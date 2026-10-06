#!/usr/bin/env node
/**
 * Off-site backup of the Supabase project — database rows plus Storage files.
 *
 * Supabase's own daily backups live in the same account as the data they
 * protect, and they do not cover Storage at all: lose the account and the
 * profile photos and certificates go with it. This writes both to a folder
 * outside Supabase.
 *
 * What it does NOT contain: the schema. DDL, RLS policies and indexes are
 * the `scripts/supabase-*.sql` files in git — a restore means replaying
 * those first, then loading these rows back in.
 *
 * Usage:
 *   node scripts/backup-supabase.js              # database + storage
 *   node scripts/backup-supabase.js --db-only    # skip the storage mirror
 *   node scripts/backup-supabase.js --dry-run    # report, write nothing
 *
 *   BACKUP_DIR=/some/path node scripts/backup-supabase.js
 *
 * The dump holds names, e-mail addresses, phone numbers and the full message
 * history. Files are written 0600 and the folder 0700; keep the destination
 * off shared drives.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');
const { createClient } = require('@supabase/supabase-js');

try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    });
  }
} catch {}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — is .env.local filled in?');
  process.exit(1);
}

const BACKUP_DIR = process.env.BACKUP_DIR
  || path.join(os.homedir(), 'Library', 'Mobile Documents', 'com~apple~CloudDocs', 'ThaiHelper-Backups');
const KEEP_DUMPS = Number(process.env.BACKUP_KEEP || 30);

const DB_ONLY = process.argv.includes('--db-only');
const DRY_RUN = process.argv.includes('--dry-run');

// Every table in `public`. A table missing from this list is never backed up,
// so the run ends with a drift check against the live API and shouts if the
// schema grew a table nobody added here.
const TABLES = [
  'blocked_contacts', 'company_accounts', 'contact_reveals', 'conversations',
  'directory_click_events', 'directory_listings', 'directory_reviews',
  'documents', 'employer_accounts', 'employer_registrations',
  'employer_saved_helpers', 'helper_favorites', 'helper_profiles',
  'helper_ratings', 'helper_references', 'hire_confirmations',
  'magic_login_tokens', 'messages', 'push_subscriptions',
  'rate_limit_attempts', 'user_preferences', 'wizard_analytics',
];

// Pagination needs a unique sort key; everything else is keyed on `id`.
const PK = { blocked_contacts: 'handle', magic_login_tokens: 'token' };

const BUCKETS = ['helper-documents', 'profile-photos'];

const PAGE = 1000;            // PostgREST refuses to return more (db-max-rows)
const DOWNLOAD_PARALLEL = 5;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const human = n => n < 1024 ? `${n} B`
  : n < 1024 ** 2 ? `${(n / 1024).toFixed(0)} KB`
  : n < 1024 ** 3 ? `${(n / 1024 ** 2).toFixed(1)} MB`
  : `${(n / 1024 ** 3).toFixed(2)} GB`;

/* ---------------------------------------------------------------- database */

async function dumpTable(name) {
  const pk = PK[name] || 'id';
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(name)
      .select('*')
      .order(pk, { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`${name}: ${error.message}`);
    if (data && data.length) rows.push(...data);
    // A short page is the end. An exactly-full one is ambiguous and costs
    // one more round trip to settle.
    if (!data || data.length < PAGE) return rows;
  }
}

async function dumpDatabase() {
  const tables = {};
  const counts = {};
  for (const name of TABLES) {
    const rows = await dumpTable(name);
    tables[name] = rows;
    counts[name] = rows.length;
    console.log(`  ${name.padEnd(26)} ${String(rows.length).padStart(6)} rows`);
  }
  return { tables, counts };
}

// The list above is maintained by hand; this catches the day it goes stale.
async function checkForNewTables() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    const spec = await res.json();
    const exposed = Object.keys(spec.definitions || spec.components?.schemas || {});
    return exposed.filter(t => !TABLES.includes(t));
  } catch {
    return null; // never fail a backup over the drift check
  }
}

/* ----------------------------------------------------------------- storage */

async function listBucket(bucket, prefix = '') {
  const out = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: PAGE, offset, sortBy: { column: 'name', order: 'asc' },
    });
    if (error) throw new Error(`${bucket}/${prefix}: ${error.message}`);
    for (const entry of data) {
      const full = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id === null) out.push(...await listBucket(bucket, full)); // folder
      else out.push({ path: full, size: Number(entry.metadata?.size ?? 0) });
    }
    if (data.length < PAGE) return out;
  }
}

// iCloud evicts the contents of files it has already uploaded and leaves a
// `.name.icloud` stub behind. The bytes are safe in iCloud, so an evicted
// file counts as backed up — re-downloading it would just burn egress.
function localState(filePath, size) {
  try {
    if (fs.statSync(filePath).size === size) return 'ok';
    return 'stale';
  } catch {}
  const stub = path.join(path.dirname(filePath), `.${path.basename(filePath)}.icloud`);
  return fs.existsSync(stub) ? 'evicted' : 'missing';
}

async function mirrorBucket(bucket, root) {
  const objects = await listBucket(bucket);
  const todo = [];
  let ok = 0, evicted = 0;

  for (const obj of objects) {
    const dest = path.join(root, bucket, obj.path);
    const state = localState(dest, obj.size);
    if (state === 'ok') ok++;
    else if (state === 'evicted') evicted++;
    else todo.push({ ...obj, dest });
  }

  const bytes = todo.reduce((n, o) => n + o.size, 0);
  console.log(`  ${bucket}: ${objects.length} objects — ${ok + evicted} already here, ${todo.length} to fetch (${human(bytes)})`);

  if (DRY_RUN || !todo.length) return { objects: objects.length, downloaded: 0, bytes: 0, failed: [] };

  const failed = [];
  let done = 0, fetched = 0;
  const queue = todo.slice();

  await Promise.all(Array.from({ length: DOWNLOAD_PARALLEL }, async () => {
    for (;;) {
      const obj = queue.shift();
      if (!obj) return;
      try {
        const { data, error } = await supabase.storage.from(bucket).download(obj.path);
        if (error) throw error;
        const buf = Buffer.from(await data.arrayBuffer());
        fs.mkdirSync(path.dirname(obj.dest), { recursive: true, mode: 0o700 });
        fs.writeFileSync(obj.dest, buf, { mode: 0o600 });
        fetched += buf.length;
      } catch (err) {
        failed.push({ path: obj.path, error: String(err.message || err) });
      }
      if (++done % 50 === 0) process.stdout.write(`    ${done}/${todo.length}\r`);
    }
  }));

  console.log(`    ${done}/${todo.length} fetched (${human(fetched)})${failed.length ? ` — ${failed.length} FAILED` : ''}`);
  return { objects: objects.length, downloaded: done - failed.length, bytes: fetched, failed };
}

/* ------------------------------------------------------------------- prune */

function pruneOldDumps(dbDir) {
  const dumps = fs.readdirSync(dbDir)
    .filter(f => /^thaihelper-db-\d{4}-\d{2}-\d{2}\.json\.gz$/.test(f))
    .sort();
  const drop = dumps.slice(0, Math.max(0, dumps.length - KEEP_DUMPS));
  for (const f of drop) fs.unlinkSync(path.join(dbDir, f));
  return drop.length;
}

/* -------------------------------------------------------------------- main */

async function main() {
  const startedAt = new Date();
  const stamp = startedAt.toISOString().slice(0, 10);

  console.log(`ThaiHelper backup — ${startedAt.toISOString()}`);
  console.log(`Destination: ${BACKUP_DIR}${DRY_RUN ? '  (dry run)' : ''}\n`);

  if (!DRY_RUN) fs.mkdirSync(path.join(BACKUP_DIR, 'db'), { recursive: true, mode: 0o700 });

  console.log('Database:');
  const { tables, counts } = await dumpDatabase();
  const totalRows = Object.values(counts).reduce((a, b) => a + b, 0);

  let dumpFile = null, dumpSize = 0;
  if (!DRY_RUN) {
    const payload = {
      project: SUPABASE_URL,
      taken_at: startedAt.toISOString(),
      note: 'Data only. Schema lives in scripts/supabase-*.sql in git.',
      row_counts: counts,
      tables,
    };
    const gz = zlib.gzipSync(Buffer.from(JSON.stringify(payload)), { level: 9 });
    dumpFile = path.join(BACKUP_DIR, 'db', `thaihelper-db-${stamp}.json.gz`);
    fs.writeFileSync(dumpFile, gz, { mode: 0o600 });
    dumpSize = gz.length;
  }
  console.log(`  → ${totalRows} rows total${dumpFile ? `, ${human(dumpSize)} gzipped` : ''}\n`);

  const storage = {};
  if (!DB_ONLY) {
    console.log('Storage:');
    const root = path.join(BACKUP_DIR, 'storage');
    if (!DRY_RUN) fs.mkdirSync(root, { recursive: true, mode: 0o700 });
    for (const bucket of BUCKETS) storage[bucket] = await mirrorBucket(bucket, root);
    console.log('');
  }

  const pruned = DRY_RUN ? 0 : pruneOldDumps(path.join(BACKUP_DIR, 'db'));

  const newTables = await checkForNewTables();
  if (newTables && newTables.length) {
    console.log(`WARNING: these tables exist in the API but are not backed up: ${newTables.join(', ')}`);
    console.log('         Add them to TABLES in this script.\n');
  }

  const report = {
    taken_at: startedAt.toISOString(),
    finished_at: new Date().toISOString(),
    dry_run: DRY_RUN,
    db: { file: dumpFile && path.basename(dumpFile), bytes: dumpSize, total_rows: totalRows, row_counts: counts },
    storage,
    pruned_dumps: pruned,
    untracked_tables: newTables || [],
  };
  if (!DRY_RUN) {
    fs.writeFileSync(path.join(BACKUP_DIR, 'last-run.json'), JSON.stringify(report, null, 2), { mode: 0o600 });
  }

  const failures = Object.values(storage).flatMap(s => s.failed || []);
  console.log(`Done in ${Math.round((Date.now() - startedAt) / 1000)}s.`);
  if (failures.length) {
    console.error(`${failures.length} file(s) failed — see last-run.json`);
    process.exit(1);
  }
}

main().catch(err => { console.error('Backup FAILED:', err.message || err); process.exit(1); });

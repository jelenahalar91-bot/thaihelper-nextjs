/**
 * One-time migration script: Google Sheets → Supabase helper_profiles
 *
 * Usage:
 *   node scripts/migrate-sheets-to-supabase.js
 *
 * Requires .env.local to be loaded (uses dotenv or manual env vars).
 *
 * What it does:
 *   1. Fetches ALL rows from Google Sheets via the Apps Script API
 *   2. Inserts each row into Supabase helper_profiles table
 *   3. Ensures user_preferences row exists for each helper
 *   4. Reports success/failure for each row
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && !key.startsWith('#')) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SHEET_URL = process.env.GOOGLE_SHEETS_URL;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

if (!SHEET_URL) {
  console.error('Missing GOOGLE_SHEETS_URL in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// We need a special Apps Script function to export all data.
// Since we don't have one, we'll use an alternative approach:
// Read the data from a CSV export or use the existing lookup with known refs.
//
// ALTERNATIVE: Add a temporary "export" action to the Apps Script.
// For now, this script expects a JSON file with the sheet data.

async function migrate() {
  console.log('=== ThaiHelper: Google Sheets → Supabase Migration ===\n');

  // Try to read from a JSON export file
  const exportPath = path.join(__dirname, 'sheet-export.json');

  if (!fs.existsSync(exportPath)) {
    console.log('No sheet-export.json found.');
    console.log('');
    console.log('Please export your Google Sheet data:');
    console.log('1. Open your Google Sheet');
    console.log('2. File → Download → Comma-separated values (.csv)');
    console.log('3. Then run: node scripts/csv-to-json.js (to convert)');
    console.log('');
    console.log('OR paste the data manually into scripts/sheet-export.json as:');
    console.log('[');
    console.log('  {');
    console.log('    "ref": "TH-XXXXXX",');
    console.log('    "firstName": "Anna",');
    console.log('    "lastName": "Test",');
    console.log('    "email": "anna@example.com",');
    console.log('    "age": "25-30",');
    console.log('    "category": "nanny",');
    console.log('    "skills": "infant_care, homework",');
    console.log('    "city": "Bangkok",');
    console.log('    "area": "",');
    console.log('    "experience": "1",');
    console.log('    "languages": "Thai, English",');
    console.log('    "rate": "200_300",');
    console.log('    "education": "Bachelor",');
    console.log('    "certificates": "First Aid",');
    console.log('    "bio": "...",');
    console.log('    "whatsapp": "+66...",');
    console.log('    "hasWhatsApp": "Yes",');
    console.log('    "photo": "https://...",');
    console.log('    "source": "thaihelper.app/register",');
    console.log('    "timestamp": "2025-01-01T00:00:00Z"');
    console.log('  }');
    console.log(']');
    process.exit(1);
  }

  const rows = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));
  console.log(`Found ${rows.length} rows to migrate.\n`);

  let success = 0;
  let failed = 0;

  for (const row of rows) {
    let ref = (row.ref || '').trim();
    const email = (row.email || '').trim().toLowerCase();

    if (!email) {
      console.log(`⚠ SKIP: Missing email — ${JSON.stringify(row).substring(0, 80)}`);
      failed++;
      continue;
    }

    // Generate ref if missing
    if (!ref) {
      ref = 'TH-' + Math.random().toString(36).substr(2, 6).toUpperCase();
      console.log(`  → Generated new ref: ${ref} for ${email}`);
    }

    // Insert into helper_profiles
    const { error: profileError } = await supabase
      .from('helper_profiles')
      .upsert({
        helper_ref: ref,
        first_name: row.firstName || row.first_name || '',
        last_name: row.lastName || row.last_name || '',
        email: email,
        age: row.age || null,
        category: row.category || '',
        skills: row.skills || null,
        city: row.city || '',
        area: row.area || null,
        experience: row.experience || null,
        languages: row.languages || null,
        rate: row.rate || null,
        education: row.education || null,
        certificates: row.certificates || null,
        bio: row.bio || null,
        whatsapp: row.whatsapp || null,
        has_whatsapp: row.hasWhatsApp === 'Yes' || row.has_whatsapp === true,
        photo_url: row.photo || row.photo_url || null,
        source: row.source || 'thaihelper.app/register',
        created_at: row.timestamp || new Date().toISOString(),
      }, { onConflict: 'helper_ref' });

    if (profileError) {
      console.log(`✗ FAILED ${ref} (${email}): ${profileError.message}`);
      failed++;
      continue;
    }

    // Ensure user_preferences exists
    await supabase
      .from('user_preferences')
      .upsert(
        { helper_ref: ref, email: email },
        { onConflict: 'helper_ref' }
      );

    console.log(`✓ Migrated ${ref} — ${row.firstName || row.first_name} (${email})`);
    success++;
  }

  console.log(`\n=== Done: ${success} migrated, ${failed} failed ===`);
}

migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});

const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  if (line.startsWith('#') || !line.trim()) return;
  const [key, ...valueParts] = line.split('=');
  let value = valueParts.join('=').trim();
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1);
  }
  env[key.trim()] = value;
});

process.env.NEXT_PUBLIC_SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUnverified() {
  console.log('\n╔═══════════════════════════════════════════════╗');
  console.log('║       📧 HELPER EMAIL VERIFICATION STATUS    ║');
  console.log('╚═══════════════════════════════════════════════╝\n');

  // Get all helpers
  const { data: helpers, error } = await supabase
    .from('helper_profiles')
    .select('helper_ref, first_name, email, email_verified, created_at');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const verified = helpers.filter(h => h.email_verified === true);
  const unverified = helpers.filter(h => h.email_verified === false || h.email_verified === null);

  console.log(`📊 GESAMT: ${helpers.length} Helper\n`);
  console.log(`✅ VERIFIZIERT: ${verified.length} (${((verified.length/helpers.length)*100).toFixed(1)}%)`);
  console.log(`❌ UNVERIFI ZIERT: ${unverified.length} (${((unverified.length/helpers.length)*100).toFixed(1)}%)\n`);

  if (unverified.length > 0) {
    console.log('UNVERIFI ZIERTE HELPER (letzte 10):');
    unverified.slice(-10).forEach(h => {
      const created = new Date(h.created_at);
      const daysAgo = Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));
      console.log(`  ${h.helper_ref} | ${h.first_name} | ${h.email}`);
      console.log(`    Registriert vor ${daysAgo} Tagen`);
    });
  }
}

checkUnverified().catch(console.error);

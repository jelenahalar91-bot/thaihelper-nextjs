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

async function findHelper(searchEmail) {
  console.log(`\nSearching for helper with email: ${searchEmail}\n`);

  const { data, error } = await supabase
    .from('helper_profiles')
    .select('helper_ref, first_name, last_name, email')
    .ilike('email', `%${searchEmail}%`)
    .limit(5);

  if (error) {
    console.log('Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('❌ No helper found');
    return;
  }

  console.log(`Found ${data.length} helper(s):\n`);
  data.forEach(h => {
    console.log(`  Ref: ${h.helper_ref}`);
    console.log(`  Name: ${h.first_name} ${h.last_name || ''}`);
    console.log(`  Email: ${h.email}`);
    console.log();
  });
}

const email = process.argv[2] || 'nuinutinop';
findHelper(email).catch(console.error);

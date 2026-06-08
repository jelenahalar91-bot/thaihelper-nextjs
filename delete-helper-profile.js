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

async function deleteHelperProfile(helperRef) {
  console.log(`\nDeleting helper profile: ${helperRef}`);
  console.log('────────────────────────────────────────\n');

  // First, get helper info before deletion
  const { data: helper } = await supabase
    .from('helper_profiles')
    .select('helper_ref, first_name, email')
    .eq('helper_ref', helperRef)
    .single();

  if (!helper) {
    console.log('❌ Helper not found');
    return;
  }

  console.log(`✓ Found: ${helper.first_name} (${helper.email})`);

  // Delete the helper profile
  const { error } = await supabase
    .from('helper_profiles')
    .delete()
    .eq('helper_ref', helperRef);

  if (error) {
    console.log('❌ Error deleting profile:', error);
    return;
  }

  console.log('✓ Profile deleted from database');
  console.log(`\n✅ Helper ${helperRef} has been removed`);
  console.log(`\nDetails to log:`);
  console.log(`  - Name: ${helper.first_name}`);
  console.log(`  - Email: ${helper.email}`);
  console.log(`  - Ref: ${helperRef}`);
  console.log(`  - Date: ${new Date().toISOString()}`);
}

// Check which helper to delete
const helperRef = process.argv[2];
if (!helperRef) {
  console.log('Usage: node delete-helper-profile.js <HELPER_REF>');
  console.log('Example: node delete-helper-profile.js TH-PJZKHB');
  process.exit(1);
}

deleteHelperProfile(helperRef).catch(console.error);

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

async function checkRatings() {
  console.log('\n🌟 CHECKING FOR RATINGS/REVIEWS SYSTEM...\n');

  // Try to find ratings table
  const { data: ratingsData, error: ratingsError } = await supabase
    .from('ratings')
    .select('*')
    .limit(1);

  if (!ratingsError && ratingsData) {
    console.log('✅ RATINGS TABLE EXISTS!');
    const { count } = await supabase.from('ratings').select('*', { count: 'exact', head: true });
    console.log(`   Total ratings: ${count}\n`);

    // Show sample ratings
    const { data: samples } = await supabase
      .from('ratings')
      .select('*')
      .limit(5);

    if (samples && samples.length > 0) {
      console.log('Sample ratings:');
      samples.forEach(r => {
        console.log(`  - ${r.reviewer_ref} → ${r.helper_ref}: ${r.rating} stars`);
        if (r.comment) console.log(`    "${r.comment.slice(0, 60)}..."`);
      });
    }
  } else {
    console.log('❌ No "ratings" table found');
  }

  // Also try variations
  const tableNames = ['reviews', 'helper_ratings', 'ratings_helper', 'feedback'];
  for (const tableName of tableNames) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*', { head: true })
      .limit(1);
    
    if (!error) {
      console.log(`\n✅ Found "${tableName}" table!`);
      const { count } = await supabase.from(tableName).select('*', { count: 'exact', head: true });
      console.log(`   Total: ${count} records`);
    }
  }
}

checkRatings().catch(console.error);

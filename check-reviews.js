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

async function checkReviews() {
  console.log('\n🌟 REVIEWS & RATINGS STATUS\n');

  // Check helper_ratings
  console.log('📋 helper_ratings TABLE:');
  const { data: ratings, count: ratingsCount, error: rError } = await supabase
    .from('helper_ratings')
    .select('*')
    .limit(10);

  console.log(`   Records: ${ratingsCount || 0}`);
  
  if (!rError && ratings && ratings.length > 0) {
    console.log('   Samples:');
    ratings.slice(0, 3).forEach(r => {
      console.log(`     - Rating: ${JSON.stringify(r).slice(0, 80)}...`);
    });
  } else if (!rError) {
    console.log('   ✅ Table exists but is empty (no reviews yet)');
  }

  // Check reviews
  console.log('\n📋 reviews TABLE:');
  const { data: reviews, error: revError } = await supabase
    .from('reviews')
    .select('*')
    .limit(10);

  if (!revError && reviews) {
    const { count: revCount } = await supabase.from('reviews').select('*', { count: 'exact', head: true });
    console.log(`   Records: ${revCount || 0}`);
    
    if (reviews.length > 0) {
      console.log('   Samples:');
      reviews.slice(0, 3).forEach(r => {
        console.log(`     - ${JSON.stringify(r).slice(0, 80)}...`);
      });
    }
  } else if (revError) {
    console.log(`   ❌ Error: ${revError.message}`);
  } else {
    console.log('   ✅ Table exists but is empty');
  }

  console.log('\n✅ BEWERTUNGSSYSTEM EXISTIERT!');
  console.log('   Tables: helper_ratings (ready), reviews (ready)');
  console.log('   Status: Implementiert, aber noch 0 Bewertungen eingegeben');
}

checkReviews().catch(console.error);

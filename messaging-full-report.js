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

async function fullReport() {
  console.log('\n╔═════════════════════════════════════════════════════════╗');
  console.log('║         📱 MESSAGING ACTIVITY & ENGAGEMENT REPORT      ║');
  console.log('╚═════════════════════════════════════════════════════════╝\n');

  // Overall stats
  const { count: convCount } = await supabase.from('conversations').select('*', { count: 'exact', head: true });
  const { count: msgCount } = await supabase.from('messages').select('*', { count: 'exact', head: true });

  console.log('📊 DATABASE TOTALS:');
  console.log(`   Conversations: ${convCount}`);
  console.log(`   Messages: ${msgCount}`);

  // Today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.toISOString();
  
  const { count: todayMsg } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStart);

  // This week
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: weekMsg } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekAgo);
  const { count: weekConv } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekAgo);

  console.log(`\n🔥 TODAY: ${todayMsg} messages`);
  console.log(`📅 THIS WEEK: ${weekConv} conversations, ${weekMsg} messages`);
  console.log(`   ⌀ ${(weekMsg/7).toFixed(1)} messages/day`);

  // Most active helpers
  console.log(`\n🏆 TOP HELPERS (by message count this week):`);
  const { data: helperActivity } = await supabase
    .from('messages')
    .select('sender_ref')
    .eq('sender_type', 'helper')
    .gte('created_at', weekAgo);

  const helperCounts = {};
  helperActivity.forEach(m => {
    helperCounts[m.sender_ref] = (helperCounts[m.sender_ref] || 0) + 1;
  });

  const topHelpers = Object.entries(helperCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  for (const [ref, count] of topHelpers) {
    const { data: helper } = await supabase
      .from('helper_profiles')
      .select('first_name')
      .eq('helper_ref', ref)
      .single();
    
    if (helper) {
      console.log(`   ${helper.first_name} (${ref}): ${count} messages`);
    }
  }

  // Check for keywords suggesting meetings/agreements
  console.log(`\n📋 LOOKING FOR AGREEMENTS/MEETINGS/REVIEWS:`);
  const { data: allMsgs } = await supabase
    .from('messages')
    .select('content_original, content_translated, created_at')
    .gte('created_at', weekAgo);

  const meetingKeywords = ['meet', 'coffee', 'visit', 'come', 'appointment', 'time', 'day', 'week', 'month', 'start', 'begin', 'agreed', 'agree', 'contract'];
  const reviewKeywords = ['thank', 'good', 'excellent', 'great', 'awesome', 'perfect', 'happy', 'recommend', 'best', 'star', '⭐', 'rating'];

  let meetingMsgs = 0;
  let reviewMsgs = 0;

  allMsgs.forEach(m => {
    const text = (m.content_original || '').toLowerCase();
    if (meetingKeywords.some(kw => text.includes(kw))) meetingMsgs++;
    if (reviewKeywords.some(kw => text.includes(kw))) reviewMsgs++;
  });

  console.log(`   Messages with meeting/agreement keywords: ${meetingMsgs}`);
  console.log(`   Messages with positive/review keywords: ${reviewMsgs}`);

  // Conversation depth
  console.log(`\n💬 CONVERSATION DEPTH:`);
  const { data: convs } = await supabase
    .from('conversations')
    .select('id')
    .gte('created_at', weekAgo);

  let totalMsgsInWeekConvs = 0;
  let longConvs = 0;

  for (const conv of convs) {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conv.id);
    
    totalMsgsInWeekConvs += count;
    if (count >= 3) longConvs++;
  }

  const avgMsgsPerConv = convs.length > 0 ? (totalMsgsInWeekConvs / convs.length).toFixed(1) : 0;
  console.log(`   ⌀ ${avgMsgsPerConv} messages per conversation`);
  console.log(`   ${longConvs}/${convs.length} conversations with 3+ messages (active)`);

  // Conclusion
  console.log(`\n✅ ENGAGEMENT ASSESSMENT:`);
  if (weekMsg > 50) {
    console.log(`   ✓ SEHR AKTIV - Nutzer schreiben viel`);
  } else if (weekMsg > 30) {
    console.log(`   ✓ AKTIV - Gutes Engagement`);
  } else {
    console.log(`   ~ MODERAT - Könnte höher sein`);
  }

  if (longConvs > convs.length * 0.5) {
    console.log(`   ✓ SUBSTANTIELLE CHATS - Nicht nur Grüße`);
  }

  if (meetingMsgs > 5) {
    console.log(`   ✓ VEREINBARUNGEN WERDEN GEMACHT - Nutzer verhandeln Termine`);
  }

  if (reviewMsgs > 5) {
    console.log(`   ✓ POSITIVE FEEDBACK - Nutzer scheinen zufrieden`);
  }
}

fullReport().catch(console.error);

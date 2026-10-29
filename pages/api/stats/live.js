import { getServiceSupabase } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getServiceSupabase();

    const [helpersResult, familiesResult, conversationsResult] = await Promise.all([
      supabase.from('helper_profiles').select('*', { count: 'exact', head: true }).eq('email_verified', true),
      supabase.from('employer_accounts').select('*', { count: 'exact', head: true }).eq('email_verified', true),
      supabase.from('conversations').select('*', { count: 'exact', head: true }),
    ]);

    const helpers = helpersResult.count || 0;
    const families = familiesResult.count || 0;
    const matches = conversationsResult.count || 0;

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({
      helpers,
      families,
      matches,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[api/stats/live] failed:', err);
    return res.status(500).json({ error: 'Failed to load stats' });
  }
}

// GET /api/cron/fb-post
//
// Stuendlicher Cron (vercel.json), der faellige Posts aus fb_scheduled_posts
// auf die Facebook-Seite stellt.
//
// Warum stuendlich und nicht genau um 19:00 Bangkok: ein Lauf pro Stunde holt
// auch das nach, was liegen geblieben ist, wenn Vercel einen Lauf verschluckt
// oder Facebook zehn Minuten lang 500er liefert. Der Plan traegt die Uhrzeit,
// nicht der Cron — in der Tabelle steht scheduled_at, und alles was faellig und
// noch pending ist, geht raus.
//
// Nachholfenster: ein Post, der laenger als MAX_LATE_HOURS ueberfaellig ist,
// wird auf 'skipped' gesetzt statt gepostet. Sonst kippt nach einem laengeren
// Ausfall der ganze Rueckstau auf einmal in den Feed.
//
// Auth wie bei den anderen Crons: Bearer $CRON_SECRET.

import * as Sentry from '@sentry/nextjs';
import { getServiceSupabase } from '../../../lib/supabase';
import { postToFacebookPage, getFacebookConfig } from '../../../lib/facebook-page';
import { sendFacebookCronAlert } from '../../../lib/emails/facebook-cron-alert';

// Hoechstens so viele Posts pro Lauf, damit ein Rueckstau nicht in einem
// Rutsch in den Feed kippt.
const MAX_POSTS_PER_RUN = 2;
// Aelter als das und der Post wird uebersprungen statt nachgeholt.
const MAX_LATE_HOURS = 20;
// Nach so vielen Fehlversuchen gilt ein Post als gescheitert und wird nicht
// weiter probiert. Facebook lehnt manche Texte dauerhaft ab — ohne Deckel
// wuerde der Cron denselben Post stuendlich bis in alle Ewigkeit versuchen.
const MAX_ATTEMPTS = 3;

function authorize(req) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const got = req.headers.authorization || '';
    return got === `Bearer ${expected}`;
  }
  if (process.env.NODE_ENV === 'production') {
    console.error('CRON_SECRET not set in production — refusing cron run');
    return false;
  }
  return req.headers['x-vercel-cron'] === '1';
}

async function alert(subject, detail) {
  console.error(`[fb-post] ${subject}: ${detail}`);
  Sentry.captureMessage(`fb-post: ${subject} — ${detail}`, 'error');
  try {
    await sendFacebookCronAlert({ subject, detail });
  } catch (e) {
    console.error('[fb-post] Alarm-Mail fehlgeschlagen:', e.message);
  }
}

export default async function handler(req, res) {
  if (!authorize(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { configured } = getFacebookConfig();
  if (!configured) {
    // Kein Alarm: solange die Env-Variablen nicht gesetzt sind, ist die
    // Automation schlicht noch nicht scharf. Das ist ein Zustand, kein Fehler.
    return res.status(200).json({ ok: true, skipped: 'facebook not configured' });
  }

  const supabase = getServiceSupabase();
  const now = new Date();
  const cutoff = new Date(now.getTime() - MAX_LATE_HOURS * 3600 * 1000);

  // Zu alt zum Nachholen: erst wegraeumen, dann posten. So kann ein alter
  // Rueckstau nie das Kontingent dieses Laufs auffressen.
  const { data: stale, error: staleErr } = await supabase
    .from('fb_scheduled_posts')
    .update({ status: 'skipped', last_error: 'zu spaet zum Nachholen', updated_at: now.toISOString() })
    .eq('status', 'pending')
    .lt('scheduled_at', cutoff.toISOString())
    .select('slug');

  if (staleErr) {
    await alert('Datenbankfehler', `Aufraeumen alter Posts: ${staleErr.message}`);
    return res.status(500).json({ error: 'db error' });
  }
  if (stale && stale.length) {
    await alert(
      'Posts uebersprungen',
      `${stale.length} Post(s) waren mehr als ${MAX_LATE_HOURS} Stunden ueberfaellig und wurden nicht nachgeholt: ${stale
        .map((r) => r.slug)
        .join(', ')}`
    );
  }

  const { data: due, error: dueErr } = await supabase
    .from('fb_scheduled_posts')
    .select('id, slug, message, link, image_url, attempts')
    .eq('status', 'pending')
    .lte('scheduled_at', now.toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(MAX_POSTS_PER_RUN);

  if (dueErr) {
    await alert('Datenbankfehler', `Faellige Posts lesen: ${dueErr.message}`);
    return res.status(500).json({ error: 'db error' });
  }
  if (!due || due.length === 0) {
    return res.status(200).json({ ok: true, posted: 0, skipped: stale ? stale.length : 0 });
  }

  const results = [];
  for (const row of due) {
    const attempts = (row.attempts || 0) + 1;
    try {
      const fbPostId = await postToFacebookPage({
        message: row.message,
        link: row.link || undefined,
        imageUrl: row.image_url || undefined,
      });
      await supabase
        .from('fb_scheduled_posts')
        .update({
          status: 'posted',
          fb_post_id: fbPostId,
          posted_at: new Date().toISOString(),
          attempts,
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);
      results.push({ slug: row.slug, ok: true, fbPostId });
      console.log(`[fb-post] ${row.slug} → ${fbPostId}`);
    } catch (e) {
      const giveUp = attempts >= MAX_ATTEMPTS || e.isTokenError || e.isPermissionError;
      await supabase
        .from('fb_scheduled_posts')
        .update({
          status: giveUp ? 'failed' : 'pending',
          attempts,
          last_error: e.message.slice(0, 500),
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);
      results.push({ slug: row.slug, ok: false, error: e.message });

      if (e.isTokenError) {
        // Der eine Fehler, der die ganze Automation stillegt: ab hier geht
        // nichts mehr raus, bis jemand ein neues Token hinterlegt.
        await alert(
          'Facebook-Token ungueltig',
          `${e.message}\n\nAb jetzt geht kein Post mehr raus. Neues System-User-Token im Business Manager erzeugen und als FB_PAGE_ACCESS_TOKEN bei Vercel hinterlegen.`
        );
        break;
      }
      if (giveUp) {
        await alert('Post endgueltig gescheitert', `${row.slug}: ${e.message}`);
      }
    }
  }

  const posted = results.filter((r) => r.ok).length;
  return res.status(200).json({ ok: true, posted, results });
}

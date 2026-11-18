/**
 * Posten auf die ThaiHelper-Facebook-Seite ueber die Graph API.
 *
 * Warum selbst und nicht Publer: der Publer-Plan vom Juni 2026 lief bis zum
 * 15.09. und ist am 19.06. abgerissen, ohne dass irgendwo etwas aufgeschlagen
 * ist — die Seite war fuenf Monate still. Ein Cron im eigenen Repo faellt
 * genauso aus, aber er faellt LAUT aus: /api/cron/fb-post schickt bei einem
 * Fehler eine Mail an ADMIN_EMAIL und meldet an Sentry.
 *
 * Token: FB_PAGE_ACCESS_TOKEN ist ein Page Access Token eines System-Users aus
 * dem Business Manager (Berechtigungen pages_manage_posts + pages_read_
 * engagement). System-User-Token laufen nicht ab — ein normales Page-Token aus
 * dem Graph Explorer schon nach 60 Tagen, das waere genau derselbe stille Tod
 * wie bei Publer. Siehe marketing/fb-plan-2026-11/README.md.
 */

const GRAPH_VERSION = 'v21.0';
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

export function getFacebookConfig() {
  const pageId = process.env.FB_PAGE_ID || '';
  const token = process.env.FB_PAGE_ACCESS_TOKEN || '';
  return { pageId, token, configured: Boolean(pageId && token) };
}

/**
 * Graph-Fehler lesbar machen. Facebook antwortet mit HTTP 200 auf manche
 * Fehler und mit 400 auf andere; in beiden Faellen steckt die Wahrheit in
 * body.error. Code 190 heisst "Token ungueltig/abgelaufen" — das ist der
 * Fehler, der die Automation killt, deshalb kennzeichnen wir ihn getrennt.
 */
function graphError(body, res) {
  const err = body && body.error ? body.error : null;
  const message = err
    ? `${err.type || 'GraphError'} ${err.code || ''}: ${err.message || ''}`.trim()
    : `HTTP ${res.status}`;
  const e = new Error(`Facebook Graph API: ${message}`);
  e.code = err ? err.code : null;
  e.subcode = err ? err.error_subcode : null;
  e.isTokenError = err ? err.code === 190 || err.code === 102 : false;
  e.isPermissionError = err ? err.code === 200 || err.code === 10 : false;
  return e;
}

async function graphPost(path, params) {
  const { token } = getFacebookConfig();
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') body.append(k, String(v));
  }
  body.append('access_token', token);

  const res = await fetch(`${GRAPH}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  let json = null;
  try {
    json = await res.json();
  } catch {
    // Antwort war kein JSON — dann zaehlt nur der Status.
  }
  if (!res.ok || !json || json.error) throw graphError(json, res);
  return json;
}

/**
 * Einen Post veroeffentlichen.
 *
 * - mit `imageUrl`: Foto-Post, `message` wird die Bildunterschrift.
 *   Facebook laedt das Bild selbst von der URL — sie muss oeffentlich
 *   erreichbar sein (also www.thaihelper.app/..., kein lokaler Pfad).
 * - mit `link`:    Link-Post. Facebook zieht Titel, Text und Bild aus den
 *   OG-Tags der Zielseite. Deshalb bauen wir die Vorschaukarte nicht selbst:
 *   SEOHead liefert sie schon, und ein Link-Post bekommt die Klickflaeche
 *   ueber die ganze Karte statt nur ueber den Text.
 * - ohne beides: reiner Textpost.
 *
 * Gibt die Facebook-Post-ID zurueck.
 */
export async function postToFacebookPage({ message, link, imageUrl }) {
  const { pageId, configured } = getFacebookConfig();
  if (!configured) {
    throw new Error('FB_PAGE_ID oder FB_PAGE_ACCESS_TOKEN fehlt');
  }
  if (!message || !message.trim()) {
    throw new Error('Post ohne Text');
  }

  if (imageUrl) {
    const out = await graphPost(`/${pageId}/photos`, {
      url: imageUrl,
      caption: message,
      published: true,
    });
    // /photos gibt post_id ("<pageid>_<postid>") und id (die Foto-ID).
    return out.post_id || out.id;
  }

  const out = await graphPost(`/${pageId}/feed`, { message, link });
  return out.id;
}

/**
 * Token-Check ohne etwas zu posten. Wird vom Cron benutzt, um einen
 * abgelaufenen Token zu melden, BEVOR ein Post daran scheitert — und von
 * scripts/fb-token-check.mjs von Hand.
 */
export async function checkFacebookToken() {
  const { pageId, token, configured } = getFacebookConfig();
  if (!configured) return { ok: false, reason: 'FB_PAGE_ID oder FB_PAGE_ACCESS_TOKEN fehlt' };

  const res = await fetch(
    `${GRAPH}/${pageId}?fields=id,name,fan_count&access_token=${encodeURIComponent(token)}`
  );
  const json = await res.json().catch(() => null);
  if (!res.ok || !json || json.error) {
    const e = graphError(json, res);
    return { ok: false, reason: e.message, isTokenError: e.isTokenError };
  }
  return { ok: true, pageId: json.id, name: json.name, followers: json.fan_count };
}

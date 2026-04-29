/**
 * UTM attribution utility.
 *
 * Captures utm_source / utm_medium / utm_campaign / utm_content / utm_term
 * from the URL on first visit and persists them in sessionStorage so the
 * registration form can include them when the user signs up — even if they
 * navigate around the site between landing and registering.
 *
 * Also stores the original document.referrer as a fallback when no UTMs are
 * present (e.g. organic Facebook clicks without a tagged URL).
 */

const STORAGE_KEY = 'th_attribution';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

// Read UTMs from the current URL and persist them. First-touch attribution:
// once stored we don't overwrite, so internal navigation doesn't clear them.
export function captureAttribution() {
  if (typeof window === 'undefined') return;

  if (sessionStorage.getItem(STORAGE_KEY)) return;

  const params = new URLSearchParams(window.location.search);
  const data = {};
  UTM_KEYS.forEach((k) => {
    const v = params.get(k);
    if (v) data[k] = v.slice(0, 100);
  });

  const fbclid = params.get('fbclid');
  if (fbclid) data.fbclid = fbclid.slice(0, 200);

  if (Object.keys(data).length === 0 && document.referrer) {
    try {
      const ref = new URL(document.referrer);
      if (ref.hostname && ref.hostname !== window.location.hostname) {
        data.referrer = ref.hostname;
      }
    } catch {}
  }

  if (Object.keys(data).length === 0) return;

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getAttribution() {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Format attribution as a short, human-readable string for the DB `source`
// column. Examples: "facebook/launch-2026/english", "facebook/burmese-ad-1",
// "google/cpc", "ref:t.co", "fbclid-only", "direct".
export function formatAttributionString(attr) {
  if (!attr) return 'direct';
  if (attr.utm_source) {
    const parts = [attr.utm_source];
    if (attr.utm_campaign) parts.push(attr.utm_campaign);
    if (attr.utm_content) parts.push(attr.utm_content);
    return parts.join('/');
  }
  if (attr.referrer) return `ref:${attr.referrer}`;
  if (attr.fbclid) return 'fbclid-only';
  return 'direct';
}

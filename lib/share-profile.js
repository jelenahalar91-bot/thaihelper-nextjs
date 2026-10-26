/**
 * Sharing one helper profile with somebody who isn't looking at the screen.
 *
 * A family hires together. The person browsing is almost never the only one
 * who has to agree, and until now the only way to carry a profile into that
 * conversation was a screenshot or "remind me of the name later" — which is
 * where profiles got lost. There is no shareable address for a profile
 * either: /helpers opens them in a modal, so the URL bar still says
 * /helpers no matter whose profile is open.
 *
 * So the link has to be built, not copied: helperShareUrl() returns
 * /helper/<ref>, which next.config.js rewrites to /helpers?helper=<ref> —
 * the recipient lands on that exact profile with the browse list behind it.
 *
 * The ref in the URL is the same one GET /api/helpers already publishes for
 * every helper, so a share link reveals nothing the public card doesn't.
 */

// Fallback origin for anything built outside the browser (SSR, tests). Keeps
// the www. form we use in every outbound link.
export const SHARE_SITE_URL = 'https://www.thaihelper.app';

/**
 * Public, shareable address of a helper profile.
 *
 * @param {string} ref    helper_ref (e.g. "TH-AB12CD")
 * @param {string} [origin] defaults to the current origin in the browser, so
 *                          a link shared from a preview deploy stays on it
 */
export function helperShareUrl(ref, origin) {
  if (!ref) return SHARE_SITE_URL;
  const base = origin
    || (typeof window !== 'undefined' && window.location?.origin)
    || SHARE_SITE_URL;
  return `${base}/helper/${encodeURIComponent(ref)}`;
}

// Share UI copy. Lives here rather than in a per-page T object because the
// same button sits in the browse page, the employer dashboard and the
// conversation header — three pages with three different T objects.
const COPY = {
  en: {
    share:      'Share',
    shareTitle: 'Share this profile',
    copied:     'Link copied',
    failed:     'Could not copy the link',
  },
  th: {
    share:      'แชร์',
    shareTitle: 'แชร์โปรไฟล์นี้',
    copied:     'คัดลอกลิงก์แล้ว',
    failed:     'คัดลอกลิงก์ไม่สำเร็จ',
  },
};

/** `COPY[lang] || COPY.en` — the my/km/lo locales fall back to English. */
export function shareCopy(lang = 'en') {
  return COPY[lang] || COPY.en;
}

/**
 * Hand a link to the OS share sheet, or put it on the clipboard when there
 * isn't one (every desktop browser but Safari/Edge).
 *
 * @returns {Promise<'shared'|'copied'|'cancelled'|'failed'>}
 */
export async function shareOrCopyLink({ url, title, text }) {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ url, title, text });
      return 'shared';
    } catch (err) {
      // AbortError is the user closing the sheet — not a failure, and it
      // must NOT fall through to the clipboard: copying a link somebody
      // just decided not to share, and saying so, is the one outcome
      // nobody asked for.
      if (err?.name === 'AbortError') return 'cancelled';
      // Anything else (no share target, permission policy) → clipboard.
    }
  }
  return (await copyToClipboard(url)) ? 'copied' : 'failed';
}

async function copyToClipboard(value) {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Insecure context or a denied permission — fall through to the
    // execCommand path below, which needs neither.
  }
  try {
    const el = document.createElement('textarea');
    el.value = value;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.top = '-1000px';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

/**
 * /app — Short redirect target used in LINE/email invites. Routes each
 * visitor to the right destination:
 *
 *   Android → Google Play listing
 *   iOS     → App Store listing
 *   Desktop → the homepage
 *
 * Why a redirect page instead of pasting the store URLs directly into
 * invites: gives us a stable short link we control. If a store URL
 * changes, we swap it here once — no need to re-blast every LINE/email
 * link.
 *
 * It used to send Android into the closed-test opt-in and answer iOS with
 * a "coming soon" page. Both shipped a while ago — Android has been on a
 * 100% rollout since 9 November and the iPhone app is on the App Store —
 * so every iOS visitor following this link was being told the app does
 * not exist, and every Android visitor was sent to a test track they
 * cannot join.
 */

import { APP_STORE_URL } from '@/components/AppStoreBadge';
import { PLAY_STORE_URL } from '@/components/PlayStoreBadge';

// The Play URL already carries ?id=…, so inbound params have to be merged
// rather than appended — a second '?' would swallow the package name and
// land the visitor on Google Play's error page.
function withParams(base, qs) {
  const params = qs.replace(/^\?/, '');
  if (!params) return base;
  return `${base}${base.includes('?') ? '&' : '?'}${params}`;
}

export async function getServerSideProps({ req }) {
  const ua = req.headers['user-agent'] || '';
  const isAndroid = /android/i.test(ua);
  const isIOS = /iphone|ipad|ipod/i.test(ua);

  // Preserve inbound tracking params so campaign attribution survives
  // the hop into the store (Google Play propagates ?utm_source etc.
  // through the install referrer for GA/FB analytics).
  const url = req.url || '/app';
  const qs = url.includes('?') ? url.slice(url.indexOf('?')) : '';

  if (isAndroid) {
    return {
      redirect: {
        destination: withParams(PLAY_STORE_URL, qs),
        permanent: false,
      },
    };
  }

  if (isIOS) {
    return {
      redirect: {
        destination: withParams(APP_STORE_URL, qs),
        permanent: false,
      },
    };
  }

  // Desktop / unknown — bounce to homepage so the link isn't a dead-end.
  return {
    redirect: {
      destination: '/',
      permanent: false,
    },
  };
}

// Never rendered: every branch above redirects. Next still wants a
// default export from a page file.
export default function AppRedirect() {
  return null;
}

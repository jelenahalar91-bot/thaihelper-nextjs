/**
 * Analytics wrapper — supports Google Analytics 4 + Meta Pixel.
 *
 * Setup:
 * 1. Add IDs to .env.local:
 *    NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
 *    NEXT_PUBLIC_FB_PIXEL_ID=1234567890123456
 * 2. Both load automatically via _app.js after cookie consent.
 */

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

// ── Google Analytics 4 ───────────────────────────────────────────────────────
export function pageview(url) {
  if (!GA_ID || typeof window === 'undefined') return;
  window.gtag?.('config', GA_ID, { page_path: url });
}

export function event({ action, category, label, value }) {
  if (!GA_ID || typeof window === 'undefined') return;
  window.gtag?.('event', action, {
    event_category: category,
    event_label: label,
    value,
  });
}

// ── Meta Pixel ───────────────────────────────────────────────────────────────
export function fbPageview() {
  if (!FB_PIXEL_ID || typeof window === 'undefined') return;
  window.fbq?.('track', 'PageView');
}

// Use Meta's standard event names ("CompleteRegistration", "Lead",
// "Contact", "ViewContent") so Ads Manager can optimize on them.
// Custom names work but are second-class for optimization.
export function fbTrack(eventName, params = {}) {
  if (!FB_PIXEL_ID || typeof window === 'undefined') return;
  window.fbq?.('track', eventName, params);
}

// ── Predefined GA events for ThaiHelper ──────────────────────────────────────
export const EVENTS = {
  REGISTER_START: { action: 'register_start', category: 'engagement' },
  REGISTER_COMPLETE: { action: 'register_complete', category: 'conversion' },
  PROFILE_VIEW: { action: 'profile_view', category: 'engagement' },
  LANG_SWITCH: { action: 'lang_switch', category: 'engagement' },
  CTA_CLICK: { action: 'cta_click', category: 'engagement' },
  EMPLOYER_SIGNUP: { action: 'employer_signup', category: 'conversion' },
};

/**
 * Analytics wrapper — currently supports Google Analytics 4.
 * Swap for Plausible or Umami by changing the implementation here.
 *
 * Setup:
 * 1. Add your GA4 Measurement ID to .env.local:
 *    NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
 * 2. The scripts are loaded automatically via _app.js
 */

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// Log a page view
export function pageview(url) {
  if (!GA_ID || typeof window === 'undefined') return;
  window.gtag?.('config', GA_ID, { page_path: url });
}

// Log a custom event
export function event({ action, category, label, value }) {
  if (!GA_ID || typeof window === 'undefined') return;
  window.gtag?.('event', action, {
    event_category: category,
    event_label: label,
    value,
  });
}

// Predefined events for ThaiHelper
export const EVENTS = {
  REGISTER_START: { action: 'register_start', category: 'engagement' },
  REGISTER_COMPLETE: { action: 'register_complete', category: 'conversion' },
  PROFILE_VIEW: { action: 'profile_view', category: 'engagement' },
  LANG_SWITCH: { action: 'lang_switch', category: 'engagement' },
  CTA_CLICK: { action: 'cta_click', category: 'engagement' },
  EMPLOYER_SIGNUP: { action: 'employer_signup', category: 'conversion' },
};

/**
 * Trustpilot score — single source of truth.
 *
 * The score used to be hard-coded in several places (landing page, /legit,
 * OG image) and drifted apart. Everything now imports from here, so updating
 * the rating is a one-line change.
 *
 * How to refresh: open https://www.trustpilot.com/review/thaihelper.app,
 * copy the TrustScore and the review count, update SCORE / REVIEW_COUNT and
 * LAST_CHECKED below. Nothing else needs to change.
 */

export const TRUSTPILOT_URL = 'https://www.trustpilot.com/review/thaihelper.app';

// Last checked: 2026-11-25 — 4.4 ("Excellent"), 17 reviews.
export const TRUSTPILOT_SCORE = 4.4;
export const TRUSTPILOT_REVIEW_COUNT = 17;
export const TRUSTPILOT_LAST_CHECKED = '2026-11-25';

// Trustpilot green.
export const TRUSTPILOT_GREEN = '#00B67A';

/** Number of filled stars to show for the current score (rest are dimmed). */
export const TRUSTPILOT_FULL_STARS = Math.round(TRUSTPILOT_SCORE);

/** "4.4" — no trailing ".0" for whole scores. */
export const TRUSTPILOT_SCORE_LABEL = Number.isInteger(TRUSTPILOT_SCORE)
  ? String(TRUSTPILOT_SCORE)
  : TRUSTPILOT_SCORE.toFixed(1);

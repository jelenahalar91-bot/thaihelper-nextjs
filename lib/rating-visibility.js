// How many reviews a helper needs before any of them are public.
//
// The history matters, because this number has been both 3 and 1 and the
// reasons are opposite sides of the same incident.
//
// 2026-09-12 — set to 3. EMP-572KZV wrote one 1-star review accusing a
// helper of stealing from a child's money box. She had no other reviews, so
// that single review WAS her public score: the browse list showed her at
// ★1.0. Hiding everything below three reviews stopped one voice from being
// the whole story.
//
// 2026-09-16 — back to 1. The same day the threshold went up, the rule for
// who may review at all was tightened far harder: three messages from each
// side, spread over at least 24 hours (see MIN_MESSAGES_PER_SIDE in
// pages/api/ratings.js). Of 990 family-helper pairs on the platform, 75
// clear that bar. EMP-572KZV would not be one of them. The gate moved to the
// entrance, and keeping it at the exit as well cost more than it protected:
// with 3 honest 5-star reviews spread across 3 different helpers, the
// threshold meant not a single star was visible anywhere on the site. A
// review system nobody can see does not build trust, and it gives families
// no reason to write the next one.
//
// What replaced the hiding, all of it built the same day:
//   - Every review shows its own count next to the average, so "★5.0
//     (1 review)" reads as one family's opinion, not as a verdict.
//   - The helper is emailed the moment a review lands, with a one-click
//     dispute link (lib/review-dispute.js). The review stays visible while
//     disputed — hiding it on the accused person's say-so would just hand
//     the same weapon to the other side — but an admin mail goes out
//     immediately, so a false review can be deleted in minutes.
//   - Any review of 1 or 2 stars also alerts the admin on arrival, whether
//     or not it is disputed.
//
// Setting this back above 1 is a product decision, not a tuning knob: it
// makes every helper with fewer reviews invisible again.
export const MIN_PUBLIC_REVIEWS = 1;

/**
 * The rating as the public may see it.
 *
 * Kept even though the threshold is 1, because every surface — browse cards,
 * SSR list, profile modal — goes through it, and the rule is meant to live
 * in one place rather than be re-derived by each caller if it ever changes
 * again.
 */
export function publicRating(avg, count) {
  const n = count || 0;
  if (n < MIN_PUBLIC_REVIEWS) {
    return { ratingAvg: null, ratingCount: 0 };
  }
  return { ratingAvg: avg != null ? Number(avg) : null, ratingCount: n };
}

// How many reviews a helper needs before any of them are public.
//
// Why this exists (2026-09-12): EMP-572KZV wrote one 1-star review accusing a
// helper of stealing from a child's money box. She had no other reviews, so
// that single review WAS her public score — the browse list showed her at
// ★1.0. One angry stranger, four clicks, and a career on this platform is
// over. The review was false and the account is suspended, but the damage ran
// from the moment it was posted.
//
// Three is the smallest number that stops one voice from being the whole
// story. Below it the average is meaningless anyway: ★1.0 (1 review) and
// ★5.0 (1 review) both say almost nothing, and the platform presents them as
// if they said everything.
//
// The reviews are hidden, not discarded. They keep counting, and when the
// third arrives all three appear together. That cuts both ways on purpose —
// a glowing first review waits exactly as long as a furious one, so this
// cannot be read as suppressing criticism.
//
// The author always sees their own review (/api/ratings returns myRating
// regardless), otherwise it looks like it failed to save.
//
// Raising or lowering this is a product decision, not a tuning knob: at the
// time of writing the platform had 3 reviews in total across 3.5 months, so
// almost nobody is affected either way.
export const MIN_PUBLIC_REVIEWS = 3;

/**
 * The rating as the public may see it.
 *
 * Returns nulls/zero below the threshold so every surface — browse cards,
 * SSR list, profile modal — hides the badge without each one re-deriving the
 * rule. Callers spread the result into their card shape.
 */
export function publicRating(avg, count) {
  const n = count || 0;
  if (n < MIN_PUBLIC_REVIEWS) {
    return { ratingAvg: null, ratingCount: 0 };
  }
  return { ratingAvg: avg != null ? Number(avg) : null, ratingCount: n };
}

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// TEMP KILL SWITCH (added 2026-07-07): Vercel's Image Optimization quota
// (Hobby plan free allowance) is exhausted for this billing cycle, so
// next/image now returns 402 OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED for
// any Supabase-hosted photo that isn't already cached at the edge —
// confirmed via curl against thaihelper.app/_next/image. That broke ~37 of
// 40 recently-uploaded helper photos site-wide (browse cards, homepage
// "Recently joined" panel, profile modals, chat avatars).
//
// Every call site that branches on `photo.includes('.supabase.co')` to
// decide next/image vs. plain <img> should AND that check with
// `!SUPABASE_IMAGE_OPTIMIZER_DISABLED` so Supabase photos fall through to
// the plain <img> tag (served straight from Supabase Storage, confirmed
// reachable — no optimizer, no quota). This trades away the Vercel-CDN
// bandwidth savings that motivated routing photos through next/image in
// the first place, shifting load back onto Supabase's own egress
// allowance (which has been over-limit before — see bot-blocking
// history), so don't leave this flipped longer than necessary.
//
// Revert once the monthly quota resets or the plan is upgraded: flip this
// back to `false` (or delete it and undo the `!SUPABASE_IMAGE_OPTIMIZER_
// DISABLED &&` guards) — no other code changes needed.
export const SUPABASE_IMAGE_OPTIMIZER_DISABLED = true;

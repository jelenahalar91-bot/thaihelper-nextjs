// Rebuild the static directory pages a listing appears on, right after its
// owner changed it.
//
// /directory and /directory/<slug> are statically generated and refreshed
// once an hour. Fine for our own edits — but a company that presses "Save"
// and then "View public page" was shown the old page, with nothing to tell
// it the save had worked. Found on 2026-11-13 with a demo account: the row
// held the new languages, the page did not.
//
// English and Thai only: those are the two languages the directory is
// written in. The helper-funnel locales (my/km/lo) fall back to English here
// and catch up on the hourly refresh.
//
// Never throws — a failed rebuild must not turn a successful save into an
// error. Next keeps serving the last good page.

const LOCALE_PREFIXES = ['', '/th'];

export async function refreshListingPages(res, slug) {
  if (typeof res?.revalidate !== 'function') return;
  const paths = [];
  for (const prefix of LOCALE_PREFIXES) {
    paths.push(`${prefix}/directory`);
    if (slug) paths.push(`${prefix}/directory/${slug}`);
  }
  const results = await Promise.allSettled(paths.map((p) => res.revalidate(p)));
  results.forEach((r, i) => {
    if (r.status === 'rejected') console.warn(`revalidate ${paths[i]} failed:`, r.reason?.message || r.reason);
  });
}

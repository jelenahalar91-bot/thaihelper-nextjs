// Age computation helpers.
//
// Going forward we store date of birth (`helper_profiles.date_of_birth`) and
// derive exact age at display time, so cards stay accurate as time passes
// and we don't have to run a yearly cron to bump everyone's age.
//
// Pre-DOB helpers still have a range string in `age` (e.g. "35–39"); we
// fall back to that when no DOB is on file.

const MIN_AGE = 18;
const MAX_AGE = 80;

export function computeAge(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 && age <= 130 ? age : null;
}

// Returns the string we want to render in the UI: exact age from DOB if we
// have one, otherwise the legacy range string the helper picked at signup.
export function getDisplayAge(row) {
  const exact = computeAge(row?.date_of_birth || row?.dateOfBirth);
  if (exact !== null) return String(exact);
  return row?.age || '';
}

// Validate a YYYY-MM-DD DOB at registration / profile edit time. Returns
// { ok: true } or { ok: false, reason }.
export function validateDob(dob) {
  if (!dob) return { ok: false, reason: 'missing' };
  const age = computeAge(dob);
  if (age === null) return { ok: false, reason: 'invalid' };
  if (age < MIN_AGE) return { ok: false, reason: 'too_young' };
  if (age > MAX_AGE) return { ok: false, reason: 'too_old' };
  return { ok: true, age };
}

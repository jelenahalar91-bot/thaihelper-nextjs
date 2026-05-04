/**
 * Work Permit Wizard — option lists + decision engine.
 *
 * The wizard asks five questions and returns a result object describing
 * which recommendation flow to render:
 *   - 'no_wp_needed'        Thai nationals — no WP required.
 *   - 'not_worth_it'        WP cost/time > expected employment duration.
 *   - 'worth_it_but_slow'   Medium-term: bridge with a Thai helper while
 *                           the WP application progresses.
 *   - 'worth_it'            Long-term: full WP track (MOU or Non-B).
 *
 * Strict on inputs: unknown values fall through to the most cautious
 * advice ("worth_it" with the relevant track) rather than throwing —
 * the result page always handles every flow, so silent fallback is
 * preferable to crashing on a missing/typoed value.
 */

// ──────────────────────────────────────────────────────────────────────
// Option lists — single source of truth for the wizard form
// ──────────────────────────────────────────────────────────────────────

export const NATIONALITY_OPTIONS = [
  { value: 'thai',        en: 'Thai',                          th: 'ไทย' },
  { value: 'myanmar',     en: 'Myanmar (Burmese)',             th: 'พม่า' },
  { value: 'laos',        en: 'Laos',                          th: 'ลาว' },
  { value: 'cambodia',    en: 'Cambodia',                      th: 'กัมพูชา' },
  { value: 'philippines', en: 'Philippines',                   th: 'ฟิลิปปินส์' },
  { value: 'other',       en: 'Other',                         th: 'อื่นๆ' },
];

export const HELPER_STATUS_OPTIONS = [
  { value: 'already_working',  en: 'Already working for me (need to formalize)', th: 'ทำงานให้ฉันอยู่แล้ว (ต้องการทำให้ถูกกฎหมาย)' },
  { value: 'new_hire_abroad',  en: 'New hire — not yet in Thailand',             th: 'จ้างใหม่ — ยังไม่ได้อยู่ในไทย' },
  { value: 'new_hire_in_thai', en: 'New hire — already in Thailand',             th: 'จ้างใหม่ — อยู่ในไทยแล้ว' },
];

export const VISA_TYPE_OPTIONS = [
  { value: 'tourist',           en: 'Tourist visa',                            th: 'วีซ่าท่องเที่ยว' },
  { value: 'non_b',             en: 'Non-B (work)',                            th: 'นอน-บี (ทำงาน)' },
  { value: 'non_o_dependent',   en: 'Non-O dependent (spouse / family)',       th: 'นอน-โอ ผู้ติดตาม (คู่สมรส / ครอบครัว)' },
  { value: 'non_o_retirement',  en: 'Non-O / Non-O-A retirement (age 50+)',    th: 'นอน-โอ / โอ-เอ เกษียณอายุ (50+)' },
  { value: 'education',         en: 'Education visa (ED)',                     th: 'วีซ่านักเรียน (ED)' },
  { value: 'extension_of_stay', en: 'Extension of Stay',                       th: 'ขยายเวลาพำนัก' },
  { value: 'border_run',        en: 'Visa runs / border',                      th: 'วีซ่ารัน / ชายแดน' },
  { value: 'unknown',           en: "Don't know",                              th: 'ไม่ทราบ' },
];

export const DURATION_OPTIONS = [
  { value: 'less_than_3_months', en: 'Less than 3 months',  th: 'น้อยกว่า 3 เดือน' },
  { value: '3_to_6_months',      en: '3–6 months',          th: '3–6 เดือน' },
  { value: '6_to_12_months',     en: '6–12 months',         th: '6–12 เดือน' },
  { value: 'more_than_1_year',   en: 'More than 1 year',    th: 'มากกว่า 1 ปี' },
];

// Whitelists for API/server validation
export const NATIONALITY_VALUES    = NATIONALITY_OPTIONS.map(o => o.value);
export const HELPER_STATUS_VALUES  = HELPER_STATUS_OPTIONS.map(o => o.value);
export const VISA_TYPE_VALUES      = VISA_TYPE_OPTIONS.map(o => o.value);
export const DURATION_VALUES       = DURATION_OPTIONS.map(o => o.value);

// ──────────────────────────────────────────────────────────────────────
// Decision engine
// ──────────────────────────────────────────────────────────────────────

// Cost estimates (THB). Ranges are intentionally wide because they
// vary by city and provider — the wizard surfaces both ends.
export const WP_COST_ESTIMATES = {
  mou:        { min: 15000, max: 25000, timeMonths: '2–4'      },
  non_b:      { min: 30000, max: 50000, timeMonths: '1–3'      },
  pink_card:  { min:  5000, max: 10000, timeMonths: '1–2'      },
  transfer:   { min:  5000, max: 15000, timeMonths: '2–4 weeks'},
};

const MOU_NATIONALITIES = ['myanmar', 'laos', 'cambodia'];

export function getWizardResult({ city, nationality, helperStatus, visaType, duration }) {
  // Thai national → no WP needed (highest-priority short-circuit)
  if (nationality === 'thai') {
    return { flow: 'no_wp_needed', reason: 'thai_national', city };
  }

  const isMOU = MOU_NATIONALITIES.includes(nationality);
  const track = isMOU ? 'mou' : 'non_b';
  const estimatedCost = isMOU ? WP_COST_ESTIMATES.mou : WP_COST_ESTIMATES.non_b;

  // Short-term → not worth it
  if (duration === 'less_than_3_months') {
    return {
      flow: 'not_worth_it',
      reason: 'too_short',
      track,
      estimatedCost,
      city,
    };
  }

  // Medium-term → worth it but slow (bridge with Thai helper)
  if (duration === '3_to_6_months') {
    return {
      flow: 'worth_it_but_slow',
      reason: 'medium_term',
      track,
      estimatedCost,
      city,
    };
  }

  // Long-term → worth it. Helpers already in Thailand on a Non-B (or
  // already working for the family) can sometimes be transferred
  // instead of starting a fresh WP application.
  const canTransfer = helperStatus === 'already_working' || visaType === 'non_b';
  return {
    flow: 'worth_it',
    track,
    estimatedCost,
    city,
    canTransfer,
  };
}

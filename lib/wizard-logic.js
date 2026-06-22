/**
 * Work Permit Wizard — option lists + decision engine.
 *
 * The wizard asks five questions and returns a result object describing
 * which recommendation flow to render:
 *   - 'no_wp_needed'              Thai nationals — no WP required.
 *   - 'not_legally_allowed'       Non-MOU3 nationality (Vietnam, Philippines,
 *                                 Western, Other) — domestic-worker WP
 *                                 category is unavailable under the 2009
 *                                 Thailand–MOU framework.
 *   - 'not_worth_it'              WP cost/time > expected employment duration.
 *   - 'worth_it_but_slow'         Medium-term: bridge with a Thai helper while
 *                                 the WP application progresses.
 *   - 'worth_it'                  Long-term: full WP application.
 *
 * Key design fact (May 2026): the wizard is scoped specifically to HOUSEHOLD
 * employment. Thailand's bilateral labour MOUs (Cambodia May 2003, Laos
 * Oct 2002, Myanmar June 2003 — renewed 2015–2016, Cambodia again April
 * 2025) are the only pathway for foreign nationals to be issued a
 * "domestic worker" work permit. Vietnam joined the CLMV labour MOU
 * framework in July 2015 but only for fishery and construction, NOT
 * household work — so Vietnamese helpers sit alongside Filipinos/Western
 * as not-legally-allowed for this wizard's scope.
 *
 * The legal mechanism: Category 4 ("menial work and selling goods at
 * stores") of the 2020 Notification under the Royal Decree on Foreign
 * Workers Management B.E. 2560 (2017) is MOU-only, and Thailand has
 * MOUs covering domestic work only with Cambodia/Laos/Myanmar.
 *
 * Narrow exceptions exist (diplomatic households per Section 4 of the
 * Working of Aliens Act; BOI executive sponsorship; Non-B for genuine
 * tutor/governess/household-manager roles with a registered Thai
 * employer) — surfaced in the result panel's third recommendation.
 *
 * Strict on inputs: unknown values fall through to the most cautious
 * advice rather than throwing — the result page always handles every
 * flow, so silent fallback is preferable to crashing on a missing/typoed
 * value.
 */

// ──────────────────────────────────────────────────────────────────────
// Option lists — single source of truth for the wizard form
// ──────────────────────────────────────────────────────────────────────

export const NATIONALITY_OPTIONS = [
  { value: 'thai',        en: 'Thai',                          th: 'ไทย' },
  { value: 'myanmar',     en: 'Myanmar (Burmese)',             th: 'พม่า' },
  { value: 'laos',        en: 'Laos',                          th: 'ลาว' },
  { value: 'cambodia',    en: 'Cambodia',                      th: 'กัมพูชา' },
  { value: 'vietnam',     en: 'Vietnam',                       th: 'เวียดนาม' },
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
//
// MOU range bumped from 15–25k / 2–4 months to 20–35k / 3–6 months in
// May 2026: stricter doc requirements since the start of 2026 (mandatory
// original NIC + household list copy + CI), plus the 900 THB renewal
// fee and pink card/CI add-ons that together typically push total cost
// to ~30k THB per worker. Sources: BNI Online, Global New Light of
// Myanmar, Pattaya Mail, VisaVerge (Mar–May 2026).
//
// Only `mou` is referenced by the wizard now that non-MOU3 helpers
// short-circuit to not_legally_allowed. pink_card and transfer are
// kept for the Phase-2 cost calculator referenced in the page comment.
export const WP_COST_ESTIMATES = {
  mou:        { min: 20000, max: 35000, timeMonths: '3–6'      },
  pink_card:  { min:  5000, max: 10000, timeMonths: '1–2'      },
  transfer:   { min:  5000, max: 15000, timeMonths: '2–4 weeks'},
};

// Nationalities the 2009 Thailand–MOU domestic-worker framework covers.
// Strictly Myanmar/Laos/Cambodia: this is the only legal pathway for a
// foreign household worker. See file-level doc for the Vietnam caveat.
export const MOU_DW_NATIONALITIES = ['myanmar', 'laos', 'cambodia'];

export function getWizardResult({ city, nationality, helperStatus, visaType, duration }) {
  // Thai national → no WP needed (highest-priority short-circuit)
  if (nationality === 'thai') {
    return { flow: 'no_wp_needed', reason: 'thai_national', city };
  }

  // Non-MOU3 nationality → domestic-worker WP category unavailable.
  // We surface this before the duration question because no duration
  // changes the legal answer.
  if (!MOU_DW_NATIONALITIES.includes(nationality)) {
    return {
      flow: 'not_legally_allowed',
      reason: 'nationality_not_in_dw_mou',
      nationality,
      city,
    };
  }

  // MOU3 path — Myanmar/Laos/Cambodia. Track is always 'mou' here.
  const track = 'mou';
  const estimatedCost = WP_COST_ESTIMATES.mou;

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

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
 *   - 'mou_suspended'             Cambodia — the household MOU exists on
 *                                 paper but Thailand admits no new
 *                                 Cambodian workers (see below).
 *   - 'not_worth_it'              WP cost/time > expected employment duration.
 *   - 'worth_it_but_slow'         Medium-term: bridge with a Thai helper while
 *                                 the WP application progresses.
 *   - 'worth_it'                  Long-term: full WP application.
 *
 * Key design fact: the wizard is scoped specifically to HOUSEHOLD
 * employment. Thailand's bilateral labour MOUs (Cambodia May 2003, Laos
 * Oct 2002, Myanmar June 2003 — renewed 2015–2016) are the only pathway
 * for foreign nationals to be issued a "domestic worker" work permit.
 * Vietnam joined the CLMV labour MOU framework in July 2015 but only for
 * fishery and construction, NOT household work — so Vietnamese helpers
 * sit alongside Filipinos/Western as not-legally-allowed here.
 *
 * CAMBODIA (checked 14 Oct 2026 — the treaty list is NOT the operative
 * answer): the household MOU with Cambodia is intact on paper, but
 * admissions have been shut since the border conflict.
 *   • 10 Nov 2025 — after a landmine injured a Thai soldier, the PM
 *     suspended the extension policy covering ~100k Cambodian workers.
 *   • 9 Mar 2026 — Ministry of Labour, five measures: "No new Cambodian
 *     workers will be admitted into the country; only those who already
 *     hold valid work permits will be managed." No policy to reopen the
 *     border. Renewals for Cambodians put on hold while Laos, Myanmar
 *     and Vietnam renewals continue.
 *   • Existing holders: ~53,809 under the 24 Sep 2024 Cabinet resolution
 *     expired 31 Mar 2026; ~85,117 MOU workers finish four-year terms
 *     between Nov 2025 and Dec 2026. Those who renewed after 13 Feb 2025
 *     may stay and work to 13 Feb 2027, with one further renewal to
 *     13 Feb 2029.
 *   • The 14 Jul 2026 Cabinet extension to 11 Dec 2027 covers Laos,
 *     Myanmar and Vietnam — Cambodia is pointedly excluded.
 * So Cambodia gets its own flow: no new hire from abroad, and a
 * time-limited, verify-everything answer for someone already here.
 *
 * SRI LANKA / NEPAL / BANGLADESH: Thailand signed a labour MOU plus an
 * employment MOA with Sri Lanka on 14 Sep 2026 (10,000 workers, two-year
 * contracts), with Nepal and Bangladesh frameworks announced for 2027.
 * The announced sectors are construction, manufacturing and agriculture —
 * household work is not among them, so this opens no route for a family.
 * Revisit if the implementing regulations list domestic service.
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
// vary enormously between in-country renewal vs first-time import,
// licensed agency vs informal broker, and city.
//
// May 2026 fact-check found the previous 20–35k range understated
// fresh imports from Myanmar (which routinely run 30–50k with broker
// fees; HRW documents cases up to 127k THB). Widened to 15–50k:
//   • low end ~15k: in-country renewal via licensed agency (Thai-side
//     official ~3.7–7k + agency fees) — passport.co.th 2025 list
//     prices Myanmar domestic-helper renewal at 12,900 THB + VAT
//   • mid 20–35k: realistic all-in for renewal with broker, or
//     in-country registration
//   • high 50k: first-time MOU import (Myanmar passport + CI + embassy
//     + broker + travel) per HaRDstories May 2026 and HRW Jul 2025
//
// Timing 3–6 months end-to-end. Thai-side processing is now 1–3 weeks
// via the e-Work Permit system (mandatory since 28 Apr 2026), but the
// Myanmar embassy / CI / junta pre-departure approval bottleneck
// since Jan 2026 keeps end-to-end at multiple months for new imports.
//
// Only `mou` is referenced by the wizard now that non-MOU3 helpers
// short-circuit to not_legally_allowed. pink_card and transfer are
// kept for the Phase-2 cost calculator referenced in the page comment.
export const WP_COST_ESTIMATES = {
  mou:        { min: 15000, max: 50000, timeMonths: '3–6'      },
  pink_card:  { min:  5000, max: 10000, timeMonths: '1–2'      },
  transfer:   { min:  5000, max: 15000, timeMonths: '2–4 weeks'},
};

// Nationalities whose MOU with Thailand covers household work on paper.
// Used to decide which wizard questions are worth asking — NOT to decide
// whether a permit can actually be obtained. See MOU_DW_OPEN below.
export const MOU_DW_NATIONALITIES = ['myanmar', 'laos', 'cambodia'];

// Of those, the ones where Thailand is actually admitting and renewing
// workers. This is the list that drives advice.
export const MOU_DW_OPEN = ['myanmar', 'laos'];

// Treaty intact, admissions shut. See the Cambodia block in the file doc.
export const MOU_DW_SUSPENDED = ['cambodia'];

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

  // Cambodia — the treaty covers household work, but Thailand has
  // admitted no new Cambodian workers since Nov 2025 and renewals are on
  // hold. Whether anything is possible depends entirely on whether the
  // candidate is already here holding a permit, so this branch sits after
  // the helper-status question rather than short-circuiting from step 2.
  // Deliberately no cost/time estimate: quoting one would imply the
  // process is running, and for Cambodians it currently is not.
  if (MOU_DW_SUSPENDED.includes(nationality)) {
    const alreadyInThailand =
      helperStatus === 'already_working' || helperStatus === 'new_hire_in_thai';
    return {
      flow: 'mou_suspended',
      reason: 'cambodia_admissions_closed',
      nationality,
      alreadyInThailand,
      city,
    };
  }

  // MOU path — Myanmar/Laos. Track is always 'mou' here.
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

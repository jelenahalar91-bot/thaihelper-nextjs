// Formatting for agency pricing in the expert directory.
//
// The data lives in directory_listings.pricing (JSONB array of packages) plus
// payment_flow / pricing_url / pricing_checked_at — see
// scripts/supabase-directory-pricing.sql for the shape and the reasoning.
// Both directory pages and the public API import from here so a price reads
// the same everywhere.

const PERIOD = {
  one_time:  { en: 'one-time',  th: 'ครั้งเดียว' },
  monthly:   { en: '/ month',   th: '/ เดือน' },
  hourly:    { en: '/ hour',    th: '/ ชั่วโมง' },
  daily:     { en: '/ day',     th: '/ วัน' },
  per_visit: { en: '/ visit',   th: '/ ครั้ง' },
};

// One line each: what the family actually pays, and to whom.
export const PAYMENT_FLOW = {
  helper_direct: {
    short: { en: 'You pay the helper directly', th: 'คุณจ่ายเงินเดือนให้ผู้ช่วยโดยตรง' },
    long: {
      en: 'You pay the helper’s salary yourself. The agency’s fee is a separate charge for finding and placing them.',
      th: 'คุณจ่ายเงินเดือนให้ผู้ช่วยเอง ค่าบริการของเอเจนซี่เป็นค่าจัดหาแยกต่างหาก',
    },
  },
  via_agency: {
    short: { en: 'You pay the agency', th: 'คุณจ่ายให้เอเจนซี่' },
    long: {
      en: 'You pay the agency, and the agency pays the helper. The helper is usually the agency’s employee, not yours.',
      th: 'คุณจ่ายให้เอเจนซี่ แล้วเอเจนซี่จ่ายให้ผู้ช่วย ผู้ช่วยมักเป็นพนักงานของเอเจนซี่ ไม่ใช่ของคุณ',
    },
  },
  both: {
    short: { en: 'Depends on the package', th: 'ขึ้นอยู่กับแพ็กเกจ' },
    long: {
      en: 'Some packages place a helper you then employ directly; others keep the helper on the agency’s payroll. Each package says which.',
      th: 'บางแพ็กเกจจัดหาผู้ช่วยให้คุณจ้างเอง บางแพ็กเกจผู้ช่วยยังอยู่กับเอเจนซี่ แต่ละแพ็กเกจระบุไว้',
    },
  },
};

function pick(obj, lang) {
  return obj ? (obj[lang === 'th' ? 'th' : 'en'] || obj.en) : '';
}

export function formatThb(n) {
  if (n == null || Number.isNaN(Number(n))) return '';
  return '฿' + Number(n).toLocaleString('en-US');
}

export function periodLabel(period, lang) {
  return pick(PERIOD[period], lang);
}

/** Accepts the JSONB value as delivered (array), or a JSON string, or null. */
export function normalizePricing(raw) {
  let v = raw;
  if (typeof v === 'string') {
    try { v = JSON.parse(v); } catch { return []; }
  }
  if (!Array.isArray(v)) return [];
  return v.filter(p => p && typeof p === 'object' && p.name);
}

/**
 * "฿6,000 one-time" / "฿15,000–฿18,000 / month" / "On request".
 *
 * A package may carry `price_label` (and `price_label_th`) instead of a
 * number — "1 month’s salary" is how several agencies price recruitment,
 * and it is a real, published price, just not one in baht.
 */
export function formatPackagePrice(pkg, lang) {
  if (pkg.price_label) {
    const label = (lang === 'th' && pkg.price_label_th) ? pkg.price_label_th : pkg.price_label;
    const per = periodLabel(pkg.period, lang);
    return per ? `${label} ${per}` : label;
  }
  if (pkg.price_thb == null) return lang === 'th' ? 'สอบถามราคา' : 'On request';
  const base = pkg.price_max_thb != null
    ? `${formatThb(pkg.price_thb)}–${formatThb(pkg.price_max_thb)}`
    : formatThb(pkg.price_thb);
  const per = periodLabel(pkg.period, lang);
  return per ? `${base} ${per}` : base;
}

export function packageName(pkg, lang) {
  return (lang === 'th' && pkg.name_th) ? pkg.name_th : pkg.name;
}

export function packageIncludes(pkg, lang) {
  return (lang === 'th' && pkg.includes_th) ? pkg.includes_th : (pkg.includes || '');
}

// Hourly / daily rates are a different product (a cleaner for an afternoon),
// not the price of finding someone. A placement agency that also runs an
// app must not show up as "from ฿210 / hour".
const SPOT_PERIODS = new Set(['hourly', 'daily', 'per_visit']);

/**
 * The cheapest priced package, for a "from …" chip. Placement / monthly
 * packages win over spot rates; spot rates only when nothing else is priced.
 * Null if none priced.
 */
export function cheapestPackage(pricing) {
  const priced = normalizePricing(pricing).filter(p => p.price_thb != null);
  if (!priced.length) return null;
  const pool = priced.some(p => !SPOT_PERIODS.has(p.period))
    ? priced.filter(p => !SPOT_PERIODS.has(p.period))
    : priced;
  return pool.reduce((a, b) => (Number(b.price_thb) < Number(a.price_thb) ? b : a));
}

/** "from ฿6,000 one-time" — or null when nothing is published. */
export function pricingSummary(listing, lang) {
  const cheapest = cheapestPackage(listing?.pricing);
  if (!cheapest) return null;
  const prefix = lang === 'th' ? 'เริ่ม' : 'from';
  // "from" already says it is a lower bound — drop the range's upper end.
  return `${prefix} ${formatPackagePrice({ ...cheapest, price_max_thb: null }, lang)}`;
}

/** Longest replacement guarantee any package offers, in days. */
export function maxReplacementDays(pricing) {
  const days = normalizePricing(pricing)
    .map(p => Number(p.replacement_days))
    .filter(n => Number.isFinite(n) && n > 0);
  return days.length ? Math.max(...days) : null;
}

export function paymentFlowShort(flow, lang) {
  return pick(PAYMENT_FLOW[flow]?.short, lang);
}

export function paymentFlowLong(flow, lang) {
  return pick(PAYMENT_FLOW[flow]?.long, lang);
}

export function formatCheckedDate(iso, lang) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

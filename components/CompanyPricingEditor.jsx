// The "Prices" part of a company's listing form: the packages a family sees
// as a table on the public page, who the family pays, and a link to the
// company's own price page.
//
// Until 2026-11-15 only we could fill that table, by copying an agency's
// website by hand — while the invitation letter told companies they could
// "publish your prices". This is the part that makes the sentence true.
//
// Controlled like the rest of CompanyListingForm: `value` is the listing,
// changes go out through onChange(field, newValue). A package keeps every
// key it arrived with (Thai names, minimum months …), so correcting one
// price on an entry we wrote does not strip what this form does not show.

// The three answers families see as "Who you pay" (lib/directory-pricing.js),
// worded here from the company's side of the table.
const PAYMENT_FLOWS = [
  { value: 'helper_direct', en: 'The family pays the helper; our fee is separate', th: 'ครอบครัวจ่ายเงินเดือนให้ผู้ช่วยเอง ค่าบริการของเราแยกต่างหาก' },
  { value: 'via_agency',    en: 'The family pays us, and we pay the helper',       th: 'ครอบครัวจ่ายให้เรา แล้วเราจ่ายให้ผู้ช่วย' },
  { value: 'both',          en: 'Depends on the package',                          th: 'ขึ้นอยู่กับแพ็กเกจ' },
];

const MAX_PACKAGES = 10;

const PERIODS = [
  { value: 'one_time',  en: 'one-time',  th: 'ครั้งเดียว' },
  { value: 'monthly',   en: 'per month', th: 'ต่อเดือน' },
  { value: 'hourly',    en: 'per hour',  th: 'ต่อชั่วโมง' },
  { value: 'daily',     en: 'per day',   th: 'ต่อวัน' },
  { value: 'per_visit', en: 'per visit', th: 'ต่อครั้ง' },
];

const T = {
  en: {
    title: 'Prices',
    intro: 'Optional. What you enter here is shown as a price table on your public page.',
    pkg: 'Price',
    name: 'What is it for?',
    name_ph: 'e.g. Full-time housekeeper',
    how: 'Price',
    mode_amount: 'Amount in baht',
    mode_text: 'In words',
    mode_request: 'On request',
    from: 'Price (฿)',
    to: 'Up to (฿, optional)',
    text_ph: 'e.g. 1 month’s salary',
    period: 'Charged',
    includes: 'What is included',
    includes_ph: 'e.g. 3 hours, supplies included',
    guarantee: 'Replacement guarantee (days, optional)',
    remove: 'Remove',
    add: '+ Add a price',
    add_first: '+ Add your first price',
    limit: 'That is the most a listing can show.',
    pays: 'Who does the family pay?',
    pays_none: '— Not specified —',
    link: 'Link to your price page',
    link_hint: 'Optional. Families can open it from your listing.',
  },
  th: {
    title: 'ราคา',
    intro: 'ไม่บังคับ ข้อมูลที่กรอกจะแสดงเป็นตารางราคาบนหน้าสาธารณะของคุณ',
    pkg: 'ราคา',
    name: 'ราคานี้สำหรับบริการอะไร',
    name_ph: 'เช่น แม่บ้านเต็มเวลา',
    how: 'ราคา',
    mode_amount: 'จำนวนเงิน (บาท)',
    mode_text: 'เป็นข้อความ',
    mode_request: 'สอบถามราคา',
    from: 'ราคา (฿)',
    to: 'ถึง (฿ ไม่บังคับ)',
    text_ph: 'เช่น เงินเดือน 1 เดือน',
    period: 'คิดราคา',
    includes: 'สิ่งที่รวมอยู่ในราคา',
    includes_ph: 'เช่น 3 ชั่วโมง รวมอุปกรณ์',
    guarantee: 'ระยะรับประกันเปลี่ยนคน (จำนวนวัน ไม่บังคับ)',
    remove: 'ลบ',
    add: '+ เพิ่มรายการราคา',
    add_first: '+ เพิ่มรายการราคา',
    limit: 'เพิ่มได้สูงสุดเท่านี้',
    pays: 'ครอบครัวจ่ายเงินให้ใคร',
    pays_none: '— ไม่ระบุ —',
    link: 'ลิงก์หน้าราคาของคุณ',
    link_hint: 'ไม่บังคับ ครอบครัวเปิดดูได้จากรายชื่อของคุณ',
  },
};

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';
const labelCls = 'block text-xs font-semibold text-navy mb-1';

// Which of the three ways a package is priced. `_mode` is what the company
// last picked in this form; without it, read it off the data.
function modeOf(pkg) {
  if (pkg._mode) return pkg._mode;
  if (pkg.price_label) return 'text';
  if (pkg.price_thb != null && pkg.price_thb !== '') return 'amount';
  return pkg.name ? 'request' : 'amount';
}

export default function CompanyPricingEditor({ value, onChange, lang = 'en' }) {
  const t = T[lang] || T.en;
  const th = lang === 'th';
  const v = value || {};
  const packages = Array.isArray(v.pricing) ? v.pricing : [];
  // Only agencies place a person who might need replacing.
  const showGuarantee = v.type === 'agency' || v.type === 'mou_agency';

  const setPackages = (next) => onChange('pricing', next);
  const patch = (i, changes) => setPackages(packages.map((p, j) => (j === i ? { ...p, ...changes } : p)));
  const setMode = (i, mode) => {
    // Switching the kind of price clears the other kind, so a hidden number
    // cannot outlive the choice "on request".
    if (mode === 'amount') patch(i, { _mode: mode, price_label: '', price_label_th: '' });
    else if (mode === 'text') patch(i, { _mode: mode, price_thb: '', price_max_thb: '' });
    else patch(i, { _mode: mode, price_thb: '', price_max_thb: '', price_label: '', price_label_th: '' });
  };
  const add = () => setPackages([...packages, { name: '', period: 'one_time', price_thb: '', _mode: 'amount' }]);
  const remove = (i) => setPackages(packages.filter((_, j) => j !== i));

  return (
    <div>
      <h3 className="mb-1 mt-6 text-base font-bold text-navy">{t.title}</h3>
      <p className="mb-3 text-xs text-gray-500">{t.intro}</p>

      {packages.map((pkg, i) => {
        const mode = modeOf(pkg);
        return (
          <div key={i} className="mb-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-gray-400">{t.pkg} {i + 1}</span>
              <button type="button" onClick={() => remove(i)} className="text-xs font-semibold text-red-600 hover:underline">
                {t.remove}
              </button>
            </div>

            <div className="mb-3">
              <label className={labelCls}>{t.name}</label>
              <input className={inputCls} value={pkg.name || ''} maxLength={100} placeholder={t.name_ph}
                onChange={(e) => patch(i, { name: e.target.value })} />
            </div>

            <div className="grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>{t.how}</label>
                <select className={inputCls} value={mode} onChange={(e) => setMode(i, e.target.value)}>
                  <option value="amount">{t.mode_amount}</option>
                  <option value="text">{t.mode_text}</option>
                  <option value="request">{t.mode_request}</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>{t.period}</label>
                <select className={inputCls} value={pkg.period || 'one_time'} onChange={(e) => patch(i, { period: e.target.value })}>
                  {PERIODS.map((p) => <option key={p.value} value={p.value}>{th ? p.th : p.en}</option>)}
                </select>
              </div>

              {mode === 'amount' && (
                <>
                  <div>
                    <label className={labelCls}>{t.from}</label>
                    <input className={inputCls} inputMode="numeric" value={pkg.price_thb ?? ''} maxLength={10}
                      onChange={(e) => patch(i, { price_thb: e.target.value.replace(/[^0-9]/g, '') })} />
                  </div>
                  <div>
                    <label className={labelCls}>{t.to}</label>
                    <input className={inputCls} inputMode="numeric" value={pkg.price_max_thb ?? ''} maxLength={10}
                      onChange={(e) => patch(i, { price_max_thb: e.target.value.replace(/[^0-9]/g, '') })} />
                  </div>
                </>
              )}
              {mode === 'text' && (
                <div className="sm:col-span-2">
                  <label className={labelCls}>{t.mode_text}</label>
                  <input className={inputCls} value={pkg.price_label || ''} maxLength={60} placeholder={t.text_ph}
                    onChange={(e) => patch(i, { price_label: e.target.value })} />
                </div>
              )}
            </div>

            <div className="mt-3">
              <label className={labelCls}>{t.includes}</label>
              <input className={inputCls} value={pkg.includes || ''} maxLength={300} placeholder={t.includes_ph}
                onChange={(e) => patch(i, { includes: e.target.value })} />
            </div>

            {(showGuarantee || pkg.replacement_days) && (
              <div className="mt-3 sm:w-1/2">
                <label className={labelCls}>{t.guarantee}</label>
                <input className={inputCls} inputMode="numeric" value={pkg.replacement_days ?? ''} maxLength={3}
                  onChange={(e) => patch(i, { replacement_days: e.target.value.replace(/[^0-9]/g, '') })} />
              </div>
            )}
          </div>
        );
      })}

      {packages.length < MAX_PACKAGES ? (
        <button type="button" onClick={add}
          className="rounded-lg border border-dashed border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5">
          {packages.length ? t.add : t.add_first}
        </button>
      ) : (
        <p className="text-xs text-gray-500">{t.limit}</p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-navy mb-1">{t.pays}</label>
          <select className={inputCls} value={v.paymentFlow || ''} onChange={(e) => onChange('paymentFlow', e.target.value)}>
            <option value="">{t.pays_none}</option>
            {PAYMENT_FLOWS.map((f) => (
              <option key={f.value} value={f.value}>{th ? f.th : f.en}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-navy mb-1">{t.link}</label>
          <input className={inputCls} value={v.pricingUrl || ''} maxLength={300} placeholder="https://"
            onChange={(e) => onChange('pricingUrl', e.target.value)} />
          <p className="mt-1 text-xs text-gray-500">{t.link_hint}</p>
        </div>
      </div>
    </div>
  );
}

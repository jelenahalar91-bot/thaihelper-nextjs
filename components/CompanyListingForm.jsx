// Shared directory-listing form, used by both the onboarding page
// (/business-onboarding) and the company dashboard (/business-dashboard).
//
// Fully controlled: parent owns `value` (camelCase, mirrors toEditableListing)
// and gets updates via onChange(field, newValue). CSV fields (specialties,
// languages, nationalities) are stored as comma strings; the chips toggle them.

import { useState, useEffect } from 'react';
import {
  DIRECTORY_TYPES,
  groupedSpecialties,
  DIRECTORY_LANGUAGES,
  NATIONALITIES_PLACED,
} from '@/lib/constants/directory';
import { CITY_OPTIONS } from '@/lib/constants/cities';

function csvHas(csv, v) {
  return String(csv || '').split(',').map(s => s.trim()).includes(v);
}
function csvToggle(csv, v) {
  const list = String(csv || '').split(',').map(s => s.trim()).filter(Boolean);
  const i = list.indexOf(v);
  if (i >= 0) list.splice(i, 1);
  else list.push(v);
  return list.join(',');
}

// Cities as chips (value=slug) so companies can only pick valid cities —
// free text led to typos that broke the directory's city filter.
const CITY_CHIP_OPTIONS = CITY_OPTIONS.map(c => ({ value: c.slug, en: c.name, th: c.name }));

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';
const labelCls = 'block text-sm font-semibold text-navy mb-1';

function Field({ label, hint, children }) {
  return (
    <div className="mb-4">
      <label className={labelCls}>{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

// `other` adds an "Other" chip that opens one line of free text — the chips
// are the part families filter on, but a company that also speaks French or
// places Nepali staff had nowhere to say so.
function ChipGroup({ options, value, onToggle, lang, other }) {
  const [otherOpen, setOtherOpen] = useState(Boolean(other?.value));
  // The listing arrives after the first render on the onboarding page.
  useEffect(() => { if (other?.value) setOtherOpen(true); }, [other?.value]);
  const th = lang === 'th';

  return (
    <>
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const on = csvHas(value, opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onToggle(opt.value)}
            className={
              'rounded-full border px-3 py-1.5 text-sm transition ' +
              (on
                ? 'border-primary bg-primary/10 text-primary font-semibold'
                : 'border-gray-300 bg-white text-gray-600')
            }
          >
            {opt.flag ? `${opt.flag} ` : ''}{lang === 'th' ? opt.th : opt.en}
          </button>
        );
      })}
      {other && (
        <button
          type="button"
          aria-expanded={otherOpen}
          onClick={() => {
            // Closing it is how you take the entry back, so it clears the text.
            if (otherOpen) other.onChange('');
            setOtherOpen(!otherOpen);
          }}
          className={
            'rounded-full border px-3 py-1.5 text-sm transition ' +
            (otherOpen
              ? 'border-primary bg-primary/10 text-primary font-semibold'
              : 'border-gray-300 bg-white text-gray-600')
          }
        >
          {th ? 'อื่นๆ' : 'Other'}
        </button>
      )}
    </div>
    {other && otherOpen && (
      <input
        className={inputCls + ' mt-2'}
        value={other.value || ''}
        onChange={(e) => other.onChange(e.target.value)}
        maxLength={120}
        placeholder={other.placeholder}
        aria-label={other.label}
        autoFocus={!other.value}
      />
    )}
    </>
  );
}

export default function CompanyListingForm({ value, onChange, lang = 'en' }) {
  const v = value || {};
  const set = (field) => (e) => onChange(field, e.target.value);
  const th = lang === 'th';

  return (
    <div>
      <h3 className="mb-3 text-base font-bold text-navy">{th ? 'ข้อมูลบริษัท' : 'Company details'}</h3>

      <Field label={th ? 'ชื่อบริษัท' : 'Company name'}>
        <input className={inputCls} value={v.name || ''} onChange={set('name')} maxLength={120} />
      </Field>

      <Field label={th ? 'ชื่อ (ภาษาไทย)' : 'Name (Thai, optional)'}>
        <input className={inputCls} value={v.nameTh || ''} onChange={set('nameTh')} maxLength={120} />
      </Field>

      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <Field label={th ? 'ประเภท' : 'Type'}>
          <select className={inputCls} value={v.type || ''} onChange={set('type')}>
            <option value="">{th ? '— เลือก —' : '— Select —'}</option>
            {DIRECTORY_TYPES.map(o => (
              <option key={o.value} value={o.value}>{th ? o.th : o.en}</option>
            ))}
          </select>
        </Field>

        <Field label={th ? 'เมืองหลัก' : 'Main city'}>
          <select className={inputCls} value={v.city || ''} onChange={set('city')}>
            <option value="">{th ? '— เลือก —' : '— Select —'}</option>
            {CITY_OPTIONS.map(c => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label={th ? 'พื้นที่ให้บริการ' : 'Cities served'}
        hint={th ? 'แตะเมืองทั้งหมดที่คุณให้บริการ' : 'Tap all the cities you serve'}
      >
        <ChipGroup options={CITY_CHIP_OPTIONS} value={v.citiesServed} lang={lang}
          onToggle={(val) => onChange('citiesServed', csvToggle(v.citiesServed, val))} />
      </Field>

      <Field label={th ? 'ที่อยู่' : 'Address'}>
        <input className={inputCls} value={v.address || ''} onChange={set('address')} maxLength={200} />
      </Field>

      <h3 className="mb-3 mt-6 text-base font-bold text-navy">{th ? 'ข้อมูลติดต่อ' : 'Contact details'}</h3>

      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <Field label={th ? 'โทรศัพท์' : 'Phone'}>
          <input className={inputCls} value={v.phone || ''} onChange={set('phone')} maxLength={60} />
        </Field>
        <Field label="WhatsApp">
          <input className={inputCls} value={v.whatsapp || ''} onChange={set('whatsapp')} maxLength={60} />
        </Field>
        <Field label="LINE ID">
          <input className={inputCls} value={v.lineId || ''} onChange={set('lineId')} maxLength={60} />
        </Field>
        <Field label={th ? 'อีเมลติดต่อ' : 'Contact email'}>
          <input className={inputCls} value={v.email || ''} onChange={set('email')} maxLength={160} />
        </Field>
        <Field label={th ? 'เว็บไซต์' : 'Website'}>
          <input className={inputCls} value={v.website || ''} onChange={set('website')} maxLength={200} placeholder="https://" />
        </Field>
        <Field label={th ? 'ลิงก์ Google Maps' : 'Google Maps link'}>
          <input className={inputCls} value={v.googleMapsUrl || ''} onChange={set('googleMapsUrl')} maxLength={300} />
        </Field>
        <Field label={th ? 'เวลาทำการ' : 'Opening hours'}>
          <input className={inputCls} value={v.openingHours || ''} onChange={set('openingHours')} maxLength={200} placeholder={th ? 'จ–ศ 9:00–18:00' : 'Mon–Fri 9am–6pm'} />
        </Field>
        <Field label={th ? 'เลขทะเบียน / ใบอนุญาต' : 'License / registration no.'}>
          <input className={inputCls} value={v.licenseNumber || ''} onChange={set('licenseNumber')} maxLength={80} />
        </Field>
      </div>

      <h3 className="mb-3 mt-6 text-base font-bold text-navy">{th ? 'รายละเอียด' : 'About'}</h3>

      <Field label={th ? 'คำอธิบาย (อังกฤษ)' : 'Description (English)'}>
        <textarea className={inputCls} rows={4} value={v.description || ''} onChange={set('description')} maxLength={2000} />
      </Field>
      <Field label={th ? 'คำอธิบาย (ไทย)' : 'Description (Thai, optional)'}>
        <textarea className={inputCls} rows={4} value={v.descriptionTh || ''} onChange={set('descriptionTh')} maxLength={2000} />
      </Field>

      <Field label={th ? 'บริการเฉพาะทาง' : 'Specialties'}>
        {/* One heading per group. Unheaded, 22 chips read as a single blob
            and companies tick the first few rather than the right ones. */}
        {groupedSpecialties().map(g => (
          <div key={g.value} className="mb-3 last:mb-0">
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {th ? g.th : g.en}
            </div>
            <ChipGroup options={g.options} value={v.specialties} lang={lang}
              onToggle={(val) => onChange('specialties', csvToggle(v.specialties, val))} />
          </div>
        ))}
      </Field>

      <Field label={th ? 'ภาษาที่ให้บริการ' : 'Languages spoken'}>
        <ChipGroup options={DIRECTORY_LANGUAGES} value={v.languagesSpoken} lang={lang}
          onToggle={(val) => onChange('languagesSpoken', csvToggle(v.languagesSpoken, val))}
          other={{
            value: v.languagesOther,
            onChange: (val) => onChange('languagesOther', val),
            label: th ? 'ภาษาอื่นๆ' : 'Other languages',
            placeholder: th ? 'เช่น ฝรั่งเศส, เกาหลี' : 'e.g. French, Korean',
          }} />
      </Field>

      <Field label={th ? 'สัญชาติของพนักงานที่จัดหา' : 'Nationalities placed'}>
        <ChipGroup options={NATIONALITIES_PLACED} value={v.nationalitiesPlaced} lang={lang}
          onToggle={(val) => onChange('nationalitiesPlaced', csvToggle(v.nationalitiesPlaced, val))}
          other={{
            value: v.nationalitiesOther,
            onChange: (val) => onChange('nationalitiesOther', val),
            label: th ? 'สัญชาติอื่นๆ' : 'Other nationalities',
            placeholder: th ? 'เช่น ลาว, เนปาล' : 'e.g. Laotian, Nepali',
          }} />
      </Field>
    </div>
  );
}

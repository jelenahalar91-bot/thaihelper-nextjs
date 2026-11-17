// Shared "which part of the city?" control — helpers (where they want to
// work), families (where they live) and companies (which parts they cover).
//
// Click first, type only when the list does not have it: the free-text line
// this replaces produced 56 spellings for Phuket's areas alone. A city we
// have no list for falls back to the plain line, as before.
//
// Self-styled (inline colours, a few layout utilities) because the pages that
// use it share no stylesheet: the signup pages are hand-written CSS, the
// company forms are Tailwind, the dashboards are inline styles.
import { useEffect, useMemo, useState } from 'react';
import { areasFor, parseAreaSlugs, MAX_AREAS, MAX_AREA_OTHER } from '@/lib/constants/areas';

const T = {
  en: {
    anywhere: (city) => `Anywhere in ${city}`,
    other: 'Other',
    other_ph: 'Type your area',
    plain_ph: 'e.g. neighbourhood or district',
    search_ph: 'Type to find an area',
    none_found: 'Not in the list? Use “Other”.',
    max: (n) => `You can pick up to ${n}.`,
  },
  th: {
    anywhere: (city) => `ทั่ว${city}`,
    other: 'อื่นๆ',
    other_ph: 'พิมพ์ชื่อย่านของคุณ',
    plain_ph: 'เช่น ชื่อย่านหรืออำเภอ',
    search_ph: 'พิมพ์เพื่อค้นหาย่าน',
    none_found: 'ไม่มีในรายการ? เลือก “อื่นๆ”',
    max: (n) => `เลือกได้สูงสุด ${n} ย่าน`,
  },
};

const SEARCH_FROM = 16; // lists longer than this get a find-as-you-type line

const flat = (s) => String(s || '').toLowerCase().replace(/[\s\-_.]+/g, '');

/**
 * @param {string}   city      city slug; the list shown depends on it
 * @param {string}   cityLabel display name of the city, for "Anywhere in …"
 * @param {string}   slugs     CSV of selected area slugs
 * @param {string}   other     the free-text line
 * @param {function} onChange  ({ slugs: 'a,b', other: '…' }) => void
 * @param {number}   max       how many areas may be picked (1 = single choice)
 * @param {string}   accent    brand colour of the page (teal helpers, gold families)
 * @param {string}   anywhereLabel  override for the "Anywhere in …" chip
 * @param {string}   id        id for the text input, so a <label htmlFor> works
 */
export default function AreaPicker({
  city, cityLabel, slugs, other, onChange, lang = 'en',
  max = MAX_AREAS, accent = '#006a62', anywhereLabel, id,
}) {
  const t = T[lang === 'th' ? 'th' : 'en'];
  const areas = useMemo(() => areasFor(city), [city]);
  const selected = useMemo(() => parseAreaSlugs(slugs), [slugs]);
  const [otherOpen, setOtherOpen] = useState(Boolean(other));
  const [query, setQuery] = useState('');

  // The stored value arrives after the first render on the edit pages.
  useEffect(() => { if (other) setOtherOpen(true); }, [other]);
  useEffect(() => { setQuery(''); }, [city]);

  const emit = (nextSlugs, nextOther) => onChange({ slugs: nextSlugs.join(','), other: nextOther });

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '10px 12px', fontSize: 15,
    border: '1px solid #d1d5db', borderRadius: 10, background: '#fff', color: '#1a1a1a',
    fontFamily: 'inherit',
  };

  // No list for this city: the plain line, exactly as it was.
  if (!areas.length) {
    return (
      <input
        id={id}
        type="text"
        value={other || ''}
        maxLength={MAX_AREA_OTHER}
        placeholder={t.plain_ph}
        onChange={(e) => emit([], e.target.value)}
        style={inputStyle}
      />
    );
  }

  const chip = (on, disabled) => ({
    borderRadius: 999, padding: '7px 13px', fontSize: 14, lineHeight: 1.2,
    border: `1.5px solid ${on ? accent : '#d1d5db'}`,
    background: on ? `${accent}1a` : '#fff',
    color: on ? accent : '#4b5563',
    fontWeight: on ? 700 : 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  });

  const toggle = (slug) => {
    // Found it — the search has done its job, show the whole list again.
    setQuery('');
    if (selected.includes(slug)) return emit(selected.filter((s) => s !== slug), other || '');
    if (max === 1) return emit([slug], other || '');
    if (selected.length >= max) return undefined;
    return emit([...selected, slug], other || '');
  };

  const q = flat(query);
  const hits = (a) => flat(a.en).includes(q) || flat(a.th).includes(q) || flat(a.slug).includes(q);
  const visible = q ? areas.filter((a) => selected.includes(a.slug) || hits(a)) : areas;
  const noneFound = Boolean(q) && !areas.some(hits);
  const full = max > 1 && selected.length >= max;
  const nothing = selected.length === 0 && !otherOpen;

  return (
    <div>
      {areas.length > SEARCH_FROM && (
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search_ph}
          aria-label={t.search_ph}
          style={{ ...inputStyle, marginBottom: 8, padding: '8px 12px', fontSize: 14 }}
        />
      )}
      <div
        role="group"
        style={{
          display: 'flex', flexWrap: 'wrap', gap: 8,
          maxHeight: areas.length > SEARCH_FROM ? 196 : 'none',
          overflowY: areas.length > SEARCH_FROM ? 'auto' : 'visible',
          padding: areas.length > SEARCH_FROM ? '2px 2px 4px' : 0,
        }}
      >
        {!q && (
          <button
            type="button"
            aria-pressed={nothing}
            style={chip(nothing, false)}
            onClick={() => { setOtherOpen(false); emit([], ''); }}
          >
            {anywhereLabel || t.anywhere(cityLabel || '')}
          </button>
        )}
        {visible.map((a) => {
          const on = selected.includes(a.slug);
          const disabled = !on && full;
          return (
            <button
              key={a.slug}
              type="button"
              aria-pressed={on}
              disabled={disabled}
              style={chip(on, disabled)}
              onClick={() => toggle(a.slug)}
            >
              {lang === 'th' ? a.th : a.en}
            </button>
          );
        })}
        <button
          type="button"
          aria-expanded={otherOpen}
          style={chip(otherOpen, false)}
          onClick={() => {
            // Closing it is how you take the entry back, so it clears the text.
            if (otherOpen) emit(selected, '');
            setOtherOpen(!otherOpen);
          }}
        >
          {t.other}
        </button>
      </div>
      {noneFound && (
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>{t.none_found}</div>
      )}
      {full && (
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>{t.max(max)}</div>
      )}
      {otherOpen && (
        <input
          id={id}
          type="text"
          value={other || ''}
          maxLength={MAX_AREA_OTHER}
          placeholder={t.other_ph}
          autoFocus={!other}
          onChange={(e) => emit(selected, e.target.value)}
          style={{ ...inputStyle, marginTop: 8 }}
        />
      )}
    </div>
  );
}

// The second filter under "City" on every browse page: once a city with a
// list is chosen, its areas to pick from. A city we have no list for (and
// "all cities") keeps the search-as-you-type line the pages always had.
// Filtering itself is areaFilterMatches() in lib/constants/areas.js.
import { useEffect, useRef } from 'react';
import { areasFor } from '@/lib/constants/areas';
import { toCitySlug } from '@/lib/constants/cities';
import { useLang } from '@/pages/_app';

export default function AreaFilter({
  city, value, onChange, lang: langProp,
  allLabel, placeholder, selectStyle, inputStyle, selectClassName, inputClassName, id,
}) {
  const ctx = useLang();
  const lang = langProp || ctx?.lang || 'en';
  const slug = toCitySlug(city);
  const areas = areasFor(slug);

  // A Phuket area means nothing once the city is Bangkok.
  const lastCity = useRef(slug);
  useEffect(() => {
    if (lastCity.current !== slug) {
      lastCity.current = slug;
      if (value) onChange('');
    }
  }, [slug, value, onChange]);

  if (!areas.length) {
    return (
      <input
        id={id}
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
        className={inputClassName}
      />
    );
  }

  return (
    <select
      id={id}
      value={areas.some((a) => a.slug === value) ? value : ''}
      onChange={(e) => onChange(e.target.value)}
      style={selectStyle}
      className={selectClassName}
    >
      <option value="">{allLabel || (lang === 'th' ? 'ทุกย่าน' : 'All areas')}</option>
      {areas.map((a) => (
        <option key={a.slug} value={a.slug}>{lang === 'th' ? a.th : a.en}</option>
      ))}
    </select>
  );
}

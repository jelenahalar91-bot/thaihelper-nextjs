/**
 * Inline work-permit guidance for helpers.
 *
 * Rendered under the nationality field on /register and on the helper's
 * own /profile edit form. Informational only — it never blocks a signup
 * and is never shown to employers.
 *
 * Self-contained inline styles on purpose: /register uses styled-jsx
 * with a `field` class system, /profile uses inline styles, and this
 * component has to look right in both.
 */

import { getWorkPermitGuidance } from '@/lib/work-permit-guidance';

const TONE = {
  // Gold — the family-side accent, used here for "read this carefully".
  warn: { bg: '#FEF6EC', border: '#F4A261', title: '#8A4B12', icon: '⚠️' },
  // Brand teal — neutral, "here is how your route works".
  info: { bg: '#EDF5F4', border: '#006a62', title: '#00524C', icon: 'ℹ️' },
};

const MORE = { en: 'Read the full work-permit guide', th: 'อ่านคู่มือใบอนุญาตทำงานฉบับเต็ม' };

export default function WorkPermitNotice({ nationality, categories, lang = 'en' }) {
  const notices = getWorkPermitGuidance(nationality, categories);
  if (notices.length === 0) return null;

  const l = lang === 'th' ? 'th' : 'en';

  return (
    <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
      {notices.map(n => {
        const tone = TONE[n.tone] || TONE.info;
        const copy = n[l] || n.en;
        return (
          <div
            key={n.id}
            style={{
              background: tone.bg,
              borderLeft: `3px solid ${tone.border}`,
              borderRadius: 8,
              padding: '12px 14px',
              fontSize: '0.85rem',
              lineHeight: 1.55,
              color: '#374151',
            }}
          >
            <div style={{ fontWeight: 700, color: tone.title, marginBottom: 4 }}>
              {tone.icon} {copy.title}
            </div>
            <div>{copy.body}</div>
            {n.link && (
              <a
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  marginTop: 6,
                  color: tone.title,
                  fontWeight: 600,
                  textDecoration: 'underline',
                }}
              >
                {MORE[l]} →
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

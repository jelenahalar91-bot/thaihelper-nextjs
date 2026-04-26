/**
 * Modal showing a helper's full public profile.
 *
 * Opened from the conversation header so employers can quickly review
 * who they're chatting with without navigating away. The parent passes
 * a `helper` object already loaded from /api/helpers (employer-dashboard
 * has the full list in state, so no extra fetch needed).
 *
 * All raw database values (skills, rate, category, experience, languages)
 * are mapped to human-readable labels using the shared constants.
 *
 * Props:
 *   helper: full helper object from /api/helpers (public shape, no contacts)
 *   onClose: () => void
 *   t: translations from the parent page (employer-dashboard)
 *   lang: current language ('en' | 'th')
 */

import { useEffect, useState } from 'react';
import {
  CATEGORIES,
  SKILLS_BY_CATEGORY,
  RATES,
  LANGUAGES,
} from '../../lib/constants/categories';

// ─── Label helpers ──────────────────────────────────────────────────────────

function getCategoryLabel(slug, lang = 'en') {
  if (!slug) return '';
  const cat = CATEGORIES.find(c => c.value === slug);
  return cat ? (cat[lang] || cat.en) : slug;
}

function getSkillLabels(skillsStr, category, lang = 'en') {
  if (!skillsStr) return [];
  const slugs = skillsStr.split(',').map(s => s.trim()).filter(Boolean);
  const pool = SKILLS_BY_CATEGORY[category] || [];
  // Also check all categories in case skills don't match the current category
  const allSkills = Object.values(SKILLS_BY_CATEGORY).flat();

  return slugs.map(slug => {
    const match = pool.find(s => s.value === slug) || allSkills.find(s => s.value === slug);
    return match ? (match[lang] || match.en) : slug;
  });
}

function getRateLabel(rateVal, lang = 'en') {
  if (!rateVal) return '';
  const rate = RATES.find(r => r.value === rateVal);
  return rate ? (rate[lang] || rate.en) : rateVal;
}

function getLanguageLabels(langStr) {
  if (!langStr) return '';
  const slugs = langStr.split(',').map(s => s.trim()).filter(Boolean);
  return slugs.map(slug => {
    const match = LANGUAGES.find(l => l.value === slug);
    return match ? match.label : slug;
  }).join(', ');
}

const EXP_MAP = {
  en: { '0': 'Less than 1 year', '1': '1–2 years', '3': '3–5 years', '6': '6–10 years', '10': '10+ years' },
  th: { '0': 'น้อยกว่า 1 ปี', '1': '1–2 ปี', '3': '3–5 ปี', '6': '6–10 ปี', '10': '10+ ปี' },
};

function getExperienceLabel(exp, lang = 'en') {
  if (!exp) return '';
  const map = EXP_MAP[lang] || EXP_MAP.en;
  return map[String(exp)] || `${exp} years`;
}

const REL_LABELS = {
  employer: '👔 Former Employer',
  colleague: '🤝 Colleague',
  trainer: '🎓 Trainer',
  other: '📋 Reference',
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function HelperProfileModal({ helper, onClose, t, lang = 'en' }) {
  const [references, setReferences] = useState([]);
  const [refsLoading, setRefsLoading] = useState(true);
  const [certDocs, setCertDocs] = useState([]);
  const [certsLoading, setCertsLoading] = useState(true);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Prevent body scroll while modal open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Fetch references when modal opens
  useEffect(() => {
    if (!helper?.ref) { setRefsLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/helper-references?ref=${helper.ref}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setReferences(data.references || []);
        }
      } catch (err) {
        console.error('Failed to load references:', err);
      }
      if (!cancelled) setRefsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [helper?.ref]);

  // Fetch certificate documents when modal opens
  useEffect(() => {
    if (!helper?.ref) { setCertsLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/helper-documents?ref=${helper.ref}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setCertDocs(data.documents || []);
        }
      } catch (err) {
        console.error('Failed to load certificate documents:', err);
      }
      if (!cancelled) setCertsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [helper?.ref]);

  if (!helper) return null;

  const displayName =
    [helper.firstName, helper.lastName].filter(Boolean).join(' ') || 'Helper';
  const initial = (helper.firstName || '?')[0].toUpperCase();
  const categoryLabel = getCategoryLabel(helper.category, lang);
  const rateLabel = getRateLabel(helper.rate, lang);
  const expLabel = getExperienceLabel(helper.experience, lang);
  const langLabels = getLanguageLabels(helper.languages);
  const skillLabels = getSkillLabels(helper.skills, helper.category, lang);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          animation: 'slideUp 0.25s ease-out',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Gradient hero with photo + close button */}
        <div style={{
          position: 'relative',
          background: 'linear-gradient(135deg, #006a62 0%, #00897e 50%, #00b29c 100%)',
          padding: '28px 24px 24px',
          color: 'white',
        }}>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute', top: '14px', right: '14px',
              zIndex: 10,
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(8px)',
              border: 'none', color: 'white',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.32)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Decorative blobs — pointerEvents:none so they don't block the X */}
          <div aria-hidden style={{
            position: 'absolute', top: '-40px', right: '-40px',
            width: '140px', height: '140px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            pointerEvents: 'none',
          }} />
          <div aria-hidden style={{
            position: 'absolute', bottom: '-20px', left: '-30px',
            width: '100px', height: '100px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', textAlign: 'center' }}>
            <div style={{
              width: '96px', height: '96px', borderRadius: '50%',
              background: 'white',
              border: '4px solid rgba(255,255,255,0.5)',
              margin: '0 auto 14px',
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '36px', color: '#006a62', fontWeight: 800,
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            }}>
              {helper.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={helper.photo}
                  alt={displayName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : initial}
            </div>
            <h2 style={{
              fontSize: '24px', fontWeight: 800, margin: '0 0 4px',
              letterSpacing: '-0.3px',
            }}>
              {displayName}
              {helper.age && (
                <span style={{ fontWeight: 500, opacity: 0.85 }}> · {helper.age}</span>
              )}
            </h2>
            {categoryLabel && (
              <div style={{
                fontSize: '14px', opacity: 0.95, fontWeight: 500,
              }}>
                {categoryLabel}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{
          padding: '16px 24px 28px',
        }}>
          {/* Info pill card */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '18px 20px',
            marginBottom: '16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb',
          }}>
            <InfoRow icon="📍" label={t?.profile_location || 'Location'}>
              {helper.city}
              {helper.area ? ` · ${helper.area}` : ''}
            </InfoRow>
            {expLabel && (
              <InfoRow icon="⏱" label={t?.profile_experience || 'Experience'}>
                {expLabel}
              </InfoRow>
            )}
            {langLabels && (
              <InfoRow icon="🗣" label={t?.profile_languages || 'Languages'}>
                {langLabels}
              </InfoRow>
            )}
            {helper.education && (
              <InfoRow icon="🎓" label={t?.profile_education || 'Education'}>
                {helper.education}
              </InfoRow>
            )}
            {rateLabel && (
              <InfoRow icon="💰" label={t?.profile_rate || 'Rate'} last>
                {rateLabel}
              </InfoRow>
            )}
          </div>

          {/* About / bio — show English translation to English viewers when available */}
          {(() => {
            const displayBio = lang === 'th' ? helper.bio : (helper.bioEn || helper.bio);
            if (!displayBio) return null;
            return (
              <Section title={t?.profile_about || 'About'}>
                <p style={{
                  fontSize: '14px', lineHeight: 1.65, color: '#374151', margin: 0,
                  whiteSpace: 'pre-wrap',
                }}>
                  {displayBio}
                </p>
              </Section>
            );
          })()}

          {/* Skills — mapped to readable labels with emoji */}
          {skillLabels.length > 0 && (
            <Section title={t?.profile_skills || 'Skills'}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {skillLabels.map((label, i) => (
                  <span key={i} style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    fontSize: '13px',
                    color: '#166534',
                    fontWeight: 500,
                  }}>
                    {label}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Certificates */}
          <Section title={t?.profile_certificates || 'Certificates'}>
            {/* Text description (from free-text field) */}
            {helper.certificates && (
              <p style={{
                fontSize: '14px', lineHeight: 1.6, color: '#374151',
                margin: certDocs.length > 0 ? '0 0 14px' : 0,
              }}>
                {helper.certificates}
              </p>
            )}

            {/* Uploaded certificate images with privacy overlay */}
            {certsLoading ? (
              <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
                Loading...
              </p>
            ) : certDocs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {certDocs.map((doc) => (
                  <CertificatePreview key={doc.id} doc={doc} t={t} />
                ))}
              </div>
            ) : !helper.certificates ? (
              <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0, fontStyle: 'italic' }}>
                {t?.profile_no_certificates || 'No certificates uploaded yet.'}
              </p>
            ) : null}
          </Section>

          {/* Recommendations / References */}
          <Section title={t?.profile_recommendations || 'Recommendations'}>
            {refsLoading ? (
              <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
                Loading...
              </p>
            ) : references.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0, fontStyle: 'italic' }}>
                {t?.profile_no_recommendations || 'No recommendations yet.'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {references.map((ref) => (
                  <div key={ref.id} style={{
                    padding: '12px 14px',
                    background: '#faf5ff',
                    borderRadius: '12px',
                    border: '1px solid #e9d5ff',
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      marginBottom: ref.reference_text ? '6px' : 0,
                    }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>
                        {ref.reference_name}
                      </span>
                      <span style={{
                        fontSize: '11px', color: '#7c3aed', fontWeight: 500,
                        background: '#ede9fe', padding: '2px 8px', borderRadius: '10px',
                      }}>
                        {REL_LABELS[ref.relationship] || ref.relationship}
                      </span>
                    </div>
                    {ref.reference_text && (
                      <p style={{
                        fontSize: '13px', color: '#555', margin: 0,
                        lineHeight: 1.5, fontStyle: 'italic',
                      }}>
                        &ldquo;{ref.reference_text}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>

      {/* Inline keyframes (kept local so the modal doesn't depend on globals) */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function CertificatePreview({ doc, t }) {
  if (!doc.isImage || !doc.url) {
    // PDF or missing URL — show as file badge
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 14px',
        background: '#f9fafb', borderRadius: '10px',
        border: '1px solid #e5e7eb',
      }}>
        <span style={{ fontSize: '20px' }}>📄</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '13px', fontWeight: 600, color: '#374151',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {doc.fileName}
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>PDF document</div>
        </div>
      </div>
    );
  }

  // Image certificate — entire image blurred for privacy (GDPR-safe)
  // Contact details, addresses, DOBs can appear ANYWHERE on certificates,
  // so we blur the whole image. Employers contact the helper to verify details.
  return (
    <div style={{
      position: 'relative',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid #e5e7eb',
      background: '#f9fafb',
      minHeight: '180px',
    }}>
      {/* Certificate image — fully blurred */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={doc.url}
        alt={doc.fileName}
        loading="lazy"
        style={{
          width: '100%',
          display: 'block',
          borderRadius: '12px',
          filter: 'blur(14px)',
          WebkitFilter: 'blur(14px)',
          transform: 'scale(1.05)', // avoid blur edge artifacts
        }}
      />

      {/* Centered privacy badge */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'rgba(0, 106, 98, 0.95)',
          color: 'white',
          padding: '10px 18px',
          borderRadius: '24px',
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.2px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          {t?.profile_cert_privacy || 'Certificate available after contact'}
        </div>
      </div>

      {/* File name label */}
      <div style={{
        position: 'absolute',
        top: '8px', left: '8px',
        background: 'rgba(0,0,0,0.6)',
        color: 'white',
        padding: '3px 10px',
        borderRadius: '8px',
        fontSize: '11px',
        fontWeight: 500,
        maxWidth: '80%',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {doc.fileName}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, children, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '12px',
      padding: '10px 0',
      borderBottom: last ? 'none' : '1px solid #f3f4f6',
    }}>
      <div style={{
        fontSize: '18px', width: '24px', textAlign: 'center', flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '11px', fontWeight: 700, color: '#9ca3af',
          textTransform: 'uppercase', letterSpacing: '0.4px',
          marginBottom: '2px',
        }}>
          {label}
        </div>
        <div style={{ fontSize: '14px', color: '#1a1a1a', fontWeight: 500 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <h3 style={{
        fontSize: '12px', fontWeight: 800, color: '#9ca3af',
        textTransform: 'uppercase', letterSpacing: '0.6px',
        margin: '0 0 8px', padding: '0 4px',
      }}>
        {title}
      </h3>
      <div style={{
        background: 'white',
        borderRadius: '14px',
        padding: '16px 18px',
        border: '1px solid #e5e7eb',
      }}>
        {children}
      </div>
    </div>
  );
}

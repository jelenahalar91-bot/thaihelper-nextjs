/**
 * Modal showing a helper's full public profile.
 *
 * Opened from the conversation header so employers can quickly review
 * who they're chatting with without navigating away. The parent passes
 * a `helper` object already loaded from /api/helpers (employer-dashboard
 * has the full list in state, so no extra fetch needed).
 *
 * Props:
 *   helper: full helper object from /api/helpers (public shape, no contacts)
 *   onClose: () => void
 *   t: translations from the parent page (employer-dashboard)
 */

import { useEffect } from 'react';

export default function HelperProfileModal({ helper, onClose, t }) {
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

  if (!helper) return null;

  const displayName =
    [helper.firstName, helper.lastName].filter(Boolean).join(' ') || 'Helper';
  const initial = (helper.firstName || '?')[0].toUpperCase();

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
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          animation: 'slideUp 0.25s ease-out',
        }}
      >
        {/* Gradient hero with photo + close button */}
        <div style={{
          position: 'relative',
          background: 'linear-gradient(135deg, #006a62 0%, #00897e 50%, #00b29c 100%)',
          padding: '28px 24px 64px',
          color: 'white',
        }}>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute', top: '14px', right: '14px',
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

          {/* Decorative blobs */}
          <div aria-hidden style={{
            position: 'absolute', top: '-40px', right: '-40px',
            width: '140px', height: '140px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }} />
          <div aria-hidden style={{
            position: 'absolute', bottom: '-20px', left: '-30px',
            width: '100px', height: '100px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
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
            {helper.category && (
              <div style={{
                fontSize: '14px', opacity: 0.95, fontWeight: 500,
              }}>
                {helper.category}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '0 24px 24px',
          marginTop: '-40px',
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
            {helper.experience && (
              <InfoRow icon="⏱" label={t?.profile_experience || 'Experience'}>
                {helper.experience} {t?.card_yrs || 'years'}
              </InfoRow>
            )}
            {helper.languages && (
              <InfoRow icon="🗣" label={t?.profile_languages || 'Languages'}>
                {helper.languages}
              </InfoRow>
            )}
            {helper.education && (
              <InfoRow icon="🎓" label={t?.profile_education || 'Education'}>
                {helper.education}
              </InfoRow>
            )}
            {helper.rate && (
              <InfoRow icon="💰" label={t?.profile_rate || 'Rate'} last>
                {helper.rate}
              </InfoRow>
            )}
          </div>

          {/* About / bio */}
          {helper.bio && (
            <Section title={t?.profile_about || 'About'}>
              <p style={{
                fontSize: '14px', lineHeight: 1.65, color: '#374151', margin: 0,
                whiteSpace: 'pre-wrap',
              }}>
                {helper.bio}
              </p>
            </Section>
          )}

          {/* Skills */}
          {helper.skills && (
            <Section title={t?.profile_skills || 'Skills'}>
              <p style={{
                fontSize: '14px', lineHeight: 1.6, color: '#374151', margin: 0,
              }}>
                {helper.skills}
              </p>
            </Section>
          )}

          {/* Certificates */}
          {helper.certificates && (
            <Section title={t?.profile_certificates || 'Certificates'}>
              <p style={{
                fontSize: '14px', lineHeight: 1.6, color: '#374151', margin: 0,
              }}>
                {helper.certificates}
              </p>
            </Section>
          )}
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

/**
 * Modal showing an employer's profile.
 *
 * Opened from the conversation header so helpers can see who they're
 * chatting with. The parent passes the `employer` object from the
 * conversation's counterparty data + the full employer list.
 *
 * Props:
 *   employer: { ref, firstName, lastName, city, area, lookingFor, jobDescription,
 *               arrangementPreference, preferredAgeRange }
 *   onClose: () => void
 *   t: translations (from helper dashboard)
 */

import { useEffect } from 'react';

export default function EmployerProfileModal({ employer, onClose, t }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  if (!employer) return null;

  const displayName =
    [employer.firstName, employer.lastName].filter(Boolean).join(' ') || 'Employer';
  const initial = (employer.firstName || '?')[0].toUpperCase();

  const arrangementLabel = (val) => {
    if (val === 'live_in') return t?.browse_live_in || 'Live-in';
    if (val === 'live_out') return t?.browse_live_out || 'Live-out';
    if (val === 'either') return t?.browse_either || 'Either';
    return val || '';
  };

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
        {/* Gradient hero */}
        <div style={{
          position: 'relative',
          background: 'linear-gradient(135deg, #001b3d 0%, #003366 50%, #004d99 100%)',
          padding: '28px 24px 32px',
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

          <div aria-hidden style={{
            position: 'absolute', top: '-40px', right: '-40px',
            width: '140px', height: '140px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }} />

          <div style={{ position: 'relative', textAlign: 'center' }}>
            <div style={{
              width: '96px', height: '96px', borderRadius: '50%',
              background: 'white',
              border: '4px solid rgba(255,255,255,0.5)',
              margin: '0 auto 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '36px', color: '#001b3d', fontWeight: 800,
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            }}>
              {initial}
            </div>
            <h2 style={{
              fontSize: '24px', fontWeight: 800, margin: '0 0 4px',
              letterSpacing: '-0.3px',
            }}>
              {displayName}
            </h2>
            <div style={{ fontSize: '14px', opacity: 0.85, fontWeight: 500 }}>
              {t?.emp_profile_title || 'Employer'}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '24px',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '18px 20px',
            marginBottom: '16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb',
          }}>
            {employer.city && (
              <InfoRow icon="📍" label={t?.profile_location || 'Location'}>
                {employer.city}
                {employer.area ? ` · ${employer.area}` : ''}
              </InfoRow>
            )}
            {employer.lookingFor && (
              <InfoRow icon="🔍" label={t?.browse_card_looking || 'Looking for'}>
                {employer.lookingFor}
              </InfoRow>
            )}
            {employer.arrangementPreference && (
              <InfoRow icon="🏠" label={t?.browse_card_arrangement || 'Arrangement'}>
                {arrangementLabel(employer.arrangementPreference)}
              </InfoRow>
            )}
            {employer.preferredAgeRange && (
              <InfoRow icon="📅" label={t?.browse_card_age_pref || 'Preferred age'} last={!employer.jobDescription}>
                {employer.preferredAgeRange}
              </InfoRow>
            )}
          </div>

          {employer.jobDescription && (
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{
                fontSize: '12px', fontWeight: 800, color: '#9ca3af',
                textTransform: 'uppercase', letterSpacing: '0.6px',
                margin: '0 0 8px', padding: '0 4px',
              }}>
                {t?.emp_profile_description || 'Job Description'}
              </h3>
              <div style={{
                background: 'white',
                borderRadius: '14px',
                padding: '16px 18px',
                border: '1px solid #e5e7eb',
              }}>
                <p style={{
                  fontSize: '14px', lineHeight: 1.65, color: '#374151', margin: 0,
                  whiteSpace: 'pre-wrap',
                }}>
                  {employer.jobDescription}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

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
      <div style={{ fontSize: '18px', width: '24px', textAlign: 'center', flexShrink: 0 }}>
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

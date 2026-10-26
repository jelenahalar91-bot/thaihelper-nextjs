/**
 * Full-size photo overlay.
 *
 * A profile photo is a 96px circle in the profile modal, which is not enough
 * to judge a face — families asked to be able to open it. Click the backdrop,
 * press Escape, or hit the X to close.
 *
 * Props:
 *   src: image URL (nothing renders without one)
 *   alt: accessible name, usually the person's display name
 *   onClose: () => void
 */

import { useEffect } from 'react';

export default function PhotoLightbox({ src, alt = '', onClose }) {
  // Escape closes. The profile modal underneath listens for Escape too, so
  // the handler stops the event: the first Escape should close the photo,
  // not the whole profile behind it.
  useEffect(() => {
    if (!src) return undefined;
    const onKey = e => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      // Rendered inside the profile modal, whose own backdrop closes it on
      // click — without stopping here, closing the photo would close the
      // profile behind it as well.
      onClick={e => { e.stopPropagation(); onClose?.(); }}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.96)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        animation: 'photoLightboxIn 0.15s ease-out',
        cursor: 'zoom-out',
      }}
    >
      <button
        onClick={e => { e.stopPropagation(); onClose?.(); }}
        aria-label="Close"
        style={{
          position: 'absolute', top: '16px', right: '16px',
          width: '40px', height: '40px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.18)',
          border: 'none', color: 'white', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          borderRadius: '8px',
          cursor: 'default',
        }}
      />

      <style jsx>{`
        @keyframes photoLightboxIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

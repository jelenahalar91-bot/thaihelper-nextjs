/**
 * Individual message bubble with translation toggle.
 *
 * Dual-role aware:
 *  - `isOwn` controls bubble alignment / colour
 *  - `message.is_locked === true` is set by the API only for unverified
 *    employers (paid-tier gating is currently disabled — ThaiHelper is
 *    free for everyone). The locked variant renders a preview blur with
 *    an "Verify your email" CTA instead of an upgrade prompt.
 */

import { useState } from 'react';

export default function MessageBubble({ message, isOwn, t, onUpgrade }) {
  const [showOriginal, setShowOriginal] = useState(false);

  // ── Locked variant ──────────────────────────────────────────────────────
  if (message.is_locked) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        marginBottom: '8px',
      }}>
        <div style={{
          maxWidth: '75%',
          padding: '10px 14px',
          borderRadius: isOwn ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          background: isOwn ? '#006a62' : '#f3f4f6',
          color: isOwn ? 'white' : '#333',
          position: 'relative',
        }}>
          <p style={{
            margin: 0,
            fontSize: '15px',
            lineHeight: 1.5,
            filter: 'blur(3px)',
            userSelect: 'none',
            pointerEvents: 'none',
          }}>
            {message.content_preview || '••• ••• •••'}
          </p>
          <button
            type="button"
            onClick={onUpgrade}
            style={{
              marginTop: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              border: 'none',
              borderRadius: '999px',
              background: isOwn ? 'rgba(255,255,255,0.2)' : '#006a62',
              color: 'white',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🔒 {t.msg_locked_cta || 'Verify your email to unlock'}
          </button>
          <div style={{
            marginTop: '4px',
            fontSize: '11px',
            color: isOwn ? 'rgba(255,255,255,0.6)' : '#bbb',
          }}>
            {formatTime(message.created_at)}
          </div>
        </div>
      </div>
    );
  }

  // ── Normal variant ──────────────────────────────────────────────────────
  const hasTranslation =
    message.content_translated && message.content_translated !== message.content_original;
  const displayText = showOriginal
    ? message.content_original
    : (message.content_translated || message.content_original);

  return (
    <div style={{
      display: 'flex',
      justifyContent: isOwn ? 'flex-end' : 'flex-start',
      marginBottom: '8px',
    }}>
      <div style={{
        maxWidth: '75%',
        padding: '10px 14px',
        borderRadius: isOwn ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        background: isOwn ? '#006a62' : '#f3f4f6',
        color: isOwn ? 'white' : '#333',
      }}>
        <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
          {displayText}
        </p>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '4px',
          gap: '8px',
        }}>
          {hasTranslation && (
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                fontSize: '12px', color: isOwn ? 'rgba(255,255,255,0.7)' : '#999',
                textDecoration: 'underline',
              }}
            >
              {showOriginal ? t.msg_show_translated : t.msg_show_original}
            </button>
          )}
          <span style={{ fontSize: '11px', color: isOwn ? 'rgba(255,255,255,0.6)' : '#bbb' }}>
            {formatTime(message.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

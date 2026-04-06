/**
 * Individual message bubble with translation toggle.
 */

import { useState } from 'react';

export default function MessageBubble({ message, isOwn, t }) {
  const [showOriginal, setShowOriginal] = useState(false);
  const hasTranslation = message.content_translated && message.content_translated !== message.content_original;

  const displayText = showOriginal ? message.content_original : (message.content_translated || message.content_original);

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
        <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
          {displayText}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', gap: '8px' }}>
          {hasTranslation && (
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                fontSize: '11px', color: isOwn ? 'rgba(255,255,255,0.7)' : '#999',
                textDecoration: 'underline',
              }}
            >
              {showOriginal ? t.msg_show_translated : t.msg_show_original}
            </button>
          )}
          <span style={{ fontSize: '10px', color: isOwn ? 'rgba(255,255,255,0.6)' : '#bbb' }}>
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

/**
 * Full conversation view with message thread and input.
 *
 * Dual-role:
 *   - currentRole: 'helper' | 'employer'  → drives "isOwn" bubble alignment
 *   - canSend: boolean — when false (free-tier employer) the composer is
 *     replaced with an upgrade CTA. The send-input is never rendered for
 *     locked users so they can't even attempt a POST that would 402.
 */

import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

export default function ConversationDetail({
  conversation,
  messages,
  currentRole = 'helper',
  canSend = true,
  loading,
  msgInput,
  setMsgInput,
  onSend,
  sending,
  onBack,
  onUpgrade,
  t,
}) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const cp = conversation.counterparty || {};
  const displayName =
    [cp.firstName, cp.lastName].filter(Boolean).join(' ') || 'Unknown';
  const initial = (cp.firstName || '?')[0].toUpperCase();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 200px)',
      minHeight: '400px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '14px 16px', background: 'white',
        borderRadius: '12px 12px 0 0',
        borderBottom: '1px solid #e5e7eb',
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '15px', color: '#006a62', fontWeight: 600, padding: '4px 8px',
        }}>
          ← {t.msg_back}
        </button>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: '#eef2ff', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '16px', color: '#6366f1',
          fontWeight: 700, overflow: 'hidden',
        }}>
          {cp.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cp.photo}
              alt={displayName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : initial}
        </div>
        <span style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a' }}>
          {displayName}
        </span>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px',
        background: '#fafafa', display: 'flex', flexDirection: 'column',
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            <div style={{
              margin: '0 auto 12px', width: '32px', height: '32px',
              border: '3px solid #e5e7eb', borderTop: '3px solid #006a62',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        ) : messages.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '40px',
            color: '#999', fontSize: '15px',
          }}>
            {t.msg_no_conv_text}
          </div>
        ) : (
          messages.map(msg => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender_type === currentRole}
              t={t}
              onUpgrade={onUpgrade}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input — locked variant for free-tier employers */}
      {canSend ? (
        <div style={{
          display: 'flex', gap: '8px', padding: '12px 16px',
          background: 'white', borderTop: '1px solid #e5e7eb',
          borderRadius: '0 0 12px 12px',
        }}>
          <input
            type="text"
            value={msgInput}
            onChange={e => setMsgInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder={t.msg_placeholder}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: '10px',
              border: '1px solid #e5e7eb', fontSize: '15px', fontFamily: 'inherit',
            }}
          />
          <button
            onClick={onSend}
            disabled={sending || !msgInput.trim()}
            style={{
              padding: '10px 20px', borderRadius: '10px', border: 'none',
              background: '#006a62', color: 'white', fontSize: '15px',
              fontWeight: 600, cursor: sending ? 'wait' : 'pointer',
              opacity: (sending || !msgInput.trim()) ? 0.5 : 1,
            }}
          >
            {t.msg_send}
          </button>
        </div>
      ) : (
        <div style={{
          padding: '16px', background: '#fff7ed',
          borderTop: '1px solid #fed7aa',
          borderRadius: '0 0 12px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '12px', flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: '14px', color: '#9a3412', flex: 1, minWidth: '200px' }}>
            🔒 {t.msg_send_locked || 'Upgrade to send messages and read full conversations.'}
          </div>
          <button
            onClick={onUpgrade}
            style={{
              padding: '10px 18px', borderRadius: '10px', border: 'none',
              background: '#006a62', color: 'white', fontSize: '14px',
              fontWeight: 700, cursor: 'pointer',
            }}
          >
            {t.msg_locked_cta || 'Upgrade'}
          </button>
        </div>
      )}
    </div>
  );
}

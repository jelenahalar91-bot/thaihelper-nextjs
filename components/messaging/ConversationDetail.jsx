/**
 * Full conversation view with message thread and input.
 *
 * Dual-role:
 *   - currentRole: 'helper' | 'employer'  → drives "isOwn" bubble alignment
 *   - canSend: boolean — when false (free-tier employer) the composer is
 *     replaced with an upgrade CTA. The send-input is never rendered for
 *     locked users so they can't even attempt a POST that would 402.
 *
 * - onViewProfile: optional callback. When set, the header avatar + name
 *   become clickable and call this with the counterparty object so the
 *   parent page can open a profile modal.
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
  onViewProfile,
  t,
}) {
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const prevMessageCountRef = useRef(0);

  // Reset when switching to a different conversation so the new view
  // always auto-scrolls to bottom on open.
  useEffect(() => {
    prevMessageCountRef.current = 0;
  }, [conversation?.id]);

  // Auto-scroll logic:
  //  - Always scroll to bottom on initial load (first render with messages)
  //  - On subsequent updates (e.g. polling), only scroll if the user is
  //    already near the bottom OR it's their own new message. Otherwise
  //    don't yank them out of scrolling up to read history.
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const count = messages.length;
    const prev = prevMessageCountRef.current;
    prevMessageCountRef.current = count;

    if (count === 0) return;

    const isInitial = prev === 0;
    const lastMsg = messages[count - 1];
    const isOwnNewMsg = count > prev && lastMsg?.sender_type === currentRole;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const nearBottom = distanceFromBottom < 120;

    if (isInitial || isOwnNewMsg || nearBottom) {
      messagesEndRef.current?.scrollIntoView({
        behavior: isInitial ? 'auto' : 'smooth',
      });
    }
  }, [messages, currentRole]);

  const cp = conversation.counterparty || {};
  const displayName =
    [cp.firstName, cp.lastName].filter(Boolean).join(' ') || 'Unknown';
  const initial = (cp.firstName || '?')[0].toUpperCase();
  const subtitle = cp.category || cp.city || '';
  const profileClickable = typeof onViewProfile === 'function';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 200px)',
      minHeight: '480px',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      border: '1px solid #e5e7eb',
      background: 'white',
    }}>
      {/* ── Header ───────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '14px 18px',
        background: 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)',
        borderBottom: '1px solid #e5e7eb',
      }}>
        <button
          onClick={onBack}
          aria-label={t.msg_back}
          style={{
            background: 'rgba(0,106,98,0.08)',
            border: 'none',
            cursor: 'pointer',
            width: '36px', height: '36px',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#006a62',
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,106,98,0.16)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,106,98,0.08)'; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>

        {/* Clickable identity block */}
        <button
          onClick={profileClickable ? () => onViewProfile(cp) : undefined}
          disabled={!profileClickable}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            background: 'none', border: 'none',
            padding: '6px 10px',
            margin: '-6px -10px',
            borderRadius: '12px',
            cursor: profileClickable ? 'pointer' : 'default',
            flex: 1, minWidth: 0,
            textAlign: 'left',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => {
            if (profileClickable) e.currentTarget.style.background = 'rgba(0,106,98,0.06)';
          }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
        >
          <div style={{
            position: 'relative',
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #e6f5f3 0%, #d1fae5 100%)',
            border: '2px solid #006a62',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '17px', color: '#006a62',
            fontWeight: 700, overflow: 'hidden',
            flexShrink: 0,
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '16px', fontWeight: 700, color: '#1a1a1a',
              display: 'flex', alignItems: 'center', gap: '6px',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {displayName}
              {profileClickable && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#006a62" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </div>
            {subtitle && (
              <div style={{
                fontSize: '13px', color: '#006a62', fontWeight: 500,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                marginTop: '1px',
              }}>
                {subtitle}
              </div>
            )}
          </div>
        </button>
      </div>

      {/* ── Messages ─────────────────────────────────────── */}
      <div ref={scrollContainerRef} style={{
        flex: 1, overflowY: 'auto', padding: '20px 18px',
        background: 'linear-gradient(180deg, #fafbfc 0%, #f4f6f8 100%)',
        display: 'flex', flexDirection: 'column',
      }}>
        {loading ? (
          <div style={{ margin: 'auto', textAlign: 'center', color: '#999' }}>
            <div style={{
              margin: '0 auto 12px', width: '32px', height: '32px',
              border: '3px solid #e5e7eb', borderTop: '3px solid #006a62',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        ) : messages.length === 0 ? (
          <EmptyConversation displayName={cp.firstName || displayName} t={t} />
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

      {/* ── Input — locked variant for free-tier employers ─── */}
      {canSend ? (
        <div style={{
          display: 'flex', gap: '10px', padding: '14px 16px',
          background: 'white',
          borderTop: '1px solid #e5e7eb',
          alignItems: 'center',
        }}>
          <div style={{
            flex: 1, position: 'relative',
            display: 'flex', alignItems: 'center',
            background: '#f3f4f6',
            borderRadius: '999px',
            padding: '4px 6px 4px 18px',
            transition: 'background 0.15s, box-shadow 0.15s',
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
                flex: 1, padding: '10px 4px',
                border: 'none', background: 'transparent',
                fontSize: '15px', fontFamily: 'inherit',
                outline: 'none',
                color: '#1a1a1a',
              }}
            />
            <button
              onClick={onSend}
              disabled={sending || !msgInput.trim()}
              aria-label={t.msg_send}
              style={{
                width: '38px', height: '38px',
                borderRadius: '50%', border: 'none',
                background: (sending || !msgInput.trim())
                  ? '#cbd5e1'
                  : 'linear-gradient(135deg, #006a62 0%, #00897e 100%)',
                color: 'white',
                cursor: sending ? 'wait' : (msgInput.trim() ? 'pointer' : 'default'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'transform 0.15s',
                boxShadow: msgInput.trim() ? '0 2px 8px rgba(0,106,98,0.3)' : 'none',
              }}
              onMouseEnter={e => {
                if (msgInput.trim() && !sending) e.currentTarget.style.transform = 'scale(1.06)';
              }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {sending ? (
                <div style={{
                  width: '16px', height: '16px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          padding: '16px 18px',
          background: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)',
          borderTop: '1px solid #fed7aa',
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

// ─── Empty-state ─────────────────────────────────────────────────────────
function EmptyConversation({ displayName, t }) {
  return (
    <div style={{
      margin: 'auto', textAlign: 'center', padding: '32px 24px',
      maxWidth: '360px',
    }}>
      <div style={{
        width: '72px', height: '72px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #e6f5f3 0%, #d1fae5 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#006a62" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <h3 style={{
        fontSize: '17px', fontWeight: 700, color: '#1a1a1a',
        margin: '0 0 6px',
      }}>
        {(t.msg_empty_title || 'Say hi to {name} 👋').replace('{name}', displayName)}
      </h3>
      <p style={{
        fontSize: '14px', color: '#666', lineHeight: 1.55, margin: 0,
      }}>
        {t.msg_empty_hint || 'Send your first message to get the conversation started. Messages are auto-translated, so you can write in your own language.'}
      </p>
    </div>
  );
}

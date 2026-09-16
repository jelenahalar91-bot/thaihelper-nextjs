/**
 * Full conversation view with message thread and input.
 *
 * Dual-role:
 *   - currentRole: 'helper' | 'employer'  → drives "isOwn" bubble alignment
 *   - canSend: boolean — when false the composer is hidden. The send-input
 *     is never rendered for locked users so they can't attempt a POST.
 *     2026-06-09: canSend is now derived from email_verified only (the
 *     paywall has been removed). Pre-verify users see the verify-email
 *     banner above instead of an upgrade CTA.
 *
 * - onViewProfile: optional callback. When set, the header avatar + name
 *   become clickable and call this with the counterparty object so the
 *   parent page can open a profile modal.
 *
 * Below the thread sits the closing-the-loop strip (OutcomePrompt): the
 * rating form for families who may rate this helper, and "I was hired by
 * this family" for helpers. Both live here rather than in the profile modal
 * because this is where the relationship actually is — the modal version was
 * three clicks and a scroll away and went unused for three and a half months.
 */

import { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import RateForm from '../RateForm';
import { StarRatingDisplay } from '../StarRating';
import { sharesContactDetails } from '../../lib/contact-warning';
import { formatCity } from '../../lib/constants/cities';

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
  // onUpgrade was used by the old paywall's "Upgrade" CTA — removed
  // 2026-06-09. Kept as a deprecated prop so existing callers don't
  // crash; safe to drop in a future cleanup pass.
  onUpgrade,
  onViewProfile,
  // Optional: renders a "📹 Video call" button in the header. Only
  // meaningful for employers — voluntary, nothing forces either side
  // to use it. Omit (or pass nothing) to hide the button entirely.
  onRequestVideoCall,
  // Verify-required state (overrides input with a verify banner)
  verifyRequired = false,
  onResendVerify,
  resendingVerify = false,
  resendVerifyResult = null, // 'sent' | 'error' | null
  // Optional quick-reply chips shown above the input. Array of strings.
  quickReplies = null,
  lang = 'en',
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

  // Asking once, before the contact details leave the app. MessageBubble
  // warns after the fact, which reaches the recipient; this reaches the
  // sender while it is still their decision. It is a confirmation, not a
  // block — "Send anyway" is right there, and sharing contact details has
  // always been allowed.
  const [confirmOffPlatform, setConfirmOffPlatform] = useState(false);

  const requestSend = () => {
    if (!confirmOffPlatform && sharesContactDetails(msgInput)) {
      setConfirmOffPlatform(true);
      return;
    }
    setConfirmOffPlatform(false);
    onSend();
  };

  // Editing the text after being asked can well mean removing the number,
  // so the question is asked again against whatever now stands.
  const handleInputChange = (value) => {
    if (confirmOffPlatform) setConfirmOffPlatform(false);
    setMsgInput(value);
  };

  // ── Closing the loop ────────────────────────────────────────────────
  //
  // Whether this family may rate this helper (employer view), or whether
  // this helper has already told us the family hired them (helper view).
  // Fetched per conversation; both endpoints are cheap and re-check
  // everything server-side, so a stale answer here can only cost a wasted
  // click, never an unauthorised write.
  const [rating, setRating] = useState(null);      // { canRate, myRating } | null
  const [hired, setHired] = useState(null);        // { confirmed } | null
  const [hiring, setHiring] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);

  const counterpartyRef = conversation.counterparty?.ref || null;

  useEffect(() => {
    setRateOpen(false);
    setRating(null);
    setHired(null);
    if (!counterpartyRef) return;

    let cancelled = false;
    const url = currentRole === 'employer'
      ? `/api/ratings?helper=${encodeURIComponent(counterpartyRef)}`
      : `/api/hire-confirmation?employer=${encodeURIComponent(counterpartyRef)}`;

    fetch(url)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (cancelled || !data) return;
        if (currentRole === 'employer') {
          setRating({ canRate: !!data.canRate, myRating: data.myRating || null });
        } else {
          setHired({ confirmed: !!data.confirmed });
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [counterpartyRef, currentRole]);

  async function confirmHired() {
    if (!counterpartyRef || hiring) return;
    setHiring(true);
    try {
      const res = await fetch('/api/hire-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employerRef: counterpartyRef }),
      });
      if (res.ok) setHired({ confirmed: true });
    } catch {
      // Silent: the button simply stays available to try again.
    }
    setHiring(false);
  }

  // Refetch after a rating is saved so the strip switches to "you rated X".
  async function reloadRating() {
    if (!counterpartyRef) return;
    try {
      const res = await fetch(`/api/ratings?helper=${encodeURIComponent(counterpartyRef)}`);
      if (!res.ok) return;
      const data = await res.json();
      setRating({ canRate: !!data.canRate, myRating: data.myRating || null });
      setRateOpen(false);
    } catch {
      // Keep the form open rather than pretending it saved.
    }
  }

  const cp = conversation.counterparty || {};
  const displayName =
    [cp.firstName, cp.lastName].filter(Boolean).join(' ') || 'Unknown';
  const initial = (cp.firstName || '?')[0].toUpperCase();
  const subtitle = cp.category || formatCity(cp.city) || '';
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
        display: 'flex', alignItems: 'center', gap: '8px',
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

        {/* Clickable identity block — avatar + name + subtitle. This is
            also where rating happens (opens the same profile modal with
            the star-rating input), so a separate "Rate" button is
            redundant — it used to sit here and, combined with the video
            call button, crowded out the name on mobile down to a single
            truncated letter. Removed 2026-07-01 after user-reported
            mobile UX feedback. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
          <button
            onClick={profileClickable ? () => onViewProfile(cp) : undefined}
            disabled={!profileClickable}
            className="flex items-center gap-2 sm:gap-3"
            style={{
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
          <div
            className="w-9 h-9 sm:w-11 sm:h-11 text-sm sm:text-[17px]"
            style={{
              position: 'relative',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #e6f5f3 0%, #d1fae5 100%)',
              border: '2px solid #006a62',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#006a62',
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
            <div
              className="text-sm sm:text-base"
              style={{
                fontWeight: 700, color: '#1a1a1a',
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
              <div
                className="hidden sm:block"
                style={{
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

        {/* Video-call request — employer-only, entirely optional. Neither
            side is ever required to use it; it just drops a Jitsi link
            into the chat that either party can ignore.
            Icon-only on mobile (text label was pushing the counterparty's
            name down to a single truncated letter — see the identity-block
            comment above); the label appears from the sm breakpoint up. */}
        {currentRole === 'employer' && typeof onRequestVideoCall === 'function' && canSend && !verifyRequired && (
          <button
            type="button"
            onClick={onRequestVideoCall}
            title={t.msg_request_video_call || 'Request a video call'}
            aria-label={t.msg_video_call_btn || 'Video call'}
            className="px-2.5 sm:px-3 py-2"
            style={{
              background: 'rgba(0,106,98,0.08)',
              border: '1px solid rgba(0,106,98,0.25)',
              borderRadius: '8px',
              color: '#006a62',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <span aria-hidden="true">📹</span>
            <span className="hidden sm:inline">{t.msg_video_call_btn || 'Video call'}</span>
          </button>
        )}
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

      {/* ── Closing the loop: rate / confirm hire ─────────── */}
      <OutcomePrompt
        currentRole={currentRole}
        counterpartyRef={counterpartyRef}
        counterpartyName={cp.firstName || displayName}
        rating={rating}
        rateOpen={rateOpen}
        setRateOpen={setRateOpen}
        onRated={reloadRating}
        hired={hired}
        hiring={hiring}
        onConfirmHired={confirmHired}
        bothSidesSpoke={
          messages.some(m => m.sender_type === 'helper')
          && messages.some(m => m.sender_type === 'employer')
        }
        lang={lang}
      />

      {/* ── Input — verify-required > free-tier-locked > normal ─── */}
      {verifyRequired ? (
        <div style={{
          padding: '16px 18px',
          background: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)',
          borderTop: '1px solid #fed7aa',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>✉️</span>
            <div style={{ fontSize: '14px', color: '#92400e', lineHeight: 1.5 }}>
              <div style={{ fontWeight: 700, marginBottom: '2px' }}>
                {t.msg_verify_required_title}
              </div>
              <div>{t.msg_verify_required_body}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={onResendVerify}
              disabled={resendingVerify || resendVerifyResult === 'sent'}
              style={{
                padding: '8px 16px', borderRadius: '10px', border: 'none',
                background: resendVerifyResult === 'sent' ? '#10b981' : '#92400e',
                color: 'white', fontSize: '13px', fontWeight: 700,
                cursor: resendingVerify ? 'wait' : 'pointer',
                opacity: resendingVerify ? 0.7 : 1,
              }}
            >
              {resendingVerify
                ? '...'
                : resendVerifyResult === 'sent'
                  ? `✓ ${t.msg_verify_resent}`
                  : t.msg_verify_resend}
            </button>
            {resendVerifyResult === 'error' && (
              <span style={{ fontSize: '13px', color: '#9a3412' }}>
                {t.msg_verify_resend_error}
              </span>
            )}
          </div>
        </div>
      ) : canSend ? (
        <div style={{
          display: 'flex', flexDirection: 'column',
          background: 'white',
          borderTop: '1px solid #e5e7eb',
        }}>
          {Array.isArray(quickReplies) && quickReplies.length > 0 && messages.length === 0 && (
            <div style={{
              padding: '12px 16px 0',
              display: 'flex', flexDirection: 'column', gap: '8px',
            }}>
              {t.msg_quick_replies_label && (
                <div style={{
                  fontSize: '12px', color: '#6b7280',
                  fontWeight: 600, letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}>
                  {t.msg_quick_replies_label}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {quickReplies.map((text, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setMsgInput(text)}
                    style={{
                      textAlign: 'left',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid #d1fae5',
                      background: '#f0fdfa',
                      fontSize: '13px', lineHeight: 1.45,
                      color: '#065f46',
                      cursor: 'pointer',
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#d1fae5';
                      e.currentTarget.style.borderColor = '#6ee7b7';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#f0fdfa';
                      e.currentTarget.style.borderColor = '#d1fae5';
                    }}
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          )}
          {confirmOffPlatform && (
            <div style={{
              margin: '0 16px',
              padding: '12px 14px',
              borderRadius: '12px',
              borderLeft: '3px solid #F4A261',
              background: '#fff8f0',
              color: '#7a5330',
              fontSize: '13px',
              lineHeight: 1.5,
            }}>
              <strong style={{ color: '#8a4b12' }}>
                {t.msg_offplatform_confirm_title || 'You are sharing contact details'}
              </strong>
              <div style={{ margin: '4px 0 10px' }}>
                {t.msg_offplatform_confirm_body
                  || 'We cannot see or check what happens outside ThaiHelper, and this is how scams start. You can keep talking here instead.'}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={requestSend}
                  disabled={sending}
                  style={{
                    padding: '8px 14px', borderRadius: '999px',
                    border: '1.5px solid #d8a06a', background: 'transparent',
                    color: '#8a4b12', fontSize: '13px', fontWeight: 600,
                    cursor: sending ? 'wait' : 'pointer',
                  }}
                >
                  {t.msg_offplatform_confirm_send || 'Send anyway'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmOffPlatform(false)}
                  style={{
                    padding: '8px 14px', borderRadius: '999px',
                    border: 'none', background: '#006a62',
                    color: 'white', fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {t.msg_offplatform_confirm_cancel || 'Keep it in the chat'}
                </button>
              </div>
            </div>
          )}
          <div style={{
            display: 'flex', gap: '10px', padding: '14px 16px',
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
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && !sending) {
                  e.preventDefault();
                  requestSend();
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
              onClick={requestSend}
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
        </div>
      ) : null /* 2026-06-09: free-tier-locked "Upgrade" branch
                  removed. The paywall is gone — canSend is now
                  derived from email_verified only (see lib/access.js).
                  If canSend is false, verifyRequired will be true and
                  the verify-email banner above renders. */ }
    </div>
  );
}

// ─── Empty-state ─────────────────────────────────────────────────────────
/**
 * The strip between the thread and the composer that asks what happened.
 *
 * Two different questions depending on who is looking:
 *
 *   Family → "How was X?" with the star form inline. Shown only when
 *   /api/ratings says they are eligible (3 messages each way, spread over a
 *   day). Once they have rated, it shrinks to their own stars plus an edit
 *   link, so the strip never nags someone who already answered.
 *
 *   Helper → "Did this family hire you?" — one button, one email to the
 *   family, once per pair forever (pages/api/hire-confirmation.js). Hidden
 *   until both sides have actually said something, because before that there
 *   is nothing to confirm.
 *
 * Neither version is dismissable, and both stay quiet-looking on purpose:
 * this sits above the message input on every visit to the conversation, so
 * anything louder would be shouting at someone who is trying to type.
 */
function OutcomePrompt({
  currentRole, counterpartyRef, counterpartyName,
  rating, rateOpen, setRateOpen, onRated,
  hired, hiring, onConfirmHired, bothSidesSpoke, lang,
}) {
  const th = lang === 'th';
  if (!counterpartyRef) return null;

  const shell = (children, tone = 'teal') => (
    <div style={{
      padding: '12px 18px',
      borderTop: '1px solid #e5e7eb',
      background: tone === 'gold'
        ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
        : 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)',
    }}>
      {children}
    </div>
  );

  // ── Family side ──────────────────────────────────────────────────────
  if (currentRole === 'employer') {
    if (!rating) return null;

    if (rating.myRating) {
      return shell(
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          flexWrap: 'wrap', fontSize: '13px', color: '#4b5563',
        }}>
          <span>{th ? 'คุณให้คะแนนแล้ว' : 'You rated'} {counterpartyName}</span>
          <StarRatingDisplay avg={rating.myRating.stars} count={1} size="sm" lang={lang} />
          <button
            type="button"
            onClick={() => setRateOpen(!rateOpen)}
            style={{
              background: 'none', border: 'none', padding: 0,
              color: '#006a62', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {rateOpen ? (th ? 'ปิด' : 'Close') : (th ? 'แก้ไข' : 'Edit')}
          </button>
          {rateOpen && (
            <div style={{ width: '100%' }}>
              <RateForm
                helperRef={counterpartyRef}
                existingRating={rating.myRating}
                onSubmitted={onRated}
                lang={lang}
              />
            </div>
          )}
        </div>
      );
    }

    if (!rating.canRate) return null;

    return shell(
      <>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '18px' }} aria-hidden="true">⭐</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#92400e' }}>
            {th
              ? `${counterpartyName} ทำงานให้คุณแล้วใช่ไหม?`
              : `Did ${counterpartyName} work for you?`}
          </span>
          <button
            type="button"
            onClick={() => setRateOpen(!rateOpen)}
            style={{
              marginLeft: 'auto',
              padding: '8px 16px', borderRadius: '9px', border: 'none',
              background: '#006a62', color: 'white',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer',
            }}
          >
            {rateOpen ? (th ? 'ปิด' : 'Close') : (th ? 'ให้คะแนน' : 'Leave a review')}
          </button>
        </div>
        {!rateOpen && (
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: '6px 0 0', lineHeight: 1.5 }}>
            {th
              ? 'ครอบครัวอื่นเห็นรีวิวของคุณบนโปรไฟล์ของเธอ'
              : 'Your review shows on her profile — it is what the next family has to go on.'}
          </p>
        )}
        {rateOpen && (
          <RateForm
            helperRef={counterpartyRef}
            existingRating={null}
            onSubmitted={onRated}
            lang={lang}
          />
        )}
      </>,
      'gold'
    );
  }

  // ── Helper side ──────────────────────────────────────────────────────
  if (!hired || !bothSidesSpoke) return null;

  if (hired.confirmed) {
    return shell(
      <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.5 }}>
        {th
          ? '✅ เราแจ้งครอบครัวนี้แล้วว่าคุณได้งาน และขอให้เขารีวิวคุณ'
          : '✅ We told this family you got the job and asked them to review you.'}
      </div>
    );
  }

  return shell(
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
      <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.5, flex: 1, minWidth: '180px' }}>
        <strong style={{ color: '#1a1a1a' }}>
          {th ? 'ครอบครัวนี้จ้างคุณแล้วใช่ไหม?' : 'Did this family hire you?'}
        </strong>
        <br />
        {th
          ? 'เราจะส่งอีเมลหาเขาหนึ่งครั้ง เพื่อขอให้รีวิวคุณ'
          : 'We will email them once and ask them to review you.'}
      </div>
      <button
        type="button"
        onClick={onConfirmHired}
        disabled={hiring}
        style={{
          padding: '9px 16px', borderRadius: '9px', border: 'none',
          background: '#006a62', color: 'white',
          fontSize: '13px', fontWeight: 700,
          cursor: hiring ? 'wait' : 'pointer', opacity: hiring ? 0.7 : 1,
        }}
      >
        {hiring ? '…' : (th ? 'ใช่ ฉันได้งานแล้ว' : 'Yes, I got the job')}
      </button>
    </div>
  );
}

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
        {t.msg_empty_hint || 'Send your first message to get the conversation started.'}
      </p>
    </div>
  );
}

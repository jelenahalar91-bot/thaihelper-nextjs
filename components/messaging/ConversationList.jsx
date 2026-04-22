/**
 * List of conversation cards for the Messages tab.
 *
 * Dual-role aware: each conversation carries a `counterparty` object
 * (the other person in the chat — helper for an employer view, employer
 * for a helper view) so the same component renders cleanly for both roles.
 *
 * The API masks the last-message preview server-side for free-tier
 * employers — we just render whatever `conv.last_message` contains.
 */

import { useState } from 'react';

export default function ConversationList({ conversations, onSelect, onDelete, t }) {
  if (!conversations || conversations.length === 0) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '48px 32px',
        border: '1px solid #e5e7eb',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>💬</div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a1a', marginBottom: '8px' }}>
          {t.msg_no_conv}
        </h2>
        <p style={{
          fontSize: '15px', color: '#666', maxWidth: '400px',
          margin: '0 auto', lineHeight: 1.6,
        }}>
          {t.msg_no_conv_text}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'minmax(0, 1fr)' }}>
      {conversations.map(conv => (
        <ConversationCard
          key={conv.id}
          conv={conv}
          onSelect={onSelect}
          onDelete={onDelete}
          t={t}
        />
      ))}
    </div>
  );
}

function ConversationCard({ conv, onSelect, onDelete, t }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const cp = conv.counterparty || {};
  const displayName =
    [cp.firstName, cp.lastName].filter(Boolean).join(' ') || 'Unknown';
  const initial = (cp.firstName || '?')[0].toUpperCase();
  const lastMsg = conv.last_message;
  const isLocked = lastMsg?.is_locked;

  async function handleDelete(e) {
    e.stopPropagation();
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    setDeleting(true);
    try {
      if (onDelete) await onDelete(conv.id);
    } catch (err) {
      console.error('Delete failed:', err);
    }
    setDeleting(false);
    setShowConfirm(false);
  }

  function handleCancelDelete(e) {
    e.stopPropagation();
    setShowConfirm(false);
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => onSelect(conv)}
        style={{
          display: 'flex', alignItems: 'center', gap: '14px', width: '100%',
          padding: '16px', background: 'white', borderRadius: '12px',
          border: '1px solid #e5e7eb', cursor: 'pointer', textAlign: 'left',
          transition: 'box-shadow 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        {/* Avatar */}
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
          background: '#eef2ff', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '18px', color: '#6366f1',
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

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', gap: '8px', marginBottom: '4px',
            minWidth: 0,
          }}>
            <span style={{
              fontSize: '15px', fontWeight: 700, color: '#1a1a1a',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              minWidth: 0,
            }}>
              {displayName}
            </span>
            {lastMsg && (
              <span style={{ fontSize: '12px', color: '#999', flexShrink: 0 }}>
                {formatTime(lastMsg.created_at)}
              </span>
            )}
          </div>
          {lastMsg && (
            <p style={{
              fontSize: '14px', color: isLocked ? '#999' : '#666', margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflowWrap: 'anywhere', lineHeight: 1.35,
              fontStyle: isLocked ? 'italic' : 'normal',
            }}>
              {isLocked && '🔒 '}
              {lastMsg.preview}
            </p>
          )}
        </div>

        {/* Unread badge */}
        {conv.unread_count > 0 && (
          <span style={{
            background: '#006a62', color: 'white', borderRadius: '12px',
            padding: '2px 8px', fontSize: '12px', fontWeight: 700, flexShrink: 0,
          }}>
            {conv.unread_count}
          </span>
        )}
      </button>

      {/* Delete button (top-right) */}
      {!showConfirm ? (
        <button
          onClick={handleDelete}
          title={t.msg_delete || 'Delete conversation'}
          style={{
            position: 'absolute', top: '8px', right: '8px',
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'transparent', border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#ccc',
            transition: 'color 0.15s, background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#ccc'; e.currentTarget.style.background = 'transparent'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      ) : (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', top: '6px', right: '6px',
            display: 'flex', gap: '6px', alignItems: 'center',
            background: 'white', borderRadius: '8px',
            padding: '4px 6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            border: '1px solid #e5e7eb',
          }}
        >
          <span style={{ fontSize: '12px', color: '#666', padding: '0 4px' }}>
            {t.msg_delete_confirm || 'Delete?'}
          </span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              padding: '4px 10px', borderRadius: '6px',
              background: '#ef4444', color: 'white', border: 'none',
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            {deleting ? '...' : (t.msg_delete_yes || 'Yes')}
          </button>
          <button
            onClick={handleCancelDelete}
            style={{
              padding: '4px 10px', borderRadius: '6px',
              background: '#f3f4f6', color: '#666', border: 'none',
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            {t.msg_delete_no || 'No'}
          </button>
        </div>
      )}
    </div>
  );
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

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

export default function ConversationList({ conversations, onSelect, t }) {
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
    <div style={{ display: 'grid', gap: '8px' }}>
      {conversations.map(conv => {
        const cp = conv.counterparty || {};
        const displayName =
          [cp.firstName, cp.lastName].filter(Boolean).join(' ') || 'Unknown';
        const initial = (cp.firstName || '?')[0].toUpperCase();
        const lastMsg = conv.last_message;
        const isLocked = lastMsg?.is_locked;

        return (
          <button
            key={conv.id}
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
            {/* Avatar — photo if available, else initial */}
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
                alignItems: 'center', marginBottom: '4px',
              }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a' }}>
                  {displayName}
                </span>
                {lastMsg && (
                  <span style={{ fontSize: '12px', color: '#999' }}>
                    {formatTime(lastMsg.created_at)}
                  </span>
                )}
              </div>
              {lastMsg && (
                <p style={{
                  fontSize: '14px', color: isLocked ? '#999' : '#666', margin: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
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
        );
      })}
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

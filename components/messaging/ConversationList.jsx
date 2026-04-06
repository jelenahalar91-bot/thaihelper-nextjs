/**
 * List of conversation cards for the Messages tab.
 */

export default function ConversationList({ conversations, onSelect, t }) {
  if (conversations.length === 0) {
    return (
      <div style={{ background: 'white', borderRadius: '16px', padding: '48px 32px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>💬</div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a1a', marginBottom: '8px' }}>{t.msg_no_conv}</h2>
        <p style={{ fontSize: '14px', color: '#666', maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>{t.msg_no_conv_text}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '8px' }}>
      {conversations.map(conv => (
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
          {/* Avatar */}
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
            background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', color: '#6366f1', fontWeight: 700,
          }}>
            {(conv.employer_name || '?')[0].toUpperCase()}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a' }}>{conv.employer_name || 'Family'}</span>
              {conv.last_message && (
                <span style={{ fontSize: '11px', color: '#999' }}>
                  {formatTime(conv.last_message.created_at)}
                </span>
              )}
            </div>
            {conv.last_message && (
              <p style={{
                fontSize: '13px', color: '#666', margin: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {conv.last_message.sender_type === 'helper' ? 'You: ' : ''}
                {conv.last_message.preview}
              </p>
            )}
          </div>

          {/* Unread badge */}
          {conv.unread_count > 0 && (
            <span style={{
              background: '#006a62', color: 'white', borderRadius: '12px',
              padding: '2px 8px', fontSize: '11px', fontWeight: 700, flexShrink: 0,
            }}>
              {conv.unread_count}
            </span>
          )}
        </button>
      ))}
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

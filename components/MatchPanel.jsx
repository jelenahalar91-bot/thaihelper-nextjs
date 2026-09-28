import { formatCategoryList } from '@/lib/constants/categories';
import { formatCity } from '@/lib/constants/cities';

// ─── FAMILIES LOOKING FOR YOU ────────────────────────────────────────────
// A helper who gets a match email replied: "I don't see any work in my
// profile." She had gone looking for the job inside her own account, because
// that is what "a new job match for you" sounds like. Nothing is filed in her
// profile — a match is a family she can write to. So the dashboard shows
// those families by name, with the button that starts the conversation, and
// says plainly where the job is and is not.
const MATCH_PANEL_PREVIEW = 3;

export default function MatchPanel({ t, lang, loading, matches, onMessage, startingEmpConv, onSeeAll, isMobile }) {
  const shown = matches.slice(0, MATCH_PANEL_PREVIEW);
  const hasMore = matches.length > shown.length;

  return (
    <div style={{
      background: 'white', borderRadius: '16px',
      padding: isMobile ? '20px' : '24px',
      marginBottom: '16px', border: '1px solid #e5e7eb',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '12px', marginBottom: '4px', flexWrap: 'wrap',
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#1a1a1a' }}>
          {t.match_panel_title}
          {matches.length > 0 && (
            <span style={{
              marginLeft: '8px', padding: '2px 9px', borderRadius: '999px',
              background: '#e6f5f3', color: '#006a62', fontSize: '13px', fontWeight: 800,
            }}>
              {matches.length}
            </span>
          )}
        </h3>
        {hasMore && (
          <button
            onClick={onSeeAll}
            style={{
              background: 'none', border: 'none', padding: 0,
              color: '#006a62', fontSize: '14px', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {(t.match_panel_see_all || 'See all {n}').replace('{n}', matches.length)}
          </button>
        )}
      </div>

      <p style={{ fontSize: '14px', color: '#666', margin: '0 0 16px', lineHeight: 1.5 }}>
        {matches.length > 0 ? t.match_panel_sub : t.match_panel_empty_sub}
      </p>

      {loading ? (
        <div style={{ padding: '20px 0', color: '#999', fontSize: '14px' }}>{t.loading}</div>
      ) : matches.length === 0 ? (
        <div style={{
          padding: '20px', borderRadius: '12px',
          background: '#f8faf9', border: '1px dashed #d8e3e8',
          fontSize: '14px', fontWeight: 600, color: '#6B8999',
        }}>
          {t.match_panel_empty}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {shown.map((e, i) => (
            <div
              key={e.ref || `match-${i}`}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px', borderRadius: '12px',
                background: '#f8faf9', border: '1px solid #eef2f3',
                flexWrap: isMobile ? 'wrap' : 'nowrap',
              }}
            >
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: '#e6f5f3', border: '2px solid #006a62',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#006a62' }}>
                  {(e.firstName || '?').charAt(0).toUpperCase()}
                </span>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '15px', fontWeight: 700, color: '#1a1a1a',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {e.firstName || '—'} {e.lastName || ''}
                </div>
                <div style={{ fontSize: '13px', color: '#6B8999', marginTop: '2px' }}>
                  {t.match_panel_looking} {formatCategoryList(e.lookingFor, lang)} · {formatCity(e.city)}
                </div>
              </div>

              {e.ref && (
                <button
                  onClick={() => onMessage(e.ref)}
                  disabled={startingEmpConv === e.ref}
                  style={{
                    padding: '9px 16px', borderRadius: '10px', border: 'none',
                    background: '#006a62', color: 'white',
                    fontSize: '14px', fontWeight: 700,
                    cursor: startingEmpConv === e.ref ? 'wait' : 'pointer',
                    fontFamily: 'inherit', flexShrink: 0,
                    width: isMobile ? '100%' : 'auto',
                  }}
                >
                  {startingEmpConv === e.ref ? t.browse_card_messaging : t.browse_card_message}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: '12.5px', color: '#8ba3af', margin: '14px 0 0', lineHeight: 1.5 }}>
        {t.match_panel_hint}
      </p>
    </div>
  );
}

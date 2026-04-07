/**
 * Employer Dashboard
 *
 * Tabs:
 *  1. Browse Helpers — list of public helper cards with a "Message" button
 *     that creates (or finds) a conversation and jumps into the chat.
 *  2. Conversations — list of existing conversations + embedded chat view.
 *
 * Paywall:
 *  - Free tier: can browse helpers, can see conversation list with masked
 *    last-message preview, can open a chat (server only sends `is_locked`
 *    message previews), but the composer is replaced with an Upgrade CTA.
 *    All masking happens server-side.
 *  - Promo / Paid: full access — green banner showing days remaining.
 *
 * Auth: redirects to /employer-login on 401.
 */

import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLang } from './_app';
import {
  fetchEmployerProfile,
  employerLogout,
} from '@/lib/api/employer-auth-client';
import { fetchHelpers as fetchHelpersApi } from '@/lib/api/helpers';
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  startConversation,
  markAsRead,
} from '@/lib/api/messages';
import ConversationList from '@/components/messaging/ConversationList';
import ConversationDetail from '@/components/messaging/ConversationDetail';
import { CITIES } from '@/lib/constants/cities';
import { CATEGORY_NAMES, CAT_EMOJI } from '@/lib/constants/categories';

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────
const T = {
  en: {
    page_title: 'Employer Dashboard – ThaiHelper',
    greeting: 'Hi',
    logout: 'Log Out',
    tab_browse: 'Browse Helpers',
    tab_messages: 'Messages',
    access_promo: '🎉 You have full access — {n} days remaining',
    access_paid: '✓ Full access — {n} days remaining',
    access_free_title: 'Free account',
    access_free_text: 'Upgrade to message helpers and see full conversations.',
    access_upgrade: 'Upgrade',
    filter_city: 'All Cities',
    filter_cat: 'All Categories',
    filter_area_ph: 'Search by area...',
    filter_reset: 'Reset',
    results: 'helpers found',
    loading: 'Loading...',
    no_helpers: 'No helpers found.',
    no_helpers_sub: 'Try adjusting your filters.',
    card_yrs: 'yrs experience',
    card_message: 'Message',
    card_messaging: 'Opening...',
    msg_no_conv: 'No conversations yet',
    msg_no_conv_text: 'Start a conversation by messaging a helper from the Browse tab.',
    msg_back: 'Back',
    msg_placeholder: 'Type a message...',
    msg_send: 'Send',
    msg_show_original: 'Show original',
    msg_show_translated: 'Show translated',
    msg_locked_cta: 'Upgrade to read',
    msg_send_locked: 'Upgrade to send messages and read full conversations.',
    err_start_locked: 'Upgrade your account to message helpers.',
    err_generic: 'Something went wrong. Please try again.',
  },
  th: {
    page_title: 'แดชบอร์ดนายจ้าง – ThaiHelper',
    greeting: 'สวัสดี',
    logout: 'ออกจากระบบ',
    tab_browse: 'ค้นหาผู้ช่วย',
    tab_messages: 'ข้อความ',
    access_promo: '🎉 คุณมีสิทธิ์เข้าถึงเต็มรูปแบบ — เหลืออีก {n} วัน',
    access_paid: '✓ เข้าถึงเต็มรูปแบบ — เหลืออีก {n} วัน',
    access_free_title: 'บัญชีฟรี',
    access_free_text: 'อัปเกรดเพื่อส่งข้อความและอ่านบทสนทนาแบบเต็ม',
    access_upgrade: 'อัปเกรด',
    filter_city: 'ทุกจังหวัด',
    filter_cat: 'ทุกประเภท',
    filter_area_ph: 'ค้นหาตามย่าน...',
    filter_reset: 'รีเซ็ต',
    results: 'ผู้ช่วยที่พบ',
    loading: 'กำลังโหลด...',
    no_helpers: 'ไม่พบผู้ช่วย',
    no_helpers_sub: 'ลองปรับตัวกรอง',
    card_yrs: 'ปีประสบการณ์',
    card_message: 'ส่งข้อความ',
    card_messaging: 'กำลังเปิด...',
    msg_no_conv: 'ยังไม่มีบทสนทนา',
    msg_no_conv_text: 'เริ่มต้นบทสนทนาโดยส่งข้อความถึงผู้ช่วยจากแท็บค้นหา',
    msg_back: 'กลับ',
    msg_placeholder: 'พิมพ์ข้อความ...',
    msg_send: 'ส่ง',
    msg_show_original: 'แสดงต้นฉบับ',
    msg_show_translated: 'แสดงคำแปล',
    msg_locked_cta: 'อัปเกรดเพื่ออ่าน',
    msg_send_locked: 'อัปเกรดเพื่อส่งข้อความและอ่านบทสนทนาแบบเต็ม',
    err_start_locked: 'อัปเกรดบัญชีของคุณเพื่อส่งข้อความถึงผู้ช่วย',
    err_generic: 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง',
  },
};

// Helper for category display with emoji
function categoryWithEmoji(cat) {
  if (!cat) return '';
  const found = Object.entries(CAT_EMOJI).find(([k]) =>
    cat.toLowerCase().includes(k.toLowerCase().split(' ')[0])
  );
  return found ? `${found[1]} ${cat}` : cat;
}

export default function EmployerDashboard() {
  const router = useRouter();
  const { lang, setLang } = useLang();
  const t = T[lang] || T.en;

  // ── Auth + profile state ──────────────────────────────────────────────
  const [profile, setProfile] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // ── Tab state ─────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('browse');

  // ── Browse tab state ──────────────────────────────────────────────────
  const [helpers, setHelpers] = useState([]);
  const [helpersLoading, setHelpersLoading] = useState(true);
  const [filterCity, setFilterCity] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [startingConv, setStartingConv] = useState(null); // helper_ref currently being opened

  // ── Conversations tab state ───────────────────────────────────────────
  const [conversations, setConversations] = useState([]);
  const [convsLoading, setConvsLoading] = useState(false);
  const [accessStatus, setAccessStatus] = useState(null);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [msgInput, setMsgInput] = useState('');
  const [sending, setSending] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');

  // ── Mount: auth check + initial loads ─────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const profileRes = await fetchEmployerProfile();
      if (!profileRes || !profileRes.success) {
        router.replace('/employer-login');
        return;
      }
      if (cancelled) return;
      setProfile(profileRes.profile);
      setAuthChecked(true);
      // Load helpers in parallel with conversations so the dashboard is
      // ready as soon as the user clicks any tab.
      loadHelpers();
      loadConversations();
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadHelpers() {
    setHelpersLoading(true);
    try {
      const data = await fetchHelpersApi();
      setHelpers(data.helpers || []);
    } catch (err) {
      console.error('Failed to load helpers:', err);
      setHelpers([]);
    }
    setHelpersLoading(false);
  }

  async function loadConversations() {
    setConvsLoading(true);
    try {
      const data = await fetchConversations();
      setConversations(data.conversations || []);
      if (data.accessStatus) setAccessStatus(data.accessStatus);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
    setConvsLoading(false);
  }

  // ── Filtered helper list ──────────────────────────────────────────────
  const filteredHelpers = useMemo(() => helpers.filter(h => {
    if (filterCity && h.city?.toLowerCase() !== filterCity.toLowerCase()) return false;
    if (filterCat && !h.category?.toLowerCase().includes(filterCat.toLowerCase())) return false;
    if (filterArea && !h.area?.toLowerCase().includes(filterArea.toLowerCase())) return false;
    return true;
  }), [helpers, filterCity, filterCat, filterArea]);

  function resetFilters() {
    setFilterCity('');
    setFilterCat('');
    setFilterArea('');
  }

  // ── Logout ────────────────────────────────────────────────────────────
  async function handleLogout() {
    await employerLogout();
    router.replace('/employer-login');
  }

  // ── Start a conversation from a helper card ───────────────────────────
  async function handleMessageHelper(helperRef) {
    setErrorBanner('');
    setStartingConv(helperRef);
    try {
      const { conversation_id } = await startConversation(helperRef);
      // Refresh conversations so the new one appears in the list, then open it
      const data = await fetchConversations();
      setConversations(data.conversations || []);
      if (data.accessStatus) setAccessStatus(data.accessStatus);
      const conv = (data.conversations || []).find(c => c.id === conversation_id);
      if (conv) {
        setActiveTab('messages');
        await openConversation(conv);
      }
    } catch (err) {
      if (err.code === 'payment_required') {
        setErrorBanner(t.err_start_locked);
        setActiveTab('messages');
      } else {
        console.error('Start conversation error:', err);
        setErrorBanner(t.err_generic);
      }
    }
    setStartingConv(null);
  }

  // ── Open / send messages ──────────────────────────────────────────────
  async function openConversation(conv) {
    setSelectedConv(conv);
    setMessagesLoading(true);
    setMessages([]);
    try {
      const res = await fetchMessages(conv.id);
      setMessages(res.messages || []);
      if (res.accessStatus) setAccessStatus(res.accessStatus);
      // Mark incoming messages as read
      if (conv.unread_count > 0) {
        markAsRead(conv.id).catch(() => {});
        setConversations(prev =>
          prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c)
        );
      }
    } catch (err) {
      console.error('Load messages error:', err);
    }
    setMessagesLoading(false);
  }

  async function handleSendMessage() {
    if (!msgInput.trim() || !selectedConv) return;
    setSending(true);
    try {
      const res = await sendMessage(selectedConv.id, msgInput.trim());
      setMessages(prev => [...prev, res.message]);
      setMsgInput('');
    } catch (err) {
      if (err.message === 'payment_required') {
        setErrorBanner(t.err_start_locked);
      } else {
        setErrorBanner(t.err_generic);
      }
    }
    setSending(false);
  }

  function handleUpgrade() {
    // Stripe integration not built yet — placeholder.
    alert(t.access_free_text);
  }

  if (!authChecked) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
      }}>
        {t.loading}
      </div>
    );
  }

  const employerHasAccess = accessStatus?.active === true;
  const totalUnread = conversations.reduce((n, c) => n + (c.unread_count || 0), 0);

  return (
    <>
      <Head>
        <title>{t.page_title}</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className={`min-h-screen bg-gray-50 ${lang === 'th' ? 'lang-th' : ''}`}>
        {/* ── NAV ───────────────────────────────────────── */}
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between w-full">
            {/* Logo → also acts as "back to browse" */}
            <button
              onClick={() => { setActiveTab('browse'); setSelectedConv(null); }}
              className="text-xl md:text-2xl font-bold"
            >
              Thai<span style={{color:'#006a62'}}>Helper</span>
            </button>

            <div className="flex items-center gap-2 md:gap-3">
              {/* Messages icon with unread badge */}
              <button
                onClick={() => { setActiveTab('messages'); setSelectedConv(null); }}
                className={`relative p-2.5 rounded-lg transition-colors ${
                  activeTab === 'messages'
                    ? 'bg-[#006a62] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={t.tab_messages}
                aria-label={t.tab_messages}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {totalUnread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                )}
              </button>

              {/* Language toggle */}
              <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                <button
                  className={`px-2.5 py-1.5 rounded-lg text-sm font-bold transition-all ${lang === 'en' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                  onClick={() => setLang('en')}
                >🇬🇧</button>
                <button
                  className={`px-2.5 py-1.5 rounded-lg text-sm font-bold transition-all ${lang === 'th' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                  onClick={() => setLang('th')}
                >🇹🇭</button>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="px-3 md:px-4 py-2 rounded-lg border border-gray-200 text-xs md:text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {t.logout}
              </button>
            </div>
          </div>
        </header>

        <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px 64px' }}>
          {/* ── Greeting ───────────────────────────────── */}
          <h1 style={{
            fontSize: '24px', fontWeight: 700, color: '#1a1a1a',
            margin: '0 0 16px',
          }}>
            {t.greeting}, {profile?.first_name || 'there'} 👋
          </h1>

          {/* ── Access banner ──────────────────────────── */}
          {accessStatus && employerHasAccess && (
            <div style={{
              background: '#dcfce7', border: '1px solid #86efac',
              color: '#166534', padding: '12px 16px',
              borderRadius: '12px', marginBottom: '16px',
              fontSize: '14px', fontWeight: 600,
            }}>
              {(accessStatus.tier === 'promo' ? t.access_promo : t.access_paid)
                .replace('{n}', accessStatus.daysRemaining)}
            </div>
          )}
          {accessStatus && !employerHasAccess && (
            <div style={{
              background: '#fff7ed', border: '1px solid #fed7aa',
              padding: '14px 16px', borderRadius: '12px', marginBottom: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '12px', flexWrap: 'wrap',
            }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#9a3412' }}>
                  🔒 {t.access_free_title}
                </div>
                <div style={{ fontSize: '13px', color: '#9a3412', marginTop: '2px' }}>
                  {t.access_free_text}
                </div>
              </div>
              <button
                onClick={handleUpgrade}
                style={{
                  padding: '10px 20px', borderRadius: '10px', border: 'none',
                  background: '#006a62', color: 'white', fontSize: '13px',
                  fontWeight: 700, cursor: 'pointer',
                }}
              >
                {t.access_upgrade}
              </button>
            </div>
          )}

          {/* ── Error banner ───────────────────────────── */}
          {errorBanner && (
            <div style={{
              background: '#fee2e2', border: '1px solid #fecaca',
              color: '#991b1b', padding: '12px 16px',
              borderRadius: '10px', marginBottom: '16px',
              fontSize: '13px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>{errorBanner}</span>
              <button
                onClick={() => setErrorBanner('')}
                style={{
                  background: 'none', border: 'none', color: '#991b1b',
                  cursor: 'pointer', fontSize: '18px', padding: 0,
                }}
              >×</button>
            </div>
          )}

          {/* ── Section title ──────────────────────────── */}
          <h2 style={{
            fontSize: '18px', fontWeight: 700, color: '#1a1a1a',
            margin: '20px 0 16px',
          }}>
            {activeTab === 'browse' ? t.tab_browse : t.tab_messages}
          </h2>

          {/* ── Browse view ────────────────────────────── */}
          {activeTab === 'browse' && (
            <BrowseTab
              t={t}
              loading={helpersLoading}
              helpers={filteredHelpers}
              totalCount={filteredHelpers.length}
              filterCity={filterCity}
              setFilterCity={setFilterCity}
              filterCat={filterCat}
              setFilterCat={setFilterCat}
              filterArea={filterArea}
              setFilterArea={setFilterArea}
              onResetFilters={resetFilters}
              onMessageHelper={handleMessageHelper}
              startingConv={startingConv}
            />
          )}

          {/* ── Messages tab ───────────────────────────── */}
          {activeTab === 'messages' && (
            <>
              {!selectedConv ? (
                convsLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    {t.loading}
                  </div>
                ) : (
                  <ConversationList
                    conversations={conversations}
                    onSelect={openConversation}
                    t={t}
                  />
                )
              ) : (
                <ConversationDetail
                  conversation={selectedConv}
                  messages={messages}
                  currentRole="employer"
                  canSend={employerHasAccess}
                  loading={messagesLoading}
                  msgInput={msgInput}
                  setMsgInput={setMsgInput}
                  onSend={handleSendMessage}
                  sending={sending}
                  onBack={() => { setSelectedConv(null); setMessages([]); }}
                  onUpgrade={handleUpgrade}
                  t={t}
                />
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────

function BrowseTab({
  t, loading, helpers, totalCount,
  filterCity, setFilterCity, filterCat, setFilterCat,
  filterArea, setFilterArea, onResetFilters,
  onMessageHelper, startingConv,
}) {
  return (
    <>
      {/* Filter bar */}
      <div style={{
        display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px',
      }}>
        <select
          value={filterCity}
          onChange={e => setFilterCity(e.target.value)}
          className="filter-select"
          style={{
            padding: '10px 14px', borderRadius: '10px',
            border: '1px solid #e5e7eb', fontSize: '14px',
            background: 'white', minWidth: '160px',
          }}
        >
          <option value="">{t.filter_city}</option>
          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          style={{
            padding: '10px 14px', borderRadius: '10px',
            border: '1px solid #e5e7eb', fontSize: '14px',
            background: 'white', minWidth: '180px',
          }}
        >
          <option value="">{t.filter_cat}</option>
          {CATEGORY_NAMES.map(c => (
            <option key={c} value={c}>{categoryWithEmoji(c)}</option>
          ))}
        </select>

        <input
          type="text"
          value={filterArea}
          onChange={e => setFilterArea(e.target.value)}
          placeholder={t.filter_area_ph}
          style={{
            padding: '10px 14px', borderRadius: '10px',
            border: '1px solid #e5e7eb', fontSize: '14px',
            flex: 1, minWidth: '160px',
          }}
        />

        {(filterCity || filterCat || filterArea) && (
          <button
            onClick={onResetFilters}
            style={{
              padding: '10px 16px', borderRadius: '10px',
              border: '1px solid #e5e7eb', background: 'white',
              fontSize: '13px', cursor: 'pointer', color: '#666',
            }}
          >
            {t.filter_reset}
          </button>
        )}
      </div>

      {/* Results count */}
      <div style={{ marginBottom: '12px', fontSize: '13px', color: '#666' }}>
        <strong>{totalCount}</strong> {t.results}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          {t.loading}
        </div>
      ) : helpers.length === 0 ? (
        <div style={{
          background: 'white', borderRadius: '16px',
          padding: '48px 32px', border: '1px solid #e5e7eb',
          textAlign: 'center',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
            {t.no_helpers}
          </h3>
          <p style={{ fontSize: '14px', color: '#666' }}>{t.no_helpers_sub}</p>
        </div>
      ) : (
        <div style={{
          display: 'grid', gap: '14px',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        }}>
          {helpers.map(h => (
            <HelperCard
              key={h.ref}
              helper={h}
              t={t}
              onMessage={() => onMessageHelper(h.ref)}
              isStarting={startingConv === h.ref}
            />
          ))}
        </div>
      )}
    </>
  );
}

function HelperCard({ helper, t, onMessage, isStarting }) {
  const displayName = [helper.firstName, helper.lastName].filter(Boolean).join(' ');
  return (
    <div style={{
      background: 'white', borderRadius: '14px',
      border: '1px solid #e5e7eb', padding: '18px',
      display: 'flex', flexDirection: 'column', gap: '12px',
    }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          overflow: 'hidden', background: '#e6f5f3', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px', color: '#006a62', fontWeight: 700,
        }}>
          {helper.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={helper.photo}
              alt={displayName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            (helper.firstName || '?')[0].toUpperCase()
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '15px', fontWeight: 700, color: '#1a1a1a',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {displayName}
            {helper.age && (
              <span style={{ color: '#999', fontWeight: 500, fontSize: '13px' }}>
                {' '}· {helper.age}
              </span>
            )}
          </div>
          <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
            {categoryWithEmoji(helper.category)}
          </div>
          {helper.city && (
            <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
              📍 {helper.city}{helper.area ? ` · ${helper.area}` : ''}
            </div>
          )}
        </div>
      </div>

      {helper.experience && (
        <div style={{ fontSize: '12px', color: '#666' }}>
          ⏱ {helper.experience} {t.card_yrs}
        </div>
      )}
      {helper.languages && (
        <div style={{ fontSize: '12px', color: '#666' }}>
          🗣 {helper.languages}
        </div>
      )}

      <button
        onClick={onMessage}
        disabled={isStarting}
        style={{
          marginTop: 'auto',
          padding: '10px 16px', borderRadius: '10px', border: 'none',
          background: '#006a62', color: 'white', fontSize: '14px',
          fontWeight: 700, cursor: isStarting ? 'wait' : 'pointer',
          opacity: isStarting ? 0.6 : 1,
        }}
      >
        💬 {isStarting ? t.card_messaging : t.card_message}
      </button>
    </div>
  );
}

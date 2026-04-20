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
 * Auth: redirects to /login on 401.
 */

import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLang } from './_app';
import LangSwitcher from '@/components/LangSwitcher';
import EmployerProfileMenu from '@/components/EmployerProfileMenu';
import HelperCard from '@/components/HelperCard';
import { fetchEmployerProfile } from '@/lib/api/employer-auth-client';
import { fetchHelpers as fetchHelpersApi } from '@/lib/api/helpers';
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  startConversation,
  markAsRead,
  deleteConversation,
} from '@/lib/api/messages';
import ConversationList from '@/components/messaging/ConversationList';
import ConversationDetail from '@/components/messaging/ConversationDetail';
import HelperProfileModal from '@/components/messaging/HelperProfileModal';
import { CITIES } from '@/lib/constants/cities';
import { CATEGORIES, CAT_EMOJI } from '@/lib/constants/categories';

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────
const T = {
  en: {
    page_title: 'Employer Dashboard – ThaiHelper',
    greeting: 'Hi',
    hi_morning: 'Good morning',
    hi_afternoon: 'Good afternoon',
    hi_evening: 'Good evening',
    hero_subtitle_promo: 'You have full access — {n} days left to message helpers.',
    hero_subtitle_paid: 'Full access active — {n} days remaining.',
    hero_subtitle_free: 'Welcome! Browse helpers and start conversations.',
    hero_status_promo: 'LAUNCH',
    hero_status_paid: 'PAID',
    hero_status_free: 'LAUNCH',
    hero_unread: 'unread',
    launch_banner_title: 'Launch phase',
    launch_banner_text: 'ThaiHelper is in its launch phase — everything is currently 100% free, including messaging helpers. We will introduce a one-time access fee for messaging in the future, but for now enjoy full access at no cost.',
    logout: 'Log Out',
    tab_browse: 'Browse Helpers',
    tab_messages: 'Messages',
    tab_favorites: 'Favorites',
    fav_add: 'Save to favorites',
    fav_remove: 'Remove from favorites',
    fav_empty_title: 'No favorites yet',
    fav_empty_sub: 'Tap the heart on any helper card to save them here.',
    access_promo: '🎉 You have full access — {n} days remaining',
    access_paid: '✓ Full access — {n} days remaining',
    access_free_title: 'Free account',
    access_free_text: 'Upgrade to message helpers and see full conversations.',
    access_upgrade: 'Upgrade',
    filter_title: 'Filters',
    filter_show_filters: 'Filters',
    filter_show_results: 'Show {n} results',
    filter_city: 'All Cities',
    filter_cat: 'All Categories',
    filter_city_label: 'City',
    filter_cat_label: 'Category',
    filter_area_label: 'Area / Neighbourhood',
    filter_age_label: 'Age',
    filter_exp_label: 'Experience (years)',
    filter_lang_label: 'Languages',
    filter_area_ph: 'Search by area...',
    filter_reset: 'Reset',
    sort_label: 'Sort by',
    sort_newest: 'Newest',
    sort_experience: 'Most experience',
    sort_alphabetical: 'A–Z',
    sort_youngest: 'Youngest first',
    sort_oldest: 'Oldest first',
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
    msg_delete_error: 'Could not delete the conversation. Please try again.',
    err_translation_failed: '',
    err_too_long: 'Message is too long (max {n} characters).',
    // Conversation empty state
    msg_empty_title: 'Say hi to {name} 👋',
    msg_empty_hint: 'Send your first message to get the conversation started.',
    // Helper profile modal
    profile_location: 'Location',
    profile_experience: 'Experience',
    profile_languages: 'Languages',
    profile_education: 'Education',
    profile_rate: 'Rate',
    profile_about: 'About',
    profile_skills: 'Skills',
    profile_certificates: 'Certificates',
    profile_recommendations: 'Recommendations',
    profile_no_recommendations: 'No recommendations yet.',
    profile_no_certificates: 'No certificates uploaded yet.',
    profile_cert_privacy: 'Personal details hidden for privacy',
    msg_delete: 'Delete conversation',
    msg_delete_confirm: 'Delete?',
    msg_delete_yes: 'Yes',
    msg_delete_no: 'No',
    verify_banner: 'Please check your email and click the verification link to activate your account.',
  },
  th: {
    page_title: 'แดชบอร์ดนายจ้าง – ThaiHelper',
    greeting: 'สวัสดี',
    hi_morning: 'อรุณสวัสดิ์',
    hi_afternoon: 'สวัสดีตอนบ่าย',
    hi_evening: 'สวัสดีตอนเย็น',
    hero_subtitle_promo: 'คุณมีสิทธิ์เข้าถึงเต็มรูปแบบ — เหลืออีก {n} วันในการส่งข้อความ',
    hero_subtitle_paid: 'เปิดใช้งานเต็มรูปแบบ — เหลืออีก {n} วัน',
    hero_subtitle_free: 'ยินดีต้อนรับ! ค้นหาผู้ช่วยและเริ่มการสนทนาได้เลย',
    hero_status_promo: 'เปิดตัว',
    hero_status_paid: 'ชำระเงินแล้ว',
    hero_status_free: 'เปิดตัว',
    hero_unread: 'ยังไม่ได้อ่าน',
    launch_banner_title: 'ช่วงเปิดตัว',
    launch_banner_text: 'ThaiHelper อยู่ในช่วงเปิดตัว — ตอนนี้ทุกอย่างฟรี 100% รวมถึงการส่งข้อความหาผู้ช่วย ในอนาคตเราจะเก็บค่าธรรมเนียมแบบจ่ายครั้งเดียวสำหรับการส่งข้อความ แต่ตอนนี้ใช้งานเต็มรูปแบบได้ฟรี',
    logout: 'ออกจากระบบ',
    tab_browse: 'ค้นหาผู้ช่วย',
    tab_messages: 'ข้อความ',
    tab_favorites: 'รายการโปรด',
    fav_add: 'บันทึกในรายการโปรด',
    fav_remove: 'ลบออกจากรายการโปรด',
    fav_empty_title: 'ยังไม่มีรายการโปรด',
    fav_empty_sub: 'แตะหัวใจบนการ์ดผู้ช่วยเพื่อบันทึกไว้ที่นี่',
    access_promo: '🎉 คุณมีสิทธิ์เข้าถึงเต็มรูปแบบ — เหลืออีก {n} วัน',
    access_paid: '✓ เข้าถึงเต็มรูปแบบ — เหลืออีก {n} วัน',
    access_free_title: 'บัญชีฟรี',
    access_free_text: 'อัปเกรดเพื่อส่งข้อความและอ่านบทสนทนาแบบเต็ม',
    access_upgrade: 'อัปเกรด',
    filter_title: 'ตัวกรอง',
    filter_show_filters: 'ตัวกรอง',
    filter_show_results: 'แสดง {n} ผลลัพธ์',
    filter_city: 'ทุกจังหวัด',
    filter_cat: 'ทุกประเภท',
    filter_city_label: 'จังหวัด',
    filter_cat_label: 'ประเภท',
    filter_area_label: 'พื้นที่ / ย่าน',
    filter_age_label: 'อายุ',
    filter_exp_label: 'ประสบการณ์ (ปี)',
    filter_lang_label: 'ภาษา',
    filter_area_ph: 'ค้นหาตามย่าน...',
    filter_reset: 'รีเซ็ต',
    sort_label: 'เรียงตาม',
    sort_newest: 'ใหม่ล่าสุด',
    sort_experience: 'ประสบการณ์มากที่สุด',
    sort_alphabetical: 'ก–ฮ',
    sort_youngest: 'อายุน้อยที่สุดก่อน',
    sort_oldest: 'อายุมากที่สุดก่อน',
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
    msg_delete_error: 'ไม่สามารถลบการสนทนาได้ กรุณาลองอีกครั้ง',
    err_translation_failed: '',
    err_too_long: 'ข้อความยาวเกินไป (สูงสุด {n} ตัวอักษร)',
    // Conversation empty state
    msg_empty_title: 'ทักทาย {name} กันเถอะ 👋',
    msg_empty_hint: 'ส่งข้อความแรกเพื่อเริ่มการสนทนา',
    // Helper profile modal
    profile_location: 'ที่ตั้ง',
    profile_experience: 'ประสบการณ์',
    profile_languages: 'ภาษา',
    profile_education: 'การศึกษา',
    profile_rate: 'ค่าจ้าง',
    profile_about: 'เกี่ยวกับ',
    profile_skills: 'ทักษะ',
    profile_certificates: 'ใบรับรอง',
    profile_recommendations: 'คำแนะนำ',
    profile_no_recommendations: 'ยังไม่มีคำแนะนำ',
    profile_no_certificates: 'ยังไม่มีใบรับรอง',
    profile_cert_privacy: 'ข้อมูลส่วนตัวถูกซ่อนเพื่อความเป็นส่วนตัว',
    msg_delete: 'ลบบทสนทนา',
    msg_delete_confirm: 'ลบ?',
    msg_delete_yes: 'ใช่',
    msg_delete_no: 'ไม่',
    verify_banner: 'กรุณาตรวจสอบอีเมลของคุณและคลิกลิงก์ยืนยันเพื่อเปิดใช้งานบัญชี',
  },
};

// Helper category normalization + display.
//
// Helpers store `category` as a slug ("nanny", "elder_care", …) coming from
// the registration form, while the filter dropdown shows friendly display
// names ("Nanny & Babysitter"). We map both sides to a canonical slug so
// a filter selection actually matches the stored value.
//
// `categoryToSlug` accepts either a slug or a display name (with or without
// emoji) and returns the canonical slug, or null if unknown.
function categoryToSlug(cat) {
  if (!cat) return null;
  const raw = String(cat).trim().toLowerCase();
  if (!raw) return null;
  // Direct slug hit
  const bySlug = CATEGORIES.find(c => c.value.toLowerCase() === raw);
  if (bySlug) return bySlug.value;
  // Display-name hit (strip emoji + punctuation)
  const stripped = raw.replace(/[^a-z&\s]/g, '').trim();
  const byName = CATEGORIES.find(c => {
    const en = c.en.toLowerCase().replace(/[^a-z&\s]/g, '').trim();
    return en === stripped || en.startsWith(stripped) || stripped.startsWith(en);
  });
  if (byName) return byName.value;
  // First-word fallback (e.g. legacy "Nanny" → "nanny")
  const firstWord = stripped.split(/[\s&/,]+/)[0];
  const byFirst = CATEGORIES.find(c =>
    c.value.startsWith(firstWord) || c.en.toLowerCase().includes(firstWord)
  );
  return byFirst ? byFirst.value : null;
}

// Helper for category display with emoji — accepts slug OR display name
function categoryWithEmoji(cat) {
  if (!cat) return '';
  const slug = categoryToSlug(cat);
  if (slug) {
    const def = CATEGORIES.find(c => c.value === slug);
    if (def) return def.en; // already contains the emoji
  }
  // Fallback — best-effort prefix
  const found = Object.entries(CAT_EMOJI).find(([k]) =>
    String(cat).toLowerCase().includes(k.toLowerCase().split(' ')[0])
  );
  return found ? `${found[1]} ${cat}` : String(cat);
}

export default function EmployerDashboard() {
  const router = useRouter();
  const { lang, setLang } = useLang();
  const t = T[lang] || T.en;

  // ── Auth + profile state ──────────────────────────────────────────────
  const [profile, setProfile] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // ── Responsive breakpoint ─────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Tab state ─────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('browse');

  // ── Browse tab state ──────────────────────────────────────────────────
  const [helpers, setHelpers] = useState([]);
  const [helpersLoading, setHelpersLoading] = useState(true);
  const [filterCity, setFilterCity] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterAgeRange, setFilterAgeRange] = useState(''); // '' | '18-25' | '25-35' | '35-45' | '45-55' | '55+'
  const [filterMinExp, setFilterMinExp] = useState(''); // '' | '1' | '3' | '5' | '10'
  const [filterLanguages, setFilterLanguages] = useState([]); // ['english', 'thai', ...]
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'experience' | 'alphabetical' | 'youngest' | 'oldest'
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
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
  const [viewingHelper, setViewingHelper] = useState(null); // helper obj shown in profile modal

  // ── Favorites state ───────────────────────────────────────────────────
  const [favorites, setFavorites] = useState(new Set());

  // ── Mount: auth check + initial loads ─────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const profileRes = await fetchEmployerProfile();
      if (!profileRes || !profileRes.success) {
        router.replace('/login');
        return;
      }
      if (cancelled) return;
      setProfile(profileRes.profile);
      setAuthChecked(true);
      // Load helpers in parallel with conversations so the dashboard is
      // ready as soon as the user clicks any tab.
      loadHelpers();
      loadConversations();
      loadFavorites();
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadFavorites() {
    try {
      const r = await fetch('/api/favorites');
      if (!r.ok) return;
      const data = await r.json();
      setFavorites(new Set(data.favorites || []));
    } catch (err) {
      console.error('Failed to load favorites:', err);
    }
  }

  async function toggleFavorite(helperRef, nextValue) {
    // Optimistic update
    setFavorites(prev => {
      const next = new Set(prev);
      if (nextValue) next.add(helperRef); else next.delete(helperRef);
      return next;
    });
    try {
      if (nextValue) {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ helper_ref: helperRef }),
        });
      } else {
        await fetch(`/api/favorites?helper_ref=${encodeURIComponent(helperRef)}`, {
          method: 'DELETE',
        });
      }
    } catch (err) {
      console.error('Favorite toggle failed:', err);
      setFavorites(prev => {
        const next = new Set(prev);
        if (nextValue) next.delete(helperRef); else next.add(helperRef);
        return next;
      });
    }
  }

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

  async function loadConversations({ silent = false } = {}) {
    if (!silent) setConvsLoading(true);
    try {
      const data = await fetchConversations();
      setConversations(data.conversations || []);
      if (data.accessStatus) setAccessStatus(data.accessStatus);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
    if (!silent) setConvsLoading(false);
  }

  // ── Polling: keep conversation list fresh while Messages tab is open ──
  // Refreshes every 15s so new unread messages appear without a hard reload.
  // We skip polling while the user is typing in a conversation detail view
  // to avoid clobbering the messages list mid-keystroke.
  useEffect(() => {
    if (!authChecked) return;
    if (activeTab !== 'messages') return;
    if (selectedConv) return; // conversation detail has its own poll below
    const id = setInterval(() => loadConversations({ silent: true }), 15000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, activeTab, selectedConv]);

  // Poll the open conversation's messages every 10s so replies land live
  useEffect(() => {
    if (!authChecked) return;
    if (!selectedConv) return;
    const id = setInterval(async () => {
      try {
        const res = await fetchMessages(selectedConv.id);
        setMessages(res.messages || []);
        if (res.accessStatus) setAccessStatus(res.accessStatus);
      } catch {
        /* ignore transient errors */
      }
    }, 10000);
    return () => clearInterval(id);
  }, [authChecked, selectedConv]);

  // ── Filtered + sorted helper list ─────────────────────────────────────
  const filteredHelpers = useMemo(() => {
    const filtered = helpers.filter(h => {
    if (filterCity && h.city?.toLowerCase() !== filterCity.toLowerCase()) return false;
    // Category — normalize both sides to slug so the filter works regardless
    // of whether the helper's stored `category` is a slug ("nanny") or a
    // display name ("Nanny & Babysitter"). filterCat is always a slug.
    if (filterCat) {
      const helperSlug = categoryToSlug(h.category);
      if (helperSlug !== filterCat) return false;
    }
    if (filterArea && !h.area?.toLowerCase().includes(filterArea.toLowerCase())) return false;

    // Age range — parse helper age as number, ranges are inclusive/exclusive
    // at the upper bound to keep buckets disjoint (e.g. 25 falls into 25-35).
    if (filterAgeRange) {
      const age = parseInt(h.age, 10);
      if (Number.isNaN(age)) return false;
      const rangeOk = (
        (filterAgeRange === '18-25' && age >= 18 && age < 25) ||
        (filterAgeRange === '25-35' && age >= 25 && age < 35) ||
        (filterAgeRange === '35-45' && age >= 35 && age < 45) ||
        (filterAgeRange === '45-55' && age >= 45 && age < 55) ||
        (filterAgeRange === '55+'   && age >= 55)
      );
      if (!rangeOk) return false;
    }

    // Min experience — experience is stored as a free-text string, try to
    // extract the first integer ("5", "5 years", "5+ yrs" all match 5).
    if (filterMinExp) {
      const min = parseInt(filterMinExp, 10);
      const match = (h.experience || '').match(/\d+/);
      const years = match ? parseInt(match[0], 10) : 0;
      if (years < min) return false;
    }

    // Languages — helper must speak ALL selected languages (substring match,
    // case-insensitive). Helper's languages field is free text like
    // "English, Thai, Russian".
    if (filterLanguages.length > 0) {
      const langsLower = (h.languages || '').toLowerCase();
      for (const lang of filterLanguages) {
        if (!langsLower.includes(lang.toLowerCase())) return false;
      }
    }

      return true;
    });

    // Sort — operate on a copy so we don't mutate state
    const parseExp = (h) => {
      const m = (h.experience || '').match(/\d+/);
      return m ? parseInt(m[0], 10) : 0;
    };
    const parseAge = (h) => {
      const a = parseInt(h.age, 10);
      return Number.isNaN(a) ? Infinity : a;
    };
    const parseDate = (h) => new Date(h.createdAt || 0).getTime();

    const sorted = [...filtered];
    switch (sortBy) {
      case 'experience':
        sorted.sort((a, b) => parseExp(b) - parseExp(a));
        break;
      case 'alphabetical':
        sorted.sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));
        break;
      case 'youngest':
        sorted.sort((a, b) => parseAge(a) - parseAge(b));
        break;
      case 'oldest':
        sorted.sort((a, b) => parseAge(b) - parseAge(a));
        break;
      case 'newest':
      default:
        sorted.sort((a, b) => parseDate(b) - parseDate(a));
        break;
    }
    return sorted;
  }, [helpers, filterCity, filterCat, filterArea, filterAgeRange, filterMinExp, filterLanguages, sortBy]);

  function resetFilters() {
    setFilterCity('');
    setFilterCat('');
    setFilterArea('');
    setFilterAgeRange('');
    setFilterMinExp('');
    setFilterLanguages([]);
  }

  function toggleLanguage(lang) {
    setFilterLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  }

  const activeFilterCount =
    (filterCity ? 1 : 0) + (filterCat ? 1 : 0) + (filterArea ? 1 : 0) +
    (filterAgeRange ? 1 : 0) + (filterMinExp ? 1 : 0) + filterLanguages.length;

  // ── Start a conversation from a helper card ───────────────────────────
  async function handleMessageHelper(helperRef) {
    setErrorBanner('');
    setStartingConv(helperRef);
    try {
      const { conversation_id } = await startConversation(helperRef);

      // Try to find this conversation in the (filtered) list
      const data = await fetchConversations();
      setConversations(data.conversations || []);
      if (data.accessStatus) setAccessStatus(data.accessStatus);
      const conv = (data.conversations || []).find(c => c.id === conversation_id);

      if (conv) {
        // Conversation has messages — open it normally
        setActiveTab('messages');
        await openConversation(conv);
      } else {
        // Conversation is empty (new or never used) — open directly
        const helper = helpers.find(h => h.ref === helperRef);
        const newConv = {
          id: conversation_id,
          created_at: new Date().toISOString(),
          last_message_at: new Date().toISOString(),
          unread_count: 0,
          last_message: null,
          counterparty: helper ? {
            ref: helper.ref,
            firstName: helper.firstName,
            lastName: helper.lastName,
            photo: helper.photo,
            category: helper.category,
            city: helper.city,
          } : { ref: helperRef, firstName: 'Helper', lastName: '', photo: null },
        };
        setActiveTab('messages');
        setSelectedConv(newConv);
        setMessages([]);
        setMessagesLoading(false);
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

      // If the conversation isn't in the sidebar yet (first message),
      // refresh the list so it appears
      const inList = conversations.some(c => c.id === selectedConv.id);
      if (!inList) {
        loadConversations({ silent: true });
      }
    } catch (err) {
      if (err.code === 'payment_required') {
        setErrorBanner(t.err_start_locked);
      } else if (err.code === 'message_too_long') {
        setErrorBanner((t.err_too_long || 'Message is too long.').replace('{n}', err.max || 4000));
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

  // Delete a conversation and remove it from local state — only mutate
  // local state after the API call succeeds, so a failed request doesn't
  // make a still-existing conversation "disappear" only to reappear on
  // reload (would look like a ghost bug to the user).
  async function handleDeleteConversation(conversationId) {
    try {
      await deleteConversation(conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      // If the deleted conversation was currently open, close it
      if (selectedConv?.id === conversationId) {
        setSelectedConv(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Delete conversation failed:', err);
      setErrorBanner(t.msg_delete_error || t.err_generic);
    }
  }

  // Open the full helper profile modal from the conversation header.
  // We look the helper up in the already-loaded `helpers` state (from the
  // Browse tab) so there's no extra round-trip. Falls back to a lookup by
  // ref if needed.
  function handleViewHelperProfile(counterparty) {
    if (!counterparty?.ref) return;
    const helper = helpers.find(h => h.ref === counterparty.ref);
    if (helper) {
      setViewingHelper(helper);
    } else {
      // Helper not in current list (e.g. filtered out) — build a minimal
      // object from what the conversation counterparty gave us.
      setViewingHelper({
        ref: counterparty.ref,
        firstName: counterparty.firstName,
        lastName: counterparty.lastName,
        photo: counterparty.photo,
        category: counterparty.category,
        city: counterparty.city,
      });
    }
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
              {/* Favorites icon with count badge */}
              <button
                onClick={() => { setActiveTab('favorites'); setSelectedConv(null); }}
                className={`relative p-2.5 rounded-lg transition-colors ${
                  activeTab === 'favorites'
                    ? 'bg-[#006a62] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={t.tab_favorites}
                aria-label={t.tab_favorites}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={activeTab === 'favorites' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {favorites.size > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#e11d48] text-white text-[10px] font-bold flex items-center justify-center">
                    {favorites.size > 9 ? '9+' : favorites.size}
                  </span>
                )}
              </button>

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
              <LangSwitcher languages={['en', 'th', 'ru']} />

              {/* Profile avatar with dropdown menu (Dashboard / Profile / Settings / Logout) */}
              <EmployerProfileMenu
                profile={profile}
                lang={lang}
                current="dashboard"
              />
            </div>
          </div>
        </header>

        <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px 64px' }}>
          {/* ── Hero card with greeting + status ──────── */}
          <EmployerHero
            t={t}
            firstName={profile?.first_name}
            employerRef={profile?.employer_ref}
            accessStatus={accessStatus}
            hasAccess={employerHasAccess}
            unreadCount={totalUnread}
            conversationCount={conversations.length}
            onUpgrade={handleUpgrade}
            onOpenMessages={() => { setActiveTab('messages'); setSelectedConv(null); }}
            isMobile={isMobile}
          />

          {/* ── Email verification warning ──────────────── */}
          {profile && profile.email_verified === false && (
            <div style={{
              display: 'flex', gap: '12px', alignItems: 'center',
              background: '#fef3c7', border: '1px solid #f59e0b',
              borderRadius: '12px', padding: '14px 18px',
              marginBottom: '16px', flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '22px' }}>✉️</span>
              <p style={{ flex: 1, margin: 0, fontSize: '14px', color: '#92400e', lineHeight: 1.5 }}>
                {t.verify_banner || 'Please check your email and click the verification link to activate your account.'}
              </p>
            </div>
          )}

          {/* ── Error banner ───────────────────────────── */}
          {errorBanner && (
            <div style={{
              background: '#fee2e2', border: '1px solid #fecaca',
              color: '#991b1b', padding: '12px 16px',
              borderRadius: '10px', marginBottom: '16px',
              fontSize: '14px',
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
            {activeTab === 'browse' ? t.tab_browse
              : activeTab === 'favorites' ? t.tab_favorites
              : t.tab_messages}
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
              filterAgeRange={filterAgeRange}
              setFilterAgeRange={setFilterAgeRange}
              filterMinExp={filterMinExp}
              setFilterMinExp={setFilterMinExp}
              filterLanguages={filterLanguages}
              toggleLanguage={toggleLanguage}
              sortBy={sortBy}
              setSortBy={setSortBy}
              activeFilterCount={activeFilterCount}
              onResetFilters={resetFilters}
              onMessageHelper={handleMessageHelper}
              startingConv={startingConv}
              mobileFiltersOpen={mobileFiltersOpen}
              setMobileFiltersOpen={setMobileFiltersOpen}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onViewProfile={setViewingHelper}
            />
          )}

          {/* ── Favorites view ─────────────────────────── */}
          {activeTab === 'favorites' && (
            <FavoritesTab
              t={t}
              helpers={helpers.filter(h => favorites.has(h.ref))}
              loading={helpersLoading}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onMessageHelper={handleMessageHelper}
              startingConv={startingConv}
              onViewProfile={setViewingHelper}
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
                    onDelete={handleDeleteConversation}
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
                  onViewProfile={handleViewHelperProfile}
                  t={t}
                />
              )}
            </>
          )}
        </main>

        {/* Helper profile modal (opened from conversation header) */}
        {viewingHelper && (
          <HelperProfileModal
            helper={viewingHelper}
            onClose={() => setViewingHelper(null)}
            t={t}
            lang={lang}
          />
        )}
      </div>
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────

// Time-aware greeting (SSR-safe: defaults to morning, updates on client)
function getGreeting(t) {
  if (typeof window === 'undefined') return t.hi_morning;
  const h = new Date().getHours();
  if (h < 12) return t.hi_morning;
  if (h < 18) return t.hi_afternoon;
  return t.hi_evening;
}

function EmployerHero({ t, firstName, employerRef, accessStatus, hasAccess, unreadCount, conversationCount, onUpgrade, onOpenMessages, isMobile }) {
  const tier = accessStatus?.tier || 'free';
  const days = accessStatus?.daysRemaining;

  const statusLabel =
    tier === 'promo' ? t.hero_status_promo :
    tier === 'paid'  ? t.hero_status_paid  :
                       t.hero_status_free;

  const subtitle =
    !accessStatus ? '' :
    tier === 'promo' ? t.hero_subtitle_promo.replace('{n}', days) :
    tier === 'paid'  ? t.hero_subtitle_paid.replace('{n}', days)  :
                       t.hero_subtitle_free;

  const dotColor = hasAccess ? '#7dffb0' : '#fbbf24';

  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(135deg, #006a62 0%, #00897e 50%, #00b29c 100%)',
      borderRadius: '20px',
      padding: isMobile ? '22px 22px 24px' : '32px 36px',
      marginBottom: '20px',
      color: 'white',
      boxShadow: '0 12px 32px rgba(0, 106, 98, 0.25)',
    }}>
      {/* Decorative blobs */}
      <div aria-hidden style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
      <div aria-hidden style={{ position: 'absolute', bottom: '-80px', left: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

      <div style={{ position: 'relative', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: isMobile ? '16px' : '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: isMobile ? 0 : '260px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 12px', borderRadius: '999px', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '12px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: dotColor, boxShadow: `0 0 0 3px ${dotColor}33` }} />
            {statusLabel}{employerRef ? ` · ${employerRef}` : ''}
          </div>
          <h1 style={{ fontSize: isMobile ? '24px' : '30px', fontWeight: 800, margin: '0 0 8px', lineHeight: 1.15, letterSpacing: '-0.5px' }}>
            {getGreeting(t)}, {firstName || 'there'} 👋
          </h1>
          {subtitle && (
            <p style={{ fontSize: isMobile ? '14px' : '15px', margin: 0, opacity: 0.92, lineHeight: 1.5, maxWidth: '500px' }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Right side mini-stats */}
        <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
          <HeroStat value={conversationCount || 0} label={t.tab_messages} onClick={onOpenMessages} compact={isMobile} />
          {unreadCount > 0 && (
            <HeroStat value={unreadCount} label={t.hero_unread} accent onClick={onOpenMessages} compact={isMobile} />
          )}
        </div>
      </div>
    </div>
  );
}

function HeroStat({ value, label, accent, onClick, compact }) {
  const clickable = typeof onClick === 'function';
  const Tag = clickable ? 'button' : 'div';
  return (
    <Tag
      onClick={clickable ? onClick : undefined}
      aria-label={clickable ? `${label} — open messages` : undefined}
      style={{
        minWidth: compact ? '72px' : '88px',
        padding: compact ? '10px 12px' : '14px 16px',
        borderRadius: '14px',
        background: accent ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(8px)',
        border: accent ? 'none' : '1px solid rgba(255,255,255,0.2)',
        textAlign: 'center',
        color: accent ? '#dc2626' : 'white',
        cursor: clickable ? 'pointer' : 'default',
        transition: 'transform 0.15s, background 0.15s',
        font: 'inherit',
      }}
      onMouseEnter={clickable ? (e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.background = accent ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.25)';
      } : undefined}
      onMouseLeave={clickable ? (e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.background = accent ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.15)';
      } : undefined}
    >
      <div style={{ fontSize: compact ? '20px' : '24px', fontWeight: 800, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: compact ? '10px' : '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginTop: '4px', opacity: accent ? 0.9 : 0.85 }}>{label}</div>
    </Tag>
  );
}

// Language filter chips — substring-matched against the helper's
// free-text `languages` field (e.g. "English, Thai, Russian").
const LANGUAGE_OPTIONS = [
  { value: 'english', label: 'English', flag: '🇬🇧' },
  { value: 'thai',    label: 'ไทย',     flag: '🇹🇭' },
  { value: 'russian', label: 'Русский', flag: '🇷🇺' },
  { value: 'chinese', label: '中文',     flag: '🇨🇳' },
  { value: 'german',  label: 'Deutsch', flag: '🇩🇪' },
];

const AGE_OPTIONS = [
  { value: '18-25', label: '18–25' },
  { value: '25-35', label: '25–35' },
  { value: '35-45', label: '35–45' },
  { value: '45-55', label: '45–55' },
  { value: '55+',   label: '55+' },
];

const EXP_OPTIONS = [
  { value: '1',  label: '1+' },
  { value: '3',  label: '3+' },
  { value: '5',  label: '5+' },
  { value: '10', label: '10+' },
];

function BrowseTab({
  t, loading, helpers, totalCount,
  filterCity, setFilterCity, filterCat, setFilterCat,
  filterArea, setFilterArea,
  filterAgeRange, setFilterAgeRange,
  filterMinExp, setFilterMinExp,
  filterLanguages, toggleLanguage,
  sortBy, setSortBy,
  activeFilterCount, onResetFilters,
  onMessageHelper, startingConv,
  mobileFiltersOpen, setMobileFiltersOpen,
  favorites, onToggleFavorite,
  onViewProfile,
}) {
  const sidebar = (
    <FilterSidebar
      t={t}
      filterCity={filterCity}
      setFilterCity={setFilterCity}
      filterCat={filterCat}
      setFilterCat={setFilterCat}
      filterArea={filterArea}
      setFilterArea={setFilterArea}
      filterAgeRange={filterAgeRange}
      setFilterAgeRange={setFilterAgeRange}
      filterMinExp={filterMinExp}
      setFilterMinExp={setFilterMinExp}
      filterLanguages={filterLanguages}
      toggleLanguage={toggleLanguage}
      activeFilterCount={activeFilterCount}
      onResetFilters={onResetFilters}
    />
  );

  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
      {/* Desktop sidebar — sticky so it stays visible while scrolling cards */}
      <aside
        className="browse-sidebar-desktop"
        style={{
          width: '280px',
          flexShrink: 0,
          position: 'sticky',
          top: '80px',
        }}
      >
        {sidebar}
      </aside>

      {/* Main results */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Mobile filter button + results count + sort */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '12px', marginBottom: '14px', flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: '14px', color: '#666' }}>
            <strong style={{ color: '#1a1a1a', fontSize: '15px' }}>{totalCount}</strong>{' '}
            {t.results}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Sort dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M7 12h10M11 18h2" />
              </svg>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                aria-label={t.sort_label || 'Sort by'}
                style={{
                  padding: '7px 10px 7px 10px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  background: 'white',
                  fontSize: '13px',
                  color: '#374151',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <option value="newest">{t.sort_newest || 'Newest'}</option>
                <option value="experience">{t.sort_experience || 'Most experience'}</option>
                <option value="alphabetical">{t.sort_alphabetical || 'A–Z'}</option>
                <option value="youngest">{t.sort_youngest || 'Youngest first'}</option>
                <option value="oldest">{t.sort_oldest || 'Oldest first'}</option>
              </select>
            </div>

          <button
            className="browse-sidebar-mobile-btn"
            onClick={() => setMobileFiltersOpen(true)}
            style={{
              display: 'none', // shown via CSS below on small screens
              alignItems: 'center', gap: '8px',
              padding: '9px 16px', borderRadius: '10px',
              border: '1px solid #006a62', background: 'white',
              color: '#006a62', fontSize: '14px', fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
            {t.filter_show_filters || 'Filters'}
            {activeFilterCount > 0 && (
              <span style={{
                background: '#006a62', color: 'white',
                borderRadius: '999px', padding: '1px 8px',
                fontSize: '12px', fontWeight: 800,
              }}>
                {activeFilterCount}
              </span>
            )}
          </button>
          </div>
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
            <p style={{ fontSize: '15px', color: '#666' }}>{t.no_helpers_sub}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {helpers.map(h => {
              const isStarting = startingConv === h.ref;
              return (
                <HelperCard
                  key={h.ref}
                  helper={{ ...h, categoryLabel: categoryWithEmoji(h.category) }}
                  t={{ card_exp: t.card_yrs, card_verified: 'Verified', fav_add: t.fav_add, fav_remove: t.fav_remove }}
                  isFavorite={favorites?.has(h.ref)}
                  onToggleFavorite={onToggleFavorite}
                  onViewProfile={onViewProfile}
                  ctaSlot={
                    <button
                      onClick={(e) => { e.stopPropagation(); onMessageHelper(h.ref); }}
                      disabled={isStarting}
                      className="w-full px-5 py-2.5 rounded-lg bg-[#006a62] text-white text-sm font-bold hover:bg-[#004d47] transition-colors disabled:opacity-60 disabled:cursor-wait"
                    >
                      💬 {isStarting ? t.card_messaging : t.card_message}
                    </button>
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile filter sheet */}
      {mobileFiltersOpen && (
        <div
          onClick={() => setMobileFiltersOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 900,
            background: 'rgba(15,23,42,0.5)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white',
              width: '100%',
              maxWidth: '480px',
              maxHeight: '85vh',
              borderRadius: '20px 20px 0 0',
              padding: '20px',
              overflowY: 'auto',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '16px',
            }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>
                {t.filter_title || 'Filters'}
              </h3>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                style={{
                  background: '#f3f4f6', border: 'none',
                  width: '32px', height: '32px', borderRadius: '50%',
                  cursor: 'pointer', fontSize: '16px', color: '#666',
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            {sidebar}
            <button
              onClick={() => setMobileFiltersOpen(false)}
              style={{
                width: '100%', marginTop: '16px',
                padding: '13px 20px', borderRadius: '12px', border: 'none',
                background: '#006a62', color: 'white',
                fontSize: '15px', fontWeight: 700, cursor: 'pointer',
              }}
            >
              {t.filter_show_results?.replace('{n}', totalCount) || `Show ${totalCount} results`}
            </button>
          </div>
        </div>
      )}

      {/* Responsive toggle: hide sidebar on small screens, show mobile button */}
      <style jsx>{`
        @media (max-width: 900px) {
          :global(.browse-sidebar-desktop) { display: none !important; }
          :global(.browse-sidebar-mobile-btn) { display: inline-flex !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Filter sidebar ─────────────────────────────────────────────────────
function FilterSidebar({
  t,
  filterCity, setFilterCity,
  filterCat, setFilterCat,
  filterArea, setFilterArea,
  filterAgeRange, setFilterAgeRange,
  filterMinExp, setFilterMinExp,
  filterLanguages, toggleLanguage,
  activeFilterCount, onResetFilters,
}) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      border: '1px solid #e5e7eb',
      padding: '18px 18px 8px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '18px', paddingBottom: '14px',
        borderBottom: '1px solid #f3f4f6',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#006a62" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#1a1a1a' }}>
            {t.filter_title || 'Filters'}
          </h3>
          {activeFilterCount > 0 && (
            <span style={{
              background: '#006a62', color: 'white',
              borderRadius: '999px', padding: '1px 8px',
              fontSize: '11px', fontWeight: 800,
            }}>
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={onResetFilters}
            style={{
              background: 'none', border: 'none',
              color: '#006a62', fontSize: '12px', fontWeight: 700,
              cursor: 'pointer', padding: 0,
              textDecoration: 'underline',
            }}
          >
            {t.filter_reset}
          </button>
        )}
      </div>

      {/* Category */}
      <FilterGroup label={t.filter_cat_label || 'Category'}>
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          style={filterSelectStyle}
        >
          <option value="">{t.filter_cat}</option>
          {CATEGORIES.filter(c => c.value !== 'multiple').map(c => (
            <option key={c.value} value={c.value}>{c.en}</option>
          ))}
        </select>
      </FilterGroup>

      {/* City */}
      <FilterGroup label={t.filter_city_label || 'City'}>
        <select
          value={filterCity}
          onChange={e => setFilterCity(e.target.value)}
          style={filterSelectStyle}
        >
          <option value="">{t.filter_city}</option>
          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </FilterGroup>

      {/* Area */}
      <FilterGroup label={t.filter_area_label || 'Area'}>
        <input
          type="text"
          value={filterArea}
          onChange={e => setFilterArea(e.target.value)}
          placeholder={t.filter_area_ph}
          style={filterInputStyle}
        />
      </FilterGroup>

      {/* Age range */}
      <FilterGroup label={t.filter_age_label || 'Age'}>
        <div style={chipRowStyle}>
          {AGE_OPTIONS.map(opt => (
            <ChipButton
              key={opt.value}
              active={filterAgeRange === opt.value}
              onClick={() => setFilterAgeRange(filterAgeRange === opt.value ? '' : opt.value)}
            >
              {opt.label}
            </ChipButton>
          ))}
        </div>
      </FilterGroup>

      {/* Experience */}
      <FilterGroup label={t.filter_exp_label || 'Experience (years)'}>
        <div style={chipRowStyle}>
          {EXP_OPTIONS.map(opt => (
            <ChipButton
              key={opt.value}
              active={filterMinExp === opt.value}
              onClick={() => setFilterMinExp(filterMinExp === opt.value ? '' : opt.value)}
            >
              {opt.label}
            </ChipButton>
          ))}
        </div>
      </FilterGroup>

      {/* Languages */}
      <FilterGroup label={t.filter_lang_label || 'Languages'}>
        <div style={chipRowStyle}>
          {LANGUAGE_OPTIONS.map(opt => (
            <ChipButton
              key={opt.value}
              active={filterLanguages.includes(opt.value)}
              onClick={() => toggleLanguage(opt.value)}
            >
              <span style={{ marginRight: '4px' }}>{opt.flag}</span>
              {opt.label}
            </ChipButton>
          ))}
        </div>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ label, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        fontSize: '11px', fontWeight: 800, color: '#9ca3af',
        textTransform: 'uppercase', letterSpacing: '0.5px',
        marginBottom: '8px',
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function ChipButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '6px 12px',
        borderRadius: '999px',
        border: `1px solid ${active ? '#006a62' : '#e5e7eb'}`,
        background: active ? '#006a62' : 'white',
        color: active ? 'white' : '#374151',
        fontSize: '13px', fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

const filterSelectStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1px solid #e5e7eb',
  fontSize: '14px',
  background: 'white',
  color: '#1a1a1a',
  cursor: 'pointer',
};

const filterInputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1px solid #e5e7eb',
  fontSize: '14px',
  background: 'white',
  color: '#1a1a1a',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const chipRowStyle = {
  display: 'flex', flexWrap: 'wrap', gap: '6px',
};

// ─── FavoritesTab ────────────────────────────────────────────────────────
// Shows only the helpers the employer has favorited. Same card layout and
// "Message" CTA as BrowseTab, plus the heart is always filled here.
function FavoritesTab({ t, helpers, loading, favorites, onToggleFavorite, onMessageHelper, startingConv, onViewProfile }) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
        {t.loading}
      </div>
    );
  }
  if (helpers.length === 0) {
    return (
      <div style={{
        background: 'white', borderRadius: '16px',
        padding: '48px 32px', border: '1px solid #e5e7eb',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '44px', marginBottom: '12px', color: '#e11d48' }}>♡</div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
          {t.fav_empty_title}
        </h3>
        <p style={{ fontSize: '15px', color: '#666' }}>{t.fav_empty_sub}</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {helpers.map(h => {
        const isStarting = startingConv === h.ref;
        return (
          <HelperCard
            key={h.ref}
            helper={{ ...h, categoryLabel: categoryWithEmoji(h.category) }}
            t={{ card_exp: t.card_yrs, card_verified: 'Verified', fav_add: t.fav_add, fav_remove: t.fav_remove }}
            isFavorite={favorites?.has(h.ref)}
            onToggleFavorite={onToggleFavorite}
            onViewProfile={onViewProfile}
            ctaSlot={
              <button
                onClick={(e) => { e.stopPropagation(); onMessageHelper(h.ref); }}
                disabled={isStarting}
                className="w-full px-5 py-2.5 rounded-lg bg-[#006a62] text-white text-sm font-bold hover:bg-[#004d47] transition-colors disabled:opacity-60 disabled:cursor-wait"
              >
                💬 {isStarting ? t.card_messaging : t.card_message}
              </button>
            }
          />
        );
      })}
    </div>
  );
}

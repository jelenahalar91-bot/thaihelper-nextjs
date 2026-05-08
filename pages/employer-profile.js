/**
 * Employer Profile + Settings page.
 *
 * Mirrors the helper-side profile page in spirit:
 *  - Header card with photo + name + ref
 *  - "Personal Information" section
 *  - "Where you need help" section (location)
 *  - "What you're looking for" section (preferences + job description)
 *  - "Settings" section (preferred language + logout)
 *
 * Photo upload uses the same flow as helper photos but goes through
 * /api/employer-photo so the employer auth cookie is checked.
 *
 * Auth: redirects to /login on 401.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useLang } from './_app';
import LangSwitcher from '@/components/LangSwitcher';
import EmployerProfileMenu from '@/components/EmployerProfileMenu';
import PushNotificationToggle from '@/components/PushNotificationToggle';
import PushNotificationBanner from '@/components/PushNotificationBanner';
import {
  fetchEmployerProfile,
  updateEmployerProfile,
  uploadEmployerPhoto,
} from '@/lib/api/employer-auth-client';
import { CITIES } from '@/lib/constants/cities';
import { SKILLS_BY_CATEGORY } from '@/lib/constants/categories';
import { SCHEDULE_DAYS, SCHEDULE_TIMES, DURATIONS, CHILD_AGE_GROUPS } from '@/lib/constants/employer';

const LOOKING_FOR_OPTIONS = [
  { value: 'nanny',       iconKey: 'baby',   en: 'Nanny & Babysitter',    th: 'พี่เลี้ยงเด็ก' },
  { value: 'housekeeper', iconKey: 'home',   en: 'Housekeeper & Cleaner', th: 'แม่บ้าน / ทำความสะอาด' },
  { value: 'chef',        iconKey: 'chef',   en: 'Private Chef & Cook',   th: 'พ่อครัว / แม่ครัว' },
  { value: 'driver',      iconKey: 'car',    en: 'Driver & Chauffeur',    th: 'คนขับรถ' },
  { value: 'gardener',    iconKey: 'leaf',   en: 'Gardener & Pool Care',  th: 'ดูแลสวน / สระน้ำ' },
  { value: 'elder_care',  iconKey: 'heart',  en: 'Elder Care',            th: 'ดูแลผู้สูงอายุ' },
  { value: 'tutor',       iconKey: 'book',   en: 'Tutor & Teacher',       th: 'ติวเตอร์' },
];

const AGE_RANGES = ['any', '20-30', '30-40', '40-50', '50+'];

const T = {
  en: {
    page_title: 'Profile – ThaiHelper',
    loading: 'Loading...',
    back: '← Dashboard',
    saved: 'Profile updated.',
    photo_uploading: 'Uploading...',
    photo_change: 'Change photo',
    photo_add: 'Add photo',
    photo_hint: 'JPG, PNG or WEBP · max 5 MB',
    photo_err_size: 'Photo must be smaller than 5 MB.',
    photo_err_type: 'Only JPG, PNG and WEBP allowed.',
    section_personal: 'Personal Information',
    section_location: 'Where you need help',
    section_preferences: 'What you\'re looking for',
    section_job: 'Job description',
    section_settings: 'Settings',
    section_notifications: 'Email notifications',
    notify_label: 'Email me when I receive a new message',
    notify_hint: 'We\'ll send a short email with the sender\'s name and a preview. You can unsubscribe from every email with one click.',
    label_first: 'First name',
    label_last: 'Last name',
    label_email: 'Email',
    email_locked: 'Cannot be changed',
    label_phone: 'Phone',
    label_city: 'City',
    label_area: 'Area / neighbourhood',
    label_arrangement: 'Arrangement',
    arr_live_in: 'Live-in',
    arr_live_out: 'Live-out',
    arr_either: 'Either is fine',
    arr_unset: 'No preference',
    label_age_pref: 'Preferred helper age',
    age_any: 'Any age',
    label_looking_for: 'Helper types',
    looking_hint: 'Select all categories you\'re open to',
    label_tasks: 'Specific tasks',
    tasks_hint: 'Tap the duties you actually need help with.',
    label_schedule_days: 'Days needed',
    label_schedule_time: 'Time of day',
    label_duration: 'How long',
    label_child_ages: 'Children\u2019s ages',
    label_job_desc: 'About the job (optional)',
    job_hint: 'Phone numbers and emails will be hidden automatically.',
    save: 'Save changes',
    saving: 'Saving...',
    logout: 'Log out',
    ref_label: 'Your reference',
    member_since: 'Member since',
  },
  th: {
    page_title: 'โปรไฟล์ – ThaiHelper',
    loading: 'กำลังโหลด...',
    back: '← แดชบอร์ด',
    saved: 'อัปเดตโปรไฟล์เรียบร้อย',
    photo_uploading: 'กำลังอัปโหลด...',
    photo_change: 'เปลี่ยนรูป',
    photo_add: 'เพิ่มรูป',
    photo_hint: 'JPG, PNG หรือ WEBP · สูงสุด 5 MB',
    photo_err_size: 'รูปภาพต้องเล็กกว่า 5 MB',
    photo_err_type: 'อนุญาตเฉพาะ JPG, PNG และ WEBP',
    section_personal: 'ข้อมูลส่วนตัว',
    section_location: 'พื้นที่ที่คุณต้องการความช่วยเหลือ',
    section_preferences: 'สิ่งที่คุณกำลังมองหา',
    section_job: 'รายละเอียดงาน',
    section_settings: 'การตั้งค่า',
    section_notifications: 'การแจ้งเตือนทางอีเมล',
    notify_label: 'ส่งอีเมลหาฉันเมื่อได้รับข้อความใหม่',
    notify_hint: 'เราจะส่งอีเมลสั้นๆ พร้อมชื่อผู้ส่งและตัวอย่างข้อความ คุณสามารถยกเลิกการสมัครได้ด้วยคลิกเดียวในทุกอีเมล',
    label_first: 'ชื่อ',
    label_last: 'นามสกุล',
    label_email: 'อีเมล',
    email_locked: 'ไม่สามารถเปลี่ยนได้',
    label_phone: 'โทรศัพท์',
    label_city: 'จังหวัด',
    label_area: 'ย่าน',
    label_arrangement: 'รูปแบบการจ้าง',
    arr_live_in: 'อยู่ประจำ',
    arr_live_out: 'มาเช้าเย็นกลับ',
    arr_either: 'ทั้งสองแบบก็ได้',
    arr_unset: 'ไม่ระบุ',
    label_age_pref: 'อายุของผู้ช่วยที่ต้องการ',
    age_any: 'ทุกช่วงอายุ',
    label_looking_for: 'ประเภทผู้ช่วย',
    looking_hint: 'เลือกทุกประเภทที่คุณสนใจ',
    label_tasks: 'งานที่ต้องการ',
    tasks_hint: 'แตะหน้าที่ที่คุณต้องการความช่วยเหลือจริงๆ',
    label_schedule_days: 'วันที่ต้องการ',
    label_schedule_time: 'ช่วงเวลา',
    label_duration: 'ระยะเวลา',
    label_child_ages: 'ช่วงอายุของเด็ก',
    label_job_desc: 'เกี่ยวกับงาน (ถ้ามี)',
    job_hint: 'หมายเลขโทรศัพท์และอีเมลจะถูกซ่อนอัตโนมัติ',
    save: 'บันทึก',
    saving: 'กำลังบันทึก...',
    logout: 'ออกจากระบบ',
    ref_label: 'หมายเลขอ้างอิง',
    member_since: 'สมาชิกตั้งแต่',
  },
};

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Map a "looking_for" string from the DB back into an array of slugs
function lookingForToArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

export default function EmployerProfile() {
  const router = useRouter();
  const { lang, setLang } = useLang();
  const t = T[lang] || T.en;

  const [profile, setProfile] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  // Mount: load profile
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetchEmployerProfile();
      if (!res || !res.success) {
        router.replace('/login');
        return;
      }
      if (cancelled) return;
      const p = res.profile;
      setProfile(p);
      setPhotoUrl(p.photo_url || '');
      setForm({
        first_name: p.first_name || '',
        last_name: p.last_name || '',
        phone: p.phone || '',
        city: p.city || '',
        area: p.area || '',
        arrangement_preference: p.arrangement_preference || '',
        preferred_age_range: p.preferred_age_range || '',
        looking_for: lookingForToArray(p.looking_for),
        needed_skills: lookingForToArray(p.needed_skills),
        schedule_days: lookingForToArray(p.schedule_days),
        schedule_time: lookingForToArray(p.schedule_time),
        duration: p.duration || '',
        child_age_groups: lookingForToArray(p.child_age_groups),
        job_description: p.job_description || '',
        preferred_language: p.preferred_language || 'en',
        notify_on_message: p.notify_on_message !== false,
      });
      setAuthChecked(true);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-clear toast
  useEffect(() => {
    if (!savedMsg) return;
    const id = setTimeout(() => setSavedMsg(''), 3000);
    return () => clearTimeout(id);
  }, [savedMsg]);

  // Scroll to hash anchor (#settings) after the form is loaded.
  // Menu items like "Settings" navigate with a hash, but Next.js doesn't
  // scroll automatically when the anchor is behind a loading spinner.
  // Scroll to hash after form loads, and also when the hash changes
  // via in-page navigation (e.g. clicking "Settings" in the menu while
  // already on this page).
  useEffect(() => {
    if (!form) return;
    if (typeof window === 'undefined') return;

    const scrollToHash = () => {
      const hash = window.location.hash?.slice(1);
      if (!hash) return;
      const el = document.getElementById(hash);
      if (!el) return;
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    };

    scrollToHash();
    window.addEventListener('hashchange', scrollToHash);
    return () => window.removeEventListener('hashchange', scrollToHash);
  }, [form]);

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function toggleLookingFor(slug) {
    setForm(prev => {
      const set = new Set(prev.looking_for);
      if (set.has(slug)) set.delete(slug);
      else set.add(slug);
      const nextLooking = Array.from(set);
      // Drop skills no longer covered by any selected category — same logic
      // as on registration. Otherwise legacy slugs persist invisibly.
      const allowed = new Set(nextLooking.flatMap(c => (SKILLS_BY_CATEGORY[c] || []).map(s => s.value)));
      const nextSkills = (prev.needed_skills || []).filter(s => allowed.has(s));
      return { ...prev, looking_for: nextLooking, needed_skills: nextSkills };
    });
  }

  function toggleField(field, slug) {
    setForm(prev => {
      const set = new Set(prev[field] || []);
      if (set.has(slug)) set.delete(slug);
      else set.add(slug);
      return { ...prev, [field]: Array.from(set) };
    });
  }

  // Skills shown — union of every selected category's skills, deduped.
  const skillOptions = (() => {
    const seen = new Set();
    const out = [];
    for (const cat of (form?.looking_for || [])) {
      for (const s of (SKILLS_BY_CATEGORY[cat] || [])) {
        if (!seen.has(s.value)) { seen.add(s.value); out.push(s); }
      }
    }
    return out;
  })();
  const showChildAges = (form?.looking_for || []).some(c => c === 'nanny' || c === 'tutor');

  async function handleSave() {
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await updateEmployerProfile({
        ...form,
        // Send empty arrangement as null so the CHECK constraint accepts it
        arrangement_preference: form.arrangement_preference || null,
        preferred_age_range: form.preferred_age_range || null,
      });
      if (res?.success) {
        setSavedMsg(t.saved);
      } else {
        setErrorMsg('Save failed');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Save failed');
    }
    setSaving(false);
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');

    if (file.size > MAX_PHOTO_BYTES) {
      setErrorMsg(t.photo_err_size);
      return;
    }
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setErrorMsg(t.photo_err_type);
      return;
    }

    setUploadingPhoto(true);
    const res = await uploadEmployerPhoto(file);
    setUploadingPhoto(false);
    if (res.success) {
      setPhotoUrl(res.url);
      setSavedMsg(t.saved);
    } else {
      setErrorMsg(res.error || 'Upload failed');
    }
    // Reset the input so selecting the same file again still triggers onChange
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const initial = useMemo(
    () => (form?.first_name || profile?.first_name || '?')[0]?.toUpperCase() || '?',
    [form, profile]
  );

  if (!authChecked) {
    return (
      <div style={{
        minHeight: '60vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: '#999',
      }}>
        {t.loading}
      </div>
    );
  }

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
            <button
              onClick={() => router.push('/employer-dashboard')}
              className="text-xl md:text-2xl font-bold"
            >
              Thai<span style={{color:'#006a62'}}>Helper</span>
            </button>

            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={() => router.push('/employer-dashboard')}
                className="hidden sm:inline text-sm font-semibold text-gray-700 hover:text-[#006a62] transition-colors"
              >
                {t.back}
              </button>
              <LangSwitcher languages={['en', 'th']} />
              <EmployerProfileMenu
                profile={{ ...profile, photo_url: photoUrl }}
                lang={lang}
                current="profile"
              />
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10">
          {/* Toast banners */}
          {savedMsg && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold text-center">
              {savedMsg}
            </div>
          )}
          {errorMsg && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between gap-3">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg('')} className="text-red-700 text-lg leading-none">×</button>
            </div>
          )}

          {/* Push notifications opt-in — top of the page, self-hides once
              the user has decided (granted / denied / "Later"). */}
          <PushNotificationBanner lang={lang} />

          {/* ── Header card with photo ───────────────── */}
          <section className="bg-white rounded-2xl border border-gray-200 p-5 md:p-7 mb-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-[#e6f5f3] border-4 border-[#006a62] flex items-center justify-center">
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoUrl}
                      alt={form.first_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-[#006a62]">{initial}</span>
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 px-3 py-1.5 rounded-full bg-[#006a62] text-white text-[11px] font-bold cursor-pointer shadow-lg hover:bg-[#004d47] transition-colors whitespace-nowrap">
                  {uploadingPhoto ? t.photo_uploading : (photoUrl ? t.photo_change : t.photo_add)}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    disabled={uploadingPhoto}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Name + meta */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {form.first_name} {form.last_name}
                </h1>
                <div className="text-sm text-gray-500 mt-1">
                  {profile.email}
                </div>
                <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2 text-sm">
                  <span className="px-2.5 py-1 rounded-md bg-[#e6f5f3] text-[#006a62] font-bold">
                    {t.ref_label}: {profile.employer_ref}
                  </span>
                  {profile.created_at && (
                    <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600">
                      {t.member_since} {new Date(profile.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-400 mt-2">{t.photo_hint}</div>
              </div>
            </div>
          </section>

          {/* ── Personal information ─────────────────── */}
          <Section title={t.section_personal}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t.label_first}>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={e => update('first_name', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label={t.label_last}>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={e => update('last_name', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label={t.label_email} hint={t.email_locked}>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className={`${inputClass} bg-gray-100 text-gray-500 cursor-not-allowed`}
                />
              </Field>
              <Field label={t.label_phone}>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => update('phone', e.target.value)}
                  placeholder="+66 …"
                  className={inputClass}
                />
              </Field>
            </div>
          </Section>

          {/* ── Location ─────────────────────────────── */}
          <Section title={t.section_location}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t.label_city}>
                <select
                  value={form.city}
                  onChange={e => update('city', e.target.value)}
                  className={inputClass}
                >
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label={t.label_area}>
                <input
                  type="text"
                  value={form.area}
                  onChange={e => update('area', e.target.value)}
                  placeholder="e.g. Sukhumvit, Rawai…"
                  className={inputClass}
                />
              </Field>
            </div>
          </Section>

          {/* ── Preferences ──────────────────────────── */}
          <Section title={t.section_preferences}>
            {/* Looking for chips */}
            <div className="mb-5">
              <Label>{t.label_looking_for}</Label>
              <div className="text-sm text-gray-500 mb-3">{t.looking_hint}</div>
              <div className="flex flex-wrap gap-2">
                {LOOKING_FOR_OPTIONS.map(opt => {
                  const active = form.looking_for.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleLookingFor(opt.value)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                        active
                          ? 'bg-[#006a62] text-white border-[#006a62] shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-[#006a62] hover:bg-[#e6f5f3]'
                      }`}
                    >
                      <LineIcon name={opt.iconKey} />
                      {opt[lang] || opt.en}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Specific tasks — appears once at least one category is picked */}
            {skillOptions.length > 0 && (
              <div className="mb-5">
                <Label>{t.label_tasks}</Label>
                <div className="text-sm text-gray-500 mb-3">{t.tasks_hint}</div>
                <ProfileChipRow
                  options={skillOptions}
                  selected={form.needed_skills}
                  onToggle={(v) => toggleField('needed_skills', v)}
                  lang={lang}
                />
              </div>
            )}

            {/* Children's age groups — only when childcare is selected */}
            {showChildAges && (
              <div className="mb-5">
                <Label>{t.label_child_ages}</Label>
                <ProfileChipRow
                  options={CHILD_AGE_GROUPS}
                  selected={form.child_age_groups}
                  onToggle={(v) => toggleField('child_age_groups', v)}
                  lang={lang}
                />
              </div>
            )}

            {/* Schedule — days */}
            <div className="mb-5">
              <Label>{t.label_schedule_days}</Label>
              <ProfileChipRow
                options={SCHEDULE_DAYS}
                selected={form.schedule_days}
                onToggle={(v) => toggleField('schedule_days', v)}
                lang={lang}
              />
            </div>

            {/* Schedule — time of day */}
            <div className="mb-5">
              <Label>{t.label_schedule_time}</Label>
              <ProfileChipRow
                options={SCHEDULE_TIMES}
                selected={form.schedule_time}
                onToggle={(v) => toggleField('schedule_time', v)}
                lang={lang}
              />
            </div>

            {/* Duration — single-select */}
            <div className="mb-5">
              <Label>{t.label_duration}</Label>
              <ProfileChipRow
                options={DURATIONS}
                selected={form.duration}
                onToggle={(v) => update('duration', form.duration === v ? '' : v)}
                lang={lang}
                single
              />
            </div>

            {/* Arrangement */}
            <div className="mb-5">
              <Label>{t.label_arrangement}</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                {[
                  { v: '',         iconKey: 'dots',    label: t.arr_unset },
                  { v: 'live_in',  iconKey: 'bed',     label: t.arr_live_in },
                  { v: 'live_out', iconKey: 'walk',    label: t.arr_live_out },
                  { v: 'either',   iconKey: 'check',   label: t.arr_either },
                ].map(opt => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => update('arrangement_preference', opt.v)}
                    className={`inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      form.arrangement_preference === opt.v
                        ? 'bg-[#006a62] text-white border-[#006a62] shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-[#006a62] hover:bg-[#e6f5f3]'
                    }`}
                  >
                    <LineIcon name={opt.iconKey} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Age range */}
            <Field label={t.label_age_pref}>
              <select
                value={form.preferred_age_range}
                onChange={e => update('preferred_age_range', e.target.value)}
                className={inputClass}
              >
                {AGE_RANGES.map(r => (
                  <option key={r} value={r === 'any' ? '' : r}>
                    {r === 'any' ? t.age_any : `${r} years`}
                  </option>
                ))}
              </select>
            </Field>
          </Section>

          {/* ── Job description ──────────────────────── */}
          <Section title={t.section_job}>
            <Field label={t.label_job_desc} hint={t.job_hint}>
              <textarea
                value={form.job_description}
                onChange={e => update('job_description', e.target.value)}
                rows={5}
                className={`${inputClass} resize-y font-sans`}
              />
            </Field>
          </Section>

          {/* ── Email notifications ──────────────────── */}
          <Section id="notifications" title={t.section_notifications}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.notify_on_message !== false}
                onChange={e => update('notify_on_message', e.target.checked)}
                className="mt-1 w-5 h-5 accent-[#006a62] cursor-pointer"
              />
              <span>
                <span className="block text-sm font-semibold text-gray-900">
                  {t.notify_label}
                </span>
                <span className="block text-xs text-gray-500 mt-1 leading-relaxed">
                  {t.notify_hint}
                </span>
              </span>
            </label>

            {/* Push notifications (separate from email, per-device opt-in) */}
            <div className="mt-4">
              <PushNotificationToggle lang={lang} />
            </div>
          </Section>


          {/* Save button */}
          <div className="mt-2 mb-12 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-7 py-3 rounded-xl bg-[#006a62] text-white text-sm font-bold cursor-pointer hover:bg-[#004d47] transition-colors disabled:opacity-60 disabled:cursor-wait"
            >
              {saving ? t.saving : t.save}
            </button>
          </div>
        </main>
      </div>
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#006a62]/30 focus:border-[#006a62] transition-colors';

function Section({ title, children, id }) {
  return (
    <section
      id={id}
      className="bg-white rounded-2xl border border-gray-200 p-5 md:p-7 mb-4 scroll-mt-24"
    >
      <h2 className="text-base md:text-lg font-bold text-gray-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}

// Clean stroke-SVG icons used in pills / pref selectors.
// Kept inline so there's no new dependency and no emoji clutter.
const LINE_ICON_PROPS = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function LineIcon({ name }) {
  switch (name) {
    case 'baby':
      return (
        <svg {...LINE_ICON_PROPS}>
          <circle cx="12" cy="8" r="4" />
          <path d="M9 10c.5 1 1.5 1.5 3 1.5S14.5 11 15 10" />
          <path d="M5 21v-1a7 7 0 0 1 14 0v1" />
        </svg>
      );
    case 'home':
      return (
        <svg {...LINE_ICON_PROPS}>
          <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />
        </svg>
      );
    case 'chef':
      return (
        <svg {...LINE_ICON_PROPS}>
          <path d="M6 14a4 4 0 1 1 2.4-7.2A4 4 0 0 1 15.6 6.8 4 4 0 1 1 18 14" />
          <path d="M6 14v5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-5" />
          <path d="M9 20v-6M15 20v-6" />
        </svg>
      );
    case 'car':
      return (
        <svg {...LINE_ICON_PROPS}>
          <path d="M5 17h14M5 17v2M19 17v2" />
          <path d="M6 17l1.5-5.5A2 2 0 0 1 9.5 10h5a2 2 0 0 1 2 1.5L18 17" />
          <circle cx="8" cy="17" r="1.2" />
          <circle cx="16" cy="17" r="1.2" />
        </svg>
      );
    case 'leaf':
      return (
        <svg {...LINE_ICON_PROPS}>
          <path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 16-9 0 8-3 16-9 16Z" />
          <path d="M4 20c5-5 8-7 12-9" />
        </svg>
      );
    case 'heart':
      return (
        <svg {...LINE_ICON_PROPS}>
          <path d="M20.8 6.6a5 5 0 0 0-8.8-2 5 5 0 0 0-8.8 2A5.4 5.4 0 0 0 4.6 12l7.4 8 7.4-8a5.4 5.4 0 0 0 1.4-5.4z" />
        </svg>
      );
    case 'book':
      return (
        <svg {...LINE_ICON_PROPS}>
          <path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z" />
          <path d="M4 19a2 2 0 0 1 2-2h12" />
        </svg>
      );
    case 'dots':
      return (
        <svg {...LINE_ICON_PROPS}>
          <circle cx="6" cy="12" r="1.4" />
          <circle cx="12" cy="12" r="1.4" />
          <circle cx="18" cy="12" r="1.4" />
        </svg>
      );
    case 'bed':
      return (
        <svg {...LINE_ICON_PROPS}>
          <path d="M3 18V8M3 14h18v4M21 18v-4a3 3 0 0 0-3-3h-7v3" />
          <circle cx="7" cy="12" r="1.5" />
        </svg>
      );
    case 'walk':
      return (
        <svg {...LINE_ICON_PROPS}>
          <circle cx="13" cy="4" r="1.6" />
          <path d="M9 21l2-6 2 2 2 5" />
          <path d="M8 11l3-3 3 2 3 1" />
        </svg>
      );
    case 'check':
      return (
        <svg {...LINE_ICON_PROPS}>
          <polyline points="5 12 10 17 19 7" />
        </svg>
      );
    default:
      return null;
  }
}

function Label({ children }) {
  return (
    <label className="block text-sm font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
      {children}
    </label>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {hint && <div className="text-sm text-gray-500 mt-1.5">{hint}</div>}
    </div>
  );
}

// Chip row used for the new task/schedule/duration sections. `single` makes
// it a radio-style selector (compares scalar value), otherwise it's a
// multi-select that compares against an array.
function ProfileChipRow({ options, selected, onToggle, lang, single = false }) {
  const isOn = (v) => single ? selected === v : (Array.isArray(selected) && selected.includes(v));
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const on = isOn(opt.value);
        const label = opt[lang] || opt.en || opt.label;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onToggle(opt.value)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
              on
                ? 'bg-[#006a62] text-white border-[#006a62] shadow-sm'
                : 'bg-white text-gray-700 border-gray-200 hover:border-[#006a62] hover:bg-[#e6f5f3]'
            }`}
          >
            {on ? '\u2713 ' : ''}{label}
          </button>
        );
      })}
    </div>
  );
}

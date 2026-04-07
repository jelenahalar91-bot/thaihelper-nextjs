import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { employerSignup } from '@/lib/api/employer-auth-client';
import { CITIES } from '@/lib/constants/cities';
import LangSwitcher from '@/components/LangSwitcher';

// Plain category labels for the multi-select (no emojis — we'll show clean chips)
const LOOKING_FOR_OPTIONS = [
  { value: 'nanny',       en: 'Nanny & Babysitter',    th: 'พี่เลี้ยงเด็ก' },
  { value: 'housekeeper', en: 'Housekeeper & Cleaner', th: 'แม่บ้าน / ทำความสะอาด' },
  { value: 'chef',        en: 'Private Chef & Cook',   th: 'พ่อครัว / แม่ครัว' },
  { value: 'driver',      en: 'Driver & Chauffeur',    th: 'คนขับรถ' },
  { value: 'gardener',    en: 'Gardener & Pool Care',  th: 'ดูแลสวน / สระน้ำ' },
  { value: 'elder_care',  en: 'Elder Care',            th: 'ดูแลผู้สูงอายุ' },
  { value: 'tutor',       en: 'Tutor & Teacher',       th: 'ติวเตอร์' },
];

const T = {
  en: {
    page_title: 'Register as an Employer – ThaiHelper',
    h1: 'Find your perfect helper',
    sub: 'Create a free account to browse helpers and message them directly.',
    promo_badge: '🎉 Free for the first 4 weeks',
    promo_text: 'Sign up now and get full messaging access for 28 days — no credit card required.',
    section_preferences: 'Your preferences',
    arrangement_label: 'Arrangement',
    arrangement_hint: 'Do you need someone to live with you or come daily?',
    arr_live_in: 'Live-in',
    arr_live_in_desc: 'Helper lives at your place',
    arr_live_out: 'Live-out',
    arr_live_out_desc: 'Comes daily, goes home',
    arr_either: 'Either is fine',
    arr_either_desc: 'No strong preference',
    age_pref_label: 'Preferred helper age (optional)',
    age_any: 'Any age',
    age_20_30: '20 – 30 years',
    age_30_40: '30 – 40 years',
    age_40_50: '40 – 50 years',
    age_50_plus: '50+ years',
    section_about: 'About you',
    fname_label: 'First Name',
    fname_ph: 'e.g. Sarah',
    lname_label: 'Last Name',
    lname_ph: 'e.g. Miller',
    email_label: 'Email Address',
    email_ph: 'you@example.com',
    email_hint: 'Used for login and notifications',
    phone_label: 'Phone (optional)',
    phone_ph: '+66 …',
    section_location: 'Where you need help',
    city_label: 'City',
    city_ph: '— Select city —',
    area_label: 'Neighborhood / Area (optional)',
    area_ph: 'e.g. Sukhumvit, Rawai, Nimman…',
    section_needs: 'What are you looking for?',
    needs_hint: 'Select everything that applies',
    job_label: 'Tell us about the job (optional)',
    job_ph: 'e.g. Looking for a nanny for our 2-year-old, 3 days a week. Must speak basic English.',
    job_hint: 'Phone numbers and emails will be automatically hidden for privacy.',
    section_language: 'Your language',
    lang_label: 'Preferred language for messages',
    lang_hint: 'Messages from helpers will be auto-translated into this language.',
    submit: 'Create Free Account',
    submitting: 'Creating account...',
    error_duplicate: 'An account with this email already exists. Try logging in instead.',
    error_invalid: 'Please fill in all required fields.',
    error_generic: 'Something went wrong. Please try again.',
    have_account: 'Already have an account?',
    login_link: 'Log In',
    terms_notice: 'By creating an account you agree to our',
    terms_link: 'Terms of Service',
    privacy_link: 'Privacy Policy',
    success_h1: 'Welcome to ThaiHelper!',
    success_p: 'Your account is ready. Your reference number is:',
    success_hint: 'Save this — you\'ll need it to log in. We\'ve also sent it to your email.',
    success_cta: 'Browse Helpers →',
  },
  th: {
    page_title: 'ลงทะเบียนนายจ้าง – ThaiHelper',
    h1: 'ค้นหาผู้ช่วยที่เหมาะกับคุณ',
    sub: 'สร้างบัญชีฟรีเพื่อเรียกดูผู้ช่วยและส่งข้อความโดยตรง',
    promo_badge: '🎉 ฟรี 4 สัปดาห์แรก',
    promo_text: 'ลงทะเบียนตอนนี้และรับสิทธิ์ส่งข้อความฟรี 28 วัน — ไม่ต้องใช้บัตรเครดิต',
    section_preferences: 'ความต้องการของคุณ',
    arrangement_label: 'รูปแบบการทำงาน',
    arrangement_hint: 'คุณต้องการคนที่อยู่ประจำหรือไป-กลับ?',
    arr_live_in: 'อยู่ประจำ',
    arr_live_in_desc: 'ผู้ช่วยอาศัยอยู่ที่บ้านคุณ',
    arr_live_out: 'ไป-กลับ',
    arr_live_out_desc: 'มาทำงานและกลับบ้านทุกวัน',
    arr_either: 'แบบใดก็ได้',
    arr_either_desc: 'ไม่มีข้อกำหนด',
    age_pref_label: 'อายุผู้ช่วยที่ต้องการ (ไม่จำเป็น)',
    age_any: 'ทุกช่วงอายุ',
    age_20_30: '20 – 30 ปี',
    age_30_40: '30 – 40 ปี',
    age_40_50: '40 – 50 ปี',
    age_50_plus: '50+ ปี',
    section_about: 'เกี่ยวกับคุณ',
    fname_label: 'ชื่อ',
    fname_ph: 'เช่น ซาร่า',
    lname_label: 'นามสกุล',
    lname_ph: 'เช่น มิลเลอร์',
    email_label: 'อีเมล',
    email_ph: 'you@example.com',
    email_hint: 'ใช้สำหรับเข้าสู่ระบบและการแจ้งเตือน',
    phone_label: 'โทรศัพท์ (ไม่จำเป็น)',
    phone_ph: '+66 …',
    section_location: 'ที่ที่คุณต้องการความช่วยเหลือ',
    city_label: 'เมือง',
    city_ph: '— เลือกเมือง —',
    area_label: 'ย่าน (ไม่จำเป็น)',
    area_ph: 'เช่น สุขุมวิท, รวาย, นิมมาน…',
    section_needs: 'คุณกำลังหาอะไร?',
    needs_hint: 'เลือกทุกข้อที่เกี่ยวข้อง',
    job_label: 'บอกเราเกี่ยวกับงาน (ไม่จำเป็น)',
    job_ph: 'เช่น ต้องการพี่เลี้ยงเด็กอายุ 2 ขวบ 3 วันต่อสัปดาห์',
    job_hint: 'หมายเลขโทรศัพท์และอีเมลจะถูกซ่อนโดยอัตโนมัติเพื่อความเป็นส่วนตัว',
    section_language: 'ภาษาของคุณ',
    lang_label: 'ภาษาที่ต้องการสำหรับข้อความ',
    lang_hint: 'ข้อความจากผู้ช่วยจะถูกแปลเป็นภาษานี้อัตโนมัติ',
    submit: 'สร้างบัญชีฟรี',
    submitting: 'กำลังสร้างบัญชี...',
    error_duplicate: 'มีบัญชีที่ใช้อีเมลนี้อยู่แล้ว ลองเข้าสู่ระบบแทน',
    error_invalid: 'กรุณากรอกข้อมูลที่จำเป็นทั้งหมด',
    error_generic: 'เกิดข้อผิดพลาด กรุณาลองใหม่',
    have_account: 'มีบัญชีอยู่แล้ว?',
    login_link: 'เข้าสู่ระบบ',
    terms_notice: 'โดยการสร้างบัญชี คุณยอมรับ',
    terms_link: 'ข้อกำหนดการให้บริการ',
    privacy_link: 'นโยบายความเป็นส่วนตัว',
    success_h1: 'ยินดีต้อนรับสู่ ThaiHelper!',
    success_p: 'บัญชีของคุณพร้อมใช้งานแล้ว หมายเลขอ้างอิงของคุณคือ:',
    success_hint: 'บันทึกไว้ — คุณจะต้องใช้เพื่อเข้าสู่ระบบ เราได้ส่งไปที่อีเมลของคุณด้วย',
    success_cta: 'เรียกดูผู้ช่วย →',
  },
};

export default function EmployerRegisterPage() {
  const router = useRouter();
  const [lang, setLangState] = useState('en');

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [lookingFor, setLookingFor] = useState([]);
  const [arrangementPreference, setArrangementPreference] = useState('');
  const [preferredAgeRange, setPreferredAgeRange] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('en');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successRef, setSuccessRef] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('th_lang') || 'en';
    setLangState(saved);
    setPreferredLanguage(saved);
  }, []);

  const changeLang = (l) => {
    setLangState(l);
    localStorage.setItem('th_lang', l);
  };

  const t = T[lang] || T.en;

  const toggleCategory = (value) => {
    setLookingFor(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !city) {
      setError(t.error_invalid);
      return;
    }

    setSubmitting(true);
    try {
      const result = await employerSignup({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        city,
        area: area.trim(),
        lookingFor,
        arrangementPreference: arrangementPreference || null,
        preferredAgeRange: preferredAgeRange || null,
        jobDescription: jobDescription.trim(),
        preferredLanguage,
      });

      if (!result.success) {
        const errorMap = {
          duplicate_email: t.error_duplicate,
          invalid_input: t.error_invalid,
        };
        setError(errorMap[result.error] || t.error_generic);
        return;
      }

      setSuccessRef(result.ref);
    } catch {
      setError(t.error_generic);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── SUCCESS VIEW ────────────────────────────────────────────────────
  if (successRef) {
    return (
      <>
        <Head><title>{t.success_h1}</title></Head>
        <div className="register-body">
          <nav className="register-nav">
            <Link href="/" className="brand">Thai<span>Helper</span></Link>
          </nav>
          <div className="register-container">
            <div className="card" style={{ padding: '48px 40px', maxWidth: '520px', width: '100%', textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '72px', height: '72px', borderRadius: '50%',
                background: '#e6f5f3', color: '#006a62', marginBottom: '24px',
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '12px', color: 'var(--gray-900)' }}>
                {t.success_h1}
              </h1>
              <p style={{ fontSize: '16px', color: 'var(--gray-500)', marginBottom: '24px' }}>
                {t.success_p}
              </p>
              <div style={{
                background: '#f0f2f5', borderRadius: '12px', padding: '20px',
                marginBottom: '16px',
                fontFamily: 'monospace', fontSize: '24px', fontWeight: 700,
                letterSpacing: '2px', color: '#001b3d',
              }}>
                {successRef}
              </div>
              <p style={{ fontSize: '14px', color: 'var(--gray-400)', marginBottom: '28px' }}>
                {t.success_hint}
              </p>
              <Link href="/helpers" className="btn-next" style={{ display: 'inline-block', textDecoration: 'none' }}>
                {t.success_cta}
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── FORM VIEW ───────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>{t.page_title}</title>
        <meta name="description" content="Create a free employer account on ThaiHelper to find nannies, housekeepers, chefs, drivers and more." />
      </Head>

      <div className="register-body">
        <nav className="register-nav">
          <Link href="/" className="brand">Thai<span>Helper</span></Link>
          <LangSwitcher value={lang} onChange={changeLang} languages={['en', 'th']} />
        </nav>

        <div className="register-container">
          <div className="card" style={{ padding: '40px', maxWidth: '640px', width: '100%' }}>
            <h1 style={{ fontSize: '30px', fontWeight: 700, marginBottom: '8px', color: 'var(--gray-900)' }}>
              {t.h1}
            </h1>
            <p style={{ fontSize: '17px', color: 'var(--gray-500)', marginBottom: '20px' }}>
              {t.sub}
            </p>

            {/* Promo Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #fff8e1 0%, #fff3c4 100%)',
              border: '1px solid #f5d78e',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '32px',
            }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#8a6d00', marginBottom: '4px' }}>
                {t.promo_badge}
              </div>
              <div style={{ fontSize: '14px', color: '#8a6d00', lineHeight: 1.5 }}>
                {t.promo_text}
              </div>
            </div>

            {error && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px',
                padding: '14px 18px', marginBottom: '20px', color: '#dc2626', fontSize: '15px',
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Section: About You */}
              <SectionTitle>{t.section_about}</SectionTitle>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="field">
                  <label>{t.fname_label}</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder={t.fname_ph} required />
                </div>
                <div className="field">
                  <label>{t.lname_label}</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder={t.lname_ph} required />
                </div>
              </div>

              <div className="field">
                <label>{t.email_label}</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t.email_ph} required />
                <p style={{ fontSize: '13px', color: 'var(--gray-400)', marginTop: '4px' }}>{t.email_hint}</p>
              </div>

              <div className="field">
                <label>{t.phone_label}</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder={t.phone_ph} />
              </div>

              {/* Section: Location */}
              <SectionTitle>{t.section_location}</SectionTitle>

              <div className="field">
                <label>{t.city_label}</label>
                <select value={city} onChange={e => setCity(e.target.value)} required>
                  <option value="">{t.city_ph}</option>
                  {CITIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>{t.area_label}</label>
                <input type="text" value={area} onChange={e => setArea(e.target.value)} placeholder={t.area_ph} />
              </div>

              {/* Section: Looking For (chip multi-select) */}
              <SectionTitle>{t.section_needs}</SectionTitle>
              <p style={{ fontSize: '14px', color: 'var(--gray-400)', marginTop: '-12px', marginBottom: '12px' }}>
                {t.needs_hint}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                {LOOKING_FOR_OPTIONS.map(opt => {
                  const selected = lookingFor.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleCategory(opt.value)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '999px',
                        border: `1.5px solid ${selected ? '#006a62' : 'var(--gray-200, #e5e7eb)'}`,
                        background: selected ? '#e6f5f3' : 'white',
                        color: selected ? '#006a62' : 'var(--gray-600, #4b5563)',
                        fontSize: '14px',
                        fontWeight: selected ? 600 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {opt[lang] || opt.en}
                    </button>
                  );
                })}
              </div>

              {/* Section: Preferences (arrangement + age) */}
              <SectionTitle>{t.section_preferences}</SectionTitle>

              <div className="field">
                <label>{t.arrangement_label}</label>
                <p style={{ fontSize: '13px', color: 'var(--gray-400)', marginTop: '-4px', marginBottom: '10px' }}>
                  {t.arrangement_hint}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {[
                    { value: 'live_in',  label: t.arr_live_in,  desc: t.arr_live_in_desc },
                    { value: 'live_out', label: t.arr_live_out, desc: t.arr_live_out_desc },
                    { value: 'either',   label: t.arr_either,   desc: t.arr_either_desc },
                  ].map(opt => {
                    const selected = arrangementPreference === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setArrangementPreference(opt.value)}
                        style={{
                          padding: '14px 12px',
                          borderRadius: '12px',
                          border: `1.5px solid ${selected ? '#001b3d' : 'var(--gray-200, #e5e7eb)'}`,
                          background: selected ? '#eef1f6' : 'white',
                          color: selected ? '#001b3d' : 'var(--gray-600, #4b5563)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ fontSize: '15px', fontWeight: selected ? 700 : 600, marginBottom: '2px' }}>
                          {opt.label}
                        </div>
                        <div style={{ fontSize: '12px', color: selected ? '#001b3d' : 'var(--gray-400)', lineHeight: 1.3 }}>
                          {opt.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="field">
                <label>{t.age_pref_label}</label>
                <select value={preferredAgeRange} onChange={e => setPreferredAgeRange(e.target.value)}>
                  <option value="">{t.age_any}</option>
                  <option value="20-30">{t.age_20_30}</option>
                  <option value="30-40">{t.age_30_40}</option>
                  <option value="40-50">{t.age_40_50}</option>
                  <option value="50+">{t.age_50_plus}</option>
                </select>
              </div>

              <div className="field">
                <label>{t.job_label}</label>
                <textarea
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  placeholder={t.job_ph}
                  rows={4}
                  style={{ resize: 'vertical' }}
                />
                <p style={{ fontSize: '13px', color: 'var(--gray-400)', marginTop: '4px' }}>{t.job_hint}</p>
              </div>

              {/* Section: Language */}
              <SectionTitle>{t.section_language}</SectionTitle>
              <div className="field">
                <label>{t.lang_label}</label>
                <select value={preferredLanguage} onChange={e => setPreferredLanguage(e.target.value)}>
                  <option value="en">English</option>
                  <option value="th">ภาษาไทย (Thai)</option>
                  <option value="ru">Русский (Russian)</option>
                  <option value="de">Deutsch (German)</option>
                  <option value="fr">Français (French)</option>
                </select>
                <p style={{ fontSize: '13px', color: 'var(--gray-400)', marginTop: '4px' }}>{t.lang_hint}</p>
              </div>

              <button
                type="submit"
                className="btn-next"
                disabled={submitting}
                style={{ width: '100%', marginTop: '20px', background: '#001b3d' }}
              >
                {submitting ? t.submitting : t.submit}
              </button>

              <p style={{ fontSize: '13px', color: 'var(--gray-400)', textAlign: 'center', marginTop: '14px', lineHeight: 1.5 }}>
                {t.terms_notice}{' '}
                <Link href="/terms" style={{ color: 'var(--gray-500)', textDecoration: 'underline' }}>{t.terms_link}</Link>
                {' & '}
                <Link href="/privacy" style={{ color: 'var(--gray-500)', textDecoration: 'underline' }}>{t.privacy_link}</Link>
              </p>
            </form>

            <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--gray-100)' }}>
              <p style={{ fontSize: '15px', color: 'var(--gray-500)' }}>
                {t.have_account}{' '}
                <Link href="/login" style={{ color: '#001b3d', fontWeight: 600, textDecoration: 'none' }}>
                  {t.login_link}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 style={{
      fontSize: '13px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      color: 'var(--gray-500)',
      marginTop: '28px',
      marginBottom: '14px',
      paddingBottom: '6px',
      borderBottom: '1px solid var(--gray-100, #f0f0f0)',
    }}>
      {children}
    </h2>
  );
}

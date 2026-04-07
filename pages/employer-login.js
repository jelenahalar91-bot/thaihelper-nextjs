import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  employerLogin,
  fetchEmployerProfile,
} from '@/lib/api/employer-auth-client';
import LangSwitcher from '@/components/LangSwitcher';

const T = {
  en: {
    page_title: 'Employer Login – ThaiHelper',
    h1: 'Welcome back',
    sub: 'Log in to view your messages and find helpers.',
    email_label: 'Email Address',
    email_ph: 'The email you registered with',
    ref_label: 'Reference Number',
    ref_ph: 'e.g. EMP-A1B2C3',
    ref_hint: 'Your reference number is in your welcome email.',
    submit: 'Log In',
    submitting: 'Logging in...',
    error_invalid: "We couldn't find an account with this email and reference number. Please check and try again.",
    error_rate: 'Too many login attempts. Please wait a few minutes and try again.',
    error_generic: 'Something went wrong. Please try again.',
    no_account: "Don't have an account yet?",
    register_link: 'Create Employer Account',
    forgot_ref: 'Forgot your reference number?',
    forgot_hint: 'Check your welcome email or contact us at support@thaihelper.app',
    helper_instead: 'Are you a helper?',
    helper_link: 'Helper Login',
  },
  th: {
    page_title: 'เข้าสู่ระบบนายจ้าง – ThaiHelper',
    h1: 'ยินดีต้อนรับกลับ',
    sub: 'เข้าสู่ระบบเพื่อดูข้อความและค้นหาผู้ช่วย',
    email_label: 'อีเมล',
    email_ph: 'อีเมลที่คุณใช้ลงทะเบียน',
    ref_label: 'หมายเลขอ้างอิง',
    ref_ph: 'เช่น EMP-A1B2C3',
    ref_hint: 'หมายเลขอ้างอิงอยู่ในอีเมลต้อนรับของคุณ',
    submit: 'เข้าสู่ระบบ',
    submitting: 'กำลังเข้าสู่ระบบ...',
    error_invalid: 'ไม่พบบัญชีที่ตรงกับอีเมลและหมายเลขอ้างอิงนี้ กรุณาตรวจสอบอีกครั้ง',
    error_rate: 'ลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่',
    error_generic: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
    no_account: 'ยังไม่มีบัญชี?',
    register_link: 'สร้างบัญชีนายจ้าง',
    forgot_ref: 'ลืมหมายเลขอ้างอิง?',
    forgot_hint: 'ตรวจสอบอีเมลต้อนรับหรือติดต่อเราที่ support@thaihelper.app',
    helper_instead: 'คุณเป็นผู้ช่วย?',
    helper_link: 'เข้าสู่ระบบผู้ช่วย',
  },
};

export default function EmployerLoginPage() {
  const router = useRouter();
  const [lang, setLangState] = useState('en');
  const [email, setEmail] = useState('');
  const [ref, setRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('th_lang') || 'en';
    setLangState(saved);
  }, []);

  // Auto-redirect if already logged in (same pattern as helper login)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchEmployerProfile();
        if (!cancelled && data && data.success) {
          router.replace('/employer-dashboard');
        }
      } catch {
        /* not logged in — stay here */
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  const changeLang = (l) => {
    setLangState(l);
    localStorage.setItem('th_lang', l);
  };

  const t = T[lang] || T.en;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !ref.trim()) return;

    setSubmitting(true);
    try {
      const result = await employerLogin({ email: email.trim(), ref: ref.trim() });

      if (!result.success) {
        const errorMap = { rate_limit: t.error_rate, invalid: t.error_invalid };
        setError(errorMap[result.error] || t.error_generic);
        return;
      }

      router.replace('/employer-dashboard');
    } catch {
      setError(t.error_generic);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>{t.page_title}</title>
        <meta name="description" content="Log in to your ThaiHelper employer account." />
      </Head>

      <div className="register-body">
        <nav className="register-nav">
          <Link href="/" className="brand">Thai<span>Helper</span></Link>
          <LangSwitcher value={lang} onChange={changeLang} languages={['en', 'th']} />
        </nav>

        <div className="register-container">
          <div className="card" style={{ padding: '48px 40px', maxWidth: '520px', width: '100%' }}>
            {/* Icon */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '64px', height: '64px', borderRadius: '50%',
                background: '#e8edf5', color: '#001b3d',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
            </div>

            <h1 style={{ fontSize: '32px', fontWeight: 700, textAlign: 'center', marginBottom: '10px', color: 'var(--gray-900)' }}>
              {t.h1}
            </h1>
            <p style={{ textAlign: 'center', color: 'var(--gray-500)', marginBottom: '32px', fontSize: '18px' }}>
              {t.sub}
            </p>

            {error && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px',
                padding: '14px 18px', marginBottom: '20px', color: '#dc2626', fontSize: '15px',
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>{t.email_label}</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t.email_ph}
                  required
                />
              </div>

              <div className="field">
                <label>{t.ref_label}</label>
                <input
                  type="text"
                  value={ref}
                  onChange={e => setRef(e.target.value.toUpperCase())}
                  placeholder={t.ref_ph}
                  required
                  style={{ fontFamily: 'monospace', letterSpacing: '1px' }}
                />
                <p style={{ fontSize: '14px', color: 'var(--gray-400)', marginTop: '6px' }}>
                  {t.ref_hint}
                </p>
              </div>

              <button
                type="submit"
                className="btn-next"
                disabled={submitting}
                style={{ width: '100%', marginTop: '8px' }}
              >
                {submitting ? t.submitting : t.submit}
              </button>
            </form>

            <details style={{ marginTop: '20px', fontSize: '15px', color: 'var(--gray-500)' }}>
              <summary style={{ cursor: 'pointer', color: '#001b3d' }}>{t.forgot_ref}</summary>
              <p style={{ marginTop: '8px', lineHeight: 1.5 }}>{t.forgot_hint}</p>
            </details>

            {/* Register link */}
            <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--gray-100)' }}>
              <p style={{ fontSize: '16px', color: 'var(--gray-500)' }}>
                {t.no_account}{' '}
                <Link href="/employer-register" style={{ color: '#001b3d', fontWeight: 600, textDecoration: 'none' }}>
                  {t.register_link}
                </Link>
              </p>
              <p style={{ fontSize: '14px', color: 'var(--gray-400)', marginTop: '12px' }}>
                {t.helper_instead}{' '}
                <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                  {t.helper_link}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

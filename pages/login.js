import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { login } from '@/lib/api/auth-client';
import { fetchProfile as fetchProfileApi } from '@/lib/api/helpers';
import {
  employerLogin,
  fetchEmployerProfile,
} from '@/lib/api/employer-auth-client';
import LangSwitcher from '@/components/LangSwitcher';

const T = {
  en: {
    page_title: 'Log In – ThaiHelper',
    h1: 'Welcome Back',
    sub: 'Log in to your ThaiHelper account.',
    email_label: 'Email Address',
    email_ph: 'The email you registered with',
    ref_label: 'Reference Number',
    ref_ph: 'e.g. TH-A1B2C3 or EMP-A1B2C3',
    ref_hint: 'Your reference number was included in your registration email. Helpers start with TH-, employers with EMP-.',
    submit: 'Login',
    submitting: 'Logging in...',
    error_invalid: "We couldn't find an account with this email and reference number. Please check and try again.",
    error_rate: 'Too many login attempts. Please wait a few minutes and try again.',
    error_generic: 'Something went wrong. Please try again.',
    no_account: "Don't have an account yet?",
    register_helper: 'Register as a Helper',
    register_employer: 'Register as an Employer',
    forgot_ref: 'Forgot your reference number?',
    forgot_hint: 'Check your registration confirmation email or contact us at support@thaihelper.app',
    forgot_email_label: 'Your Email Address',
    forgot_email_ph: 'Enter the email you registered with',
    forgot_submit: 'Send Reference Number',
    forgot_submitting: 'Sending...',
    forgot_sent: 'If an account exists with this email, we have sent the reference number. Please check your inbox.',
    forgot_not_found: 'No account found with this email address.',
    forgot_error: 'Something went wrong. Please try again.',
    forgot_back: 'Back to login',
  },
  th: {
    page_title: 'เข้าสู่ระบบ – ThaiHelper',
    h1: 'ยินดีต้อนรับกลับ',
    sub: 'เข้าสู่ระบบบัญชี ThaiHelper ของคุณ',
    email_label: 'อีเมล',
    email_ph: 'อีเมลที่คุณใช้ลงทะเบียน',
    ref_label: 'หมายเลขอ้างอิง',
    ref_ph: 'เช่น TH-A1B2C3 หรือ EMP-A1B2C3',
    ref_hint: 'หมายเลขอ้างอิงอยู่ในอีเมลลงทะเบียนของคุณ ผู้ช่วยขึ้นต้นด้วย TH- นายจ้างขึ้นต้นด้วย EMP-',
    submit: 'เข้าสู่ระบบ',
    submitting: 'กำลังเข้าสู่ระบบ...',
    error_invalid: 'ไม่พบบัญชีที่ตรงกับอีเมลและหมายเลขอ้างอิงนี้ กรุณาตรวจสอบอีกครั้ง',
    error_rate: 'ลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่',
    error_generic: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
    no_account: 'ยังไม่มีบัญชี?',
    register_helper: 'ลงทะเบียนเป็นผู้ช่วย',
    register_employer: 'ลงทะเบียนเป็นนายจ้าง',
    forgot_ref: 'ลืมหมายเลขอ้างอิง?',
    forgot_hint: 'ตรวจสอบอีเมลยืนยันการลงทะเบียนหรือติดต่อเราที่ support@thaihelper.app',
    forgot_email_label: 'อีเมลของคุณ',
    forgot_email_ph: 'ใส่อีเมลที่คุณใช้ลงทะเบียน',
    forgot_submit: 'ส่งหมายเลขอ้างอิง',
    forgot_submitting: 'กำลังส่ง...',
    forgot_sent: 'หากมีบัญชีที่ใช้อีเมลนี้ เราได้ส่งหมายเลขอ้างอิงแล้ว กรุณาตรวจสอบกล่องจดหมาย',
    forgot_not_found: 'ไม่พบบัญชีที่ใช้อีเมลนี้',
    forgot_error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
    forgot_back: 'กลับไปหน้าเข้าสู่ระบบ',
  },
};

// Detect account type from reference number prefix.
// EMP- → employer, anything else (TH- or unknown) → helper.
function isEmployerRef(ref) {
  return ref.trim().toUpperCase().startsWith('EMP-');
}

export default function Login() {
  const router = useRouter();
  const [lang, setLangState] = useState('en');
  const [email, setEmail] = useState('');
  const [ref, setRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  // "Forgot ref" flow
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotResult, setForgotResult] = useState(''); // 'sent' | 'not_found' | 'error'

  useEffect(() => {
    const saved = localStorage.getItem('th_lang') || 'en';
    setLangState(saved);
  }, []);

  // If already logged in (helper OR employer), send straight to the right dashboard.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Check helper session first
      try {
        const data = await fetchProfileApi();
        if (!cancelled && data && data.success) {
          router.replace('/profile');
          return;
        }
      } catch { /* not a helper, try employer */ }

      // Then check employer session
      try {
        const data = await fetchEmployerProfile();
        if (!cancelled && data && data.success) {
          router.replace('/employer-dashboard');
        }
      } catch { /* not logged in — stay here */ }
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
      const isEmployer = isEmployerRef(ref);
      const result = isEmployer
        ? await employerLogin({ email: email.trim(), ref: ref.trim() })
        : await login({ email: email.trim(), ref: ref.trim() });

      if (!result.success) {
        const errorMap = { rate_limit: t.error_rate, invalid: t.error_invalid };
        setError(errorMap[result.error] || t.error_generic);
        return;
      }

      router.replace(isEmployer ? '/employer-dashboard' : '/profile');
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
        <meta name="description" content="Log in to your ThaiHelper account." />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="register-body">
        {/* Nav */}
        <nav className="register-nav">
          <Link href="/" className="brand">Thai<span>Helper</span></Link>
          <LangSwitcher value={lang} onChange={changeLang} languages={['en', 'th']} />
        </nav>

        {/* Login Card */}
        <div className="register-container">
          <div className="card" style={{ padding: '48px 40px', maxWidth: '520px', width: '100%' }}>
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

            {/* Forgot ref */}
            {!showForgot ? (
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => { setShowForgot(true); setForgotResult(''); }}
                  style={{
                    background: 'none', border: 'none',
                    color: 'var(--primary)', fontSize: '15px',
                    cursor: 'pointer', textDecoration: 'underline',
                  }}
                >
                  {t.forgot_ref}
                </button>
              </div>
            ) : (
              <div style={{
                marginTop: '20px', padding: '20px',
                background: '#f8faf9', borderRadius: '12px',
                border: '1px solid #e5e7eb',
              }}>
                <p style={{ fontSize: '14px', color: 'var(--gray-500)', marginBottom: '12px', lineHeight: 1.5 }}>
                  {t.forgot_hint}
                </p>

                {forgotResult === 'sent' ? (
                  <div style={{
                    background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px',
                    padding: '14px', color: '#059669', fontSize: '14px', marginBottom: '12px',
                  }}>
                    {t.forgot_sent}
                  </div>
                ) : forgotResult === 'not_found' ? (
                  <div style={{
                    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px',
                    padding: '14px', color: '#dc2626', fontSize: '14px', marginBottom: '12px',
                  }}>
                    {t.forgot_not_found}
                  </div>
                ) : forgotResult === 'error' ? (
                  <div style={{
                    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px',
                    padding: '14px', color: '#dc2626', fontSize: '14px', marginBottom: '12px',
                  }}>
                    {t.forgot_error}
                  </div>
                ) : null}

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!forgotEmail.trim()) return;
                  setForgotSubmitting(true);
                  setForgotResult('');
                  try {
                    const res = await fetch('/api/forgot-ref', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: forgotEmail.trim() }),
                    });
                    if (res.ok) {
                      setForgotResult('sent');
                    } else if (res.status === 404) {
                      setForgotResult('not_found');
                    } else {
                      setForgotResult('error');
                    }
                  } catch {
                    setForgotResult('error');
                  }
                  setForgotSubmitting(false);
                }}>
                  <div className="field" style={{ marginBottom: '12px' }}>
                    <label>{t.forgot_email_label}</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder={t.forgot_email_ph}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-next"
                    disabled={forgotSubmitting}
                    style={{ width: '100%' }}
                  >
                    {forgotSubmitting ? t.forgot_submitting : t.forgot_submit}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => { setShowForgot(false); setForgotResult(''); }}
                  style={{
                    display: 'block', margin: '12px auto 0',
                    background: 'none', border: 'none',
                    color: 'var(--gray-400)', fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  &larr; {t.forgot_back}
                </button>
              </div>
            )}

            {/* Register links */}
            <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--gray-100)' }}>
              <p style={{ fontSize: '16px', color: 'var(--gray-500)', marginBottom: '14px' }}>
                {t.no_account}
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/register" style={{
                  display: 'inline-block',
                  padding: '12px 22px', borderRadius: '12px',
                  background: '#e6f5f3', color: '#006a62',
                  fontSize: '15px', fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'background 0.15s, box-shadow 0.15s',
                  border: '1px solid #006a62',
                }}>
                  {t.register_helper}
                </Link>
                <Link href="/employer-register" style={{
                  display: 'inline-block',
                  padding: '12px 22px', borderRadius: '12px',
                  background: '#e8edf5', color: '#001b3d',
                  fontSize: '15px', fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'background 0.15s, box-shadow 0.15s',
                  border: '1px solid #001b3d',
                }}>
                  {t.register_employer}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

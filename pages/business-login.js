import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useLang } from './_app';

export default function BusinessLogin() {
  const router = useRouter();
  const { lang } = useLang();
  const th = lang === 'th';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setSubmitting(true);
    try {
      const r = await fetch('/api/company-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Login failed.'); setSubmitting(false); return; }
      router.push('/business-dashboard');
    } catch {
      setError('Login failed. Please try again.');
      setSubmitting(false);
    }
  };

  const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

  return (
    <>
      <Head>
        <title>Company login · ThaiHelper</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <Link href="/" className="text-2xl font-bold font-headline text-navy">Thai<span className="text-primary">Helper</span></Link>
          </div>
          <form onSubmit={submit} className="rounded-2xl border border-gray-200 bg-white p-7 sm:p-8">
            <h1 className="text-xl font-extrabold text-navy">{th ? 'เข้าสู่ระบบบริษัท' : 'Company login'}</h1>
            <p className="mt-1 mb-6 text-sm text-gray-600">
              {th ? 'สำหรับบริษัทที่ลงในไดเรกทอรี' : 'For companies listed in the Expert Directory.'}
            </p>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-semibold text-navy">{th ? 'อีเมล' : 'Email'}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} autoComplete="email" />
            </div>
            <div className="mb-5">
              <label className="mb-1 block text-sm font-semibold text-navy">{th ? 'รหัสผ่าน' : 'Password'}</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputCls} autoComplete="current-password" />
            </div>

            {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

            <button type="submit" disabled={submitting}
              className="w-full rounded-lg bg-primary px-6 py-3 text-base font-bold text-white disabled:opacity-60">
              {submitting ? (th ? 'กำลังเข้าสู่ระบบ…' : 'Logging in…') : (th ? 'เข้าสู่ระบบ' : 'Log in')}
            </button>

            <p className="mt-5 text-center text-sm text-gray-600">
              {th ? 'ยังไม่ได้ลงทะเบียน? ' : 'Not listed yet? '}
              <Link href="/partners" className="font-semibold text-primary underline">{th ? 'สมัครที่นี่' : 'Apply here'}</Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}

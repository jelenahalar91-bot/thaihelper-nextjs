import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import BrandWordmark from '@/components/BrandWordmark';
import { useLang } from './_app';
import CompanyListingForm from '@/components/CompanyListingForm';

const EMPTY = {
  name: '', nameTh: '', type: '', city: '', citiesServed: '', address: '',
  phone: '', whatsapp: '', lineId: '', email: '', website: '', googleMapsUrl: '',
  openingHours: '', licenseNumber: '', description: '', descriptionTh: '',
  specialties: '', languagesSpoken: '', nationalitiesPlaced: '',
};

export default function BusinessOnboarding() {
  const router = useRouter();
  const { lang, setLang } = useLang();
  const th = lang === 'th';
  const token = typeof router.query.t === 'string' ? router.query.t : '';

  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [listing, setListing] = useState(EMPTY);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Honour the ?lang= hint from the invite link so a recipient who clicked
  // the Thai button lands on the Thai version (the email sends lang=th / en).
  useEffect(() => {
    if (!router.isReady) return;
    const q = router.query.lang;
    if ((q === 'th' || q === 'en') && q !== lang) setLang(q);
  }, [router.isReady, router.query.lang]);

  useEffect(() => {
    if (!router.isReady) return;
    if (!token) { setInvalid(true); setLoading(false); return; }
    (async () => {
      try {
        const r = await fetch(`/api/company-onboard?t=${encodeURIComponent(token)}`);
        const d = await r.json();
        if (!r.ok) { setInvalid(true); }
        else {
          setListing(l => ({ ...l, name: d.companyName || '', email: d.email || '', type: d.type || '' }));
        }
      } catch { setInvalid(true); }
      setLoading(false);
    })();
  }, [router.isReady, token]);

  const onField = (field, val) => setListing(l => ({ ...l, [field]: val }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError(th ? 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' : 'Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError(th ? 'รหัสผ่านไม่ตรงกัน' : 'Passwords do not match.'); return; }
    setSubmitting(true);
    try {
      const r = await fetch('/api/company-onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ t: token, password, ...listing }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Something went wrong.'); setSubmitting(false); return; }
      router.push('/business-dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Set up your listing · ThaiHelper</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-2xl px-4">
          <BrandWordmark size="sm" />

          {loading && <p className="mt-10 text-center text-gray-500">Loading…</p>}

          {!loading && invalid && (
            <div className="mt-8 rounded-2xl border border-red-200 bg-white p-8 text-center">
              <h1 className="text-lg font-bold text-red-700">{th ? 'ลิงก์ไม่ถูกต้องหรือหมดอายุ' : 'Invalid or expired link'}</h1>
              <p className="mt-2 text-sm text-gray-600">
                {th ? 'ลิงก์ตั้งค่านี้ใช้ไม่ได้แล้ว กรุณาสมัครใหม่ที่ '
                    : 'This setup link is no longer valid. Please apply again at '}
                <Link href="/partners" className="font-semibold text-primary underline">/partners</Link>.
              </p>
            </div>
          )}

          {!loading && !invalid && (
            <form onSubmit={submit} className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
              <h1 className="text-2xl font-extrabold text-navy">{th ? 'ตั้งค่าโปรไฟล์บริษัทของคุณ' : 'Set up your company listing'}</h1>
              <p className="mt-1 mb-6 text-sm text-gray-600">
                {th ? 'ตั้งรหัสผ่านและกรอกข้อมูลของคุณ คุณสามารถอัปโหลดโลโก้ในแดชบอร์ดหลังจากนี้'
                    : 'Choose a password and fill in your details. You can upload your logo in the dashboard right after.'}
              </p>

              {/* Password */}
              <h3 className="mb-3 text-base font-bold text-navy">{th ? 'รหัสผ่านสำหรับเข้าสู่ระบบ' : 'Login password'}</h3>
              <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-semibold text-navy">{th ? 'รหัสผ่าน' : 'Password'}</label>
                  <input type="password" autoComplete="new-password" value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-semibold text-navy">{th ? 'ยืนยันรหัสผ่าน' : 'Confirm password'}</label>
                  <input type="password" autoComplete="new-password" value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>
              <p className="mb-6 text-xs text-gray-500">{th ? 'คุณจะเข้าสู่ระบบด้วยอีเมลและรหัสผ่านนี้' : `You'll log in with your email and this password.`}</p>

              <div className="border-t border-gray-100 pt-6">
                <CompanyListingForm value={listing} onChange={onField} lang={lang} />
              </div>

              {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

              <button type="submit" disabled={submitting}
                className="mt-6 w-full rounded-lg bg-primary px-6 py-3 text-base font-bold text-white disabled:opacity-60">
                {submitting ? (th ? 'กำลังบันทึก…' : 'Saving…') : (th ? 'บันทึกและเข้าสู่แดชบอร์ด' : 'Save & go to dashboard')}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

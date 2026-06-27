import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useLang } from './_app';
import CompanyListingForm from '@/components/CompanyListingForm';

export default function BusinessDashboard() {
  const router = useRouter();
  const { lang } = useLang();
  const th = lang === 'th';

  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [listing, setListing] = useState(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/company-listing');
        if (r.status === 401) { router.replace('/business-login'); return; }
        const d = await r.json();
        setAccount(d.account);
        setListing(d.listing || {});
        setLogoUrl(d.listing?.logoUrl || '');
      } catch {
        setError('Could not load your listing.');
      }
      setLoading(false);
    })();
  }, []);

  const onField = (field, val) => { setListing(l => ({ ...l, [field]: val })); setSavedAt(false); };

  const save = async () => {
    setSaving(true); setError(''); setSavedAt(false);
    try {
      const r = await fetch('/api/company-listing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listing),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Could not save.'); }
      else { setSavedAt(true); }
    } catch { setError('Could not save.'); }
    setSaving(false);
  };

  const uploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('logo', file);
      const r = await fetch('/api/company-photo', { method: 'POST', body: fd });
      const d = await r.json();
      if (!r.ok) setError(d.error || 'Upload failed.');
      else setLogoUrl(d.url);
    } catch { setError('Upload failed.'); }
    setUploading(false);
  };

  const logout = async () => {
    await fetch('/api/company-auth', { method: 'DELETE' });
    router.push('/business-login');
  };

  return (
    <>
      <Head>
        <title>Company dashboard · ThaiHelper</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-2xl px-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold font-headline text-navy">Thai<span className="text-primary">Helper</span></Link>
            <button onClick={logout} className="text-sm font-semibold text-gray-500 hover:text-gray-800">
              {th ? 'ออกจากระบบ' : 'Log out'}
            </button>
          </div>

          {loading && <p className="mt-10 text-center text-gray-500">Loading…</p>}

          {!loading && listing && (
            <>
              <div className="mt-6 flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5">
                <div>
                  <h1 className="text-lg font-extrabold text-navy">{account?.name}</h1>
                  <p className="text-sm text-gray-500">{account?.email}</p>
                  {listing.slug && (
                    <Link href={`/directory/${listing.slug}`} className="mt-1 inline-block text-sm font-semibold text-primary underline">
                      {th ? 'ดูหน้าสาธารณะ →' : 'View public page →'}
                    </Link>
                  )}
                </div>
                <div className="text-center">
                  <div className="mb-2 h-16 w-16 overflow-hidden rounded-full border border-gray-200 bg-gray-50">
                    {logoUrl
                      ? <img src={logoUrl} alt="logo" className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center text-2xl">🏢</div>}
                  </div>
                  <label className="cursor-pointer text-xs font-semibold text-primary">
                    {uploading ? (th ? 'กำลังอัปโหลด…' : 'Uploading…') : (th ? 'อัปโหลดโลโก้' : 'Upload logo')}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={uploadLogo} disabled={uploading} />
                  </label>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
                <CompanyListingForm value={listing} onChange={onField} lang={lang} />

                {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

                <div className="mt-6 flex items-center gap-3">
                  <button onClick={save} disabled={saving}
                    className="rounded-lg bg-primary px-6 py-3 text-base font-bold text-white disabled:opacity-60">
                    {saving ? (th ? 'กำลังบันทึก…' : 'Saving…') : (th ? 'บันทึกการเปลี่ยนแปลง' : 'Save changes')}
                  </button>
                  {savedAt && <span className="text-sm font-semibold text-primary">✓ {th ? 'บันทึกแล้ว' : 'Saved'}</span>}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { DIRECTORY_TYPES } from '@/lib/constants/directory';

const T = {
  en: {
    meta_title: 'List Your Company · ThaiHelper',
    meta_desc: 'Get listed on ThaiHelper — reach families looking for household staff across Thailand.',
    hero_title: 'Get your company listed on ThaiHelper',
    hero_sub: 'We list staffing agencies, service companies, and training schools in our Expert Directory and Work Permit Wizard — so families who need professional support can find you.',
    benefit_1_title: 'Expert Directory',
    benefit_1_desc: 'Listed at thaihelper.app/directory — filterable by city and type.',
    benefit_2_title: 'Wizard funnel',
    benefit_2_desc: 'Agencies also appear in our Work Permit Wizard when families need placement support.',
    benefit_3_title: 'Click analytics',
    benefit_3_desc: 'We track every click: website visits, phone calls, email clicks.',
    form_title: 'Register your interest',
    label_company: 'Company name *',
    label_contact: 'Contact person',
    label_email: 'Email address *',
    label_phone: 'Phone / LINE',
    label_type: 'Type *',
    type_agency: 'Staffing Agency',
    type_company: 'Service Company',
    type_training: 'Training / School',
    type_other: 'Other',
    submit: 'Send',
    submitting: 'Sending...',
    success_title: 'Received!',
    success_body: "Thanks — we'll be in touch within a few days.",
    success_cta: 'Visit the Expert Directory',
    error: 'Something went wrong. Please email support@thaihelper.app.',
  },
  th: {
    meta_title: 'ลงทะเบียนบริษัทของคุณ · ThaiHelper',
    meta_desc: 'ลงรายชื่อบนไทยเฮลเปอร์ — เข้าถึงครอบครัวที่ต้องการพนักงานดูแลบ้านทั่วประเทศไทย',
    hero_title: 'ลงรายชื่อบริษัทของคุณบน ThaiHelper',
    hero_sub: 'เราลงรายชื่อบริษัทจัดหาแรงงาน ผู้ให้บริการ และโรงเรียนฝึกอบรมใน Expert Directory และ Work Permit Wizard',
    benefit_1_title: 'Expert Directory',
    benefit_1_desc: 'อยู่ที่ thaihelper.app/directory — กรองตามเมืองและประเภทได้',
    benefit_2_title: 'Work Permit Wizard',
    benefit_2_desc: 'บริษัทจัดหาแรงงานปรากฏใน Wizard เมื่อครอบครัวต้องการความช่วยเหลือ',
    benefit_3_title: 'วิเคราะห์ยอดคลิก',
    benefit_3_desc: 'เราติดตามทุกคลิก: เว็บ โทรศัพท์ อีเมล',
    form_title: 'ลงทะเบียนความสนใจ',
    label_company: 'ชื่อบริษัท *',
    label_contact: 'ผู้ติดต่อ',
    label_email: 'อีเมล *',
    label_phone: 'โทรศัพท์ / LINE',
    label_type: 'ประเภท *',
    type_agency: 'บริษัทจัดหาแรงงาน',
    type_company: 'บริษัทบริการ',
    type_training: 'โรงเรียนฝึกอบรม',
    type_other: 'อื่นๆ',
    submit: 'ส่ง',
    submitting: 'กำลังส่ง...',
    success_title: 'ได้รับแล้ว!',
    success_body: 'ขอบคุณ — เราจะติดต่อกลับภายในไม่กี่วัน',
    success_cta: 'ดู Expert Directory',
    error: 'เกิดข้อผิดพลาด กรุณาส่งอีเมลมาที่ support@thaihelper.app',
  },
};

// Mirror the directory taxonomy (Staffing Agency, Service Company, Lawyer,
// Visa Agent, MOU Agency, Training, Partner, Association) + an 'other'
// catch-all, so every kind of provider can self-register.
const TYPE_OPTIONS = [...DIRECTORY_TYPES, { value: 'other', en: 'Other', th: 'อื่นๆ' }];

export default function Partners() {
  const [lang, setLang] = useState('en');
  const t = T[lang];

  const [form, setForm] = useState({ companyName: '', contactName: '', email: '', phone: '', type: '' });
  const [status, setStatus] = useState('idle');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/partner-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <>
      <Head>
        <title>{t.meta_title}</title>
        <meta name="description" content={t.meta_desc} />
      </Head>

      <header className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold text-gray-900">
            Thai<span className="text-primary">Helper</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
              className="text-xs font-semibold text-gray-500 hover:text-gray-800 border border-gray-200 rounded px-2 py-1"
            >
              {lang === 'en' ? 'TH' : 'EN'}
            </button>
            <Link href="/directory" className="text-sm text-primary font-medium hover:underline">
              Directory
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">

        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">{t.hero_title}</h1>
          <p className="text-gray-500 text-sm leading-relaxed">{t.hero_sub}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { icon: '📋', title: t.benefit_1_title, desc: t.benefit_1_desc },
            { icon: '🧭', title: t.benefit_2_title, desc: t.benefit_2_desc },
            { icon: '📊', title: t.benefit_3_title, desc: t.benefit_3_desc },
          ].map((b) => (
            <div key={b.title} className="border border-gray-100 rounded-xl p-4">
              <div className="text-xl mb-1">{b.icon}</div>
              <div className="font-semibold text-gray-800 text-xs mb-1">{b.title}</div>
              <div className="text-gray-400 text-xs leading-relaxed">{b.desc}</div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 max-w-lg">
          {status === 'success' ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">✅</div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">{t.success_title}</h2>
              <p className="text-gray-500 text-sm mb-5">{t.success_body}</p>
              <Link href="/directory" className="inline-block bg-primary text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-primary-container transition">
                {t.success_cta}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-base font-bold text-gray-900 mb-1">{t.form_title}</h2>

              <div>
                <label className={labelCls}>{t.label_company}</label>
                <input required className={inputCls} value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  placeholder="e.g. Ayasan Service Co., Ltd." />
              </div>

              <div>
                <label className={labelCls}>{t.label_contact}</label>
                <input className={inputCls} value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  placeholder="e.g. Somchai Jaidee" />
              </div>

              <div>
                <label className={labelCls}>{t.label_email}</label>
                <input required type="email" className={inputCls} value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="info@yourcompany.com" />
              </div>

              <div>
                <label className={labelCls}>{t.label_phone}</label>
                <input className={inputCls} value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+66 2-xxx-xxxx or @lineID" />
              </div>

              <div>
                <label className={labelCls}>{t.label_type}</label>
                <div className="flex flex-wrap gap-2">
                  {TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, type: opt.value })}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                        form.type === opt.value
                          ? 'bg-primary border-primary text-white'
                          : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
                      }`}
                    >
                      {opt[lang] || opt.en}
                    </button>
                  ))}
                </div>
              </div>

              {status === 'error' && <p className="text-red-600 text-xs">{t.error}</p>}

              <button
                type="submit"
                disabled={status === 'loading' || !form.type}
                className="w-full bg-primary hover:bg-primary-container disabled:opacity-40 text-white font-semibold text-sm py-3 rounded-xl transition mt-2"
              >
                {status === 'loading' ? t.submitting : t.submit}
              </button>
            </form>
          )}
        </div>
      </main>

      <footer className="mt-16 border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        ThaiHelper · <Link href="/privacy" className="hover:underline">Privacy</Link> · <Link href="/terms" className="hover:underline">Terms</Link>
      </footer>
    </>
  );
}

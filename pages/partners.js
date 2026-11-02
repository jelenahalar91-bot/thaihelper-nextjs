import { useState, useMemo } from 'react';
import SEOHead from '@/components/SEOHead';
import Link from 'next/link';
import { useLang } from '@/pages/_app';
import LangSwitcher from '@/components/LangSwitcher';
import { MobileMenu, ResourcesDropdown } from '@/components/MobileMenu';
import { DIRECTORY_TYPES, DIRECTORY_LANGUAGES, NATIONALITIES_PLACED } from '@/lib/constants/directory';
import { CITY_OPTIONS, THAI_PROVINCES } from '@/lib/constants/cities';
import { PHONE_COUNTRY_CODES } from '@/lib/constants/phone-countries';
import {
  validateApplication, DEFAULT_DIAL, MIN_DESCRIPTION, MAX_CITIES_SERVED, PLACEMENT_TYPES,
} from '@/lib/partner-application';
import Turnstile from '@/components/Turnstile';

const T = {
  en: {
    nav_employers: 'For Families',
    nav_helpers: 'For Helpers',
    nav_blog: 'Blog',
    nav_login: 'Login',
    nav_cta: 'Register – Free',
    nav_resources: 'Resources',
    nav_browse_helpers: 'Browse Helpers',
    nav_wizard: 'Work Permit Wizard',
    nav_directory_back: 'Expert Directory',
    nav_employers_link: 'For Families',
    nav_about: 'About',
    nav_faq: 'FAQ',

    meta_title: 'List Your Company · ThaiHelper',
    meta_desc: 'Get listed on ThaiHelper — reach families looking for household staff across Thailand.',
    hero_title: 'Get your company listed on',
    hero_sub: 'We list staffing agencies, service companies, immigration lawyers, visa agents and more in our Expert Directory — so families who need professional support can find you.',
    hero_note: 'We only list companies operating inside Thailand. Every application is reviewed by hand.',

    section_about: 'About your company',
    section_contact: 'How families reach you',
    section_where: 'Where you work',
    section_proof: 'Show us you’re real',

    label_company: 'Company name',
    label_contact: 'Contact person',
    label_email: 'Email address',
    label_phone: 'Phone number',
    label_line: 'LINE ID',
    label_type: 'What kind of company are you?',
    label_city: 'Main city or province',
    label_cities: 'Other areas you serve',
    label_website: 'Website or Facebook page',
    label_maps: 'Google Maps listing',
    label_description: 'Describe your company',
    label_license: 'Thai company registration or licence number',
    label_languages: 'Languages you speak',
    label_nationalities: 'Nationalities you place',
    label_pricing: 'Link to your prices',
    label_confirm: 'My company operates inside Thailand and serves customers there.',

    ph_company: 'Your company name',
    ph_contact: 'e.g. Somchai Jaidee',
    ph_email: 'info@yourcompany.com',
    ph_phone: '2 123 4567',
    ph_line: 'yourcompany (without the @)',
    ph_city: 'Choose a city or province…',
    ph_website: 'yourcompany.com or facebook.com/yourpage',
    ph_maps: 'Paste your Google Maps link',
    ph_description: 'What does your company do, who do you help, and what makes you a good choice? A few honest sentences are plenty — families read this on your listing.',
    ph_license: 'e.g. 0105560123456',
    ph_pricing: 'yourcompany.com/pricing',

    hint_contact: 'A person’s name — not a phone number.',
    hint_phone: 'Pick your country code. Most companies here are on +66.',
    hint_line: 'Optional, but families in Thailand message on LINE far more than they call.',
    hint_cities: `Optional, up to ${MAX_CITIES_SERVED}.`,
    hint_proof: 'At least one link is required. This is how we check a company is real before listing it — without one we can’t approve you.',
    hint_license: 'Optional. It lets us mark your listing as verified.',
    hint_pricing: 'Optional.',
    hint_description_tpl: (n) => `${n} / ${MIN_DESCRIPTION} characters minimum`,

    err_required: 'Please fill this in.',
    err_no_digits: 'Please enter a person’s name, not a phone number.',
    err_bad_email: 'That doesn’t look like a valid email address.',
    err_bad_phone: 'Please enter a valid phone number.',
    err_bad_city: 'Please choose a city or province in Thailand.',
    err_link_required: 'Please add a website, Facebook page or Google Maps link — we need at least one.',
    err_bad_url: 'Please enter a full web address, e.g. yourcompany.com',
    err_too_short: `Please write at least ${MIN_DESCRIPTION} characters.`,
    err_confirm: 'Please confirm this to continue.',

    submit: 'Send application',
    submitting: 'Sending...',
    error: 'Something went wrong. Please email support@thaihelper.app.',
    error_fields: 'Please check the highlighted fields.',

    success_title: 'Check your inbox',
    success_body: 'We’ve sent a confirmation link to your email address. Click it and your application goes straight to our team — we review every company by hand and you’ll hear back within a few days.',
    success_spam: 'Nothing after a few minutes? Have a look in your spam folder.',
    success_plain_title: 'Thanks — we’ve got it',
    success_plain_body: 'Your application is with our team. We review every company by hand and you’ll hear back within a few days.',
    success_cta: 'Browse the Expert Directory',

    login_existing: 'Already approved?',
    login_cta: 'Company login →',

    footer_desc: 'ThaiHelper connects families and expats in Thailand with trusted household staff.',
    footer_privacy: 'Privacy',
    footer_login: 'Company login',
    footer_terms: 'Terms',
  },
  th: {
    nav_employers: 'สำหรับครอบครัว',
    nav_helpers: 'สำหรับผู้ช่วย',
    nav_blog: 'บล็อก',
    nav_login: 'เข้าสู่ระบบ',
    nav_cta: 'สมัคร – ฟรี',
    nav_resources: 'แหล่งข้อมูล',
    nav_browse_helpers: 'ดูผู้ช่วย',
    nav_wizard: 'ตัวช่วยใบอนุญาตทำงาน',
    nav_directory_back: 'รายชื่อผู้เชี่ยวชาญ',
    nav_employers_link: 'สำหรับครอบครัว',
    nav_about: 'เกี่ยวกับเรา',
    nav_faq: 'คำถามที่พบบ่อย',

    meta_title: 'ลงทะเบียนบริษัทของคุณ · ThaiHelper',
    meta_desc: 'ลงรายชื่อบนไทยเฮลเปอร์ — เข้าถึงครอบครัวที่ต้องการพนักงานดูแลบ้านทั่วประเทศไทย',
    hero_title: 'ลงรายชื่อบริษัทของคุณบน',
    hero_sub: 'เราลงรายชื่อบริษัทจัดหาแรงงาน บริษัทบริการ ทนายความตรวจคนเข้าเมือง ตัวแทนวีซ่า และอื่นๆ ใน Expert Directory เพื่อให้ครอบครัวที่ต้องการความช่วยเหลือมืออาชีพค้นหาคุณเจอ',
    hero_note: 'เรารับเฉพาะบริษัทที่ดำเนินงานในประเทศไทย และตรวจสอบทุกใบสมัครด้วยตนเอง',

    section_about: 'เกี่ยวกับบริษัทของคุณ',
    section_contact: 'ช่องทางติดต่อ',
    section_where: 'พื้นที่ให้บริการ',
    section_proof: 'ยืนยันตัวตนธุรกิจ',

    label_company: 'ชื่อบริษัท',
    label_contact: 'ผู้ติดต่อ',
    label_email: 'อีเมล',
    label_phone: 'เบอร์โทรศัพท์',
    label_line: 'LINE ID',
    label_type: 'ประเภทบริษัท',
    label_city: 'เมืองหรือจังหวัดหลัก',
    label_cities: 'พื้นที่อื่นที่ให้บริการ',
    label_website: 'เว็บไซต์ หรือ เพจเฟซบุ๊ก',
    label_maps: 'Google Maps',
    label_description: 'อธิบายเกี่ยวกับบริษัทของคุณ',
    label_license: 'เลขทะเบียนนิติบุคคล หรือ เลขใบอนุญาต',
    label_languages: 'ภาษาที่ใช้ได้',
    label_nationalities: 'สัญชาติที่จัดหา',
    label_pricing: 'ลิงก์ราคา',
    label_confirm: 'บริษัทของเราดำเนินงานในประเทศไทยและให้บริการลูกค้าที่นั่น',

    ph_company: 'ชื่อบริษัทของคุณ',
    ph_contact: 'เช่น สมชาย ใจดี',
    ph_email: 'info@yourcompany.com',
    ph_phone: '2 123 4567',
    ph_line: 'yourcompany (ไม่ต้องใส่ @)',
    ph_city: 'เลือกเมืองหรือจังหวัด…',
    ph_website: 'yourcompany.com หรือ facebook.com/yourpage',
    ph_maps: 'วางลิงก์ Google Maps ของคุณ',
    ph_description: 'บริษัทของคุณทำอะไร ช่วยเหลือใคร และทำไมจึงเป็นตัวเลือกที่ดี เขียนไม่กี่ประโยคก็พอ — ครอบครัวจะอ่านข้อความนี้ในรายชื่อของคุณ',
    ph_license: 'เช่น 0105560123456',
    ph_pricing: 'yourcompany.com/pricing',

    hint_contact: 'ชื่อบุคคล ไม่ใช่เบอร์โทรศัพท์',
    hint_phone: 'เลือกรหัสประเทศ บริษัทส่วนใหญ่ที่นี่ใช้ +66',
    hint_line: 'ไม่บังคับ แต่ครอบครัวในไทยทักผ่าน LINE มากกว่าโทร',
    hint_cities: `ไม่บังคับ สูงสุด ${MAX_CITIES_SERVED} แห่ง`,
    hint_proof: 'ต้องมีอย่างน้อยหนึ่งลิงก์ เราใช้ตรวจสอบว่าบริษัทมีอยู่จริงก่อนลงรายชื่อ หากไม่มี เราไม่สามารถอนุมัติได้',
    hint_license: 'ไม่บังคับ ช่วยให้เราติดเครื่องหมายยืนยันให้รายชื่อของคุณ',
    hint_pricing: 'ไม่บังคับ',
    hint_description_tpl: (n) => `${n} / ${MIN_DESCRIPTION} ตัวอักษรขั้นต่ำ`,

    err_required: 'กรุณากรอกข้อมูลนี้',
    err_no_digits: 'กรุณากรอกชื่อบุคคล ไม่ใช่เบอร์โทรศัพท์',
    err_bad_email: 'อีเมลไม่ถูกต้อง',
    err_bad_phone: 'เบอร์โทรศัพท์ไม่ถูกต้อง',
    err_bad_city: 'กรุณาเลือกเมืองหรือจังหวัดในประเทศไทย',
    err_link_required: 'กรุณาใส่เว็บไซต์ เพจเฟซบุ๊ก หรือลิงก์ Google Maps อย่างน้อยหนึ่งอย่าง',
    err_bad_url: 'กรุณากรอกที่อยู่เว็บให้ครบ เช่น yourcompany.com',
    err_too_short: `กรุณาเขียนอย่างน้อย ${MIN_DESCRIPTION} ตัวอักษร`,
    err_confirm: 'กรุณายืนยันเพื่อดำเนินการต่อ',

    submit: 'ส่งใบสมัคร',
    submitting: 'กำลังส่ง...',
    error: 'เกิดข้อผิดพลาด กรุณาส่งอีเมลมาที่ support@thaihelper.app',
    error_fields: 'กรุณาตรวจสอบช่องที่ไฮไลต์ไว้',

    success_title: 'กรุณาตรวจสอบอีเมลของคุณ',
    success_body: 'เราได้ส่งลิงก์ยืนยันไปที่อีเมลของคุณแล้ว คลิกลิงก์นั้นแล้วใบสมัครจะถูกส่งต่อให้ทีมงานทันที เราตรวจสอบทุกบริษัทด้วยตนเองและจะติดต่อกลับภายในไม่กี่วัน',
    success_spam: 'หากไม่ได้รับภายในไม่กี่นาที กรุณาตรวจสอบในกล่องสแปม',
    success_plain_title: 'ขอบคุณ — เราได้รับแล้ว',
    success_plain_body: 'ใบสมัครของคุณอยู่กับทีมงานของเราแล้ว เราตรวจสอบทุกบริษัทด้วยตนเองและจะติดต่อกลับภายในไม่กี่วัน',
    success_cta: 'ดู Expert Directory',

    login_existing: 'ได้รับอนุมัติแล้ว?',
    login_cta: 'เข้าสู่ระบบบริษัท →',

    footer_desc: 'ThaiHelper เชื่อมโยงครอบครัวและชาวต่างชาติในประเทศไทยกับพนักงานในบ้านที่ไว้ใจได้',
    footer_privacy: 'ความเป็นส่วนตัว',
    footer_login: 'เข้าสู่ระบบบริษัท',
    footer_terms: 'ข้อกำหนด',
  },
};

// Error codes from lib/partner-application.js → the wording for this page.
// `operatesInThailand` reuses the confirm copy rather than "please fill this in".
function errText(t, field, code) {
  if (!code) return '';
  if (field === 'operatesInThailand') return t.err_confirm;
  return t[`err_${code}`] || t.err_required;
}

const EMPTY = {
  companyName: '', contactName: '', email: '',
  phoneDial: DEFAULT_DIAL, phoneLocal: '', lineId: '',
  type: '', city: '', citiesServed: [],
  website: '', googleMapsUrl: '',
  description: '', licenseNumber: '',
  languagesSpoken: [], nationalitiesPlaced: [], pricingUrl: '',
  operatesInThailand: false,
  faxNumber: '', // honeypot — hidden from humans, see the field below
};

export default function Partners() {
  const { lang } = useLang();
  const t = T[lang] || T.en;

  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState('idle');
  const [errors, setErrors] = useState({});
  const [showErrors, setShowErrors] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(true);
  const [turnstileToken, setTurnstileToken] = useState('');

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const toggle = (field, value, max) => setForm((f) => {
    const list = f[field];
    if (list.includes(value)) return { ...f, [field]: list.filter(v => v !== value) };
    if (max && list.length >= max) return f;
    return { ...f, [field]: [...list, value] };
  });

  // Live validation, but only surfaced after the first submit attempt —
  // scolding someone about an empty field they haven't reached yet is rude.
  const live = useMemo(() => validateApplication(form), [form]);
  const shown = showErrors ? { ...live.errors, ...errors } : errors;
  const err = (field) => errText(t, field, shown[field]);

  const isPlacementType = PLACEMENT_TYPES.includes(form.type);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    if (!live.ok) {
      setShowErrors(true);
      setStatus('fields');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/partner-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          citiesServed: form.citiesServed.join(','),
          languagesSpoken: form.languagesSpoken.join(','),
          nationalitiesPlaced: form.nationalitiesPlaced.join(','),
          turnstileToken,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setNeedsVerify(data.verify !== false);
        setStatus('success');
      } else if (data.errors) {
        setErrors(data.errors);
        setShowErrors(true);
        setStatus('fields');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  const inputCls = 'w-full border border-slate-200 rounded-lg px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white';
  const errorCls = 'w-full border border-red-300 bg-red-50/40 rounded-lg px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent';
  const cls = (field) => (err(field) ? errorCls : inputCls);
  const labelCls = 'block text-sm font-semibold text-slate-700 mb-1.5';
  const hintCls = 'mt-1 text-xs text-slate-400';
  const sectionCls = 'text-xs font-bold uppercase tracking-wider text-primary pt-2';

  const chip = (active) => `px-3.5 py-2 rounded-lg border text-xs font-medium transition ${
    active ? 'bg-primary border-primary text-white' : 'border-slate-200 text-slate-600 hover:border-primary hover:text-primary'
  }`;

  const ErrMsg = ({ field }) => (err(field) ? <p className="mt-1 text-xs text-red-600">{err(field)}</p> : null);

  const navItems = [
    { href: '/directory',           label: t.nav_directory_back },
    { href: '/helpers',             label: t.nav_browse_helpers },
    { href: '/work-permit-wizard',  label: t.nav_wizard },
    { href: '/employers',           label: t.nav_employers_link },
    { href: '/about',               label: t.nav_about },
    { href: '/faq',                 label: t.nav_faq },
    { href: '/blog',                label: t.nav_blog },
  ];

  return (
    <>
      <SEOHead
        title={t.meta_title}
        description={t.meta_desc}
        path="/partners"
        lang={lang}
      />

      <div className={`min-h-screen bg-background text-on-background font-sans ${lang === 'th' ? 'lang-th' : ''}`}>
        {/* Audience switch */}
        <div className="fixed top-0 left-0 w-full bg-[#001b3d] text-white z-[60]">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 md:py-2.5 flex justify-center md:justify-end items-center gap-5 md:gap-7 text-xs md:text-sm">
            <Link href="/employers" className="font-semibold hover:text-gold transition-colors whitespace-nowrap">
              {t.nav_employers} →
            </Link>
            <Link href="/helpers" className="font-semibold hover:text-gold transition-colors whitespace-nowrap">
              {t.nav_helpers} →
            </Link>
          </div>
        </div>

        <nav className="fixed top-9 md:top-11 left-0 w-full flex justify-between items-center px-4 md:px-6 py-3 md:py-4 bg-white/90 backdrop-blur-md z-50 shadow-sm">
          <Link href="/" className="text-xl md:text-2xl font-bold font-headline">
            <span>Thai</span><span style={{ color: '#006a62' }}>Helper</span>
          </Link>
          <div className="hidden lg:flex items-center gap-4">
            <ResourcesDropdown label={t.nav_resources} items={navItems} />
            <Link className="text-sm font-semibold text-[#001b3d] hover:text-primary transition-colors" href="/login">{t.nav_login}</Link>
            <LangSwitcher />
            <Link
              className="px-6 py-2.5 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary text-sm font-semibold hover:shadow-lg transition-all active:scale-95 duration-150 whitespace-nowrap"
              href="/signup"
            >
              {t.nav_cta}
            </Link>
          </div>
          <div className="lg:hidden">
            <MobileMenu
              items={navItems}
              secondaryCta={{ href: '/login', label: t.nav_login }}
              primaryCta={{ href: '/signup', label: t.nav_cta }}
            />
          </div>
        </nav>

        <main className="pt-24 md:pt-28">
          {/* HERO */}
          <div className="bg-gradient-to-b from-[#E8F7F5] to-background px-4 py-10 md:py-16 text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold font-headline text-[#1B3A4B] max-w-2xl mx-auto leading-tight">
              {t.hero_title}{' '}
              <span className="whitespace-nowrap">Thai<span className="text-primary">Helper</span></span>
            </h1>
            <p className="text-base md:text-lg text-on-surface-variant max-w-xl mx-auto mt-3 leading-relaxed">
              {t.hero_sub}
            </p>
            <p className="text-sm text-slate-500 max-w-xl mx-auto mt-4">{t.hero_note}</p>
          </div>

          {/* FORM */}
          <div className="max-w-2xl mx-auto px-4 py-10 md:py-12">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8">
              {status === 'success' ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      {needsVerify ? <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2" /> : <path d="M20 6 9 17l-5-5" />}
                    </svg>
                  </div>
                  <h2 className="text-xl md:text-2xl font-extrabold font-headline text-[#1B3A4B] mb-2">
                    {needsVerify ? t.success_title : t.success_plain_title}
                  </h2>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto mb-3 leading-relaxed">
                    {needsVerify ? t.success_body : t.success_plain_body}
                  </p>
                  {needsVerify && <p className="text-slate-400 text-xs max-w-sm mx-auto mb-6">{t.success_spam}</p>}
                  <Link href="/directory" className="inline-block bg-primary text-white font-semibold text-sm px-6 py-3 rounded-full hover:bg-primary-container transition">
                    {t.success_cta}
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>

                  {/* ———— About your company ———— */}
                  <p className={sectionCls}>{t.section_about}</p>

                  <div>
                    <label htmlFor="f-company" className={labelCls}>{t.label_company} *</label>
                    <input id="f-company" className={cls('companyName')} value={form.companyName}
                      onChange={(e) => set('companyName', e.target.value)} placeholder={t.ph_company} />
                    <ErrMsg field="companyName" />
                  </div>

                  <div>
                    <label className={labelCls}>{t.label_type} *</label>
                    <div className="flex flex-wrap gap-2">
                      {DIRECTORY_TYPES.map((opt) => (
                        <button key={opt.value} type="button" onClick={() => set('type', opt.value)}
                          className={chip(form.type === opt.value)}>
                          {opt[lang] || opt.en}
                        </button>
                      ))}
                    </div>
                    <ErrMsg field="type" />
                  </div>

                  <div>
                    <label htmlFor="f-description" className={labelCls}>{t.label_description} *</label>
                    <textarea id="f-description" rows={5} className={`${cls('description')} resize-y`}
                      value={form.description} onChange={(e) => set('description', e.target.value)}
                      placeholder={t.ph_description} />
                    <p className={`${hintCls} ${form.description.length >= MIN_DESCRIPTION ? 'text-primary' : ''}`}>
                      {t.hint_description_tpl(form.description.length)}
                    </p>
                    <ErrMsg field="description" />
                  </div>

                  {/* ———— Where you work ———— */}
                  <p className={sectionCls}>{t.section_where}</p>

                  <div>
                    <label htmlFor="f-city" className={labelCls}>{t.label_city} *</label>
                    <select id="f-city" className={cls('city')} value={form.city}
                      onChange={(e) => set('city', e.target.value)}>
                      <option value="">{t.ph_city}</option>
                      <optgroup label="★">
                        {CITY_OPTIONS.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                      </optgroup>
                      <optgroup label="A–Z">
                        {THAI_PROVINCES.map(p => <option key={p.slug} value={p.slug}>{p.name}</option>)}
                      </optgroup>
                    </select>
                    <ErrMsg field="city" />
                  </div>

                  <div>
                    <label className={labelCls}>{t.label_cities}</label>
                    <div className="flex flex-wrap gap-2">
                      {CITY_OPTIONS.filter(c => c.slug !== form.city).map((c) => {
                        const active = form.citiesServed.includes(c.slug);
                        return (
                          <button key={c.slug} type="button" className={chip(active)}
                            onClick={() => toggle('citiesServed', c.slug, MAX_CITIES_SERVED)}>
                            {c.name}
                          </button>
                        );
                      })}
                    </div>
                    <p className={hintCls}>{t.hint_cities}</p>
                  </div>

                  {isPlacementType && (
                    <div>
                      <label className={labelCls}>{t.label_nationalities}</label>
                      <div className="flex flex-wrap gap-2">
                        {NATIONALITIES_PLACED.map((n) => (
                          <button key={n.value} type="button" className={chip(form.nationalitiesPlaced.includes(n.value))}
                            onClick={() => toggle('nationalitiesPlaced', n.value)}>
                            {n.flag} {n[lang] || n.en}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ———— Contact ———— */}
                  <p className={sectionCls}>{t.section_contact}</p>

                  <div>
                    <label htmlFor="f-contact" className={labelCls}>{t.label_contact} *</label>
                    <input id="f-contact" className={cls('contactName')} value={form.contactName}
                      onChange={(e) => set('contactName', e.target.value)} placeholder={t.ph_contact} />
                    <p className={hintCls}>{t.hint_contact}</p>
                    <ErrMsg field="contactName" />
                  </div>

                  <div>
                    <label htmlFor="f-email" className={labelCls}>{t.label_email} *</label>
                    <input id="f-email" type="email" className={cls('email')} value={form.email}
                      onChange={(e) => set('email', e.target.value)} placeholder={t.ph_email} />
                    <ErrMsg field="email" />
                  </div>

                  <div>
                    <label htmlFor="f-phone" className={labelCls}>{t.label_phone} *</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select aria-label="Country code" className={`${inputCls} sm:w-56 sm:shrink-0`} value={form.phoneDial}
                        onChange={(e) => set('phoneDial', e.target.value)}>
                        {PHONE_COUNTRY_CODES.map(c => (
                          <option key={c.code} value={c.code}>{c.label}</option>
                        ))}
                      </select>
                      <input id="f-phone" type="tel" className={cls('phoneLocal')} value={form.phoneLocal}
                        onChange={(e) => set('phoneLocal', e.target.value)} placeholder={t.ph_phone} />
                    </div>
                    <p className={hintCls}>{t.hint_phone}</p>
                    <ErrMsg field="phoneLocal" />
                  </div>

                  <div>
                    <label htmlFor="f-line" className={labelCls}>{t.label_line}</label>
                    <input id="f-line" className={inputCls} value={form.lineId}
                      onChange={(e) => set('lineId', e.target.value)} placeholder={t.ph_line} />
                    <p className={hintCls}>{t.hint_line}</p>
                  </div>

                  <div>
                    <label className={labelCls}>{t.label_languages}</label>
                    <div className="flex flex-wrap gap-2">
                      {DIRECTORY_LANGUAGES.map((l) => (
                        <button key={l.value} type="button" className={chip(form.languagesSpoken.includes(l.value))}
                          onClick={() => toggle('languagesSpoken', l.value)}>
                          {l[lang] || l.en}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ———— Proof ———— */}
                  <p className={sectionCls}>{t.section_proof}</p>
                  <p className="text-xs text-slate-500 leading-relaxed -mt-3">{t.hint_proof}</p>

                  <div>
                    <label htmlFor="f-website" className={labelCls}>{t.label_website}</label>
                    <input id="f-website" className={cls('website')} value={form.website}
                      onChange={(e) => set('website', e.target.value)} placeholder={t.ph_website} />
                    <ErrMsg field="website" />
                  </div>

                  <div>
                    <label htmlFor="f-maps" className={labelCls}>{t.label_maps}</label>
                    <input id="f-maps" className={cls('googleMapsUrl')} value={form.googleMapsUrl}
                      onChange={(e) => set('googleMapsUrl', e.target.value)} placeholder={t.ph_maps} />
                    <ErrMsg field="googleMapsUrl" />
                  </div>

                  <div>
                    <label htmlFor="f-license" className={labelCls}>{t.label_license}</label>
                    <input id="f-license" className={inputCls} value={form.licenseNumber}
                      onChange={(e) => set('licenseNumber', e.target.value)} placeholder={t.ph_license} />
                    <p className={hintCls}>{t.hint_license}</p>
                  </div>

                  <div>
                    <label htmlFor="f-pricing" className={labelCls}>{t.label_pricing}</label>
                    <input id="f-pricing" className={cls('pricingUrl')} value={form.pricingUrl}
                      onChange={(e) => set('pricingUrl', e.target.value)} placeholder={t.ph_pricing} />
                    <p className={hintCls}>{t.hint_pricing}</p>
                    <ErrMsg field="pricingUrl" />
                  </div>

                  {/* Honeypot. Hidden from people, irresistible to form bots —
                      anything that fills it in is answered like a success and
                      silently dropped by the API. */}
                  <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}>
                    <label htmlFor="f-fax">Fax number</label>
                    <input id="f-fax" name="faxNumber" type="text" tabIndex={-1} autoComplete="off"
                      value={form.faxNumber} onChange={(e) => set('faxNumber', e.target.value)} />
                  </div>

                  <label className={`flex items-start gap-3 cursor-pointer rounded-lg p-3 -mx-1 border ${
                    err('operatesInThailand') ? 'border-red-300 bg-red-50/40' : 'border-transparent'
                  }`}>
                    <input type="checkbox" className="mt-0.5 w-4 h-4 accent-primary shrink-0"
                      checked={form.operatesInThailand}
                      onChange={(e) => set('operatesInThailand', e.target.checked)} />
                    <span className="text-sm text-slate-600 leading-relaxed">{t.label_confirm} *</span>
                  </label>
                  <ErrMsg field="operatesInThailand" />

                  <Turnstile onToken={setTurnstileToken} />

                  {status === 'error' && <p className="text-red-600 text-xs">{t.error}</p>}
                  {status === 'fields' && <p className="text-red-600 text-xs">{t.error_fields}</p>}

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full bg-primary hover:bg-primary-container disabled:opacity-40 text-white font-semibold text-sm py-3.5 rounded-xl transition"
                  >
                    {status === 'loading' ? t.submitting : t.submit}
                  </button>
                </form>
              )}
            </div>

            <p className="mt-5 text-center text-sm text-slate-500">
              {t.login_existing}{' '}
              <Link href="/business-login" className="font-semibold text-primary hover:underline">{t.login_cta}</Link>
            </p>
          </div>
        </main>

        <footer className="w-full bg-slate-50 border-t border-slate-100">
          <div className="max-w-7xl mx-auto py-10 px-6 text-center">
            <p className="text-slate-400 text-xs leading-relaxed max-w-3xl mx-auto mb-2">{t.footer_desc}</p>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-slate-500 mt-3">
              <Link href="/business-login" className="font-medium text-primary hover:underline">{t.footer_login}</Link>
              <Link href="/privacy" className="hover:text-primary">{t.footer_privacy}</Link>
              <Link href="/terms" className="hover:text-primary">{t.footer_terms}</Link>
            </div>
            <p className="text-slate-400 text-xs mt-4">© 2026 ThaiHelper.</p>
          </div>
        </footer>
      </div>
    </>
  );
}

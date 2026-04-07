import { useState, useEffect } from 'react';
import SEOHead, { getBreadcrumbSchema } from '@/components/SEOHead';
import Link from 'next/link';
import { useLang } from './_app';
import { fetchHelpers as fetchHelpersApi } from '@/lib/api/helpers';
import { CITIES } from '@/lib/constants/cities';
import { CATEGORY_NAMES, CAT_EMOJI } from '@/lib/constants/categories';

// ─── TRANSLATIONS ──────────────────────────────────────────────────────────────
const T = {
  en: {
    nav_cta:        'Register Free →',
    nav_helpers:    'Browse Helpers',
    nav_home:       'Home',
    hero_badge:     '🇹🇭 Find Help in Thailand',
    hero_h1:        'Browse Trusted Helpers',
    hero_sub:       'Find nannies, housekeepers, chefs, drivers, and more — directly, without agencies.',
    filter_city:    'All Cities',
    filter_cat:     'All Categories',
    filter_area_ph: 'Search by area...',
    filter_btn:     'Search',
    filter_reset:   'Reset',
    results:        'helpers found',
    no_results:     'No helpers found matching your filters.',
    no_results_sub: 'Try adjusting your filters or check back soon — new helpers register every day.',
    card_exp:       'yrs experience',
    card_call:      'Call',
    card_whatsapp:  'WhatsApp',
    card_email:     'Email',
    card_wa_yes:    '✓ WhatsApp',
    card_wa_no:     '✗ No WhatsApp',
    card_langs:     'Languages:',
    card_area:      'Area:',
    demo_banner:    'These are sample profiles. Real helper profiles will appear here once providers register.',
    cta_title:      'Are you a helper looking for work?',
    cta_sub:        'Create your free profile and let families find you.',
    cta_btn:        'Register Now — Free →',
    footer_privacy: 'Privacy Policy',
    footer_terms:   'Terms of Service',
    cat_nanny:      '👶 Nanny & Babysitter',
    cat_housekeeper:'🏠 Housekeeper & Cleaner',
    cat_chef:       '👨‍🍳 Private Chef & Cook',
    cat_driver:     '🚗 Driver & Chauffeur',
    cat_gardener:   '🌿 Gardener & Pool Care',
    cat_elder:      '🏥 Elder Care & Caregiver',
    cat_tutor:      '📚 Tutor & Teacher',
  },
  th: {
    nav_cta:        'ลงทะเบียนฟรี →',
    nav_helpers:    'ค้นหาผู้ช่วย',
    nav_home:       'หน้าแรก',
    hero_badge:     '🇹🇭 หาผู้ช่วยในประเทศไทย',
    hero_h1:        'ค้นหาผู้ช่วยที่ไว้ใจได้',
    hero_sub:       'หาพี่เลี้ยง แม่บ้าน พ่อครัว คนขับรถ และอื่นๆ — โดยตรง ไม่ผ่านเอเจนซี่',
    filter_city:    'ทุกจังหวัด',
    filter_cat:     'ทุกประเภท',
    filter_area_ph: 'ค้นหาตามย่าน...',
    filter_btn:     'ค้นหา',
    filter_reset:   'รีเซ็ต',
    results:        'ผู้ช่วยที่พบ',
    no_results:     'ไม่พบผู้ช่วยตามเงื่อนไขที่เลือก',
    no_results_sub: 'ลองปรับตัวกรอง หรือกลับมาดูอีกครั้ง — มีผู้ช่วยใหม่ลงทะเบียนทุกวัน',
    card_exp:       'ปีประสบการณ์',
    card_call:      'โทร',
    card_whatsapp:  'WhatsApp',
    card_email:     'อีเมล',
    card_wa_yes:    '✓ WhatsApp',
    card_wa_no:     '✗ ไม่มี WhatsApp',
    card_langs:     'ภาษา:',
    card_area:      'ย่าน:',
    demo_banner:    'เหล่านี้คือโปรไฟล์ตัวอย่าง โปรไฟล์จริงจะปรากฏเมื่อผู้ให้บริการลงทะเบียน',
    cta_title:      'คุณเป็นผู้ช่วยที่กำลังหางานอยู่หรือเปล่า?',
    cta_sub:        'สร้างโปรไฟล์ฟรีเพื่อให้ครอบครัวค้นหาคุณ',
    cta_btn:        'ลงทะเบียนฟรี →',
    footer_privacy: 'นโยบายความเป็นส่วนตัว',
    footer_terms:   'ข้อกำหนดการใช้งาน',
    cat_nanny:      '👶 พี่เลี้ยงเด็ก',
    cat_housekeeper:'🏠 แม่บ้านและพนักงานทำความสะอาด',
    cat_chef:       '👨‍🍳 พ่อครัว / แม่ครัวส่วนตัว',
    cat_driver:     '🚗 คนขับรถ',
    cat_gardener:   '🌿 คนสวนและดูแลสระว่ายน้ำ',
    cat_elder:      '🏥 ผู้ดูแลผู้สูงอายุ',
    cat_tutor:      '📚 ติวเตอร์ / ครูสอนพิเศษ',
  }
};

// CITIES, CATEGORY_NAMES, CAT_EMOJI imported from @/lib/constants/

// Stock photos for demo profiles
const DEMO_PHOTOS = [
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1596815064285-45ed8a9c0463?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1551836022-4c4c79ecde51?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1541823709867-1b206113eafd?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
];

export default function Helpers() {
  const { lang, setLang: changeLang } = useLang();
  const [helpers, setHelpers] = useState([]);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterCity, setFilterCity] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterArea, setFilterArea] = useState('');

  useEffect(() => {
    fetchHelpers();
  }, []);

  const fetchHelpers = async () => {
    setLoading(true);
    try {
      const data = await fetchHelpersApi();
      setHelpers(data.helpers);
      setIsDemo(data.demo);
    } catch (err) {
      console.error('Failed to load helpers:', err);
      setHelpers([]);
    }
    setLoading(false);
  };

  const t = T[lang];

  // Apply filters
  const filtered = helpers.filter(h => {
    if (filterCity && h.city?.toLowerCase() !== filterCity.toLowerCase()) return false;
    if (filterCat && !h.category?.toLowerCase().includes(filterCat.toLowerCase())) return false;
    if (filterArea && !h.area?.toLowerCase().includes(filterArea.toLowerCase())) return false;
    return true;
  });

  const resetFilters = () => {
    setFilterCity('');
    setFilterCat('');
    setFilterArea('');
  };

  // Get category display name with emoji
  const getCatDisplay = (cat) => {
    const emoji = Object.entries(CAT_EMOJI).find(([k]) =>
      cat?.toLowerCase().includes(k.toLowerCase().split(' ')[0])
    );
    return emoji ? `${emoji[1]} ${cat}` : cat;
  };

  // Get translated category
  const getTranslatedCat = (cat) => {
    const key = Object.keys(CAT_EMOJI).find(k =>
      cat?.toLowerCase().includes(k.toLowerCase().split(' ')[0])
    );
    if (!key) return cat;
    const catKey = 'cat_' + {
      'Nanny & Babysitter': 'nanny',
      'Housekeeper & Cleaner': 'housekeeper',
      'Private Chef & Cook': 'chef',
      'Driver & Chauffeur': 'driver',
      'Gardener & Pool Care': 'gardener',
      'Elder Care & Caregiver': 'elder',
      'Tutor & Teacher': 'tutor',
    }[key];
    return t[catKey] || getCatDisplay(cat);
  };

  return (
    <>
      <SEOHead
        title="Browse Helpers – Find Nannies, Chefs, Drivers & More"
        description="Browse verified household staff profiles in Thailand. Find nannies, housekeepers, private chefs, drivers, gardeners, caregivers and tutors."
        path="/helpers"
        lang={lang}
        jsonLd={getBreadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Browse Helpers', path: '/helpers' }])}
      />

      <div className={lang === 'th' ? 'lang-th' : ''}>

        {/* ── NAV ───────────────────────────────── */}
        <nav>
          <Link className="nav-brand" href="/">Thai<span>Helper</span></Link>
          <div className="nav-right">
            <Link className="nav-link" href="/">{t.nav_home}</Link>
            <div className="lang-toggle">
              <button
                className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                onClick={() => changeLang('en')}
              >🇬🇧 EN</button>
              <button
                className={`lang-btn ${lang === 'th' ? 'active' : ''}`}
                onClick={() => changeLang('th')}
              >🇹🇭 TH</button>
            </div>
            <Link className="nav-cta" href="/register">{t.nav_cta}</Link>
          </div>
        </nav>

        {/* ── HERO ──────────────────────────────── */}
        <section className="helpers-hero">
          <div className="helpers-hero-inner">
            <div className="hero-badge">{t.hero_badge}</div>
            <h1>{t.hero_h1}</h1>
            <p>{t.hero_sub}</p>
          </div>
        </section>

        {/* ── FILTER BAR ──────────────────────────── */}
        <section className="helpers-filters">
          <div className="helpers-filters-inner">
            <select
              value={filterCity}
              onChange={e => setFilterCity(e.target.value)}
              className="filter-select"
            >
              <option value="">{t.filter_city}</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
              className="filter-select"
            >
              <option value="">{t.filter_cat}</option>
              {CATEGORY_NAMES.map(c => (
                <option key={c} value={c}>{getCatDisplay(c)}</option>
              ))}
            </select>

            <input
              type="text"
              value={filterArea}
              onChange={e => setFilterArea(e.target.value)}
              placeholder={t.filter_area_ph}
              className="filter-input"
            />

            {(filterCity || filterCat || filterArea) && (
              <button className="filter-reset-btn" onClick={resetFilters}>{t.filter_reset}</button>
            )}
          </div>
        </section>

        {/* ── DEMO BANNER ─────────────────────────── */}
        {isDemo && (
          <div className="demo-banner">
            <span>ℹ️ {t.demo_banner}</span>
          </div>
        )}

        {/* ── HELPER GRID ─────────────────────────── */}
        <section className="helpers-grid-section">
          <div className="helpers-grid-inner">

            {/* Results count */}
            <div className="helpers-results-count">
              <strong>{filtered.length}</strong> {t.results}
            </div>

            {loading ? (
              <div className="helpers-loading">
                <div className="loading-spinner"></div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="helpers-empty">
                <h3>{t.no_results}</h3>
                <p>{t.no_results_sub}</p>
                <button className="btn-outline" onClick={resetFilters}>{t.filter_reset}</button>
              </div>
            ) : (
              <div className="helpers-grid">
                {filtered.map((h, i) => (
                  <div className="helper-card" key={i}>
                    <div className="helper-card-header">
                      <div className="helper-avatar">
                        <img
                          src={DEMO_PHOTOS[i % DEMO_PHOTOS.length]}
                          alt={h.name}
                        />
                      </div>
                      <div className="helper-info">
                        <h3 className="helper-name">{h.name}</h3>
                        <div className="helper-category">{getTranslatedCat(h.category)}</div>
                        <div className="helper-location">
                          📍 {h.city}{h.area ? ` · ${h.area}` : ''}
                        </div>
                      </div>
                    </div>

                    {h.about && (
                      <p className="helper-about">{h.about}</p>
                    )}

                    <div className="helper-details">
                      {h.experience && (
                        <span className="helper-tag">⏱ {h.experience} {t.card_exp}</span>
                      )}
                      {h.languages && (
                        <span className="helper-tag">🗣 {h.languages}</span>
                      )}
                    </div>

                    <div className="helper-card-footer">
                      {h.phone && (
                        <div className="helper-contact-row">
                          <a className="helper-contact-btn phone" href={`tel:${h.phone.replace(/[^0-9+]/g, '')}`}>
                            📞 {h.phone}
                          </a>
                          <span className={`wa-badge ${h.hasWhatsApp ? 'wa-yes' : 'wa-no'}`}>
                            {h.hasWhatsApp ? t.card_wa_yes : t.card_wa_no}
                          </span>
                        </div>
                      )}
                      {h.phone && h.hasWhatsApp && (
                        <a
                          className="helper-contact-btn whatsapp"
                          href={`https://wa.me/${h.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          💬 {t.card_whatsapp}
                        </a>
                      )}
                      {h.email && (
                        <a className="helper-contact-btn email" href={`mailto:${h.email}`}>
                          ✉️ {h.email}
                        </a>
                      )}
                      {!h.phone && !h.email && (
                        <div className="helper-no-contact">Contact info not available</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── CTA FOR PROVIDERS ───────────────────── */}
        <section className="helpers-cta">
          <div className="section-inner">
            <h2>{t.cta_title}</h2>
            <p>{t.cta_sub}</p>
            <Link className="btn-gold" href="/register">{t.cta_btn}</Link>
          </div>
        </section>

        {/* ── FOOTER ──────────────────────────────── */}
        <footer>
          <p>© 2026 ThaiHelper · <a href="mailto:jelenahalar91@gmail.com">jelenahalar91@gmail.com</a></p>
          <p style={{ marginTop: '6px' }}>
            <Link href="/privacy">{t.footer_privacy}</Link> · <Link href="/terms">{t.footer_terms}</Link>
          </p>
        </footer>
      </div>
    </>
  );
}

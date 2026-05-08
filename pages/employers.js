import { useState, useEffect, useCallback } from 'react';
import SEOHead, { getBreadcrumbSchema, getServiceSchema, getSpeakableSchema, getFAQSchema } from '@/components/SEOHead';
import LangSwitcher from '@/components/LangSwitcher';
import { MobileMenu, ResourcesDropdown } from '@/components/MobileMenu';
import HelperCard from '@/components/HelperCard';
import HelperProfileModal from '@/components/messaging/HelperProfileModal';
import { CATEGORIES } from '@/lib/constants/categories';
import { useLang } from './_app';
import {
  roleLabel, cityLabel, entryInitials, FALLBACK_HELPERS,
} from '@/lib/recent-helpers-display';
import Link from 'next/link';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import {
  ArrowLeft, ArrowRight,
  UserPlus, MessageCircle, PartyPopper,
  Wallet, Ban, ShieldCheck, LayoutGrid, MapPin,
} from 'lucide-react';


// ─── HERO CAROUSEL (2 visible cards) ────────────────────────────────────────
function HeroCarousel({ items }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: true,
    slidesToScroll: 1,
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    // Auto-play
    const interval = setInterval(() => { emblaApi.scrollNext(); }, 4000);
    return () => { clearInterval(interval); emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  return (
    <div className="relative">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex -ml-4">
          {items.map((item) => (
            <div key={item.id} className="flex-[0_0_50%] min-w-0 pl-4">
              <div className="relative h-[320px] md:h-[380px] overflow-hidden rounded-2xl">
                <Image src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover" fill sizes="(max-width: 768px) 100vw, 50vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#001b3d]/95 via-[#001b3d]/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <div className="text-base font-bold text-white mb-1">{item.title}</div>
                  <div className="text-[13px] text-white/85 leading-relaxed line-clamp-4">{item.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Navigation arrows */}
      <div className="flex gap-2 mt-4 justify-end">
        <button aria-label="Previous slide" onClick={() => emblaApi?.scrollPrev()} className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-[#001b3d] hover:text-white hover:border-[#001b3d] transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button aria-label="Next slide" onClick={() => emblaApi?.scrollNext()} className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-[#001b3d] hover:text-white hover:border-[#001b3d] transition-all">
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── EMPLOYER FAQ — content + schema source of truth ─────────────────────────
// 6 questions chosen for high-frequency AI-search prompts (ChatGPT, Perplexity,
// Claude, Gemini): pricing, agency comparison, verification, finding helpers,
// salary ranges, and legality. Visible content + JSON-LD must stay in sync.
const EMPLOYER_FAQS = {
  en: [
    {
      question: 'How much does it cost to find a helper on ThaiHelper?',
      answer: 'ThaiHelper is 100% free for everyone — including messaging helpers. There are no fees for families and no fees for helpers.',
    },
    {
      question: 'How is ThaiHelper different from a traditional agency?',
      answer: 'Traditional agencies charge 1–3 months\' salary as a placement fee plus ongoing commissions. ThaiHelper is free to use and connects you directly with helpers — no commissions, no middleman. You agree on salary directly with the helper.',
    },
    {
      question: 'Does ThaiHelper verify helpers?',
      answer: 'ThaiHelper is a directory platform, not an agency. We verify each helper\'s email address but do not perform ID checks or background checks. Please conduct your own interview, ask for references, and confirm legal employment requirements (e.g. work permit, Social Security registration) before hiring.',
    },
    {
      question: 'How do I find a nanny or maid in my city?',
      answer: 'Browse the helper directory at thaihelper.app/helpers and filter by city (Bangkok, Chiang Mai, Phuket, Pattaya, Koh Samui, Hua Hin and more), service type, experience and languages. Click any profile to see full details and message the helper directly.',
    },
    {
      question: 'How much does a nanny or maid cost in Thailand?',
      answer: 'In 2026, a full-time live-out housekeeper in Thailand costs 12,000–18,000 THB/month. A full-time nanny in Bangkok costs 15,000–25,000 THB/month, and 12,000–18,000 THB/month in Chiang Mai. A private chef costs 18,000–35,000 THB/month and a personal driver 15,000–25,000 THB/month.',
    },
    {
      question: 'Is it legal to hire household staff in Thailand?',
      answer: 'Yes. Hiring domestic workers is legal and common in Thailand. Employers must pay at least minimum wage (370 THB/day in Bangkok), provide one rest day per week, six annual leave days, and 13 paid holidays. For full-time roles, employers must register helpers with Social Security. Foreigners can legally hire Thai nationals without a separate work permit for the helper.',
    },
  ],
  th: [
    {
      question: 'การหาผู้ช่วยบน ThaiHelper มีค่าใช้จ่ายเท่าไหร่?',
      answer: 'ThaiHelper ฟรี 100% สำหรับทุกคน — รวมถึงการส่งข้อความหาผู้ช่วย ไม่มีค่าธรรมเนียมสำหรับครอบครัวหรือผู้ช่วย',
    },
    {
      question: 'ThaiHelper แตกต่างจากเอเจนซี่ทั่วไปอย่างไร?',
      answer: 'เอเจนซี่ทั่วไปคิดค่านายหน้า 1–3 เดือนของเงินเดือน บวกค่าคอมมิชชั่นต่อเนื่อง ThaiHelper ใช้งานฟรีและเชื่อมต่อคุณกับผู้ช่วยโดยตรง — ไม่มีค่าคอมมิชชั่น ไม่มีคนกลาง คุณตกลงเรื่องเงินเดือนกับผู้ช่วยโดยตรง',
    },
    {
      question: 'ThaiHelper ตรวจสอบผู้ช่วยอย่างไร?',
      answer: 'ThaiHelper เป็นแพลตฟอร์มไดเรกทอรี ไม่ใช่บริษัทจัดหางาน เรายืนยันที่อยู่อีเมลของผู้ช่วยทุกคน แต่ไม่ได้ตรวจสอบบัตรประชาชนหรือประวัติอาชญากรรม กรุณาสัมภาษณ์ ขอข้อมูลอ้างอิง และยืนยันข้อกำหนดทางกฎหมาย (เช่น ใบอนุญาตทำงาน การลงทะเบียนประกันสังคม) ก่อนจ้าง',
    },
    {
      question: 'ฉันหาพี่เลี้ยงหรือแม่บ้านในเมืองของฉันได้อย่างไร?',
      answer: 'เรียกดูรายชื่อผู้ช่วยที่ thaihelper.app/helpers และกรองตามเมือง (กรุงเทพ เชียงใหม่ ภูเก็ต พัทยา เกาะสมุย หัวหิน และอีกมากมาย) ประเภทบริการ ประสบการณ์ และภาษา คลิกที่โปรไฟล์เพื่อดูรายละเอียดและส่งข้อความถึงผู้ช่วยได้โดยตรง',
    },
    {
      question: 'พี่เลี้ยงหรือแม่บ้านในประเทศไทยราคาเท่าไหร่?',
      answer: 'ในปี 2026 แม่บ้านเต็มเวลาแบบไม่อยู่ประจำในประเทศไทยราคา 12,000–18,000 บาท/เดือน พี่เลี้ยงเต็มเวลาในกรุงเทพ 15,000–25,000 บาท/เดือน และ 12,000–18,000 บาท/เดือนในเชียงใหม่ พ่อครัวส่วนตัว 18,000–35,000 บาท/เดือน และคนขับรถส่วนตัว 15,000–25,000 บาท/เดือน',
    },
    {
      question: 'การจ้างพนักงานในบ้านในประเทศไทยถูกกฎหมายหรือไม่?',
      answer: 'ใช่ การจ้างคนงานในบ้านในประเทศไทยถูกกฎหมายและเป็นเรื่องปกติ นายจ้างต้องจ่ายค่าจ้างขั้นต่ำ (370 บาท/วันในกรุงเทพ) ให้วันหยุด 1 วันต่อสัปดาห์ ลาประจำปี 6 วัน และวันหยุดที่ได้รับเงิน 13 วัน สำหรับงานเต็มเวลานายจ้างต้องลงทะเบียนผู้ช่วยกับประกันสังคม ชาวต่างชาติสามารถจ้างคนไทยได้โดยไม่ต้องมีใบอนุญาตทำงานสำหรับผู้ช่วย',
    },
  ],
};

const T = {
  en: {
    page_title: 'Find Household Staff in Thailand – ThaiHelper',
    nav_home: 'Home',
    nav_helpers: 'For Helpers',
    nav_blog: 'Blog',
    nav_login: 'Login',
    nav_cta: 'Register Free',
    // Hero
    hero_eyebrow: 'For Families & Households',
    hero_h1: 'Find your',
    hero_h1b: 'Trusted',
    hero_h1c: 'Helper today.',
    hero_shimmer: 'No middlemen, no fees.',
    hero_p: 'Browse verified nannies, housekeepers, chefs, drivers and more in your city. Create a free account and start messaging helpers today.',
    hero_cta: 'Create Free Account',
    hero_browse: 'Browse Helper Profiles — No account needed',
    hero_badge: '100% free for everyone',
    // Work permit banner (just below hero)
    wp_label: 'Work Permits & Visas',
    wp_title: 'Need a work permit for your nanny?',
    wp_p: 'Take our 2-minute wizard to find out whether you really need a WP, what it costs, and how long it takes — or jump straight to a vetted lawyer in your city.',
    wp_cta_wizard: 'Start the Wizard →',
    wp_cta_directory: 'Find an Expert',
    nav_wizard: 'Work Permit Wizard',
    nav_resources: 'Resources',
    nav_browse_helpers: 'Browse Helpers',
    nav_directory: 'Expert Directory',
    nav_faq: 'FAQ',
    // How it works
    how_label: 'How It Works',
    how_title: '3 simple steps',
    how_sub: 'We connect you directly with household professionals. No middleman.',
    how1_h: 'Create Your Account',
    how1_p: 'Register for free in 30 seconds. Tell us your city and what type of help you need.',
    how2_h: 'Browse Profiles',
    how2_p: 'Browse email-verified helper profiles with full experience, skills and languages — for free.',
    how3_h: 'Message Directly',
    how3_p: 'Chat with helpers right on the platform with built-in translation. No middlemen, no commissions.',
    // Why
    why_label: 'Why ThaiHelper',
    why_title: 'A better way to find help',
    why_sub: 'We built ThaiHelper because finding trusted help should be simple, transparent and affordable.',
    why1_h: '100% Free to Start',
    why1_p: 'No sign-up fees, no subscriptions, no commissions. Browse profiles, message helpers, and connect — all free.',
    why2_h: 'No Middleman Fees',
    why2_p: 'Connect directly with helpers. We charge a small platform fee — no commissions on salaries.',
    why3_h: 'Email-Verified Profiles',
    why3_p: 'Every helper confirms their email before their profile goes live. ThaiHelper is a directory platform — interview helpers and check references yourself, just like hiring through word of mouth.',
    why4_h: 'All Categories in One Place',
    why4_p: 'Nannies, housekeepers, chefs, drivers, gardeners, elder care, tutors — find everyone you need.',
    why5_h: 'Direct Communication',
    why5_p: 'Chat directly with helpers. Negotiate your own terms, schedules and salary — no interference.',
    why6_h: 'City-Based Matching',
    why6_p: 'We show you helpers in your area. Bangkok, Phuket, Chiang Mai, Pattaya, Koh Samui and more.',
    // Preview
    pricing_label: 'Pricing',
    pricing_title: 'Simple, transparent pricing',
    pricing_sub: 'One-time payments — no subscription, nothing auto-renews. Pay only when you\'re ready to message helpers directly.',
    pricing_promo: 'Currently 100% free during launch — no credit card required.',
    pricing_no_subscription: 'No subscription · No auto-renewal · Cancel anytime by simply not renewing',
    pricing_tier1_name: '1 Month',
    pricing_tier1_price: '$9',
    pricing_tier1_desc: 'For a one-off hire',
    pricing_tier3_name: '3 Months',
    pricing_tier3_price: '$19',
    pricing_tier3_desc: 'Most popular — time to interview & trial',
    pricing_tier3_save: 'Save 30%',
    pricing_tier3_badge: '⭐ Best Value',
    pricing_tier12_name: '12 Months',
    pricing_tier12_price: '$49',
    pricing_tier12_desc: 'For households hiring more than once',
    pricing_tier12_save: 'Save 55%',
    pricing_feat_browse: 'Browse all helper profiles',
    pricing_feat_message: 'Unlimited direct messaging',
    pricing_feat_contact: 'Unlock WhatsApp & phone',
    pricing_feat_favs: 'Save favourite helpers',
    pricing_compare: 'Compare with traditional agencies: 5,000–25,000 THB placement fee + 1 month salary commission',
    pricing_full_link: 'See full pricing & FAQ →',
    preview_label: 'Featured Helpers',
    preview_title: 'Real helpers ready to start',
    preview_sub: 'Hand-picked recently registered helpers across Bangkok, Phuket and beyond. Click any profile to see their full details.',
    preview_view_all: 'See all helpers →',
    preview_badge: 'Example',
    preview_exp: 'yrs experience',
    preview_locked: 'Contact at Launch',
    preview_note: 'These are example profiles. Real helper profiles will be available after launch in April 2026.',
    // CTA Card
    form_label: 'Register Now',
    form_title: 'Start Hiring Today',
    form_sub: 'Create your free account and message helpers directly.',
    promo_badge: '100% free — no credit card',
    cta_card_h: 'Create Your Free Account',
    cta_card_sub: 'Free account with full messaging access. Find the perfect helper for your family.',
    cta_card_b1: 'Browse verified helper profiles in your city',
    cta_card_b2: 'Message helpers directly with built-in translation',
    cta_card_b3: 'No middleman fees — ever',
    cta_card_btn: 'Create Free Account',
    cta_card_login_q: 'Already have an account?',
    cta_card_login: 'Login',
    // Launch banner
    launch_label: 'Launch Timeline',
    launch_title: 'We\'re launching in April 2026',
    launch_p: 'ThaiHelper is brand new. We\'re building the largest network of verified household staff in Thailand. Be among the first families to join.',
    launch_stat1_n: '7',
    launch_stat1_l: 'Staff Categories',
    launch_stat2_n: '6+',
    launch_stat2_l: 'Cities Covered',
    launch_stat3_n: '$0',
    launch_stat3_l: 'Registration Fee',
    // FAQ
    faq_label: 'FAQ',
    faq_title: 'Common questions from families',
    faq_sub: 'Quick answers about pricing, verification, and how to hire household staff in Thailand.',
    faq_more: 'See all FAQs →',
    // CTA
    cta_title: 'Know a great helper?',
    cta_sub: 'Tell your nanny, housekeeper, or driver about ThaiHelper. They can register for free and get discovered by families like yours.',
    cta_btn: 'Share with Helpers',
    // Footer
    footer_desc: 'ThaiHelper connects families and expats in Thailand with trusted household staff. Direct connections, no middlemen.',
    footer_disclaimer: 'ThaiHelper.app is free to use. We are not a recruitment agency and do not provide placement services. Compliance with Thai labor and immigration laws is the sole responsibility of the users.',
    footer_product: 'Product',
    footer_fp1: 'For Helpers',
    footer_fp2: 'For Families',
    footer_fp3: 'How It Works',
    footer_fp4: 'Work Permit Wizard',
    footer_fp5: 'Expert Directory',
    footer_company: 'Company',
    footer_fc1: 'About Us',
    footer_fc2: 'Contact', footer_line: 'LINE',
    footer_legal: 'Legal',
    footer_fl1: 'Privacy Policy',
    footer_fl2: 'Terms of Service',
    footer_copy: '© 2026 ThaiHelper. All rights reserved.',
  },
  th: {
    page_title: 'หาพนักงานดูแลบ้านในประเทศไทย – ThaiHelper',
    nav_home: 'หน้าแรก',
    nav_helpers: 'สำหรับผู้ช่วย',
    nav_blog: 'บล็อก',
    nav_login: 'เข้าสู่ระบบ',
    nav_cta: 'ลงทะเบียนฟรี',
    hero_eyebrow: 'สำหรับครอบครัวและครัวเรือน',
    hero_h1: 'หาผู้ช่วย',
    hero_h1b: 'ที่ไว้ใจได้',
    hero_h1c: 'วันนี้',
    hero_shimmer: 'ไม่มีคนกลาง ไม่มีค่าธรรมเนียม',
    hero_p: 'ค้นหาพี่เลี้ยง แม่บ้าน พ่อครัว คนขับรถ และอื่นๆ สร้างบัญชีฟรีและเริ่มส่งข้อความหาผู้ช่วยได้วันนี้',
    hero_cta: 'สร้างบัญชีฟรี',
    hero_browse: 'ดูโปรไฟล์ผู้ช่วย — ไม่ต้องสมัคร',
    hero_badge: 'ฟรี 100% สำหรับทุกคน',
    wp_label: 'ใบอนุญาตทำงานและวีซ่า',
    wp_title: 'ต้องการใบอนุญาตทำงานสำหรับพี่เลี้ยงของคุณ?',
    wp_p: 'ทำแบบสอบถาม 2 นาทีของเรา เพื่อดูว่าคุณจำเป็นต้องมี WP หรือไม่ ค่าใช้จ่ายเท่าไหร่ และใช้เวลานานแค่ไหน หรือไปหาทนายความที่เชื่อถือได้ในเมืองของคุณได้เลย',
    wp_cta_wizard: 'เริ่มแบบสอบถาม →',
    wp_cta_directory: 'หาผู้เชี่ยวชาญ',
    nav_wizard: 'ตัวช่วยใบอนุญาตทำงาน',
    nav_resources: 'แหล่งข้อมูล',
    nav_browse_helpers: 'ดูผู้ช่วย',
    nav_directory: 'รายชื่อผู้เชี่ยวชาญ',
    nav_faq: 'คำถามที่พบบ่อย',
    how_label: 'วิธีการใช้งาน',
    how_title: '3 ขั้นตอนง่ายๆ',
    how_sub: 'เราเชื่อมต่อคุณกับผู้เชี่ยวชาญดูแลบ้านโดยตรง ไม่มีคนกลาง',
    how1_h: 'สร้างบัญชี',
    how1_p: 'ลงทะเบียนฟรีใน 30 วินาที บอกเราว่าคุณอยู่เมืองไหนและต้องการความช่วยเหลือแบบไหน',
    how2_h: 'ดูโปรไฟล์',
    how2_p: 'ดูโปรไฟล์ผู้ช่วยที่ผ่านการยืนยัน เรตติ้ง และประสบการณ์ได้ฟรี',
    how3_h: 'ส่งข้อความโดยตรง',
    how3_p: 'แชทกับผู้ช่วยบนแพลตฟอร์มได้เลย พร้อมการแปลอัตโนมัติ ไม่มีคนกลาง ไม่มีค่าคอมมิชชั่น',
    why_label: 'ทำไม ThaiHelper',
    why_title: 'วิธีที่ดีกว่าในการหาผู้ช่วย',
    why_sub: 'เราสร้าง ThaiHelper เพราะการหาผู้ช่วยที่ไว้ใจได้ควรง่าย โปร่งใส และราคาไม่แพง',
    why1_h: 'ฟรี 100% เมื่อเริ่มต้น',
    why1_p: 'ไม่มีค่าสมัคร ไม่มีค่าสมาชิกรายเดือน ดูโปรไฟล์ฟรี',
    why2_h: 'ไม่มีค่าคนกลาง',
    why2_p: 'ติดต่อผู้ช่วยโดยตรง เราคิดค่าธรรมเนียมแพลตฟอร์มเล็กน้อย ไม่หักค่าคอมมิชชั่นจากเงินเดือน',
    why3_h: 'โปรไฟล์ที่ยืนยันอีเมล',
    why3_p: 'ผู้ช่วยทุกคนยืนยันอีเมลก่อนโปรไฟล์จะเปิดให้ดู ThaiHelper เป็นแพลตฟอร์มไดเรกทอรี — กรุณาสัมภาษณ์และตรวจสอบข้อมูลอ้างอิงด้วยตัวเอง เหมือนการจ้างผ่านการบอกต่อ',
    why4_h: 'ทุกหมวดหมู่ในที่เดียว',
    why4_p: 'พี่เลี้ยง แม่บ้าน พ่อครัว คนขับ คนสวน ดูแลผู้สูงอายุ ติวเตอร์ — หาทุกอย่างที่ต้องการ',
    why5_h: 'สื่อสารโดยตรง',
    why5_p: 'แชทกับผู้ช่วยโดยตรง เจรจาเงื่อนไข ตารางเวลา และเงินเดือนด้วยตัวเอง',
    why6_h: 'จับคู่ตามเมือง',
    why6_p: 'เราแสดงผู้ช่วยในพื้นที่ของคุณ กรุงเทพ ภูเก็ต เชียงใหม่ พัทยา เกาะสมุย และอื่นๆ',
    pricing_label: 'ราคา',
    pricing_title: 'ราคาเรียบง่ายและโปร่งใส',
    pricing_sub: 'จ่ายครั้งเดียว — ไม่ใช่ระบบสมาชิก ไม่มีการต่ออายุอัตโนมัติ จ่ายเมื่อคุณพร้อมจะส่งข้อความถึงผู้ช่วยโดยตรงเท่านั้น',
    pricing_promo: 'ขณะนี้ฟรี 100% ในช่วงเปิดตัว — ไม่ต้องใช้บัตรเครดิต',
    pricing_no_subscription: 'ไม่ใช่ระบบสมาชิก · ไม่มีการต่ออายุอัตโนมัติ · ยกเลิกได้โดยไม่ต้องต่ออายุ',
    pricing_tier1_name: '1 เดือน',
    pricing_tier1_price: '$9',
    pricing_tier1_desc: 'สำหรับการจ้างครั้งเดียว',
    pricing_tier3_name: '3 เดือน',
    pricing_tier3_price: '$19',
    pricing_tier3_desc: 'ยอดนิยม — เวลาสัมภาษณ์และทดลองงาน',
    pricing_tier3_save: 'ประหยัด 30%',
    pricing_tier3_badge: '⭐ คุ้มที่สุด',
    pricing_tier12_name: '12 เดือน',
    pricing_tier12_price: '$49',
    pricing_tier12_desc: 'สำหรับครัวเรือนที่จ้างหลายครั้งต่อปี',
    pricing_tier12_save: 'ประหยัด 55%',
    pricing_feat_browse: 'ดูโปรไฟล์ผู้ช่วยทั้งหมด',
    pricing_feat_message: 'ส่งข้อความได้ไม่จำกัด',
    pricing_feat_contact: 'ปลดล็อก WhatsApp และเบอร์โทร',
    pricing_feat_favs: 'บันทึกผู้ช่วยที่ชอบ',
    pricing_compare: 'เปรียบเทียบกับเอเจนซี่ทั่วไป: ค่านายหน้า 5,000–25,000 บาท + ค่าคอมมิชชั่น 1 เดือน',
    pricing_full_link: 'ดูราคาเต็มและคำถามที่พบบ่อย →',
    preview_label: 'ผู้ช่วยแนะนำ',
    preview_view_all: 'ดูผู้ช่วยทั้งหมด →',
    preview_label_old: 'ตัวอย่างโปรไฟล์',
    preview_title: 'ผู้ช่วยจริงพร้อมเริ่มงาน',
    preview_sub: 'ผู้ช่วยที่ลงทะเบียนล่าสุดในกรุงเทพ ภูเก็ต และเมืองอื่นๆ คลิกเพื่อดูรายละเอียดเพิ่มเติม',
    preview_badge: 'ตัวอย่าง',
    preview_exp: 'ปี ประสบการณ์',
    preview_locked: 'ติดต่อเมื่อเปิดตัว',
    preview_note: 'นี่คือโปรไฟล์ตัวอย่าง โปรไฟล์จริงจะพร้อมใช้งานหลังเปิดตัวในเดือนเมษายน 2026',
    form_label: 'ลงทะเบียนเลย',
    form_title: 'เริ่มจ้างวันนี้',
    form_sub: 'สร้างบัญชีฟรีและส่งข้อความหาผู้ช่วยโดยตรง',
    promo_badge: 'ฟรี 100% ในช่วงเปิดตัว — ไม่ต้องใช้บัตรเครดิต',
    cta_card_h: 'สร้างบัญชีฟรีของคุณ',
    cta_card_sub: 'บัญชีฟรีพร้อมสิทธิ์ส่งข้อความเต็มรูปแบบ หาผู้ช่วยที่ใช่สำหรับครอบครัวของคุณ',
    cta_card_b1: 'ดูโปรไฟล์ผู้ช่วยที่ผ่านการยืนยันในเมืองของคุณ',
    cta_card_b2: 'ส่งข้อความหาผู้ช่วยพร้อมการแปลอัตโนมัติ',
    cta_card_b3: 'ไม่มีค่าคนกลาง — ตลอดไป',
    cta_card_btn: 'สร้างบัญชีฟรี',
    cta_card_login_q: 'มีบัญชีอยู่แล้ว?',
    cta_card_login: 'เข้าสู่ระบบ',
    launch_label: 'เปิดตัว',
    launch_title: 'เราเปิดตัวเมษายน 2026',
    launch_p: 'ThaiHelper เป็นแพลตฟอร์มใหม่ เรากำลังสร้างเครือข่ายพนักงานดูแลบ้านที่ผ่านการยืนยันที่ใหญ่ที่สุดในประเทศไทย',
    launch_stat1_n: '7', launch_stat1_l: 'หมวดหมู่', launch_stat2_n: '6+', launch_stat2_l: 'เมืองที่ครอบคลุม', launch_stat3_n: '$0', launch_stat3_l: 'ค่าลงทะเบียน',
    faq_label: 'คำถามที่พบบ่อย',
    faq_title: 'คำถามที่ครอบครัวมักถาม',
    faq_sub: 'คำตอบสั้นๆ เกี่ยวกับราคา การยืนยันตัวตน และวิธีจ้างพนักงานในบ้านในประเทศไทย',
    faq_more: 'ดูคำถามทั้งหมด →',
    cta_title: 'รู้จักผู้ช่วยดีๆ ไหม?',
    cta_sub: 'บอกพี่เลี้ยง แม่บ้าน หรือคนขับของคุณเกี่ยวกับ ThaiHelper พวกเขาสามารถลงทะเบียนฟรี',
    cta_btn: 'แชร์กับผู้ช่วย',
    footer_desc: 'ThaiHelper เชื่อมต่อครอบครัวและชาวต่างชาติในประเทศไทยกับพนักงานดูแลบ้านที่ไว้ใจได้ เชื่อมต่อโดยตรง ไม่มีคนกลาง',
    footer_disclaimer: 'ThaiHelper.app ใช้งานฟรี เราไม่ใช่บริษัทจัดหางานและไม่ได้ให้บริการจัดหางาน การปฏิบัติตามกฎหมายแรงงานและกฎหมายตรวจคนเข้าเมืองของไทยเป็นความรับผิดชอบของผู้ใช้แต่เพียงผู้เดียว',
    footer_product: 'ผลิตภัณฑ์', footer_fp1: 'สำหรับผู้ช่วย', footer_fp2: 'สำหรับครอบครัว', footer_fp3: 'วิธีการใช้งาน', footer_fp4: 'ตัวช่วยใบอนุญาตทำงาน', footer_fp5: 'รายชื่อผู้เชี่ยวชาญ',
    footer_company: 'บริษัท', footer_fc1: 'เกี่ยวกับเรา', footer_fc2: 'ติดต่อ', footer_line: 'LINE',
    footer_legal: 'กฎหมาย', footer_fl1: 'นโยบายความเป็นส่วนตัว', footer_fl2: 'ข้อกำหนดการใช้บริการ',
    footer_copy: '© 2026 ThaiHelper สงวนลิขสิทธิ์',
  },
};

const EMPLOYER_TRUST_SLIDES = [
  {
    id: 'no-fees',
    title: 'Hire Directly, Save Money',
    description: 'Traditional hiring options can be expensive and unclear. ThaiHelper is free for families. Zero fees, zero commission — just direct hiring.',
    image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=600&fit=crop',
  },
  {
    id: 'no-facebook',
    title: 'No More Facebook Chaos',
    description: 'Scrolling through Facebook groups, hoping to find someone reliable? Unstructured posts, fake leads, and spam. ThaiHelper gives you real, structured profiles with email-verified accounts.',
    image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&h=600&fit=crop',
  },
  {
    id: 'structured-profiles',
    title: 'Know Who You\'re Talking To',
    description: 'Every helper on ThaiHelper has an email-verified profile with experience, skills, languages and photos — so you can shortlist before you even say hello.',
    image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=600&fit=crop',
  },
  {
    id: 'direct',
    title: 'Talk Directly, No Middleman',
    description: 'No middleman between you and your future nanny. Chat directly, discuss your needs, agree on salary and schedule — on your terms.',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop',
  },
  {
    id: 'nearby',
    title: 'Helpers in Your City',
    description: 'Whether you\'re in Bangkok, Phuket, Chiang Mai, or Koh Samui — we show you helpers who actually live near you. No more "sorry, I\'m in another province."',
    image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&h=600&fit=crop',
  },
  {
    id: 'all-staff',
    title: 'One Place for Everything',
    description: 'Need a nanny AND a housekeeper? Maybe a driver too? Stop searching across multiple places. Find all household staff in one place.',
    image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600&fit=crop',
  },
];

// Sample profiles for the employer-landing preview. Same shape as the
// /helpers API and the helper-landing preview, so the shared <HelperCard>
// component renders all three places identically.
const PROFILES = [
  {
    photo:'/images/profiles/maria.jpg',
    name:'Maria S.', age:32, verified:true,
    category_en:'👶 Nanny & Babysitter', category_th:'👶 พี่เลี้ยงเด็ก',
    city:'Phuket', area:'Rawai',
    bio_en:'Loving nanny with 5 years caring for infants and toddlers. Experienced with school runs and overnight care.',
    bio_th:'พี่เลี้ยงใจดี ดูแลทารกและเด็กเล็กมา 5 ปี รับส่งโรงเรียนและดูแลกลางคืนได้',
    experience:5, languages:'English, Filipino',
  },
  {
    photo:'/images/profiles/sunisa.jpg',
    name:'Sunisa K.', age:41, verified:true,
    category_en:'🏠 Housekeeper & Cleaner', category_th:'🏠 แม่บ้าน',
    city:'Bangkok', area:'Sukhumvit',
    bio_en:'Reliable housekeeper. 8 years with expat families. Cleaning, laundry, light cooking.',
    bio_th:'แม่บ้านที่ไว้ใจได้ ทำงานกับครอบครัวต่างชาติ 8 ปี ทำความสะอาด ซักรีด ทำอาหารง่ายๆ',
    experience:8, languages:'Thai, English',
  },
  {
    photo:'/images/profiles/ana.jpg',
    name:'Ana R.', age:29, verified:true,
    category_en:'👨‍🍳 Private Chef & Cook', category_th:'👨‍🍳 พ่อครัวส่วนตัว',
    city:'Phuket', area:'Kata',
    bio_en:'Private chef specialising in Thai and Western cuisine. Trained in pastry and weekly meal prep.',
    bio_th:'พ่อครัวส่วนตัว ชำนาญอาหารไทยและตะวันตก ทำขนมอบและเตรียมอาหารรายสัปดาห์',
    experience:3, languages:'English, Thai, Filipino',
  },
];

// Fetch up to 6 "showcase-ready" helpers server-side: verified, with photo
// and a non-empty bio, ordered newest first. We render these in the
// Featured Helpers carousel so the employer landing shows real, live
// people instead of stock images. If the fetch fails, we just render an
// empty array — the section is hidden by the JSX guard below.
export async function getServerSideProps() {
  try {
    const { getServiceSupabase } = await import('@/lib/supabase');
    const { getDisplayAge } = await import('@/lib/age');
    const supabase = getServiceSupabase();
    // Pull a wider candidate pool, then score + curate down to the best 6.
    // We don't want "newest 6" because newest can be incomplete profiles —
    // we want the best foot forward on the employer landing.
    const { data } = await supabase
      .from('helper_profiles')
      .select(
        'helper_ref, first_name, last_name, age, date_of_birth, category, ' +
        'skills, city, area, experience, languages, rate, ' +
        'bio, bio_en, photo_url, created_at'
      )
      .or('status.eq.active,status.is.null')
      .eq('email_verified', true)
      .not('photo_url', 'is', null)
      .not('bio', 'is', null)
      .neq('category', 'multiple') // legacy bucket — refined helpers only
      .limit(40);

    const thaiOrForeignRe = /[\u0400-\u04FF\u0600-\u06FF\u0900-\u097F\u0980-\u09FF\u0B80-\u0BFF\u0E00-\u0E7F\u0E80-\u0EFF\u1000-\u109F\u1780-\u17FF\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/;

    const score = (row) => {
      let s = 0;
      if (row.bio && row.bio.length > 80) s += 3;
      if (row.bio_en && row.bio_en.length > 40) s += 2; // we have an English version
      // bio is already English (no foreign script, no need for bio_en)
      if (row.bio && !thaiOrForeignRe.test(row.bio)) s += 2;
      if (row.skills && row.skills.split(',').length >= 2) s += 2;
      if (row.languages) s += 1;
      if (row.rate) s += 1;
      if (row.area) s += 1;
      if (row.city && row.city !== 'other') s += 1;
      if (row.category && !row.category.includes('multiple')) s += 1;
      // Recency tie-breaker — newer profiles edged ahead when score ties.
      s += (new Date(row.created_at).getTime() / 1e13);
      return s;
    };

    const featuredHelpers = (data || [])
      .map(row => ({ row, s: score(row) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 6)
      .map(({ row }) => ({
        ref: row.helper_ref,
        firstName: row.first_name,
        lastName: row.last_name ? row.last_name.charAt(0) + '.' : '',
        age: getDisplayAge(row) || null,
        category: row.category || '',
        skills: row.skills || '',
        city: row.city || '',
        area: row.area || '',
        experience: row.experience || '',
        languages: row.languages || '',
        rate: row.rate || '',
        bio: row.bio || '',
        bioEn: row.bio_en || '',
        photo: row.photo_url || '',
      }));

    return { props: { featuredHelpers } };
  } catch (err) {
    console.error('Failed to fetch featured helpers:', err);
    return { props: { featuredHelpers: [] } };
  }
}

function getCategoryLabel(slugCsv, lang) {
  if (!slugCsv) return '';
  return String(slugCsv)
    .split(/[,]+/).map(s => s.trim()).filter(Boolean)
    .map(slug => {
      const cat = CATEGORIES.find(c => c.value === slug);
      return cat ? (cat[lang] || cat.en) : slug;
    })
    .join(' · ');
}

export default function Employers({ featuredHelpers = [] }) {
  const { lang, setLang: changeLang } = useLang();
  const t = T[lang];
  const [viewingHelper, setViewingHelper] = useState(null);

  // Hero "Latest signups" grid — same data source as the helpers
  // homepage but framed as a discovery grid for families. Fetches 8
  // entries for the 4×2 grid (vs. 4 on the helpers page panel).
  const [recentHelpers, setRecentHelpers] = useState(FALLBACK_HELPERS);
  const [totalHelpers, setTotalHelpers] = useState(80);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/recent-helpers?limit=8')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.helpers && data.helpers.length > 0) {
          setRecentHelpers(data.helpers.slice(0, 8));
        }
        if (typeof data?.count === 'number' && data.count > 80) {
          setTotalHelpers(data.count);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <SEOHead
        title="For Families – Find Trusted Household Staff"
        description="Find and hire verified nannies, housekeepers, chefs, drivers and more in Thailand. Direct communication with candidates, no middleman fees."
        path="/employers"
        lang={lang}
        jsonLd={[
          getBreadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'For Families', path: '/employers' }]),
          getServiceSchema(),
          getSpeakableSchema('/employers'),
          getFAQSchema(EMPLOYER_FAQS.en),
        ]}
      />

      <div className={`bg-surface text-on-background font-body ${lang === 'th' ? 'lang-th' : ''}`}>

        {/* UTILITY TOP BAR — audience switch to helper landing.
            Mirrors the navy bar on the helper landing (pages/index.js) but
            in primary teal so the two pages feel like a matched set. */}
        <div className="fixed top-0 left-0 w-full bg-[#006a62] text-white z-[60]">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 md:py-2.5 flex justify-end items-center text-xs md:text-sm">
            <Link href="/" className="font-medium hover:text-gold transition-colors flex items-center gap-1.5 whitespace-nowrap">
              <span className="opacity-80">
                {lang === 'en' ? 'Are you a helper looking for work?' : 'คุณเป็นผู้ช่วยที่กำลังหางาน?'}
              </span>
              <span className="font-bold">{t.nav_helpers} →</span>
            </Link>
          </div>
        </div>

        {/* NAV */}
        <nav className="fixed top-9 md:top-11 left-0 w-full flex justify-between items-center px-4 md:px-6 py-3 md:py-4 bg-white/90 backdrop-blur-md z-50 shadow-sm">
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl md:text-2xl font-bold font-headline"><span>Thai</span><span style={{color:"#006a62"}}>Helper</span></span>
            </Link>
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-[#001b3d] text-white text-[10px] font-bold tracking-wide uppercase">
              {lang === 'en' ? 'For Families' : 'สำหรับครอบครัว'}
            </span>
          </div>
          {(() => {
            // Same set of items powers both the desktop dropdown and the
            // mobile slide-out panel — defined once so they stay in sync.
            const navItems = [
              { href: '/helpers',             label: t.nav_browse_helpers },
              { href: '/work-permit-wizard',  label: t.nav_wizard },
              { href: '/directory',           label: t.nav_directory },
              { href: '/faq',                 label: t.nav_faq },
              { href: '/blog',                label: t.nav_blog },
            ];
            return (
              <>
                {/* Desktop nav — lg and up */}
                <div className="hidden lg:flex items-center gap-4">
                  <ResourcesDropdown label={t.nav_resources} items={navItems} />
                  <Link className="text-sm font-semibold text-[#001b3d] hover:text-primary transition-colors" href="/login">{t.nav_login}</Link>
                  <LangSwitcher />
                  <Link
                    className="px-6 py-2.5 rounded-full bg-[#001b3d] text-white text-sm font-semibold hover:bg-[#002d5f] hover:shadow-lg transition-all active:scale-95 duration-150 whitespace-nowrap"
                    href="/employer-register"
                  >
                    {t.nav_cta}
                  </Link>
                </div>

                {/* Mobile / tablet nav — below lg */}
                <div className="lg:hidden">
                  <MobileMenu
                    items={navItems}
                    secondaryCta={{ href: '/login', label: t.nav_login }}
                    primaryCta={{ href: '/employer-register', label: t.nav_cta }}
                  />
                </div>
              </>
            );
          })()}
        </nav>

        <main className="pt-24 md:pt-28">

          {/* HERO — text left, 2×4 latest-signups grid right (cream bg full width) */}
          <section className="relative px-6 py-16 md:py-24 overflow-hidden" style={{background:'linear-gradient(180deg, #FFF4E5 0%, #FFFAF0 100%)'}}>
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
              {/* Left: text */}
              <div className="z-10">
                <div className="flex items-center gap-3 mb-5">
                  <span className="block w-8 h-0.5 bg-gold"></span>
                  <span className="text-xs font-bold tracking-[0.25em] uppercase text-gold">{t.hero_eyebrow}</span>
                </div>
                <h1 className="font-extrabold font-headline leading-[1.0] text-on-background mb-1 uppercase" style={{fontSize:'clamp(2.4rem,5.5vw,4.5rem)'}}>
                  {t.hero_h1}
                </h1>
                <span className="block font-extrabold font-headline leading-[1.0] text-gold mb-1 uppercase" style={{fontSize:'clamp(2.4rem,5.5vw,4.5rem)'}}>
                  {t.hero_h1b}
                </span>
                <span className="block font-extrabold font-headline leading-[1.0] text-on-background mb-4 uppercase" style={{fontSize:'clamp(2.4rem,5.5vw,4.5rem)'}}>
                  {t.hero_h1c}
                </span>
                <p className="font-extrabold font-headline mb-6 hero-gold-line" style={{fontSize:'clamp(1.3rem,2.8vw,2rem)'}}>
                  {t.hero_shimmer}
                </p>
                <p className="text-lg md:text-xl max-w-xl mb-8 leading-relaxed text-on-surface-variant">
                  {t.hero_p}
                </p>
                <Link className="px-8 py-4 rounded-xl bg-[#001b3d] text-white font-bold text-lg shadow-xl shadow-[#001b3d]/20 hover:bg-[#002d5f] hover:scale-[1.02] transition-all inline-block" href="/employer-register">{t.hero_cta}</Link>
              </div>

              {/* Right: 2×4 grid (8 helpers) with header + stats + browse */}
              <div className="relative h-full flex flex-col">
                <div className="hidden lg:block h-10 flex-shrink-0"></div>
                <div className="flex items-end justify-between pb-3 mb-3 border-b border-gold/20 flex-shrink-0">
                  <div>
                    <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-gold mb-1 block">{lang === 'th' ? 'ผู้สมัครล่าสุด' : 'Latest signups'}</span>
                    <h2 className="text-base sm:text-lg font-extrabold font-headline text-on-background leading-tight">{lang === 'th' ? 'สมาชิกใหม่ของเรา' : 'Recently joined helpers'}</h2>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 flex-shrink-0">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    {lang === 'th' ? 'สด' : 'Live'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 flex-1 content-around">
                  {recentHelpers.slice(0, 8).map((entry, i) => (
                    <Link
                      key={i}
                      href="/helpers"
                      className="bg-white rounded-xl p-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2.5 border border-gray-100"
                    >
                      {entry.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="w-10 h-10 rounded-lg object-cover flex-shrink-0" src={entry.photo} alt="" loading="lazy" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg text-white flex items-center justify-center font-bold text-sm flex-shrink-0 font-headline" style={{background:'linear-gradient(135deg,#006a62,#0a8a7e)'}}>
                          {entryInitials(entry.firstName, entry.lastInitial)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-on-background truncate">{entry.firstName} {entry.lastInitial}</div>
                        <div className="text-[11px] text-on-surface-variant mt-0.5 truncate">{roleLabel(entry.category, lang)} · {cityLabel(entry.city)}</div>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gold/30 flex-shrink-0">
                  <div className="text-center">
                    <div className="font-headline font-extrabold text-xl text-gold leading-none">{Math.floor(totalHelpers / 10) * 10}+</div>
                    <div className="text-[11px] text-on-surface-variant mt-1">{lang === 'th' ? 'ผู้ช่วยที่ยืนยันแล้ว' : 'Verified helpers'}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-headline font-extrabold text-xl text-gold leading-none">20+</div>
                    <div className="text-[11px] text-on-surface-variant mt-1">{lang === 'th' ? 'เมือง' : 'Cities'}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-headline font-extrabold text-xl text-gold leading-none">7</div>
                    <div className="text-[11px] text-on-surface-variant mt-1">{lang === 'th' ? 'หมวดหมู่' : 'Categories'}</div>
                  </div>
                </div>
                <Link className="mt-3 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gold text-on-background hover:bg-gold-dark hover:text-white font-bold text-sm transition-all" href="/helpers">{t.hero_browse}</Link>
              </div>
            </div>
          </section>

          {/* LAUNCH BANNER */}
          <section className="px-6 pb-8">
            <div className="max-w-4xl mx-auto rounded-2xl bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20 p-8 md:p-10">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold mb-2 block">{t.launch_label}</span>
                  <h3 className="text-xl md:text-2xl font-extrabold font-headline text-on-background mb-3">{t.launch_title}</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">{t.launch_p}</p>
                </div>
                <div className="flex gap-6 md:gap-8">
                  {[{n: t.launch_stat1_n, l: t.launch_stat1_l},{n: t.launch_stat2_n, l: t.launch_stat2_l},{n: t.launch_stat3_n, l: t.launch_stat3_l}].map((s,i) => (
                    <div key={i} className="text-center">
                      <div className="text-2xl md:text-3xl font-extrabold text-primary font-headline">{s.n}</div>
                      <div className="text-xs text-on-surface-variant mt-1">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* WORK PERMIT BANNER — wizard + directory entry point */}
          <section className="px-6 pb-12">
            <div className="max-w-4xl mx-auto rounded-2xl bg-gradient-to-br from-primary/5 via-white to-primary-container/10 border border-primary/20 p-8 md:p-10">
              <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8">
                <div className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl md:text-4xl">
                  📋
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2 block">{t.wp_label}</span>
                  <h3 className="text-xl md:text-2xl font-extrabold font-headline text-on-background mb-3">{t.wp_title}</h3>
                  <p className="text-on-surface-variant text-sm md:text-base leading-relaxed mb-5">{t.wp_p}</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/work-permit-wizard"
                      className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-container hover:shadow-lg transition-all"
                    >
                      {t.wp_cta_wizard}
                    </Link>
                    <Link
                      href="/directory"
                      className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white border-2 border-primary text-primary text-sm font-bold hover:bg-primary/5 transition-colors"
                    >
                      {t.wp_cta_directory}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section className="py-16 md:py-24 px-6 bg-surface">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2 block">{t.how_label}</span>
                <h2 className="text-3xl md:text-4xl font-extrabold font-headline text-on-background mb-4">{t.how_title}</h2>
                <p className="text-on-surface-variant max-w-2xl mx-auto">{t.how_sub}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {n:'1', h:t.how1_h, p:t.how1_p, icon: <UserPlus className="w-7 h-7" />, color:'text-[#F4A261]', bg:'bg-[#F4A261]/10'},
                  {n:'2', h:t.how2_h, p:t.how2_p, icon: <MessageCircle className="w-7 h-7" />, color:'text-[#006a62]', bg:'bg-[#006a62]/10'},
                  {n:'3', h:t.how3_h, p:t.how3_p, icon: <PartyPopper className="w-7 h-7" />, color:'text-[#8B5CF6]', bg:'bg-[#8B5CF6]/10'},
                ].map((s,i) => (
                  <div key={i} className="text-center relative">
                    {/* Curved dotted connector to next step (desktop only) */}
                    {i < 2 && (
                      <svg className="hidden md:block absolute top-6 z-0" style={{left:'calc(50% + 44px)', width:'calc(100% - 56px)', height:'28px'}} viewBox="0 0 100 28" preserveAspectRatio="none" fill="none">
                        <path d="M0 4 C 30 26, 70 26, 100 4" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />
                      </svg>
                    )}
                    <div className={`w-20 h-20 rounded-full ${s.bg} ${s.color} flex items-center justify-center mx-auto mb-5 relative z-10`}>
                      {s.icon}
                    </div>
                    <h3 className="text-xl font-bold font-headline text-on-background mb-3">{s.h}</h3>
                    <p className="text-on-surface-variant text-sm leading-relaxed max-w-xs mx-auto">{s.p}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* WHY THAIHELPER */}
          <section className="py-16 md:py-24 px-6">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2 block">{t.why_label}</span>
                <h2 className="text-3xl md:text-4xl font-extrabold font-headline text-on-background mb-4">{t.why_title}</h2>
                <p className="text-on-surface-variant max-w-2xl mx-auto">{t.why_sub}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { h: t.why1_h, p: t.why1_p, Icon: Wallet,       color: 'text-[#F4A261]', bg: 'bg-[#F4A261]/10' },
                  { h: t.why2_h, p: t.why2_p, Icon: Ban,           color: 'text-[#E76F51]', bg: 'bg-[#E76F51]/10' },
                  { h: t.why3_h, p: t.why3_p, Icon: ShieldCheck,   color: 'text-[#006a62]', bg: 'bg-[#006a62]/10' },
                  { h: t.why4_h, p: t.why4_p, Icon: LayoutGrid,    color: 'text-[#8B5CF6]', bg: 'bg-[#8B5CF6]/10' },
                  { h: t.why5_h, p: t.why5_p, Icon: MessageCircle, color: 'text-[#0EA5E9]', bg: 'bg-[#0EA5E9]/10' },
                  { h: t.why6_h, p: t.why6_p, Icon: MapPin,        color: 'text-[#001b3d]', bg: 'bg-[#001b3d]/10' },
                ].map((b, i) => {
                  const Icon = b.Icon;
                  return (
                    <div key={i} className="bg-surface-container-low rounded-2xl p-6 hover:bg-surface-container transition-colors">
                      <div className={`w-12 h-12 rounded-xl ${b.bg} ${b.color} flex items-center justify-center mb-4`}>
                        <Icon className="w-6 h-6" strokeWidth={2.25} />
                      </div>
                      <h3 className="font-bold font-headline text-on-background mb-2">{b.h}</h3>
                      <p className="text-sm text-on-surface-variant leading-relaxed">{b.p}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>


          {/* FEATURED HELPERS — real, recently registered helpers fetched
              server-side. Each card opens the full HelperProfileModal so
              employers can read bio + skills before signing up. We keep
              the static PROFILES fallback for the very first launch days
              when there might not be enough verified+photo helpers yet. */}
          {(featuredHelpers.length > 0 ? featuredHelpers : null) && featuredHelpers.length > 0 && (
            <section className="py-16 md:py-24 px-6 bg-surface-container-low">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2 block">{t.preview_label}</span>
                  <h2 className="text-3xl md:text-4xl font-extrabold font-headline text-on-background mb-4">{t.preview_title}</h2>
                  <p className="text-on-surface-variant max-w-2xl mx-auto">{t.preview_sub}</p>
                </div>
                {/* Vertical stack of full-width cards — same shape as the
                    /helpers browse, so visitors get a consistent feel
                    when they jump from the landing to the full list. */}
                <div className="flex flex-col gap-4 max-w-4xl mx-auto">
                  {featuredHelpers.slice(0, 4).map((h) => (
                    <HelperCard
                      key={h.ref}
                      helper={{
                        ...h,
                        verified: true,
                        categoryLabel: getCategoryLabel(h.category, lang),
                      }}
                      t={{
                        card_exp: t.preview_exp || 'yrs experience',
                        card_verified: 'Verified',
                        card_signin: 'Sign in to message',
                        card_signin_btn: 'Login / Register',
                      }}
                      onViewProfile={setViewingHelper}
                    />
                  ))}
                </div>
                <div className="text-center mt-8">
                  <Link href="/helpers" className="inline-block text-sm font-semibold text-[#006a62] hover:underline">
                    {t.preview_view_all}
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* Helper detail modal — opens when a featured card is clicked.
              Footer CTA pushes anonymous visitors to register before they
              can message. */}
          {viewingHelper && (
            <HelperProfileModal
              helper={viewingHelper}
              onClose={() => setViewingHelper(null)}
              t={{ profile_about: 'About', profile_skills: 'Skills' }}
              lang={lang}
              footerCta={
                <Link
                  href="/employer-signup"
                  className="block w-full text-center px-4 py-3 rounded-lg bg-[#006a62] text-white text-sm font-bold hover:bg-[#004d47] transition-colors"
                >
                  🔒 Register to message {viewingHelper.firstName}
                </Link>
              }
            />
          )}

          {/* CALL TO ACTION — links to dedicated registration page */}
          <section id="register" className="py-16 md:py-24 px-6">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2 block">{t.form_label}</span>
                <h2 className="text-3xl md:text-4xl font-extrabold font-headline text-on-background mb-4">{t.form_title}</h2>
                <p className="text-on-surface-variant">{t.form_sub}</p>
              </div>

              <div className="bg-white rounded-[2rem] p-10 md:p-14 shadow-xl text-center">
                <h3 className="text-2xl md:text-3xl font-extrabold font-headline text-on-background mb-3">
                  {t.cta_card_h}
                </h3>
                <p className="text-on-surface-variant mb-8 max-w-md mx-auto leading-relaxed">
                  {t.cta_card_sub}
                </p>

                {/* Bullet points */}
                <ul className="text-left max-w-sm mx-auto mb-10 space-y-3">
                  {[t.cta_card_b1, t.cta_card_b2, t.cta_card_b3].map((b, i) => (
                    <li key={i} className="flex items-start gap-3 text-on-surface-variant">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#006a62" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className="text-sm md:text-base">{b}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/employer-register" className="inline-block px-10 py-4 rounded-xl bg-[#001b3d] text-white font-bold text-lg shadow-xl shadow-[#001b3d]/20 hover:bg-[#002d5f] hover:scale-[1.02] transition-all">
                  {t.cta_card_btn} →
                </Link>

                <p className="text-xs text-on-surface-variant mt-6">
                  {t.cta_card_login_q}{' '}
                  <Link href="/login" className="text-primary font-semibold hover:underline">
                    {t.cta_card_login}
                  </Link>
                </p>
              </div>
            </div>
          </section>

          {/* FAQ — visible content paired with FAQPage JSON-LD for AI search citation */}
          <section className="py-16 md:py-24 px-6 bg-surface-variant/30">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3 block">{t.faq_label}</span>
                <h2 className="text-3xl md:text-4xl font-extrabold font-headline text-on-background mb-4">{t.faq_title}</h2>
                <p className="text-on-surface-variant text-base md:text-lg">{t.faq_sub}</p>
              </div>

              <div className="space-y-4">
                {(EMPLOYER_FAQS[lang] || EMPLOYER_FAQS.en).map((faq, i) => (
                  <details
                    key={i}
                    className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-primary/30 transition-colors"
                  >
                    <summary className="flex items-center justify-between gap-4 p-5 md:p-6 cursor-pointer list-none">
                      <h3 className="font-bold text-on-background text-base md:text-lg leading-snug">{faq.question}</h3>
                      <span className="shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-open:bg-primary group-open:text-white transition-all">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-open:rotate-180 transition-transform">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                    </summary>
                    <div className="px-5 md:px-6 pb-5 md:pb-6 -mt-1 text-on-surface-variant text-sm md:text-base leading-relaxed">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>

              <div className="text-center mt-10">
                <Link href="/faq" className="text-primary font-semibold hover:underline">
                  {t.faq_more}
                </Link>
              </div>
            </div>
          </section>

          {/* CTA CROSS-PROMOTE */}
          <section className="py-16 md:py-24 px-6">
            <div className="max-w-5xl mx-auto rounded-[3rem] bg-gradient-to-br from-[#001b3d] to-[#003366] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-[#001b3d]/30">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-extrabold font-headline text-on-primary mb-6">{t.cta_title}</h2>
                <p className="text-on-primary/80 text-lg mb-10 max-w-2xl mx-auto">{t.cta_sub}</p>
                <Link className="px-10 py-5 bg-white text-primary font-bold rounded-2xl text-lg hover:shadow-xl hover:scale-105 transition-all inline-block" href="/register">{t.cta_btn}</Link>
              </div>
            </div>
          </section>

        </main>

        {/* FOOTER */}
        <footer className="w-full bg-slate-50 border-t border-slate-100">
          <div className="max-w-7xl mx-auto py-12 px-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8">
              <div className="max-w-xs shrink-0">
                <div className="text-xl font-bold text-on-background mb-4 font-headline">Thai<span style={{color:"#006a62"}}>Helper</span></div>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">{t.footer_desc}</p>
                <div className="flex gap-4">
                  <a aria-label="Email support" className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 hover:bg-primary hover:text-white transition-all" href="mailto:support@thaihelper.app">
                    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </a>
                  <a aria-label="LINE Official Account" className="w-10 h-10 rounded-full bg-[#06C755] flex items-center justify-center text-white hover:opacity-80 transition-all" href="https://lin.ee/U7B1KX6" target="_blank" rel="noopener noreferrer">                    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>                 </a>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
                <div>
                  <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-widest font-headline whitespace-nowrap">{t.footer_product}</h4>
                  <ul className="space-y-3">
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/">{t.footer_fp1}</Link></li>
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/employers">{t.footer_fp2}</Link></li>
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/#how-it-works">{t.footer_fp3}</Link></li>
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/work-permit-wizard">{t.footer_fp4}</Link></li>
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/directory">{t.footer_fp5}</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-widest font-headline whitespace-nowrap">{t.footer_company}</h4>
                  <ul className="space-y-3">
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/about">{t.footer_fc1}</Link></li>
                    <li><a className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="mailto:support@thaihelper.app">{t.footer_fc2}</a></li>
                    <li><a className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="https://lin.ee/U7B1KX6" target="_blank" rel="noopener noreferrer">{t.footer_line}</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-widest font-headline whitespace-nowrap">{t.footer_legal}</h4>
                  <ul className="space-y-3">
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/privacy">{t.footer_fl1}</Link></li>
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/terms">{t.footer_fl2}</Link></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="mt-10 pt-6 border-t border-slate-200 text-center">
              <p className="text-slate-400 text-xs leading-relaxed max-w-3xl mx-auto mb-3">{t.footer_disclaimer}</p>
              <p className="text-slate-500 text-xs">{t.footer_copy}</p>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}

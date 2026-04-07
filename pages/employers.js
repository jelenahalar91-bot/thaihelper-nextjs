import { useState, useEffect, useCallback } from 'react';
import SEOHead, { getBreadcrumbSchema } from '@/components/SEOHead';
import LangSwitcher from '@/components/LangSwitcher';
import { useLang } from './_app';
import Link from 'next/link';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowLeft, ArrowRight, UserPlus, MessageCircle, PartyPopper } from 'lucide-react';

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
        <button onClick={() => emblaApi?.scrollPrev()} className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-[#001b3d] hover:text-white hover:border-[#001b3d] transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button onClick={() => emblaApi?.scrollNext()} className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-[#001b3d] hover:text-white hover:border-[#001b3d] transition-all">
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

const T = {
  en: {
    page_title: 'Find Household Staff in Thailand – ThaiHelper',
    nav_home: 'Home',
    nav_helpers: 'For Helpers',
    nav_cta: 'Register – Free',
    // Hero
    hero_eyebrow: 'For Employers & Families',
    hero_h1: 'Find Trusted',
    hero_h1b: 'Helpers.',
    hero_shimmer: 'No agencies, no fees.',
    hero_p: 'Browse verified nannies, housekeepers, chefs, drivers, and more in your city. Create a free account and start messaging helpers today.',
    hero_cta: 'Create Free Account',
    hero_badge: 'Free for the first 4 weeks',
    // How it works
    how_label: 'How It Works',
    how_title: '3 simple steps',
    how_sub: 'We connect you directly with household professionals. No middleman.',
    how1_h: 'Create Your Account',
    how1_p: 'Register for free in 30 seconds. Tell us your city and what type of help you need.',
    how2_h: 'Browse Profiles',
    how2_p: 'Browse verified helper profiles, ratings, and experience — for free.',
    how3_h: 'Message Directly',
    how3_p: 'Chat with helpers right on the platform. Free for the first 4 weeks — no credit card required.',
    // Why
    why_label: 'Why ThaiHelper',
    why_title: 'A better way to find help',
    why_sub: 'We built ThaiHelper because hiring through agencies is expensive, slow, and opaque.',
    why1_h: '100% Free for Employers',
    why1_p: 'No sign-up fees, no monthly subscriptions. Browse profiles at no cost — only pay for premium contact features later.',
    why2_h: 'No Agency Commissions',
    why2_p: 'Traditional agencies charge 1–3 months salary. We charge a small one-time fee. You save thousands.',
    why3_h: 'Verified & Background-Checked',
    why3_p: 'Every helper verifies their ID. Background checks and references are available on all profiles.',
    why4_h: 'All Categories in One Place',
    why4_p: 'Nannies, housekeepers, chefs, drivers, gardeners, elder care, tutors — find everyone you need.',
    why5_h: 'Direct Communication',
    why5_p: 'Chat directly with helpers. Negotiate your own terms, schedules, and salary — no interference.',
    why6_h: 'City-Based Matching',
    why6_p: 'We show you helpers in your area. Bangkok, Phuket, Chiang Mai, Pattaya, Koh Samui, and more.',
    // Preview
    preview_label: 'Profile Preview',
    preview_title: 'This is how helper profiles will look',
    preview_sub: 'Example profiles showing how you\'ll browse and compare helpers on ThaiHelper after launch.',
    preview_badge: 'Example',
    preview_exp: 'yrs experience',
    preview_locked: 'Contact at Launch',
    preview_note: 'These are example profiles. Real helper profiles will be available after launch in April 2026.',
    // Categories
    cat_label: 'What do you need?',
    cat_title: 'All household staff, one platform',
    cat_sub: 'Select the categories that match your needs. You can choose multiple.',
    // CTA Card
    form_label: 'Register Now',
    form_title: 'Start Hiring Today',
    form_sub: 'Create your free employer account and message helpers directly.',
    promo_badge: 'Free for the first 4 weeks — no credit card',
    cta_card_h: 'Create Your Employer Account',
    cta_card_sub: 'Free account with full messaging access for your first 4 weeks. Find the perfect helper for your family.',
    cta_card_b1: 'Browse verified helper profiles in your city',
    cta_card_b2: 'Message helpers directly with built-in translation',
    cta_card_b3: 'No agency fees — ever',
    cta_card_btn: 'Create Free Account',
    cta_card_login_q: 'Already have an account?',
    cta_card_login: 'Log in',
    // Job Board
    jobs_label: 'Job Board',
    jobs_title: 'What families are looking for',
    jobs_sub: 'See what other families need — helpers can browse these requests and apply when we launch.',
    jobs_posted: 'Posted',
    jobs_active: 'Active',
    jobs_last_seen: 'Last seen',
    jobs_ago: 'ago',
    jobs_days: 'days',
    jobs_hours: 'hours',
    jobs_contact_launch: 'Apply at Launch',
    // Launch banner
    launch_label: 'Launch Timeline',
    launch_title: 'We\'re launching in April 2026',
    launch_p: 'ThaiHelper is brand new. We\'re building the largest network of verified household staff in Thailand. Be among the first employers to join.',
    launch_stat1_n: '7',
    launch_stat1_l: 'Staff Categories',
    launch_stat2_n: '6+',
    launch_stat2_l: 'Cities Covered',
    launch_stat3_n: '0฿',
    launch_stat3_l: 'Registration Fee',
    // CTA
    cta_title: 'Know a great helper?',
    cta_sub: 'Tell your nanny, housekeeper, or driver about ThaiHelper. They can register for free and get discovered by families like yours.',
    cta_btn: 'Share with Helpers',
    // Footer
    footer_desc: 'ThaiHelper connects families and expats in Thailand with trusted household staff. No agency fees, no middlemen.',
    footer_product: 'Product',
    footer_fp1: 'For Helpers',
    footer_fp2: 'For Employers',
    footer_fp3: 'How It Works',
    footer_company: 'Company',
    footer_fc1: 'About Us',
    footer_fc2: 'Contact',
    footer_legal: 'Legal',
    footer_fl1: 'Privacy Policy',
    footer_fl2: 'Terms of Service',
    footer_copy: '© 2026 ThaiHelper. All rights reserved.',
  },
  th: {
    page_title: 'หาพนักงานดูแลบ้านในประเทศไทย – ThaiHelper',
    nav_home: 'หน้าแรก',
    nav_helpers: 'สำหรับผู้ช่วย',
    nav_cta: 'ลงทะเบียนฟรี',
    hero_eyebrow: 'สำหรับนายจ้างและครอบครัว',
    hero_h1: 'หาผู้ช่วยที่ไว้ใจได้',
    hero_h1b: 'โดยตรง',
    hero_shimmer: 'ไม่มีเอเจนซี่ ไม่มีค่าธรรมเนียม',
    hero_p: 'ค้นหาพี่เลี้ยง แม่บ้าน พ่อครัว คนขับรถ และอื่นๆ สร้างบัญชีฟรีและเริ่มส่งข้อความหาผู้ช่วยได้วันนี้',
    hero_cta: 'สร้างบัญชีฟรี',
    hero_badge: 'ฟรี 4 สัปดาห์แรก',
    how_label: 'วิธีการใช้งาน',
    how_title: '3 ขั้นตอนง่ายๆ',
    how_sub: 'เราเชื่อมต่อคุณกับผู้เชี่ยวชาญดูแลบ้านโดยตรง ไม่มีคนกลาง',
    how1_h: 'สร้างบัญชี',
    how1_p: 'ลงทะเบียนฟรีใน 30 วินาที บอกเราว่าคุณอยู่เมืองไหนและต้องการความช่วยเหลือแบบไหน',
    how2_h: 'ดูโปรไฟล์',
    how2_p: 'ดูโปรไฟล์ผู้ช่วยที่ผ่านการยืนยัน เรตติ้ง และประสบการณ์ได้ฟรี',
    how3_h: 'ส่งข้อความโดยตรง',
    how3_p: 'แชทกับผู้ช่วยบนแพลตฟอร์มได้เลย ฟรี 4 สัปดาห์แรก ไม่ต้องใช้บัตรเครดิต',
    why_label: 'ทำไม ThaiHelper',
    why_title: 'วิธีที่ดีกว่าในการหาผู้ช่วย',
    why_sub: 'เราสร้าง ThaiHelper เพราะการจ้างผ่านเอเจนซี่นั้นแพง ช้า และไม่โปร่งใส',
    why1_h: 'ฟรี 100% สำหรับนายจ้าง',
    why1_p: 'ไม่มีค่าสมัคร ไม่มีค่าสมาชิกรายเดือน ดูโปรไฟล์ฟรี',
    why2_h: 'ไม่มีค่าคอมมิชชั่นเอเจนซี่',
    why2_p: 'เอเจนซี่แบบเดิมคิดค่าธรรมเนียม 1-3 เดือน เราคิดค่าธรรมเนียมครั้งเดียวเล็กน้อย',
    why3_h: 'ตรวจสอบประวัติแล้ว',
    why3_p: 'ผู้ช่วยทุกคนยืนยันตัวตน มีการตรวจสอบประวัติและข้อมูลอ้างอิง',
    why4_h: 'ทุกหมวดหมู่ในที่เดียว',
    why4_p: 'พี่เลี้ยง แม่บ้าน พ่อครัว คนขับ คนสวน ดูแลผู้สูงอายุ ติวเตอร์ — หาทุกอย่างที่ต้องการ',
    why5_h: 'สื่อสารโดยตรง',
    why5_p: 'แชทกับผู้ช่วยโดยตรง เจรจาเงื่อนไข ตารางเวลา และเงินเดือนด้วยตัวเอง',
    why6_h: 'จับคู่ตามเมือง',
    why6_p: 'เราแสดงผู้ช่วยในพื้นที่ของคุณ กรุงเทพ ภูเก็ต เชียงใหม่ พัทยา เกาะสมุย และอื่นๆ',
    preview_label: 'ตัวอย่างโปรไฟล์',
    preview_title: 'โปรไฟล์ผู้ช่วยจะมีหน้าตาแบบนี้',
    preview_sub: 'ตัวอย่างโปรไฟล์แสดงวิธีที่คุณจะค้นหาและเปรียบเทียบผู้ช่วยบน ThaiHelper หลังเปิดตัว',
    preview_badge: 'ตัวอย่าง',
    preview_exp: 'ปี ประสบการณ์',
    preview_locked: 'ติดต่อเมื่อเปิดตัว',
    preview_note: 'นี่คือโปรไฟล์ตัวอย่าง โปรไฟล์จริงจะพร้อมใช้งานหลังเปิดตัวในเดือนเมษายน 2026',
    cat_label: 'คุณต้องการอะไร?',
    cat_title: 'พนักงานดูแลบ้านทุกประเภท',
    cat_sub: 'เลือกหมวดหมู่ที่ตรงกับความต้องการ เลือกได้หลายอย่าง',
    form_label: 'ลงทะเบียนเลย',
    form_title: 'เริ่มจ้างวันนี้',
    form_sub: 'สร้างบัญชีนายจ้างฟรีและส่งข้อความหาผู้ช่วยโดยตรง',
    promo_badge: 'ฟรี 4 สัปดาห์แรก — ไม่ต้องใช้บัตรเครดิต',
    cta_card_h: 'สร้างบัญชีนายจ้างของคุณ',
    cta_card_sub: 'บัญชีฟรีพร้อมสิทธิ์ส่งข้อความเต็มรูปแบบใน 4 สัปดาห์แรก หาผู้ช่วยที่ใช่สำหรับครอบครัวของคุณ',
    cta_card_b1: 'ดูโปรไฟล์ผู้ช่วยที่ผ่านการยืนยันในเมืองของคุณ',
    cta_card_b2: 'ส่งข้อความหาผู้ช่วยพร้อมการแปลอัตโนมัติ',
    cta_card_b3: 'ไม่มีค่าธรรมเนียมเอเจนซี่ — ตลอดไป',
    cta_card_btn: 'สร้างบัญชีฟรี',
    cta_card_login_q: 'มีบัญชีอยู่แล้ว?',
    cta_card_login: 'เข้าสู่ระบบ',
    jobs_label: 'กระดานงาน',
    jobs_title: 'สิ่งที่ครอบครัวกำลังมองหา',
    jobs_sub: 'ดูว่าครอบครัวอื่นต้องการอะไร — ผู้ช่วยสามารถดูคำขอเหล่านี้และสมัครเมื่อเราเปิดตัว',
    jobs_posted: 'โพสต์เมื่อ',
    jobs_active: 'ใช้งานอยู่',
    jobs_last_seen: 'เข้าใช้ล่าสุด',
    jobs_ago: 'ที่แล้ว',
    jobs_days: 'วัน',
    jobs_hours: 'ชั่วโมง',
    jobs_contact_launch: 'สมัครเมื่อเปิดตัว',
    launch_label: 'เปิดตัว',
    launch_title: 'เราเปิดตัวเมษายน 2026',
    launch_p: 'ThaiHelper เป็นแพลตฟอร์มใหม่ เรากำลังสร้างเครือข่ายพนักงานดูแลบ้านที่ผ่านการยืนยันที่ใหญ่ที่สุดในประเทศไทย',
    launch_stat1_n: '7', launch_stat1_l: 'หมวดหมู่', launch_stat2_n: '6+', launch_stat2_l: 'เมืองที่ครอบคลุม', launch_stat3_n: '0฿', launch_stat3_l: 'ค่าลงทะเบียน',
    cta_title: 'รู้จักผู้ช่วยดีๆ ไหม?',
    cta_sub: 'บอกพี่เลี้ยง แม่บ้าน หรือคนขับของคุณเกี่ยวกับ ThaiHelper พวกเขาสามารถลงทะเบียนฟรี',
    cta_btn: 'แชร์กับผู้ช่วย',
    footer_desc: 'ThaiHelper เชื่อมต่อครอบครัวและชาวต่างชาติในประเทศไทยกับพนักงานดูแลบ้านที่ไว้ใจได้',
    footer_product: 'ผลิตภัณฑ์', footer_fp1: 'สำหรับผู้ช่วย', footer_fp2: 'สำหรับนายจ้าง', footer_fp3: 'วิธีการใช้งาน',
    footer_company: 'บริษัท', footer_fc1: 'เกี่ยวกับเรา', footer_fc2: 'ติดต่อ',
    footer_legal: 'กฎหมาย', footer_fl1: 'นโยบายความเป็นส่วนตัว', footer_fl2: 'ข้อกำหนดการใช้บริการ',
    footer_copy: '© 2026 ThaiHelper สงวนลิขสิทธิ์',
  },
  ru: {
    page_title: 'Найти домашний персонал в Таиланде – ThaiHelper',
    nav_home: 'Главная',
    nav_helpers: 'Для помощников',
    nav_cta: 'Регистрация – Бесплатно',
    // (CTA wording updated below)
    hero_eyebrow: 'Для работодателей и семей',
    hero_h1: 'Найдите проверенных помощников.',
    hero_h1b: 'Напрямую.',
    hero_shimmer: 'Без агентств, без комиссий.',
    hero_p: 'Просматривайте проверенных нянь, домработниц, поваров, водителей. Создайте бесплатный аккаунт и пишите помощникам напрямую уже сегодня.',
    hero_cta: 'Создать бесплатный аккаунт',
    hero_badge: 'Бесплатно первые 4 недели',
    how_label: 'Как это работает',
    how_title: '3 простых шага',
    how_sub: 'Мы связываем вас напрямую с домашним персоналом. Без посредников.',
    how1_h: 'Создайте аккаунт',
    how1_p: 'Зарегистрируйтесь бесплатно за 30 секунд. Укажите город и тип помощника.',
    how2_h: 'Просмотр профилей',
    how2_p: 'Просматривайте проверенные профили, рейтинги и опыт — бесплатно.',
    how3_h: 'Пишите напрямую',
    how3_p: 'Общайтесь с помощниками прямо на платформе. Бесплатно первые 4 недели — без карты.',
    why_label: 'Почему ThaiHelper',
    why_title: 'Лучший способ найти помощника',
    why_sub: 'Мы создали ThaiHelper, потому что агентства берут слишком много.',
    why1_h: '100% бесплатно для работодателей',
    why1_p: 'Без регистрационных сборов, без подписок. Просматривайте профили бесплатно.',
    why2_h: 'Без комиссий агентств',
    why2_p: 'Агентства берут 1–3 месячных зарплаты. Мы берём небольшую разовую плату.',
    why3_h: 'Проверенные профили',
    why3_p: 'Каждый помощник подтверждает личность. Проверка документов и рекомендаций.',
    why4_h: 'Все категории в одном месте',
    why4_p: 'Няни, домработницы, повара, водители, садовники, сиделки, репетиторы.',
    why5_h: 'Прямое общение',
    why5_p: 'Общайтесь напрямую. Договаривайтесь об условиях без посредников.',
    why6_h: 'Подбор по городу',
    why6_p: 'Мы показываем помощников в вашем районе. Бангкок, Пхукет, Чиангмай и другие.',
    preview_label: 'Предпросмотр профилей',
    preview_title: 'Так будут выглядеть профили помощников',
    preview_sub: 'Примеры профилей, показывающие как вы будете искать и сравнивать помощников на ThaiHelper после запуска.',
    preview_badge: 'Пример',
    preview_exp: 'лет опыта',
    preview_locked: 'Связь при запуске',
    preview_note: 'Это примеры профилей. Настоящие профили помощников будут доступны после запуска в апреле 2026.',
    cat_label: 'Что вам нужно?',
    cat_title: 'Весь домашний персонал на одной платформе',
    cat_sub: 'Выберите категории, соответствующие вашим потребностям.',
    form_label: 'Регистрация',
    form_title: 'Начните нанимать сегодня',
    form_sub: 'Создайте бесплатный аккаунт работодателя и пишите помощникам напрямую.',
    promo_badge: 'Бесплатно первые 4 недели — без карты',
    cta_card_h: 'Создайте аккаунт работодателя',
    cta_card_sub: 'Бесплатный аккаунт с полным доступом к сообщениям первые 4 недели. Найдите идеального помощника для вашей семьи.',
    cta_card_b1: 'Просматривайте проверенные профили в вашем городе',
    cta_card_b2: 'Пишите помощникам напрямую со встроенным переводом',
    cta_card_b3: 'Без комиссий агентств — никогда',
    cta_card_btn: 'Создать бесплатный аккаунт',
    cta_card_login_q: 'Уже есть аккаунт?',
    cta_card_login: 'Войти',
    jobs_label: 'Доска вакансий',
    jobs_title: 'Что ищут семьи',
    jobs_sub: 'Посмотрите, что нужно другим семьям — помощники смогут откликнуться при запуске.',
    jobs_posted: 'Опубликовано',
    jobs_active: 'Активен',
    jobs_last_seen: 'Был в сети',
    jobs_ago: 'назад',
    jobs_days: 'дней',
    jobs_hours: 'часов',
    jobs_contact_launch: 'Откликнуться при запуске',
    launch_label: 'Запуск',
    launch_title: 'Мы запускаемся в апреле 2026',
    launch_p: 'ThaiHelper — новая платформа. Мы создаём крупнейшую сеть проверенного домашнего персонала в Таиланде.',
    launch_stat1_n: '7', launch_stat1_l: 'Категорий', launch_stat2_n: '6+', launch_stat2_l: 'Городов', launch_stat3_n: '0฿', launch_stat3_l: 'За регистрацию',
    cta_title: 'Знаете хорошего помощника?',
    cta_sub: 'Расскажите вашей няне, домработнице или водителю о ThaiHelper. Регистрация бесплатная.',
    cta_btn: 'Поделиться с помощниками',
    footer_desc: 'ThaiHelper связывает семьи и экспатов в Таиланде с проверенным домашним персоналом.',
    footer_product: 'Продукт', footer_fp1: 'Для помощников', footer_fp2: 'Для работодателей', footer_fp3: 'Как это работает',
    footer_company: 'Компания', footer_fc1: 'О нас', footer_fc2: 'Контакты',
    footer_legal: 'Правовая информация', footer_fl1: 'Политика конфиденциальности', footer_fl2: 'Условия использования',
    footer_copy: '© 2026 ThaiHelper. Все права защищены.',
  },
};

const CITIES = [
  { value: 'bangkok', label: 'Bangkok' },
  { value: 'phuket', label: 'Phuket' },
  { value: 'chiang_mai', label: 'Chiang Mai' },
  { value: 'pattaya', label: 'Pattaya' },
  { value: 'koh_samui', label: 'Koh Samui' },
  { value: 'hua_hin', label: 'Hua Hin' },
  { value: 'other', label: 'Other' },
];

const HELPER_TYPES = [
  { key: 'nanny', emoji: '👶', en: 'Nanny & Babysitter', th: 'พี่เลี้ยงเด็ก', ru: 'Няня' },
  { key: 'housekeeper', emoji: '🏠', en: 'Housekeeper & Cleaner', th: 'แม่บ้าน', ru: 'Домработница' },
  { key: 'chef', emoji: '👨‍🍳', en: 'Private Chef & Cook', th: 'พ่อครัว/แม่ครัว', ru: 'Повар' },
  { key: 'driver', emoji: '🚗', en: 'Driver & Chauffeur', th: 'คนขับรถ', ru: 'Водитель' },
  { key: 'gardener', emoji: '🌿', en: 'Gardener & Pool Care', th: 'คนสวน', ru: 'Садовник' },
  { key: 'elder', emoji: '🏥', en: 'Elder Care & Caregiver', th: 'ดูแลผู้สูงอายุ', ru: 'Сиделка' },
  { key: 'tutor', emoji: '📚', en: 'Tutor & Teacher', th: 'ติวเตอร์', ru: 'Репетитор' },
];

const EMPLOYER_TRUST_SLIDES = [
  {
    id: 'no-fees',
    title: '💰 Stop Paying Agencies',
    description: 'Tired of agencies taking 1–3 months salary? We were too. That\'s why ThaiHelper is free for families. Zero fees, zero commission — just direct hiring.',
    image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=600&fit=crop',
  },
  {
    id: 'no-facebook',
    title: '🚫 No More Facebook Chaos',
    description: 'Scrolling through Facebook groups, hoping to find someone reliable? No profile, no reviews, no verification. ThaiHelper gives you real profiles with verified IDs and ratings.',
    image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&h=600&fit=crop',
  },
  {
    id: 'verified',
    title: '✅ Know Who You\'re Hiring',
    description: 'Every helper on ThaiHelper verifies their ID. You see their experience, reviews from other families, and skills — before you even say hello. No more guessing.',
    image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=600&fit=crop',
  },
  {
    id: 'direct',
    title: '💬 Talk Directly, No Middleman',
    description: 'No agent sitting between you and your future nanny. Chat directly, discuss your needs, agree on salary and schedule — on your terms, not theirs.',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop',
  },
  {
    id: 'nearby',
    title: '📍 Helpers in Your City',
    description: 'Whether you\'re in Bangkok, Phuket, Chiang Mai, or Koh Samui — we show you helpers who actually live near you. No more "sorry, I\'m in another province."',
    image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&h=600&fit=crop',
  },
  {
    id: 'all-staff',
    title: '🏠 One Place for Everything',
    description: 'Need a nanny AND a housekeeper? Maybe a driver too? Stop juggling multiple agencies and Facebook groups. Find all household staff in one place.',
    image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600&fit=crop',
  },
];

const PROFILES = [
  { photo:'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=80&h=80&fit=crop&crop=face', name:'Maria S.', verified:true, role_en:'👶 Nanny & Babysitter', role_th:'👶 พี่เลี้ยงเด็ก', city:'Phuket', exp:5, langs:'🇵🇭 🇬🇧', stars:4.9, reviews:12, rate:'300', skills_en:'Infant care · School run · Overnight', skills_th:'ดูแลทารก · รับส่งโรงเรียน · ดูแลกลางคืน' },
  { photo:'https://images.unsplash.com/photo-1596815064285-45ed8a9c0463?w=80&h=80&fit=crop&crop=face', name:'Sunisa K.', verified:true, role_en:'🏠 Housekeeper', role_th:'🏠 แม่บ้าน', city:'Bangkok', exp:8, langs:'🇹🇭 🇬🇧', stars:4.8, reviews:7, rate:'200', skills_en:'Cleaning · Laundry · Cooking', skills_th:'ทำความสะอาด · ซักรีด · ทำอาหาร' },
  { photo:'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face', name:'Ana R.', verified:true, role_en:'👨‍🍳 Private Chef', role_th:'👨‍🍳 แม่ครัวส่วนตัว', city:'Phuket', exp:3, langs:'🇵🇭 🇬🇧 🇹🇭', stars:5.0, reviews:4, rate:'450', skills_en:'Thai cuisine · Western · Baking', skills_th:'อาหารไทย · อาหารตะวันตก · ขนมอบ' },
  { photo:'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=80&h=80&fit=crop&crop=face', name:'Narin P.', verified:true, role_en:'📚 Maths Tutor', role_th:'📚 ติวเตอร์คณิตศาสตร์', city:'Bangkok', exp:4, langs:'🇹🇭 🇬🇧', stars:5.0, reviews:6, rate:'400', skills_en:'Maths · Physics · Exam prep', skills_th:'คณิตศาสตร์ · ฟิสิกส์ · เตรียมสอบ' },
  { photo:'https://images.unsplash.com/photo-1551836022-4c4c79ecde51?w=80&h=80&fit=crop&crop=face', name:'Dao W.', verified:true, role_en:'🌿 Gardener & Pool Care', role_th:'🌿 คนสวน / ดูแลสระ', city:'Koh Samui', exp:6, langs:'🇹🇭', stars:4.9, reviews:9, rate:'180', skills_en:'Garden care · Pool cleaning · Lawn', skills_th:'ดูแลสวน · ทำความสะอาดสระ · ตัดหญ้า' },
  { photo:'https://images.unsplash.com/photo-1541823709867-1b206113eafd?w=80&h=80&fit=crop&crop=face', name:'Malee T.', verified:true, role_en:'🏥 Elder Care', role_th:'🏥 ดูแลผู้สูงอายุ', city:'Chiang Mai', exp:7, langs:'🇹🇭 🇬🇧', stars:4.8, reviews:5, rate:'250', skills_en:'Personal care · Medication · Companionship', skills_th:'ดูแลสุขอนามัย · เตือนทานยา · คอยเป็นเพื่อน' },
];

const SAMPLE_JOBS = [
  {
    name: 'Sarah M.',
    city: 'Phuket',
    category_en: '👶 Nanny & Babysitter',
    category_th: '👶 พี่เลี้ยงเด็ก',
    category_ru: '👶 Няня',
    text_en: 'Looking for an experienced nanny for our 2 children (ages 3 and 6). Monday to Friday, 8:00–17:00. Must speak English. We offer 18,000 THB/month. Light housekeeping included. Start date: May 2026. Long-term position preferred.',
    text_th: 'ต้องการพี่เลี้ยงดูแลเด็ก 2 คน (อายุ 3 และ 6 ปี) วันจันทร์-ศุกร์ 8:00-17:00 ต้องพูดภาษาอังกฤษได้ เงินเดือน 18,000 บาท รวมงานบ้านเบาๆ เริ่มงานพฤษภาคม 2026 ต้องการคนทำงานระยะยาว',
    text_ru: 'Ищем опытную няню для 2 детей (3 и 6 лет). Пн-Пт, 8:00–17:00. Обязательно владение английским. Зарплата 18,000 THB/мес. Включая легкую уборку. Начало: май 2026. Предпочтительно долгосрочно.',
    posted_days: 2,
    last_seen_hours: 3,
    active: true,
  },
  {
    name: 'Thomas & Lisa K.',
    city: 'Bangkok',
    category_en: '🏠 Housekeeper & Cleaner',
    category_th: '🏠 แม่บ้าน',
    category_ru: '🏠 Домработница',
    text_en: 'We need a full-time housekeeper for our condo in Sukhumvit. Tasks: daily cleaning, laundry, ironing, grocery shopping, and cooking Thai & Western food. 6 days/week (Sunday off). Salary: 15,000–20,000 THB depending on experience. Thai nationals preferred.',
    text_th: 'ต้องการแม่บ้านเต็มเวลาสำหรับคอนโดในสุขุมวิท งาน: ทำความสะอาด ซักรีด รีดผ้า ซื้อของ ทำอาหารไทยและตะวันตก 6 วัน/สัปดาห์ (หยุดวันอาทิตย์) เงินเดือน 15,000-20,000 บาท ตามประสบการณ์',
    text_ru: 'Нужна домработница на полную ставку для кондо в Сукхумвит. Уборка, стирка, глажка, покупки, приготовление тайской и западной кухни. 6 дней/неделю (воскресенье выходной). Зарплата: 15,000–20,000 THB.',
    posted_days: 5,
    last_seen_hours: 12,
    active: true,
  },
  {
    name: 'Michael R.',
    city: 'Chiang Mai',
    category_en: '🚗 Driver & Chauffeur',
    category_th: '🚗 คนขับรถ',
    category_ru: '🚗 Водитель',
    text_en: 'Part-time driver needed for school runs and weekend errands. Mon–Fri 7:00–8:30 and 14:30–16:00, plus Saturday mornings. Must have own car and clean driving record. Offering 12,000 THB/month. English speaking is a plus.',
    text_th: 'ต้องการคนขับรถพาร์ทไทม์สำหรับรับส่งโรงเรียนและธุระวันหยุด จันทร์-ศุกร์ 7:00-8:30 และ 14:30-16:00 บวกเสาร์เช้า ต้องมีรถยนต์ส่วนตัวและประวัติขับขี่ดี เงินเดือน 12,000 บาท พูดภาษาอังกฤษได้จะพิจารณาเป็นพิเศษ',
    text_ru: 'Нужен водитель на частичную занятость: школа и поручения по выходным. Пн–Пт 7:00–8:30 и 14:30–16:00, + суббота утро. Свой автомобиль, чистый стаж. 12,000 THB/мес. Английский — плюс.',
    posted_days: 1,
    last_seen_hours: 1,
    active: true,
  },
];

export default function Employers() {
  const { lang, setLang: changeLang } = useLang();
  const t = T[lang];

  return (
    <>
      <SEOHead
        title="For Employers – Hire Trusted Household Staff"
        description="Find and hire verified nannies, housekeepers, chefs, drivers and more in Thailand. No agency fees, direct communication with candidates."
        path="/employers"
        lang={lang}
        jsonLd={getBreadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'For Employers', path: '/employers' }])}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      <div className={`bg-surface text-on-background font-body ${lang === 'th' ? 'lang-th' : ''}`}>

        {/* NAVY TOP BAR — employer page indicator */}
        <div className="fixed top-0 left-0 w-full h-1 bg-[#001b3d] z-[60]"></div>

        {/* NAV */}
        <nav className="fixed top-1 left-0 w-full flex justify-between items-center px-4 md:px-6 py-3 md:py-4 bg-white/90 backdrop-blur-md z-50 shadow-sm">
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl md:text-2xl font-bold font-headline"><span>Thai</span><span style={{color:"#006a62"}}>Helper</span></span>
            </Link>
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-[#001b3d] text-white text-[10px] font-bold tracking-wide uppercase">
              {lang === 'en' ? 'For Employers' : lang === 'ru' ? 'Работодатели' : 'นายจ้าง'}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link className="text-sm font-semibold tracking-wide text-slate-600 hover:text-[#001b3d] transition-colors" href="/">{t.nav_helpers}</Link>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <LangSwitcher />
            <a className="px-4 md:px-6 py-2 md:py-2.5 rounded-full bg-[#001b3d] text-white text-xs md:text-sm font-semibold hover:bg-[#002d5f] hover:shadow-lg transition-all active:scale-95 duration-150" href="#register">{t.nav_cta}</a>
          </div>
        </nav>

        <main className="pt-20">

          {/* HERO + CAROUSEL SIDE BY SIDE */}
          <section className="relative px-6 py-16 md:py-24 overflow-hidden">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left: text */}
              <div className="z-10">
                <div className="flex items-center gap-3 mb-5">
                  <span className="block w-8 h-0.5 bg-gold"></span>
                  <span className="text-xs font-bold tracking-[0.25em] uppercase text-gold">{t.hero_eyebrow}</span>
                </div>
                <h1 className="font-extrabold font-headline leading-[1.0] text-on-background mb-1 uppercase" style={{fontSize:'clamp(2.4rem,5.5vw,4.5rem)'}}>
                  {t.hero_h1}
                </h1>
                <span className="block font-extrabold font-headline leading-[1.0] text-[#001b3d] mb-4 uppercase" style={{fontSize:'clamp(2.4rem,5.5vw,4.5rem)'}}>
                  {t.hero_h1b}
                </span>
                <p className="font-extrabold font-headline mb-6 hero-gold-line" style={{fontSize:'clamp(1.3rem,2.8vw,2rem)'}}>
                  {t.hero_shimmer}
                </p>
                <p className="text-lg md:text-xl max-w-xl mb-8 leading-relaxed text-on-surface-variant">
                  {t.hero_p}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <a className="px-8 py-4 rounded-xl bg-[#001b3d] text-white font-bold text-lg shadow-xl shadow-[#001b3d]/20 hover:bg-[#002d5f] hover:scale-[1.02] transition-all text-center" href="#register">{t.hero_cta}</a>
                  <span className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gold/10 text-gold font-bold text-sm">
                    <span className="w-2 h-2 rounded-full bg-gold animate-pulse"></span>
                    {t.hero_badge}
                  </span>
                </div>
              </div>
              {/* Right: mini carousel showing 2 cards */}
              <div className="relative">
                <HeroCarousel items={EMPLOYER_TRUST_SLIDES} />
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
                {[{h:t.why1_h,p:t.why1_p,i:'💰'},{h:t.why2_h,p:t.why2_p,i:'🚫'},{h:t.why3_h,p:t.why3_p,i:'✅'},{h:t.why4_h,p:t.why4_p,i:'📋'},{h:t.why5_h,p:t.why5_p,i:'💬'},{h:t.why6_h,p:t.why6_p,i:'📍'}].map((b,i) => (
                  <div key={i} className="bg-surface-container-low rounded-2xl p-6 hover:bg-surface-container transition-colors">
                    <span className="text-2xl mb-3 block">{b.i}</span>
                    <h3 className="font-bold font-headline text-on-background mb-2">{b.h}</h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed">{b.p}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* PROFILE PREVIEW */}
          <section className="py-16 md:py-24 px-6 bg-surface-container-low">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2 block">{t.preview_label}</span>
                <h2 className="text-3xl md:text-4xl font-extrabold font-headline text-on-background mb-4">{t.preview_title}</h2>
                <p className="text-on-surface-variant max-w-2xl mx-auto">{t.preview_sub}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {PROFILES.map((p, i) => (
                  <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100" key={i}>
                    <div className="flex items-start gap-4 mb-4">
                      <Image src={p.photo} alt={p.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/20" width={56} height={56} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-on-background truncate">{p.name}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold whitespace-nowrap">{t.preview_badge}</span>
                        </div>
                        <div className="text-sm text-on-surface-variant mt-0.5">{lang === 'th' ? p.role_th : p.role_en}</div>
                        <div className="text-xs text-gray-500 mt-1">📍 {p.city} · {p.exp} {t.preview_exp} · {p.langs}</div>
                      </div>
                    </div>
                    <div className="text-xs text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2 mb-4">{lang === 'th' ? p.skills_th : p.skills_en}</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-400 text-sm">★★★★★</span>
                        <span className="text-sm font-bold text-on-background">{p.stars}</span>
                        <span className="text-xs text-gray-400">({p.reviews})</span>
                      </div>
                      <span className="text-sm font-bold text-primary">{p.rate} THB/hr</span>
                    </div>
                    <button className="w-full mt-4 py-2.5 rounded-xl bg-surface-container-highest text-secondary font-semibold text-sm cursor-not-allowed opacity-50 flex items-center justify-center gap-2" disabled>
                      🔒 {t.preview_locked}
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-center text-sm text-on-surface-variant mt-8">🔒 {t.preview_note}</p>
            </div>
          </section>

          {/* CALL TO ACTION — links to dedicated registration page */}
          <section id="register" className="py-16 md:py-24 px-6">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2 block">{t.form_label}</span>
                <h2 className="text-3xl md:text-4xl font-extrabold font-headline text-on-background mb-4">{t.form_title}</h2>
                <p className="text-on-surface-variant">{t.form_sub}</p>
              </div>

              <div className="bg-white rounded-[2rem] p-10 md:p-14 shadow-xl text-center">
                {/* Promo badge */}
                <div className="inline-block px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold mb-6">
                  🎉 {t.promo_badge}
                </div>

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
        <footer className="w-full py-12 px-8 flex flex-col md:flex-row justify-between items-start gap-8 bg-slate-50 border-t border-slate-100">
          <div className="max-w-xs">
            <div className="text-xl font-bold text-on-background mb-4 font-headline">Thai<span style={{color:"#006a62"}}>Helper</span></div>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">{t.footer_desc}</p>
            <div className="flex gap-4">
              <a className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 hover:bg-primary hover:text-white transition-all" href="mailto:support@thaihelper.app">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </a>
              <a className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 hover:bg-primary hover:text-white transition-all" href="mailto:support@thaihelper.app">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
            <div>
              <h4 className="font-bold text-teal-700 mb-4 text-sm uppercase tracking-widest font-headline">{t.footer_product}</h4>
              <ul className="space-y-3">
                <li><Link className="text-slate-500 hover:text-teal-500 text-sm" href="/">{t.footer_fp1}</Link></li>
                <li><Link className="text-slate-500 hover:text-teal-500 text-sm" href="/employers">{t.footer_fp2}</Link></li>
                <li><Link className="text-slate-500 hover:text-teal-500 text-sm" href="/#how-it-works">{t.footer_fp3}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-teal-700 mb-4 text-sm uppercase tracking-widest font-headline">{t.footer_company}</h4>
              <ul className="space-y-3">
                <li><a className="text-slate-500 hover:text-teal-500 text-sm" href="mailto:support@thaihelper.app">{t.footer_fc1}</a></li>
                <li><a className="text-slate-500 hover:text-teal-500 text-sm" href="mailto:support@thaihelper.app">{t.footer_fc2}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-teal-700 mb-4 text-sm uppercase tracking-widest font-headline">{t.footer_legal}</h4>
              <ul className="space-y-3">
                <li><Link className="text-slate-500 hover:text-teal-500 text-sm" href="/privacy">{t.footer_fl1}</Link></li>
                <li><Link className="text-slate-500 hover:text-teal-500 text-sm" href="/terms">{t.footer_fl2}</Link></li>
              </ul>
            </div>
          </div>
          <div className="w-full md:w-auto mt-8 md:mt-0 border-t md:border-t-0 pt-8 md:pt-0">
            <p className="text-slate-500 text-xs">{t.footer_copy}</p>
          </div>
        </footer>

      </div>
    </>
  );
}

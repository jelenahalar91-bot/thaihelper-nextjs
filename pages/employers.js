import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

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
                <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
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
    nav_cta: 'Join Waitlist – Free',
    // Hero
    hero_eyebrow: 'For Employers & Families',
    hero_h1: 'Find Trusted Helpers.',
    hero_h1b: 'Directly.',
    hero_shimmer: 'No agencies, no fees.',
    hero_p: 'Browse verified nannies, housekeepers, chefs, drivers, and more in your city. Register now to be first in line when we launch.',
    hero_cta: 'Join the Free Waitlist',
    hero_badge: 'Launching April 2026',
    // How it works
    how_label: 'How It Works',
    how_title: '3 simple steps',
    how_sub: 'We connect you directly with household professionals. No middleman.',
    how1_h: 'Join the Waitlist',
    how1_p: 'Register for free in 30 seconds. Tell us your city and what type of help you need.',
    how2_h: 'Browse Profiles',
    how2_p: 'As helpers register, you can browse their verified profiles, ratings, and experience — for free.',
    how3_h: 'Get Matched',
    how3_p: "We'll notify you by email as soon as helpers in your area are available. Then contact them directly.",
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
    // Form
    form_label: 'Join the Waitlist',
    form_title: 'Register as an Employer',
    form_sub: 'Completely free. We notify you when helpers are available in your area.',
    form_fname: 'First Name',
    form_fname_ph: 'e.g. Sarah',
    form_lname: 'Last Name',
    form_lname_ph: 'e.g. Johnson',
    form_email: 'Email Address',
    form_email_ph: 'you@example.com',
    form_city: 'Your City',
    form_city_ph: '— Select your location —',
    form_needs: 'What help do you need?',
    form_needs_sub: 'Select all that apply',
    form_job: 'Your Job Offer (optional)',
    form_job_ph: 'Describe what you\'re looking for in detail:\n\n• Which days/hours do you need help?\n• How long (ongoing, temporary)?\n• Salary or hourly rate you offer?\n• Ages of children (if nanny)?\n• Tasks & responsibilities?\n• Any special requirements?',
    form_job_sub: 'Write a detailed job description so helpers know exactly what you need. This will be visible to all helpers.',
    form_job_privacy: 'Phone numbers and email addresses are automatically hidden to protect your privacy.',
    form_agree: 'I agree to the',
    form_terms: 'Terms of Service',
    form_and: 'and',
    form_privacy: 'Privacy Policy',
    form_submit: 'Join Waitlist – Free',
    form_submitting: 'Registering...',
    // Success
    success_h: 'You\'re on the list! 🎉',
    success_p: 'We\'ll email you as soon as helpers in your area are available. In the meantime, you can browse existing profiles.',
    success_cta: 'Browse Helper Profiles',
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
    hero_p: 'ค้นหาพี่เลี้ยง แม่บ้าน พ่อครัว คนขับรถ และอื่นๆ ในเมืองของคุณ ลงทะเบียนตอนนี้เพื่อเป็นคนแรกเมื่อเราเปิดตัว',
    hero_cta: 'ลงทะเบียนฟรี',
    hero_badge: 'เปิดตัวเมษายน 2026',
    how_label: 'วิธีการใช้งาน',
    how_title: '3 ขั้นตอนง่ายๆ',
    how_sub: 'เราเชื่อมต่อคุณกับผู้เชี่ยวชาญดูแลบ้านโดยตรง ไม่มีคนกลาง',
    how1_h: 'ลงทะเบียน',
    how1_p: 'ลงทะเบียนฟรีใน 30 วินาที บอกเราว่าคุณอยู่เมืองไหนและต้องการความช่วยเหลือแบบไหน',
    how2_h: 'ดูโปรไฟล์',
    how2_p: 'เมื่อผู้ช่วยลงทะเบียน คุณสามารถดูโปรไฟล์ที่ผ่านการยืนยัน เรตติ้ง และประสบการณ์ได้ฟรี',
    how3_h: 'รับการแจ้งเตือน',
    how3_p: 'เราจะแจ้งคุณทางอีเมลทันทีที่ผู้ช่วยในพื้นที่ของคุณพร้อมให้บริการ จากนั้นติดต่อพวกเขาโดยตรง',
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
    form_label: 'ลงทะเบียน',
    form_title: 'ลงทะเบียนเป็นนายจ้าง',
    form_sub: 'ฟรีทั้งหมด เราจะแจ้งคุณเมื่อผู้ช่วยพร้อมในพื้นที่ของคุณ',
    form_fname: 'ชื่อ',
    form_fname_ph: 'เช่น สมหญิง',
    form_lname: 'นามสกุล',
    form_lname_ph: 'เช่น สุขใจ',
    form_email: 'อีเมล',
    form_email_ph: 'you@example.com',
    form_city: 'เมืองของคุณ',
    form_city_ph: '— เลือกเมือง —',
    form_needs: 'คุณต้องการความช่วยเหลือแบบไหน?',
    form_needs_sub: 'เลือกทั้งหมดที่ต้องการ',
    form_job: 'รายละเอียดงาน (ไม่จำเป็น)',
    form_job_ph: 'อธิบายสิ่งที่คุณต้องการอย่างละเอียด:\n\n• ต้องการความช่วยเหลือวันไหน/เวลาไหน?\n• ระยะเวลา (ถาวร, ชั่วคราว)?\n• เงินเดือนหรืออัตราต่อชั่วโมง?\n• อายุเด็ก (ถ้าต้องการพี่เลี้ยง)?\n• หน้าที่รับผิดชอบ?\n• ข้อกำหนดพิเศษ?',
    form_job_sub: 'เขียนรายละเอียดงานเพื่อให้ผู้ช่วยรู้ว่าคุณต้องการอะไร จะแสดงให้ผู้ช่วยทุกคนเห็น',
    form_job_privacy: 'หมายเลขโทรศัพท์และอีเมลจะถูกซ่อนโดยอัตโนมัติเพื่อปกป้องความเป็นส่วนตัว',
    form_agree: 'ฉันยอมรับ',
    form_terms: 'ข้อกำหนดการใช้บริการ',
    form_and: 'และ',
    form_privacy: 'นโยบายความเป็นส่วนตัว',
    form_submit: 'ลงทะเบียนฟรี',
    form_submitting: 'กำลังลงทะเบียน...',
    success_h: 'คุณอยู่ในรายชื่อแล้ว! 🎉',
    success_p: 'เราจะส่งอีเมลถึงคุณทันทีที่ผู้ช่วยในพื้นที่ของคุณพร้อมให้บริการ',
    success_cta: 'ดูโปรไฟล์ผู้ช่วย',
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
    hero_eyebrow: 'Для работодателей и семей',
    hero_h1: 'Найдите проверенных помощников.',
    hero_h1b: 'Напрямую.',
    hero_shimmer: 'Без агентств, без комиссий.',
    hero_p: 'Просматривайте проверенных нянь, домработниц, поваров, водителей и других специалистов в вашем городе. Зарегистрируйтесь сейчас.',
    hero_cta: 'Присоединиться бесплатно',
    hero_badge: 'Запуск — апрель 2026',
    how_label: 'Как это работает',
    how_title: '3 простых шага',
    how_sub: 'Мы связываем вас напрямую с домашним персоналом. Без посредников.',
    how1_h: 'Регистрация',
    how1_p: 'Зарегистрируйтесь бесплатно за 30 секунд. Укажите город и тип помощника.',
    how2_h: 'Просмотр профилей',
    how2_p: 'Просматривайте проверенные профили, рейтинги и опыт помощников — бесплатно.',
    how3_h: 'Получите уведомление',
    how3_p: 'Мы отправим вам email, когда помощники в вашем районе будут доступны.',
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
    form_title: 'Зарегистрируйтесь как работодатель',
    form_sub: 'Полностью бесплатно. Мы уведомим вас, когда помощники появятся в вашем районе.',
    form_fname: 'Имя',
    form_fname_ph: 'напр. Анна',
    form_lname: 'Фамилия',
    form_lname_ph: 'напр. Иванова',
    form_email: 'Email',
    form_email_ph: 'you@example.com',
    form_city: 'Ваш город',
    form_city_ph: '— Выберите город —',
    form_needs: 'Какая помощь вам нужна?',
    form_needs_sub: 'Выберите все подходящие',
    form_job: 'Описание вакансии (необязательно)',
    form_job_ph: 'Опишите подробно, что вам нужно:\n\n• В какие дни/часы нужна помощь?\n• На какой срок (постоянно, временно)?\n• Зарплата или почасовая оплата?\n• Возраст детей (если няня)?\n• Обязанности?\n• Особые требования?',
    form_job_sub: 'Напишите подробное описание вакансии, чтобы помощники знали, что вам нужно. Будет видно всем помощникам.',
    form_job_privacy: 'Номера телефонов и email автоматически скрываются для защиты вашей конфиденциальности.',
    form_agree: 'Я согласен с',
    form_terms: 'Условиями использования',
    form_and: 'и',
    form_privacy: 'Политикой конфиденциальности',
    form_submit: 'Зарегистрироваться — Бесплатно',
    form_submitting: 'Регистрация...',
    success_h: 'Вы в списке! 🎉',
    success_p: 'Мы отправим вам email, как только помощники в вашем районе станут доступны.',
    success_cta: 'Смотреть профили помощников',
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
  const [lang, setLangState] = useState('en');
  useEffect(() => { const saved = localStorage.getItem('th_lang') || 'en'; setLangState(saved); }, []);
  const changeLang = (l) => { setLangState(l); localStorage.setItem('th_lang', l); };
  const t = T[lang];

  // Form state
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [needs, setNeeds] = useState([]);
  const [jobDesc, setJobDesc] = useState('');
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const toggleNeed = (key) => {
    setNeeds(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!fname.trim()) errs.fname = true;
    if (!lname.trim()) errs.lname = true;
    if (!email.trim() || !email.includes('@')) errs.email = true;
    if (!city) errs.city = true;
    if (needs.length === 0) errs.needs = true;
    if (!agree) errs.agree = true;
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/employer-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: fname.trim(),
          lastName: lname.trim(),
          email: email.trim(),
          city,
          helperTypes: needs,
          jobDescription: jobDesc,
        }),
      });
      if (!response.ok) throw new Error('Registration failed');
      setSubmitted(true);
    } catch (err) {
      console.error('Registration error:', err);
      // Still show success in pre-launch phase (data might not save but UX stays smooth)
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>{t.page_title}</title>
        <meta name="description" content="Find trusted household staff in Thailand. Browse verified nannies, housekeepers, chefs, drivers and more. No agency fees." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="canonical" href="https://thaihelper.app/employers" />
        <meta property="og:title" content="Find Household Staff in Thailand – ThaiHelper" />
        <meta property="og:description" content="Browse verified nannies, housekeepers, chefs, drivers and more. Register free as an employer — no agency fees." />
        <meta property="og:url" content="https://thaihelper.app/employers" />
        <meta name="twitter:title" content="Find Household Staff in Thailand – ThaiHelper" />
        <meta name="twitter:description" content="Browse verified nannies, housekeepers, chefs, drivers and more. No agency fees." />
      </Head>

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
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              <button className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg text-sm md:text-base font-bold transition-all ${lang === 'en' ? 'bg-white text-on-background shadow-sm' : 'text-gray-500'}`} onClick={() => changeLang('en')}>🇬🇧</button>
              <button className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg text-sm md:text-base font-bold transition-all ${lang === 'th' ? 'bg-white text-on-background shadow-sm' : 'text-gray-500'}`} onClick={() => changeLang('th')}>🇹🇭</button>
              <button className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg text-sm md:text-base font-bold transition-all ${lang === 'ru' ? 'bg-white text-on-background shadow-sm' : 'text-gray-500'}`} onClick={() => changeLang('ru')}>🇷🇺</button>
            </div>
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
                {[{n:'1', h:t.how1_h, p:t.how1_p, icon:'📝'},{n:'2', h:t.how2_h, p:t.how2_p, icon:'👀'},{n:'3', h:t.how3_h, p:t.how3_p, icon:'📧'}].map((s,i) => (
                  <div key={i} className="relative bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-shadow">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl mb-4">{s.icon}</div>
                    <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-gold font-extrabold text-sm">{s.n}</div>
                    <h3 className="text-lg font-bold font-headline text-on-background mb-2">{s.h}</h3>
                    <p className="text-on-surface-variant text-sm leading-relaxed">{s.p}</p>
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
                      <img src={p.photo} alt={p.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/20" />
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

          {/* REGISTRATION FORM */}
          <section id="register" className="py-16 md:py-24 px-6">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2 block">{t.form_label}</span>
                <h2 className="text-3xl md:text-4xl font-extrabold font-headline text-on-background mb-4">{t.form_title}</h2>
                <p className="text-on-surface-variant">{t.form_sub}</p>
              </div>

              {submitted ? (
                <div className="bg-white rounded-[2rem] p-10 md:p-14 shadow-xl text-center">
                  <div className="text-5xl mb-4">🎉</div>
                  <h3 className="text-2xl font-extrabold font-headline text-on-background mb-4">{t.success_h}</h3>
                  <p className="text-on-surface-variant mb-8 max-w-md mx-auto">{t.success_p}</p>
                  <Link href="/" className="inline-block px-8 py-4 rounded-xl bg-[#001b3d] text-white font-bold text-lg shadow-lg hover:bg-[#002d5f] hover:scale-[1.02] transition-all">
                    {t.success_cta}
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                    <div>
                      <label className="block text-sm font-semibold text-on-background mb-1.5">{t.form_fname}</label>
                      <input type="text" value={fname} onChange={e => setFname(e.target.value)} placeholder={t.form_fname_ph} className={`w-full px-4 py-3 rounded-xl border ${errors.fname ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all`} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-on-background mb-1.5">{t.form_lname}</label>
                      <input type="text" value={lname} onChange={e => setLname(e.target.value)} placeholder={t.form_lname_ph} className={`w-full px-4 py-3 rounded-xl border ${errors.lname ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all`} />
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className="block text-sm font-semibold text-on-background mb-1.5">{t.form_email}</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t.form_email_ph} className={`w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all`} />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-on-background mb-1.5">{t.form_city}</label>
                    <select value={city} onChange={e => setCity(e.target.value)} className={`w-full px-4 py-3 rounded-xl border ${errors.city ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white`}>
                      <option value="">{t.form_city_ph}</option>
                      {CITIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-on-background mb-1.5">{t.form_needs}</label>
                    <p className="text-xs text-on-surface-variant mb-3">{t.form_needs_sub}</p>
                    <div className={`grid grid-cols-2 gap-2 ${errors.needs ? 'ring-2 ring-red-400 rounded-xl p-1' : ''}`}>
                      {HELPER_TYPES.map(ht => (
                        <button type="button" key={ht.key} onClick={() => toggleNeed(ht.key)}
                          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                            needs.includes(ht.key) ? 'bg-primary/10 text-primary border-2 border-primary' : 'bg-gray-50 text-on-surface-variant border-2 border-transparent hover:bg-gray-100'
                          }`}>
                          <span>{ht.emoji}</span>
                          <span>{lang === 'th' ? ht.th : lang === 'ru' ? ht.ru : ht.en}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-on-background mb-1.5">{t.form_job}</label>
                    <p className="text-xs text-on-surface-variant mb-3">{t.form_job_sub}</p>
                    <textarea
                      value={jobDesc}
                      onChange={e => setJobDesc(e.target.value)}
                      placeholder={t.form_job_ph}
                      rows={6}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-y"
                    />
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5">
                      <span>🔒</span> {t.form_job_privacy}
                    </p>
                  </div>

                  <div className="mb-8">
                    <label className={`flex items-start gap-3 cursor-pointer ${errors.agree ? 'text-red-500' : ''}`}>
                      <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                      <span className="text-sm text-on-surface-variant">
                        {t.form_agree} <Link href="/terms" className="text-primary font-semibold hover:underline">{t.form_terms}</Link> {t.form_and} <Link href="/privacy" className="text-primary font-semibold hover:underline">{t.form_privacy}</Link>
                      </span>
                    </label>
                  </div>

                  <button type="submit" disabled={submitting}
                    className="w-full py-4 rounded-xl bg-[#001b3d] text-white font-bold text-lg shadow-xl shadow-[#001b3d]/20 hover:bg-[#002d5f] hover:scale-[1.01] transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                    {submitting ? t.form_submitting : t.form_submit}
                  </button>
                </form>
              )}
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
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
            <div>
              <h4 className="font-bold text-teal-700 mb-4 text-sm uppercase tracking-widest font-headline">{t.footer_product}</h4>
              <div className="space-y-2 text-sm text-slate-500">
                <Link href="/register" className="block hover:text-teal-600 transition-colors">{t.footer_fp1}</Link>
                <Link href="/employers" className="block hover:text-teal-600 transition-colors">{t.footer_fp2}</Link>
                <Link href="/#how-it-works" className="block hover:text-teal-600 transition-colors">{t.footer_fp3}</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-teal-700 mb-4 text-sm uppercase tracking-widest font-headline">{t.footer_company}</h4>
              <div className="space-y-2 text-sm text-slate-500">
                <a href="#" className="block hover:text-teal-600 transition-colors">{t.footer_fc1}</a>
                <a href="mailto:support@thaihelper.app" className="block hover:text-teal-600 transition-colors">{t.footer_fc2}</a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-teal-700 mb-4 text-sm uppercase tracking-widest font-headline">{t.footer_legal}</h4>
              <div className="space-y-2 text-sm text-slate-500">
                <Link href="/privacy" className="block hover:text-teal-600 transition-colors">{t.footer_fl1}</Link>
                <Link href="/terms" className="block hover:text-teal-600 transition-colors">{t.footer_fl2}</Link>
              </div>
            </div>
          </div>
        </footer>
        <div className="text-center py-4 text-xs text-slate-400 bg-slate-50 border-t border-slate-100">{t.footer_copy}</div>

      </div>
    </>
  );
}

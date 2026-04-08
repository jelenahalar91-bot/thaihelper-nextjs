import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CircularTestimonials } from '@/components/ui/circular-testimonials';
import SEOHead, { getServiceSchema, getFAQSchema } from '@/components/SEOHead';
import LangSwitcher from '@/components/LangSwitcher';
import { useLang } from './_app';

const T = {
  en: {
    nav_find:'Benefits',nav_hire:'Categories',nav_how:'How it Works',nav_employers:'For Employers',nav_login:'Login',nav_cta:'Register Free',
    hero_badge:'Premium Marketplace',
    hero_h1:'Stop Paying Agencies.',hero_h1_em:'Get Hired Directly.',
    hero_p:"Connect directly with Thailand's best nannies, chefs, drivers, and domestic helpers. No middleman, no hidden fees, just pure Thai hospitality at its finest.",
    hero_cta1:'Create My Free Profile',hero_cta2:'See How It Works',
    hero_helpers:'Be among the first verified helpers on the platform',
    hero_float:'Free Forever – No Hidden Fees',
    trust_label:'Trusted By Families At',
    feat_title:'Why Choose Direct Hiring?',feat_sub:'Skip the high commissions and lengthy agency processes. We provide the tools for a seamless, transparent connection.',
    feat1_h:'100% Direct',feat1_p:'Chat directly with candidates. Negotiate your own terms, schedules, and salary without any interference.',
    feat2_h:'Verified Profiles',feat2_p:'We verify IDs and background checks so you can focus on finding the right cultural fit for your home.',
    feat3_h:'No Hidden Fees',feat3_p:"We believe in transparent pricing. No placement fees, no monthly cuts from the helper's salary.",
    preview_label:'Your Profile',preview_title:'This Is How Families See You',
    preview_sub:'Your profile is publicly visible to families searching in your city. Only verified and registered employers can contact you directly.',
    preview_badge:'✓ Verified',preview_exp:'yrs experience',preview_btn:'Contact',
    preview_note:'Only paid & verified families can contact you.',
    match_label:'Happy Matches',match_title:'Families & Helpers United',
    match_sub:'Real connections, real stories. See how ThaiHelper brings families and helpers together.',
    match_hired:'Hired as',match_quote_label:'What they say',
    how_label:'How It Works',how_title:'3 steps to get hired',
    how_sub:'No agency needed. No waiting rooms. Just your profile and direct contact with employers.',
    step1_h:'Sign Up Free',step1_p:'Create your profile in minutes. Add your experience, skills, availability, and a photo.',
    step2_h:'Get Discovered',step2_p:'Families searching for household staff in your city will find your profile and reach out directly.',
    step3_h:'Start Working',step3_p:'Chat directly, agree on terms, and start your job — no middleman, no commission cut.',
    ben_label:'Why ThaiHelper',ben_title:'Built for household professionals',
    ben_sub:'We created ThaiHelper because the current system is broken. Agencies take too much. Facebook is chaos. You deserve better.',
    ben1_h:'Completely Free for You',ben1_p:'Listing your profile on ThaiHelper is free — forever. Employers pay for access, not you.',
    ben2_h:'Reach Serious Employers',ben2_p:'Only verified, paying families can contact you. No time-wasters, no spam.',
    ben3_h:'Thai & International Families',ben3_p:'Work with Thai families and expats from Europe, the US, Russia, and beyond.',
    ben4_h:'Build Your Reputation',ben4_p:'Collect verified reviews after each job. A strong profile means better opportunities.',
    ben5_h:'Work Where You Live',ben5_p:'Bangkok, Chiang Mai, Phuket, Pattaya, Koh Samui — find jobs in your city.',
    ben6_h:"You're in Control",ben6_p:'Set your own rates, availability, and preferences. Accept only the jobs you want.',
    cat_label:'Service Categories',cat_title:'Who can register?',
    cat_sub:'Household staff, tutors, teachers, and more — all welcome.',
    cat1:'👶 Nanny & Babysitter',cat2:'🏠 Housekeeper & Cleaner',cat3:'👨‍🍳 Private Chef & Cook',
    cat4:'🚗 Driver & Chauffeur',cat5:'🌿 Gardener & Pool Care',cat6:'🏥 Elder Care & Caregiver',cat7:'📚 Tutor & Teacher',
    vid_label:'See It In Action',vid_title:'Real people. Real jobs.',
    vid_sub:'Watch how ThaiHelper works — from registration to your first job.',
    vid1_title:'Welcome to ThaiHelper',vid1_sub:'A quick intro from our founder',vid1_badge:'🇬🇧 English',
    vid2_title:'วิธีสมัครงาน (How to Register)',vid2_sub:'Step-by-step guide for providers',vid2_badge:'🇵🇭 Filipino · 🇹🇭 Thai',
    vid3_title:'Provider Stories',vid3_sub:'Coming soon — hear from our community',vid3_badge:'🎬 Coming Soon',
    cta_title:'Ready to start your career in Thailand?',
    cta_sub:'Create your free profile and get discovered by families looking for trusted helpers like you.',
    cta_btn1:'Register Now – Free',cta_btn2:'Learn More',
    footer_desc:'The free platform for domestic helpers to create their profile and get discovered by families in Thailand.',
    footer_product:'Product',footer_company:'Company',footer_legal:'Legal',
    footer_find:'Benefits',footer_hire:'Categories',footer_pricing:'Pricing',footer_employers:'For Employers',
    footer_contact:'Contact Us',footer_about:'About Us',footer_faq:'FAQ',
    footer_privacy:'Privacy Policy',footer_terms:'Terms of Service',
  },
  th: {
    nav_find:'สิทธิประโยชน์',nav_hire:'ประเภทงาน',nav_how:'วิธีการทำงาน',nav_employers:'สำหรับนายจ้าง',nav_login:'เข้าสู่ระบบ',nav_cta:'ลงทะเบียนฟรี',
    hero_badge:'แพลตฟอร์มพรีเมียม',
    hero_h1:'หยุดจ่ายค่าเอเจนซี่',hero_h1_em:'หางานโดยตรง',
    hero_p:'เชื่อมต่อโดยตรงกับพี่เลี้ยง พ่อครัว คนขับรถ และผู้ช่วยงานบ้านที่ดีที่สุดในประเทศไทย ไม่มีคนกลาง ไม่มีค่าธรรมเนียมซ่อนเร้น',
    hero_cta1:'สร้างโปรไฟล์ฟรี',hero_cta2:'ดูวิธีการใช้งาน',
    hero_helpers:'เป็นหนึ่งในผู้ช่วยที่ผ่านการยืนยันกลุ่มแรกบนแพลตฟอร์ม',
    hero_float:'ฟรีตลอดไป – ไม่มีค่าธรรมเนียมซ่อนเร้น',
    trust_label:'ได้รับความไว้วางใจจากครอบครัวที่',
    feat_title:'ทำไมต้องจ้างตรง?',feat_sub:'ข้ามค่าคอมมิชชั่นสูงและกระบวนการเอเจนซี่ที่ยาวนาน',
    feat1_h:'ตรง 100%',feat1_p:'คุยกับผู้สมัครโดยตรง เจรจาเงื่อนไข ตารางเวลา และเงินเดือนของคุณเอง',
    feat2_h:'โปรไฟล์ที่ผ่านการยืนยัน',feat2_p:'เราตรวจสอบบัตรประชาชนและประวัติเพื่อให้คุณมุ่งเน้นที่การหาคนที่เหมาะสม',
    feat3_h:'ไม่มีค่าธรรมเนียมซ่อนเร้น',feat3_p:'เราเชื่อในราคาที่โปร่งใส ไม่มีค่าจัดหางาน ไม่หักเงินเดือนรายเดือน',
    preview_label:'โปรไฟล์ของคุณ',preview_title:'ครอบครัวจะเห็นคุณแบบนี้',
    preview_sub:'โปรไฟล์ของคุณเปิดให้ครอบครัวในเมืองของคุณค้นหาได้ เฉพาะนายจ้างที่ลงทะเบียนและยืนยันตัวตนแล้วเท่านั้นที่สามารถติดต่อคุณได้',
    preview_badge:'✓ ยืนยันแล้ว',preview_exp:'ปีประสบการณ์',preview_btn:'ติดต่อ',
    preview_note:'เฉพาะครอบครัวที่ยืนยันตัวตนและชำระเงินแล้วเท่านั้นที่ติดต่อคุณได้',
    match_label:'การจับคู่ที่มีความสุข',match_title:'ครอบครัวและผู้ช่วยที่พบกัน',
    match_sub:'การเชื่อมต่อจริง เรื่องราวจริง',
    match_hired:'จ้างเป็น',match_quote_label:'พวกเขาพูดว่า',
    how_label:'วิธีการทำงาน',how_title:'3 ขั้นตอนในการหางาน',
    how_sub:'ไม่ต้องผ่านเอเจนซี่ ไม่ต้องรอนาน',
    step1_h:'สมัครฟรี',step1_p:'สร้างโปรไฟล์ในไม่กี่นาที ใส่ประสบการณ์ ทักษะ ตารางเวลา และรูปภาพ',
    step2_h:'ถูกค้นพบ',step2_p:'ครอบครัวที่กำลังหาผู้ช่วยงานบ้านในเมืองของคุณจะพบโปรไฟล์และติดต่อโดยตรง',
    step3_h:'เริ่มทำงาน',step3_p:'คุยกันโดยตรง ตกลงเงื่อนไข แล้วเริ่มงานได้เลย',
    ben_label:'ทำไมต้อง ThaiHelper',ben_title:'สร้างมาเพื่อผู้ให้บริการในบ้านโดยเฉพาะ',
    ben_sub:'เราสร้าง ThaiHelper เพราะระบบเดิมมีปัญหา เอเจนซี่คิดค่าใช้จ่ายสูงเกินไป',
    ben1_h:'ฟรีสำหรับคุณตลอดไป',ben1_p:'ลงโปรไฟล์ใน ThaiHelper ฟรีตลอดไป นายจ้างเป็นคนจ่าย ไม่ใช่คุณ',
    ben2_h:'เข้าถึงนายจ้างที่จริงจัง',ben2_p:'เฉพาะครอบครัวที่ยืนยันตัวตนและชำระเงินแล้วเท่านั้นที่ติดต่อคุณได้',
    ben3_h:'ครอบครัวไทยและต่างชาติ',ben3_p:'ทำงานกับครอบครัวไทยและชาวต่างชาติจากยุโรป อเมริกา รัสเซีย',
    ben4_h:'สร้างชื่อเสียง',ben4_p:'สะสมรีวิวจริงหลังทำงาน โปรไฟล์ที่ดีหมายถึงโอกาสที่ดีกว่า',
    ben5_h:'ทำงานใกล้บ้าน',ben5_p:'กรุงเทพฯ เชียงใหม่ ภูเก็ต พัทยา เกาะสมุย หาได้ทุกที่',
    ben6_h:'คุณควบคุมทุกอย่าง',ben6_p:'กำหนดราคา เวลา และเงื่อนไขเอง รับเฉพาะงานที่คุณต้องการ',
    cat_label:'ประเภทบริการ',cat_title:'ใครลงทะเบียนได้บ้าง?',
    cat_sub:'พนักงานบ้าน ติวเตอร์ ครูสอนพิเศษ และอื่นๆ — ยินดีต้อนรับทุกคน',
    cat1:'👶 พี่เลี้ยงเด็ก',cat2:'🏠 แม่บ้านและพนักงานทำความสะอาด',cat3:'👨‍🍳 พ่อครัว / แม่ครัวส่วนตัว',
    cat4:'🚗 คนขับรถ',cat5:'🌿 คนสวนและดูแลสระว่ายน้ำ',cat6:'🏥 ผู้ดูแลผู้สูงอายุ',cat7:'📚 ติวเตอร์ / ครูสอนพิเศษ',
    vid_label:'ดูการทำงานจริง',vid_title:'คนจริง งานจริง',vid_sub:'ดูวิธีที่ ThaiHelper ทำงาน',
    vid1_title:'ยินดีต้อนรับสู่ ThaiHelper',vid1_sub:'แนะนำสั้นๆ จากผู้ก่อตั้ง',vid1_badge:'🇬🇧 ภาษาอังกฤษ',
    vid2_title:'วิธีสมัครงาน (How to Register)',vid2_sub:'คู่มือทีละขั้นตอนสำหรับผู้ให้บริการ',vid2_badge:'🇵🇭 ฟิลิปปินส์ · 🇹🇭 ไทย',
    vid3_title:'เรื่องราวของผู้ให้บริการ',vid3_sub:'เร็วๆ นี้ — ฟังจากชุมชนของเรา',vid3_badge:'🎬 เร็วๆ นี้',
    cta_title:'พร้อมเริ่มอาชีพในประเทศไทยแล้วหรือยัง?',
    cta_sub:'สร้างโปรไฟล์ฟรีและให้ครอบครัวที่กำลังมองหาผู้ช่วยที่ไว้วางใจได้ค้นพบคุณ',
    cta_btn1:'สมัครเลย – ฟรี',cta_btn2:'เรียนรู้เพิ่มเติม',
    footer_desc:'แพลตฟอร์มฟรีสำหรับผู้ช่วยในบ้านที่จะสร้างโปรไฟล์และถูกค้นพบโดยครอบครัวในประเทศไทย',
    footer_product:'ผลิตภัณฑ์',footer_company:'บริษัท',footer_legal:'กฎหมาย',
    footer_find:'สิทธิประโยชน์',footer_hire:'ประเภทงาน',footer_pricing:'ราคา',footer_employers:'สำหรับนายจ้าง',
    footer_contact:'ติดต่อเรา',footer_about:'เกี่ยวกับเรา',footer_faq:'คำถามที่พบบ่อย',
    footer_privacy:'นโยบายความเป็นส่วนตัว',footer_terms:'ข้อกำหนดการใช้งาน',
  },
  ru: {
    nav_find:'Преимущества',nav_hire:'Категории',nav_how:'Как это работает',nav_employers:'Для работодателей',nav_login:'Войти',nav_cta:'Регистрация',
    hero_badge:'Премиум платформа',
    hero_h1:'Хватит платить агентствам.',hero_h1_em:'Устройтесь напрямую.',
    hero_p:'Свяжитесь напрямую с лучшими нянями, поварами, водителями и домашними помощниками в Таиланде. Без посредников, без скрытых комиссий.',
    hero_cta1:'Создать бесплатный профиль',hero_cta2:'Как это работает',
    hero_helpers:'Будьте среди первых проверенных помощников на платформе',
    hero_float:'Бесплатно навсегда – Без скрытых платежей',
    trust_label:'Нам доверяют семьи',
    feat_title:'Почему прямой найм?',feat_sub:'Пропустите высокие комиссии и долгие процессы агентств. Мы предоставляем инструменты для прозрачного соединения.',
    feat1_h:'100% Напрямую',feat1_p:'Общайтесь с кандидатами напрямую. Договаривайтесь об условиях, графике и зарплате без посредников.',
    feat2_h:'Проверенные профили',feat2_p:'Мы проверяем документы и биографию, чтобы вы могли сосредоточиться на поиске подходящего человека.',
    feat3_h:'Без скрытых комиссий',feat3_p:'Мы за прозрачные цены. Никаких комиссий за подбор, никаких ежемесячных удержаний из зарплаты.',
    preview_label:'Ваш профиль',preview_title:'Так семьи видят вас',
    preview_sub:'Ваш профиль виден всем семьям, ищущим помощников в вашем городе. Связаться с вами могут только зарегистрированные и проверенные работодатели.',
    preview_badge:'✓ Проверен',preview_exp:'лет опыта',preview_btn:'Связаться',
    preview_note:'Только оплатившие и проверенные семьи могут с вами связаться.',
    how_label:'Как это работает',how_title:'3 шага к трудоустройству',
    how_sub:'Без агентств. Без очередей. Только ваш профиль и прямой контакт с работодателями.',
    step1_h:'Зарегистрируйтесь бесплатно',step1_p:'Создайте профиль за несколько минут. Добавьте опыт, навыки, доступность и фото.',
    step2_h:'Вас найдут',step2_p:'Семьи, ищущие домашний персонал в вашем городе, найдут ваш профиль и свяжутся напрямую.',
    step3_h:'Начните работать',step3_p:'Общайтесь напрямую, договоритесь об условиях и приступайте к работе — без посредников.',
    ben_label:'Почему ThaiHelper',ben_title:'Создано для домашних специалистов',
    ben_sub:'Мы создали ThaiHelper, потому что текущая система не работает. Агентства берут слишком много. Facebook — хаос. Вы заслуживаете лучшего.',
    ben1_h:'Полностью бесплатно для вас',ben1_p:'Размещение профиля на ThaiHelper бесплатно навсегда. Работодатели платят за доступ, не вы.',
    ben2_h:'Серьёзные работодатели',ben2_p:'Только проверенные, оплатившие семьи могут с вами связаться. Без спама.',
    ben3_h:'Тайские и международные семьи',ben3_p:'Работайте с тайскими семьями и экспатами из Европы, США, России и других стран.',
    ben4_h:'Создайте репутацию',ben4_p:'Собирайте проверенные отзывы после каждой работы. Сильный профиль — лучшие возможности.',
    ben5_h:'Работайте рядом с домом',ben5_p:'Бангкок, Чиангмай, Пхукет, Паттайя, Самуи — найдите работу в вашем городе.',
    ben6_h:'Вы контролируете всё',ben6_p:'Устанавливайте свои ставки, доступность и предпочтения. Принимайте только ту работу, которую хотите.',
    cat_label:'Категории услуг',cat_title:'Кто может зарегистрироваться?',
    cat_sub:'Домашний персонал, репетиторы, учителя и другие — все приглашаются.',
    cat1:'👶 Няня',cat2:'🏠 Домработница',cat3:'👨‍🍳 Личный повар',
    cat4:'🚗 Водитель',cat5:'🌿 Садовник и бассейн',cat6:'🏥 Уход за пожилыми',cat7:'📚 Репетитор',
    vid_label:'Смотрите в действии',vid_title:'Реальные люди. Реальная работа.',vid_sub:'Посмотрите, как работает ThaiHelper — от регистрации до первой работы.',
    vid1_title:'Добро пожаловать в ThaiHelper',vid1_sub:'Краткое вступление от основателя',vid1_badge:'🇬🇧 Английский',
    vid2_title:'Как зарегистрироваться',vid2_sub:'Пошаговое руководство для специалистов',vid2_badge:'🇵🇭 Филиппинский · 🇹🇭 Тайский',
    vid3_title:'Истории специалистов',vid3_sub:'Скоро — послушайте наше сообщество',vid3_badge:'🎬 Скоро',
    cta_title:'Готовы начать карьеру в Таиланде?',
    cta_sub:'Создайте бесплатный профиль и будьте найдены семьями, которые ищут надёжных помощников.',
    cta_btn1:'Регистрация – Бесплатно',cta_btn2:'Узнать больше',
    footer_desc:'Бесплатная платформа для домашних помощников — создайте профиль и будьте найдены семьями в Таиланде.',
    footer_product:'Продукт',footer_company:'Компания',footer_legal:'Правовая информация',
    footer_find:'Преимущества',footer_hire:'Категории',footer_pricing:'Цены',footer_employers:'Для работодателей',
    footer_contact:'Связаться',footer_about:'О нас',footer_faq:'Частые вопросы',
    footer_privacy:'Политика конфиденциальности',footer_terms:'Условия использования',
  }
};

const PROFILES = [
  { photo:'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=80&h=80&fit=crop&crop=face', name:'Maria S.', verified:true, role_en:'👶 Nanny & Babysitter', role_th:'👶 พี่เลี้ยงเด็ก', city:'Phuket', exp:5, langs:'🇵🇭 🇬🇧', stars:4.9, reviews:12, rate:'300', skills_en:'Infant care · School run · Overnight', skills_th:'ดูแลทารก · รับส่งโรงเรียน · ดูแลกลางคืน' },
  { photo:'https://images.unsplash.com/photo-1596815064285-45ed8a9c0463?w=80&h=80&fit=crop&crop=face', name:'Sunisa K.', verified:true, role_en:'🏠 Housekeeper', role_th:'🏠 แม่บ้าน', city:'Bangkok', exp:8, langs:'🇹🇭 🇬🇧', stars:4.8, reviews:7, rate:'200', skills_en:'Cleaning · Laundry · Cooking', skills_th:'ทำความสะอาด · ซักรีด · ทำอาหาร' },
  { photo:'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face', name:'Ana R.', verified:true, role_en:'👨‍🍳 Private Chef', role_th:'👨‍🍳 แม่ครัวส่วนตัว', city:'Phuket', exp:3, langs:'🇵🇭 🇬🇧 🇹🇭', stars:5.0, reviews:4, rate:'450', skills_en:'Thai cuisine · Western · Baking', skills_th:'อาหารไทย · อาหารตะวันตก · ขนมอบ' },
  { photo:'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=80&h=80&fit=crop&crop=face', name:'Narin P.', verified:true, role_en:'📚 Maths Tutor', role_th:'📚 ติวเตอร์คณิตศาสตร์', city:'Bangkok', exp:4, langs:'🇹🇭 🇬🇧', stars:5.0, reviews:6, rate:'400', skills_en:'Maths · Physics · Exam prep', skills_th:'คณิตศาสตร์ · ฟิสิกส์ · เตรียมสอบ' },
  { photo:'https://images.unsplash.com/photo-1551836022-4c4c79ecde51?w=80&h=80&fit=crop&crop=face', name:'Dao W.', verified:true, role_en:'🌿 Gardener & Pool Care', role_th:'🌿 คนสวน / ดูแลสระ', city:'Koh Samui', exp:6, langs:'🇹🇭', stars:4.9, reviews:9, rate:'180', skills_en:'Garden care · Pool cleaning · Lawn', skills_th:'ดูแลสวน · ทำความสะอาดสระ · ตัดหญ้า' },
  { photo:'https://images.unsplash.com/photo-1541823709867-1b206113eafd?w=80&h=80&fit=crop&crop=face', name:'Malee T.', verified:true, role_en:'🏥 Elder Care', role_th:'🏥 ดูแลผู้สูงอายุ', city:'Chiang Mai', exp:7, langs:'🇹🇭 🇬🇧', stars:4.8, reviews:5, rate:'250', skills_en:'Personal care · Medication · Companionship', skills_th:'ดูแลสุขอนามัย · เตือนทานยา · คอยเป็นเพื่อน' },
];

const MATCHES = [
  { family:'The Johnson Family', family_photo:'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=80&h=80&fit=crop&crop=face', helper:'Maria S.', helper_photo:'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=80&h=80&fit=crop&crop=face', role_en:'Full-time Nanny', role_th:'พี่เลี้ยงเด็กเต็มเวลา', city:'Phuket', quote_en:'Maria has been incredible with our kids. Found her in 2 days!', quote_th:'Maria ดูแลลูกๆ ได้อย่างยอดเยี่ยม พบเธอใน 2 วัน!' },
  { family:'The Weber Family', family_photo:'https://images.unsplash.com/photo-1600486913747-55e5470d6f40?w=80&h=80&fit=crop&crop=face', helper:'Sunisa K.', helper_photo:'https://images.unsplash.com/photo-1596815064285-45ed8a9c0463?w=80&h=80&fit=crop&crop=face', role_en:'Housekeeper', role_th:'แม่บ้าน', city:'Bangkok', quote_en:'No agency fees, direct communication. Exactly what we needed.', quote_th:'ไม่มีค่าเอเจนซี่ สื่อสารโดยตรง ตรงตามที่เราต้องการ' },
  { family:'The Petrov Family', family_photo:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face', helper:'Ana R.', helper_photo:'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face', role_en:'Private Chef', role_th:'พ่อครัวส่วนตัว', city:'Phuket', quote_en:'Ana cooks amazing Thai and Western food. Our family loves her!', quote_th:'Ana ทำอาหารไทยและตะวันตกได้อย่างยอดเยี่ยม ครอบครัวเรารักเธอ!' },
];

const JOB_CATEGORIES = [
  {
    name: '👶 Nanny & Babysitter',
    designation: 'Childcare & Development',
    quote: 'Trusted nannies and babysitters who provide loving, attentive care for your children — from infants to school-age kids.',
    src: '/images/categories/nanny.jpg',
  },
  {
    name: '🏠 Housekeeper & Cleaner',
    designation: 'Home Management',
    quote: 'Professional housekeepers who keep your home spotless, organized, and running smoothly — daily or weekly service.',
    src: '/images/categories/housekeeper.jpg',
  },
  {
    name: '👨‍🍳 Private Chef & Cook',
    designation: 'Culinary Arts',
    quote: 'Skilled private chefs preparing delicious Thai, Western, and international cuisine tailored to your family\'s taste.',
    src: '/images/categories/chef.jpg',
  },
  {
    name: '🚗 Driver & Chauffeur',
    designation: 'Transportation',
    quote: 'Reliable drivers for school runs, airport transfers, errands, and daily commutes across Thailand.',
    src: '/images/categories/driver.jpg',
  },
  {
    name: '🌿 Gardener & Pool Care',
    designation: 'Outdoor Maintenance',
    quote: 'Expert gardeners and pool technicians who keep your outdoor spaces lush, clean, and beautiful year-round.',
    src: '/images/categories/gardener.jpg',
  },
  {
    name: '🏥 Elder Care & Caregiver',
    designation: 'Senior Support',
    quote: 'Compassionate caregivers providing personal care, medication management, and companionship for elderly family members.',
    src: '/images/categories/caregiver.jpg',
  },
  {
    name: '📚 Tutor & Teacher',
    designation: 'Education & Learning',
    quote: 'Qualified tutors for maths, languages, exam prep, and more — helping your children excel academically.',
    src: '/images/categories/tutor.jpg',
  },
];

export default function Home() {
  const { lang, setLang: changeLang } = useLang();
  const t = T[lang];

  // FAQ data for structured data
  const homeFaqs = [
    { question: 'Is ThaiHelper really free for helpers?', answer: 'Yes, creating a profile on ThaiHelper is 100% free for helpers — forever. Only employers pay for verified access to contact helpers directly.' },
    { question: 'How does ThaiHelper work?', answer: 'Sign up for free, create your profile with experience, skills and a photo, then get discovered by families searching for household staff in your city. Chat directly and agree on terms — no agency involved.' },
    { question: 'What types of helpers can register?', answer: 'Nannies, babysitters, housekeepers, private chefs, drivers, gardeners, pool care specialists, elder caregivers, tutors, and teachers are all welcome to register.' },
    { question: 'Which cities does ThaiHelper cover?', answer: 'ThaiHelper covers all major cities in Thailand including Bangkok, Chiang Mai, Phuket, Pattaya, Koh Samui, and more.' },
    { question: 'Are helpers verified?', answer: 'Yes, ThaiHelper verifies IDs and can conduct background checks so families can hire with confidence.' },
  ];

  return (
    <>
      <SEOHead
        title="ThaiHelper – Find Trusted Household Staff in Thailand"
        description="ThaiHelper connects families and expats in Thailand with trusted nannies, housekeepers, cooks, drivers and more. No agency fees."
        path="/"
        lang={lang}
        jsonLd={[getServiceSchema(), getFAQSchema(homeFaqs)]}
      />

      <div className={`bg-surface text-on-background font-body ${lang === 'th' ? 'lang-th' : ''}`}>

        {/* TEAL TOP BAR — helper page indicator */}
        <div className="fixed top-0 left-0 w-full h-1 bg-primary z-[60]"></div>

        {/* NAV */}
        <nav className="fixed top-1 left-0 w-full flex justify-between items-center px-4 md:px-6 py-3 md:py-4 bg-white/90 backdrop-blur-md z-50 shadow-sm">
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="text-xl md:text-2xl font-bold font-headline"><span>Thai</span><span style={{color:"#006a62"}}>Helper</span></Link>
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-primary text-white text-[10px] font-bold tracking-wide uppercase">
              {lang === 'en' ? 'For Helpers' : lang === 'ru' ? 'Помощники' : 'ผู้ช่วย'}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link className="text-sm font-semibold tracking-wide text-[#001b3d] hover:text-[#002d5f] transition-colors" href="/employers">{t.nav_employers}</Link>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Link className="text-xs md:text-sm font-semibold text-[#001b3d] hover:text-primary transition-colors" href="/login">{t.nav_login}</Link>
            <LangSwitcher />
            <Link className="px-4 md:px-6 py-2 md:py-2.5 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs md:text-sm font-semibold hover:shadow-lg transition-all active:scale-95 duration-150" href="/register">{t.nav_cta}</Link>
          </div>
        </nav>

        <main className="pt-24">

          {/* HERO */}
          <section className="relative px-6 py-16 md:py-24 overflow-hidden">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="z-10">
                {/* Eyebrow */}
                <div className="flex items-center gap-3 mb-5">
                  <span className="block w-8 h-0.5 bg-gold"></span>
                  <span className="text-xs font-bold tracking-[0.25em] uppercase text-gold">{lang === 'en' ? 'Get Hired Directly.' : lang === 'ru' ? 'Устройтесь напрямую.' : 'หางานโดยตรง'}</span>
                </div>
                {/* Main headline */}
                <h1 className="font-extrabold font-headline leading-[1.0] text-on-background mb-3 uppercase" style={{fontSize:'clamp(2.8rem,6vw,5rem)'}}>
                  {lang === 'en' ? 'Your Next Job.' : lang === 'ru' ? 'Ваша следующая работа.' : 'งานต่อไปของคุณ'}
                </h1>
                {/* "No fees" line with gold shimmer */}
                <p className="font-extrabold font-headline mb-6 hero-gold-line" style={{fontSize:'clamp(1.5rem,3vw,2.2rem)'}}>
                  {lang === 'en' ? 'No fees, no agencies.' : lang === 'ru' ? 'Без комиссий, без агентств.' : 'ไม่มีค่าธรรมเนียม ไม่มีเอเจนซี่'}
                </p>
                {/* Subtext */}
                <p className="text-lg md:text-xl max-w-xl mb-10 leading-relaxed">
                  <strong className="text-primary">{lang === 'en' ? 'Work directly with expats and families.' : lang === 'ru' ? 'Работайте напрямую с семьями и экспатами.' : 'ทำงานตรงกับครอบครัวและชาวต่างชาติ'}</strong>
                  {' '}<span className="text-on-surface-variant">{lang === 'en' ? 'No agency fees. No commission. Post your profile in 3 minutes — verified families find and contact you directly.' : lang === 'ru' ? 'Без агентских сборов. Без комиссий. Создайте профиль за 3 минуты — проверенные семьи найдут вас сами.' : 'ไม่มีค่าเอเจนซี่ ไม่มีค่าคอมมิชชั่น ลงโปรไฟล์ใน 3 นาที — ครอบครัวที่ยืนยันแล้วติดต่อคุณโดยตรง'}</span>
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link className="px-8 py-4 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform text-center" href="/register">{t.hero_cta1}</Link>
                  <a className="px-8 py-4 rounded-xl bg-surface-container-highest text-secondary font-bold text-lg hover:bg-surface-container-high transition-colors text-center" href="#how-it-works">{t.hero_cta2}</a>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-tertiary/5 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <CircularTestimonials
                    testimonials={JOB_CATEGORIES}
                    autoplay={true}
                    colors={{
                      name: '#001b3d',
                      designation: '#006a62',
                      testimony: '#3d4947',
                      arrowBackground: '#006a62',
                      arrowForeground: '#ffffff',
                      arrowHoverBackground: '#35a79c',
                    }}
                    fontSizes={{
                      name: '24px',
                      designation: '16px',
                      quote: '16px',
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* TRUST BAR */}
          <div className="py-5 px-6">
            <div className="max-w-md mx-auto text-center">
              <div className="flex justify-center mb-3">
                <div className="flex -space-x-2.5">
                  <Image className="w-9 h-9 rounded-full border-2 border-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=80&h=80&fit=crop&crop=face" alt="Helper profile" width={36} height={36} />
                  <Image className="w-9 h-9 rounded-full border-2 border-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1596815064285-45ed8a9c0463?w=80&h=80&fit=crop&crop=face" alt="Helper profile" width={36} height={36} />
                  <Image className="w-9 h-9 rounded-full border-2 border-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face" alt="Helper profile" width={36} height={36} />
                  <Image className="w-9 h-9 rounded-full border-2 border-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=80&h=80&fit=crop&crop=face" alt="Helper profile" width={36} height={36} />
                </div>
              </div>
              <p className="text-sm font-medium text-on-surface-variant tracking-wide">
                {lang === 'en' ? (
                  <>Be among the <span className="font-bold text-gold">first verified</span> helpers on the platform</>
                ) : lang === 'ru' ? (
                  <>Будьте среди <span className="font-bold text-gold">первых проверенных</span> помощников</>
                ) : (
                  <>เป็นหนึ่งใน<span className="font-bold text-gold">ผู้ช่วยที่ผ่านการยืนยัน</span>กลุ่มแรก</>
                )}
              </p>
            </div>
          </div>

          {/* FEATURES */}
          <section className="py-16 md:py-24 px-6 bg-surface">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-extrabold font-headline text-on-background mb-4">{t.feat_title}</h2>
                <p className="text-on-surface-variant max-w-2xl mx-auto">{t.feat_sub}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {svg:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,h:t.feat1_h,p:t.feat1_p,bg:'bg-surface-container-highest',ic:'text-primary'},
                  {svg:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,h:t.feat2_h,p:t.feat2_p,bg:'bg-surface-container-high',ic:'text-secondary'},
                  {svg:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,h:t.feat3_h,p:t.feat3_p,bg:'bg-surface-container-highest',ic:'text-tertiary'},
                ].map((f,i) => (
                  <div key={i} className={`p-8 rounded-[2rem] ${f.bg} hover:-translate-y-2 transition-transform duration-300`}>
                    <div className={`w-14 h-14 rounded-2xl bg-white/60 flex items-center justify-center mb-6 ${f.ic}`}>
                      {f.svg}
                    </div>
                    <h3 className="text-xl font-bold font-headline text-on-background mb-3">{f.h}</h3>
                    <p className="text-on-surface-variant leading-relaxed">{f.p}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* PROFILE PREVIEW */}
          <section className="py-24 px-6 bg-surface-container-low">
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
                          {p.verified && <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-teal-light text-primary text-[10px] font-bold whitespace-nowrap">{t.preview_badge}</span>}
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
                    <button className="w-full mt-4 py-2.5 rounded-xl bg-surface-container-highest text-secondary font-semibold text-sm hover:bg-surface-container-high transition-colors cursor-not-allowed opacity-60" disabled>{t.preview_btn}</button>
                  </div>
                ))}
              </div>
              <p className="text-center text-sm text-on-surface-variant mt-8">🔒 {t.preview_note}</p>
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section className="py-24 px-6 bg-surface" id="how-it-works">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2 block">{t.how_label}</span>
                <h2 className="text-3xl md:text-4xl font-extrabold font-headline text-on-background mb-4">{t.how_title}</h2>
                <p className="text-on-surface-variant max-w-2xl mx-auto">{t.how_sub}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[{num:'1',h:t.step1_h,p:t.step1_p},{num:'2',h:t.step2_h,p:t.step2_p},{num:'3',h:t.step3_h,p:t.step3_p}].map((s,i) => (
                  <div key={i} className="p-8 rounded-[2rem] bg-surface-container-highest hover:-translate-y-2 transition-transform duration-300">
                    <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold font-headline mb-6">{s.num}</div>
                    <h3 className="text-xl font-bold font-headline text-on-background mb-3">{s.h}</h3>
                    <p className="text-on-surface-variant leading-relaxed">{s.p}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* BENEFITS */}
          <section id="benefits" className="py-24 px-6 bg-surface-container-low">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2 block">{t.ben_label}</span>
                <h2 className="text-3xl md:text-4xl font-extrabold font-headline text-on-background mb-4">{t.ben_title}</h2>
                <p className="text-on-surface-variant max-w-2xl mx-auto">{t.ben_sub}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {svg:<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,h:t.ben1_h,p:t.ben1_p},
                  {svg:<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>,h:t.ben2_h,p:t.ben2_p},
                  {svg:<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,h:t.ben3_h,p:t.ben3_p},
                  {svg:<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,h:t.ben4_h,p:t.ben4_p},
                  {svg:<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,h:t.ben5_h,p:t.ben5_p},
                  {svg:<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,h:t.ben6_h,p:t.ben6_p},
                ].map((b,i) => (
                  <div key={i} className="flex gap-5 p-6 rounded-2xl bg-white hover:shadow-lg transition-shadow duration-300">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                      {b.svg}
                    </div>
                    <div>
                      <h3 className="font-bold font-headline text-on-background mb-1">{b.h}</h3>
                      <p className="text-sm text-on-surface-variant leading-relaxed">{b.p}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CATEGORIES */}
          <section id="categories" className="py-24 px-6 bg-surface">
            <div className="max-w-7xl mx-auto text-center">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2 block">{t.cat_label}</span>
              <h2 className="text-3xl md:text-4xl font-extrabold font-headline text-on-background mb-4">{t.cat_title}</h2>
              <p className="text-on-surface-variant max-w-2xl mx-auto mb-12">{t.cat_sub}</p>
              <div className="flex flex-wrap justify-center gap-3">
                {[t.cat1,t.cat2,t.cat3,t.cat4,t.cat5,t.cat6,t.cat7].map((c,i) => (
                  <span key={i} className="px-6 py-3 rounded-full bg-surface-container-highest text-on-background font-semibold text-sm hover:bg-primary hover:text-on-primary transition-colors cursor-default">{c}</span>
                ))}
              </div>
            </div>
          </section>

          {/* VIDEOS - coming later */}

          {/* CTA */}
          <section className="py-24 px-6">
            <div className="max-w-5xl mx-auto rounded-[3rem] bg-gradient-to-br from-primary to-primary-container p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-primary/30">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-extrabold font-headline text-on-primary mb-8">{t.cta_title}</h2>
                <p className="text-on-primary/80 text-lg mb-12 max-w-2xl mx-auto">{t.cta_sub}</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link className="px-10 py-5 bg-white text-primary font-bold rounded-2xl text-lg hover:shadow-xl hover:scale-105 transition-all" href="/register">{t.cta_btn1}</Link>
                </div>
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
                <li><a className="text-slate-500 hover:text-teal-500 text-sm" href="#benefits">{t.footer_find}</a></li>
                <li><a className="text-slate-500 hover:text-teal-500 text-sm" href="#categories">{t.footer_hire}</a></li>
                <li><a className="text-slate-500 hover:text-teal-500 text-sm" href="#how">{t.footer_pricing}</a></li>
                <li><Link className="text-slate-500 hover:text-teal-500 text-sm" href="/employers">{t.footer_employers}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-teal-700 mb-4 text-sm uppercase tracking-widest font-headline">{t.footer_company}</h4>
              <ul className="space-y-3">
                <li><a className="text-slate-500 hover:text-teal-500 text-sm" href="mailto:support@thaihelper.app">{t.footer_contact}</a></li>
                <li><a className="text-slate-500 hover:text-teal-500 text-sm" href="mailto:support@thaihelper.app">{t.footer_about}</a></li>
                <li><a className="text-slate-500 hover:text-teal-500 text-sm" href="mailto:support@thaihelper.app">{t.footer_faq}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-teal-700 mb-4 text-sm uppercase tracking-widest font-headline">{t.footer_legal}</h4>
              <ul className="space-y-3">
                <li><Link className="text-slate-500 hover:text-teal-500 text-sm" href="/privacy">{t.footer_privacy}</Link></li>
                <li><Link className="text-slate-500 hover:text-teal-500 text-sm" href="/terms">{t.footer_terms}</Link></li>
              </ul>
            </div>
          </div>
          <div className="w-full md:w-auto mt-8 md:mt-0 border-t md:border-t-0 pt-8 md:pt-0">
            <p className="text-slate-500 text-xs">© 2026 ThaiHelper. All rights reserved.</p>
          </div>
        </footer>

        <CookieBanner lang={lang} />
      </div>
    </>
  );
}

function CookieBanner({ lang }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { if (typeof window !== 'undefined') { const accepted = localStorage.getItem('th_cookie_ok'); if (!accepted) setVisible(true); } }, []);
  const accept = () => { localStorage.setItem('th_cookie_ok', '1'); setVisible(false); };
  if (!visible) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-inverse-surface text-inverse-on-surface px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 z-50 shadow-lg">
      <span className="text-sm">
        {lang === 'th'
          ? <>เราใช้ local storage เพื่อบันทึกการตั้งค่าภาษาเท่านั้น ไม่มีการติดตาม อ่าน <Link href="/privacy" className="text-inverse-primary hover:underline">นโยบายความเป็นส่วนตัว</Link></>
          : lang === 'ru'
          ? <>Мы используем local storage только для сохранения языковых настроек — без отслеживания. Читайте нашу <Link href="/privacy" className="text-inverse-primary hover:underline">Политику конфиденциальности</Link>.</>
          : <>We only use local storage to remember your language preference — no tracking. Read our <Link href="/privacy" className="text-inverse-primary hover:underline">Privacy Policy</Link>.</>
        }
      </span>
      <button className="px-6 py-2 rounded-full bg-primary text-on-primary font-semibold text-sm hover:bg-primary-container transition-colors whitespace-nowrap" onClick={accept}>{lang === 'th' ? 'รับทราบ' : lang === 'ru' ? 'Понятно' : 'Got it'}</button>
    </div>
  );
}

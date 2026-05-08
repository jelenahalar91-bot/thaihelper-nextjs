import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
const CircularTestimonials = dynamic(() => import('@/components/ui/circular-testimonials').then(m => m.CircularTestimonials), { ssr: false });
import SEOHead, { getServiceSchema, getFAQSchema, getSpeakableSchema } from '@/components/SEOHead';
import LangSwitcher from '@/components/LangSwitcher';
import HelperCard from '@/components/HelperCard';
import { MobileMenu, ResourcesDropdown } from '@/components/MobileMenu';
import { useLang } from './_app';

const T = {
  en: {
    nav_find:'Benefits',nav_hire:'Categories',nav_how:'How it Works',nav_employers:'For Families',nav_blog:'Blog',nav_login:'Login',nav_cta:'Register Free',
    nav_resources:'Resources',nav_about:'About',nav_faq:'FAQ',
    hero_badge:'Premium Marketplace',
    hero_h1:'Find Work Directly.',hero_h1_em:'No Middleman Needed.',
    hero_p:"Connect directly with Thailand's best nannies, chefs, drivers and domestic helpers. No middleman, no hidden fees, just pure Thai hospitality at its finest.",
    hero_cta1:'Create My Free Profile',hero_cta2:'See How It Works',hero_browse:'Browse Job Listings — See who is hiring',
    hero_helpers:'Be among the first verified helpers on the platform',
    hero_float:'Free Forever – No Hidden Fees',
    hero_step1:'Sign up free — it takes 3 minutes',
    hero_step2:'Families find your profile and contact you',
    hero_step3:'Chat, agree on terms and start working',
    trust_label:'Trusted By Families At',
    feat_title:'Why Choose Direct Connections?',feat_sub:'No middleman. No waiting. We connect you with families — simple and fast.',
    feat1_h:'100% Direct',feat1_p:'Talk to families yourself. Agree on your own schedule and salary. No one in between.',
    feat2_h:'Real Families Only',feat2_p:'Every family confirms their email before they can contact you. No spam, no fake messages, no recruiters posing as families.',
    feat3_h:'No Hidden Fees',feat3_p:"Your profile is free. No sign-up fees. No one takes money from your salary.",
    preview_label:'Your Profile',preview_title:'This Is How Families See You',
    preview_sub:'Families in your city can see your profile. Only registered families with a verified email account can message you.',
    preview_badge:'✓ Active',preview_exp:'yrs experience',preview_btn:'Contact',
    preview_note:'Only registered families can contact you.',
    preview_signin:'Sign in to message',preview_signin_btn:'Login / Register',
    match_label:'Happy Matches',match_title:'Families & Helpers United',
    match_sub:'Real connections, real stories. See how ThaiHelper brings families and helpers together.',
    match_hired:'Hired as',match_quote_label:'What they say',
    how_label:'How It Works',how_title:'3 steps to get hired',
    how_sub:'No middleman. No waiting. Just 3 easy steps.',
    step1_h:'Sign Up Free',step1_p:'Create your profile in 3 minutes. Add your experience, skills and a photo.',
    step2_h:'Get Found',step2_p:'Families in your city find your profile and send you a message.',
    step3_h:'Start Working',step3_p:'Talk to the family, agree on the job and start — no one takes a cut from your pay.',
    ben_label:'Why ThaiHelper',ben_title:'Built for household professionals',
    ben_sub:'Traditional options are expensive and unclear. Facebook groups are messy. You deserve something better.',
    ben1_h:'Free for You — Always',ben1_p:'Your profile on ThaiHelper is free — forever. Employers pay, not you.',
    ben2_h:'Real Families Only',ben2_p:'Only families with an email-verified account can reach you. No spam, no time-wasting.',
    ben3_h:'Thai & International Families',ben3_p:'Work with Thai families and expats from Europe, the US, Russia and beyond.',
    ben4_h:'Build Your Reputation',ben4_p:'Get reviews after each job. Good reviews help you get more work.',
    ben5_h:'Work Where You Live',ben5_p:'Bangkok, Chiang Mai, Phuket, Pattaya, Koh Samui — find jobs in your city.',
    ben6_h:"You're in Control",ben6_p:'Set your own price and schedule. Only take the jobs you want.',
    cat_label:'Service Categories',cat_title:'Who can register?',
    cat_sub:'Household staff, tutors, teachers and more — all welcome.',
    cat1:'Nanny & Babysitter',cat2:'Housekeeper & Cleaner',cat3:'Private Chef & Cook',
    cat4:'Driver & Chauffeur',cat5:'Gardener & Pool Care',cat6:'Elder Care & Caregiver',cat7:'Tutor & Teacher',
    vid_label:'See It In Action',vid_title:'Real people. Real jobs.',
    vid_sub:'Watch how ThaiHelper works — from registration to your first job.',
    vid1_title:'Welcome to ThaiHelper',vid1_sub:'A quick intro from our founder',vid1_badge:'🇬🇧 English',
    vid2_title:'วิธีสมัครงาน (How to Register)',vid2_sub:'Step-by-step guide for providers',vid2_badge:'🇵🇭 Filipino · 🇹🇭 Thai',
    vid3_title:'Provider Stories',vid3_sub:'Coming soon — hear from our community',vid3_badge:'🎬 Coming Soon',
    cta_title:'Ready to start your career in Thailand?',
    cta_sub:'Create your free profile and let families find you.',
    cta_btn1:'Register Now – Free',cta_btn2:'Learn More',
    footer_desc:'A free platform connecting independent service providers with families in Thailand.',
    footer_disclaimer:'ThaiHelper.app is free to use. We are not a recruitment agency and do not provide placement services. Compliance with Thai labor and immigration laws is the sole responsibility of the users.',
    footer_product:'Product',footer_company:'Company',footer_legal:'Legal',
    footer_find:'Benefits',footer_hire:'Categories',footer_pricing:'Pricing',footer_employers:'For Families',footer_wizard:'Work Permit Wizard',footer_directory:'Expert Directory',
    footer_contact:'Contact Us',footer_line:'LINE',footer_about:'About Us',footer_faq:'FAQ',
    footer_privacy:'Privacy Policy',footer_terms:'Terms of Service',
  },
  th: {
    nav_find:'สิทธิประโยชน์',nav_hire:'ประเภทงาน',nav_how:'วิธีการทำงาน',nav_employers:'สำหรับครอบครัว',nav_blog:'บล็อก',nav_login:'เข้าสู่ระบบ',nav_cta:'ลงทะเบียนฟรี',
    nav_resources:'แหล่งข้อมูล',nav_about:'เกี่ยวกับเรา',nav_faq:'คำถามที่พบบ่อย',
    hero_badge:'แพลตฟอร์มพรีเมียม',
    hero_h1:'หางานโดยตรง',hero_h1_em:'ไม่ต้องผ่านคนกลาง',
    hero_p:'เชื่อมต่อโดยตรงกับพี่เลี้ยง พ่อครัว คนขับรถ และผู้ช่วยงานบ้านที่ดีที่สุดในประเทศไทย ไม่มีคนกลาง ไม่มีค่าธรรมเนียมซ่อนเร้น',
    hero_cta1:'สร้างโปรไฟล์ฟรี',hero_cta2:'ดูวิธีการใช้งาน',hero_browse:'ดูประกาศรับสมัครงาน — ดูว่าใครกำลังจ้าง',
    hero_helpers:'เป็นหนึ่งในผู้ช่วยที่ผ่านการยืนยันกลุ่มแรกบนแพลตฟอร์ม',
    hero_float:'ฟรีตลอดไป – ไม่มีค่าธรรมเนียมซ่อนเร้น',
    hero_step1:'สมัครฟรี — ใช้เวลาแค่ 3 นาที',
    hero_step2:'ครอบครัวจะเห็นโปรไฟล์และติดต่อคุณ',
    hero_step3:'คุยกัน ตกลงเงื่อนไข แล้วเริ่มงานได้เลย',
    trust_label:'ได้รับความไว้วางใจจากครอบครัวที่',
    feat_title:'ทำไมต้องเชื่อมต่อโดยตรง?',feat_sub:'ไม่ต้องผ่านคนกลาง ไม่ต้องรอ เราเชื่อมคุณกับครอบครัว — ง่ายและเร็ว',
    feat1_h:'ตรง 100%',feat1_p:'คุยกับครอบครัวด้วยตัวเอง ตกลงตารางเวลาและเงินเดือน ไม่มีคนกลาง',
    feat2_h:'ครอบครัวจริงเท่านั้น',feat2_p:'ทุกครอบครัวยืนยันอีเมลก่อนติดต่อคุณ ไม่มีสแปม ไม่มีข้อความปลอม ไม่มีนักสรรหาที่แอบอ้างเป็นครอบครัว',
    feat3_h:'ไม่มีค่าธรรมเนียมซ่อนเร้น',feat3_p:'โปรไฟล์ของคุณฟรี ไม่มีค่าสมัคร ไม่มีใครหักเงินจากเงินเดือนคุณ',
    preview_label:'โปรไฟล์ของคุณ',preview_title:'ครอบครัวจะเห็นคุณแบบนี้',
    preview_sub:'โปรไฟล์ของคุณเปิดให้ครอบครัวในเมืองของคุณค้นหาได้ เฉพาะครอบครัวที่ลงทะเบียนและยืนยันอีเมลแล้วเท่านั้นที่สามารถส่งข้อความหาคุณได้',
    preview_badge:'✓ ใช้งานอยู่',preview_exp:'ปีประสบการณ์',preview_btn:'ติดต่อ',
    preview_note:'เฉพาะครอบครัวที่ลงทะเบียนแล้วเท่านั้นที่ติดต่อคุณได้',
    preview_signin:'เข้าสู่ระบบเพื่อส่งข้อความ',preview_signin_btn:'เข้าสู่ระบบ / ลงทะเบียน',
    match_label:'การจับคู่ที่มีความสุข',match_title:'ครอบครัวและผู้ช่วยที่พบกัน',
    match_sub:'การเชื่อมต่อจริง เรื่องราวจริง',
    match_hired:'จ้างเป็น',match_quote_label:'พวกเขาพูดว่า',
    how_label:'วิธีการทำงาน',how_title:'3 ขั้นตอนในการหางาน',
    how_sub:'ไม่ต้องผ่านคนกลาง ไม่ต้องรอนาน',
    step1_h:'สมัครฟรี',step1_p:'สร้างโปรไฟล์ในไม่กี่นาที ใส่ประสบการณ์ ทักษะ ตารางเวลา และรูปภาพ',
    step2_h:'ถูกค้นพบ',step2_p:'ครอบครัวที่กำลังหาผู้ช่วยงานบ้านในเมืองของคุณจะพบโปรไฟล์และติดต่อโดยตรง',
    step3_h:'เริ่มทำงาน',step3_p:'คุยกันโดยตรง ตกลงเงื่อนไข แล้วเริ่มงานได้เลย',
    ben_label:'ทำไมต้อง ThaiHelper',ben_title:'สร้างมาเพื่อผู้ให้บริการในบ้านโดยเฉพาะ',
    ben_sub:'วิธีดั้งเดิมแพงและไม่ชัดเจน กลุ่ม Facebook ก็วุ่นวาย คุณสมควรได้สิ่งที่ดีกว่า',
    ben1_h:'ฟรีสำหรับคุณตลอดไป',ben1_p:'ลงโปรไฟล์ใน ThaiHelper ฟรีตลอดไป นายจ้างเป็นคนจ่าย ไม่ใช่คุณ',
    ben2_h:'ครอบครัวจริงเท่านั้น',ben2_p:'เฉพาะครอบครัวที่ยืนยันอีเมลแล้วเท่านั้นที่ติดต่อคุณได้ ไม่มีสแปม ไม่เสียเวลา',
    ben3_h:'ครอบครัวไทยและต่างชาติ',ben3_p:'ทำงานกับครอบครัวไทยและชาวต่างชาติจากยุโรป อเมริกา รัสเซีย',
    ben4_h:'สร้างชื่อเสียง',ben4_p:'สะสมรีวิวจริงหลังทำงาน โปรไฟล์ที่ดีหมายถึงโอกาสที่ดีกว่า',
    ben5_h:'ทำงานใกล้บ้าน',ben5_p:'กรุงเทพฯ เชียงใหม่ ภูเก็ต พัทยา เกาะสมุย หาได้ทุกที่',
    ben6_h:'คุณควบคุมทุกอย่าง',ben6_p:'กำหนดราคา เวลา และเงื่อนไขเอง รับเฉพาะงานที่คุณต้องการ',
    cat_label:'ประเภทบริการ',cat_title:'ใครลงทะเบียนได้บ้าง?',
    cat_sub:'พนักงานบ้าน ติวเตอร์ ครูสอนพิเศษ และอื่นๆ — ยินดีต้อนรับทุกคน',
    cat1:'พี่เลี้ยงเด็ก',cat2:'แม่บ้านและพนักงานทำความสะอาด',cat3:'พ่อครัว / แม่ครัวส่วนตัว',
    cat4:'คนขับรถ',cat5:'คนสวนและดูแลสระว่ายน้ำ',cat6:'ผู้ดูแลผู้สูงอายุ',cat7:'ติวเตอร์ / ครูสอนพิเศษ',
    vid_label:'ดูการทำงานจริง',vid_title:'คนจริง งานจริง',vid_sub:'ดูวิธีที่ ThaiHelper ทำงาน',
    vid1_title:'ยินดีต้อนรับสู่ ThaiHelper',vid1_sub:'แนะนำสั้นๆ จากผู้ก่อตั้ง',vid1_badge:'🇬🇧 ภาษาอังกฤษ',
    vid2_title:'วิธีสมัครงาน (How to Register)',vid2_sub:'คู่มือทีละขั้นตอนสำหรับผู้ให้บริการ',vid2_badge:'🇵🇭 ฟิลิปปินส์ · 🇹🇭 ไทย',
    vid3_title:'เรื่องราวของผู้ให้บริการ',vid3_sub:'เร็วๆ นี้ — ฟังจากชุมชนของเรา',vid3_badge:'🎬 เร็วๆ นี้',
    cta_title:'พร้อมเริ่มอาชีพในประเทศไทยแล้วหรือยัง?',
    cta_sub:'สร้างโปรไฟล์ฟรีและให้ครอบครัวที่กำลังมองหาผู้ช่วยที่ไว้วางใจได้ค้นพบคุณ',
    cta_btn1:'สมัครเลย – ฟรี',cta_btn2:'เรียนรู้เพิ่มเติม',
    footer_desc:'แพลตฟอร์มฟรีที่เชื่อมต่อผู้ให้บริการอิสระกับครอบครัวในประเทศไทย',
    footer_disclaimer:'ThaiHelper.app ใช้งานฟรี เราไม่ใช่บริษัทจัดหางานและไม่ได้ให้บริการจัดหางาน การปฏิบัติตามกฎหมายแรงงานและกฎหมายตรวจคนเข้าเมืองของไทยเป็นความรับผิดชอบของผู้ใช้แต่เพียงผู้เดียว',
    footer_product:'ผลิตภัณฑ์',footer_company:'บริษัท',footer_legal:'กฎหมาย',
    footer_find:'สิทธิประโยชน์',footer_hire:'ประเภทงาน',footer_pricing:'ราคา',footer_employers:'สำหรับครอบครัว',footer_wizard:'ตัวช่วยใบอนุญาตทำงาน',footer_directory:'รายชื่อผู้เชี่ยวชาญ',
    footer_contact:'ติดต่อเรา',footer_line:'LINE',footer_about:'เกี่ยวกับเรา',footer_faq:'คำถามที่พบบ่อย',
    footer_privacy:'นโยบายความเป็นส่วนตัว',footer_terms:'ข้อกำหนดการใช้งาน',
  },
};

// Sample profiles for the landing-page preview. Shape mirrors the live
// helper data on /helpers so the shared <HelperCard> component can render
// both without adapters.
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

const MATCHES = [
  { family:'The Johnson Family', family_photo:'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=80&h=80&fit=crop&crop=face', helper:'Maria S.', helper_photo:'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=80&h=80&fit=crop&crop=face', role_en:'Full-time Nanny', role_th:'พี่เลี้ยงเด็กเต็มเวลา', city:'Phuket', quote_en:'Maria has been incredible with our kids. Found her in 2 days!', quote_th:'Maria ดูแลลูกๆ ได้อย่างยอดเยี่ยม พบเธอใน 2 วัน!' },
  { family:'The Weber Family', family_photo:'https://images.unsplash.com/photo-1600486913747-55e5470d6f40?w=80&h=80&fit=crop&crop=face', helper:'Sunisa K.', helper_photo:'https://images.unsplash.com/photo-1596815064285-45ed8a9c0463?w=80&h=80&fit=crop&crop=face', role_en:'Housekeeper', role_th:'แม่บ้าน', city:'Bangkok', quote_en:'No fees, direct communication. Exactly what we needed.', quote_th:'ไม่มีค่าธรรมเนียม สื่อสารโดยตรง ตรงตามที่เราต้องการ' },
  { family:'The Petrov Family', family_photo:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face', helper:'Ana R.', helper_photo:'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face', role_en:'Private Chef', role_th:'พ่อครัวส่วนตัว', city:'Phuket', quote_en:'Ana cooks amazing Thai and Western food. Our family loves her!', quote_th:'Ana ทำอาหารไทยและตะวันตกได้อย่างยอดเยี่ยม ครอบครัวเรารักเธอ!' },
];

const JOB_CATEGORIES = [
  {
    name: 'Nanny & Babysitter',
    designation: 'Childcare & Development',
    quote: 'Trusted nannies and babysitters who provide loving, attentive care for your children — from infants to school-age kids.',
    src: '/images/categories/nanny.jpg',
  },
  {
    name: 'Housekeeper & Cleaner',
    designation: 'Home Management',
    quote: 'Professional housekeepers who keep your home spotless, organized and running smoothly — daily or weekly service.',
    src: '/images/categories/housekeeper.jpg',
  },
  {
    name: 'Private Chef & Cook',
    designation: 'Culinary Arts',
    quote: 'Skilled private chefs preparing delicious Thai, Western and international cuisine tailored to your family\'s taste.',
    src: '/images/categories/chef.jpg',
  },
  {
    name: 'Driver & Chauffeur',
    designation: 'Transportation',
    quote: 'Reliable drivers for school runs, airport transfers, errands and daily commutes across Thailand.',
    src: '/images/categories/driver.jpg',
  },
  {
    name: 'Gardener & Pool Care',
    designation: 'Outdoor Maintenance',
    quote: 'Expert gardeners and pool technicians who keep your outdoor spaces lush, clean and beautiful year-round.',
    src: '/images/categories/gardener.jpg',
  },
  {
    name: 'Elder Care & Caregiver',
    designation: 'Senior Support',
    quote: 'Compassionate caregivers providing personal care, medication management and companionship for elderly family members.',
    src: '/images/categories/caregiver.jpg',
  },
  {
    name: 'Tutor & Teacher',
    designation: 'Education & Learning',
    quote: 'Qualified tutors for maths, languages, exam prep and more — helping your children excel academically.',
    src: '/images/categories/tutor.jpg',
  },
];

export default function Home() {
  const { lang, setLang: changeLang } = useLang();
  const t = T[lang];

  // FAQ data for structured data — these target common AI queries
  const homeFaqs = [
    { question: 'Is ThaiHelper really free for helpers?', answer: 'Yes, creating a profile on ThaiHelper is 100% free for helpers — forever. There are no sign-up fees, no monthly fees, and no commission taken from your salary. ThaiHelper is also free for families — there are no fees for either side.' },
    { question: 'How does ThaiHelper work?', answer: 'Sign up for free, create your profile with experience, skills and a photo, then get discovered by families searching for household staff in your city. Chat directly and agree on terms — no middleman involved. Registration takes about 3 minutes.' },
    { question: 'What types of helpers can register on ThaiHelper?', answer: 'Nannies, babysitters, housekeepers, cleaners, private chefs, cooks, personal drivers, chauffeurs, gardeners, pool care specialists, elder caregivers, tutors and teachers are all welcome to register on ThaiHelper.' },
    { question: 'Which cities does ThaiHelper cover?', answer: 'ThaiHelper covers all of Thailand with the strongest presence in Bangkok, Chiang Mai, Phuket, Pattaya, Koh Samui, and Hua Hin. Helpers and families from any city in Thailand can use the platform.' },
    { question: 'Are helpers on ThaiHelper verified?', answer: 'ThaiHelper is a directory platform, not an agency. Every helper verifies their email address before their profile goes live, but ThaiHelper does not perform ID checks or background checks. Families can browse profiles with experience details, skills, languages spoken, and photos — and should conduct their own interview and reference checks before hiring.' },
    { question: 'How much does a maid cost in Thailand?', answer: 'Maid costs in Thailand vary by city and hours. Part-time housekeepers (2-3 days/week) cost 4,000–8,000 THB/month. Full-time live-out maids cost 12,000–18,000 THB/month. Full-time live-in maids cost 10,000–15,000 THB/month. Bangkok and Phuket are at the higher end.' },
    { question: 'How much does a nanny cost in Thailand?', answer: 'Full-time nanny salaries in Thailand range from 12,000–25,000 THB/month depending on the city, experience, and languages spoken. Bangkok nannies earn 15,000–25,000 THB/month, while Chiang Mai nannies earn 12,000–18,000 THB/month.' },
    { question: 'How is ThaiHelper different from a recruitment agency?', answer: 'Traditional agencies in Thailand charge 1-3 months salary as a placement fee and often take a cut from the helper\'s pay. ThaiHelper charges zero fees to helpers and connects families directly with staff — no middleman, no agency commission.' },
    { question: 'Can I find English-speaking helpers on ThaiHelper?', answer: 'Yes. Many helpers on ThaiHelper speak English, especially those experienced with expat families. You can filter helpers by language on the platform. Helpers who speak English, Thai, Russian, Filipino, and other languages are available.' },
    { question: 'What is the best way to find a maid in Thailand without an agency?', answer: 'The best way to find a maid in Thailand without an agency is to use a directory platform like ThaiHelper. Unlike Facebook groups, ThaiHelper offers email-verified profiles, structured information about experience and skills, and direct messaging with helpers — all without agency fees. You conduct your own interview and reference checks, just like hiring through word of mouth.' },
  ];

  return (
    <>
      <SEOHead
        title="ThaiHelper – Find Trusted Household Staff in Thailand"
        description="ThaiHelper connects families and expats in Thailand with trusted nannies, housekeepers, cooks, drivers and more. Direct connections, no middleman fees."
        path="/"
        lang={lang}
        jsonLd={[getServiceSchema(), getFAQSchema(homeFaqs), getSpeakableSchema('/')]}
      />

      <div className={`bg-surface text-on-background font-body ${lang === 'th' ? 'lang-th' : ''}`}>

        {/* UTILITY TOP BAR — audience switch to employer landing */}
        <div className="fixed top-0 left-0 w-full bg-[#001b3d] text-white z-[60]">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 md:py-2.5 flex justify-end items-center text-xs md:text-sm">
            <Link href="/employers" className="font-medium hover:text-gold transition-colors flex items-center gap-1.5 whitespace-nowrap">
              <span className="opacity-80">
                {lang === 'en' ? 'Looking to hire a helper?' : lang === 'ru' ? 'Ищете помощника?' : 'กำลังหาผู้ช่วย?'}
              </span>
              <span className="font-bold">{t.nav_employers} →</span>
            </Link>
          </div>
        </div>

        {/* NAV */}
        <nav className="fixed top-9 md:top-11 left-0 w-full flex justify-between items-center px-4 md:px-6 py-3 md:py-4 bg-white/90 backdrop-blur-md z-50 shadow-sm">
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="text-xl md:text-2xl font-bold font-headline"><span>Thai</span><span style={{color:"#006a62"}}>Helper</span></Link>
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-primary text-white text-[10px] font-bold tracking-wide uppercase">
              {lang === 'en' ? 'For Helpers' : lang === 'ru' ? 'Помощники' : 'ผู้ช่วย'}
            </span>
          </div>
          {(() => {
            const navItems = [
              { href: '/employers',           label: t.nav_employers },
              { href: '/work-permit-wizard',  label: lang === 'th' ? 'ตัวช่วยใบอนุญาตทำงาน' : 'Work Permit Wizard' },
              { href: '/directory',           label: lang === 'th' ? 'รายชื่อผู้เชี่ยวชาญ' : 'Expert Directory' },
              { href: '/about',               label: t.nav_about },
              { href: '/faq',                 label: t.nav_faq },
              { href: '/blog',                label: t.nav_blog },
            ];
            return (
              <>
                <div className="hidden lg:flex items-center gap-4">
                  <ResourcesDropdown label={t.nav_resources} items={navItems} />
                  <Link className="text-sm font-semibold text-[#001b3d] hover:text-primary transition-colors" href="/login">{t.nav_login}</Link>
                  <LangSwitcher />
                  <Link className="px-6 py-2.5 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary text-sm font-semibold hover:shadow-lg transition-all active:scale-95 duration-150 whitespace-nowrap" href="/register">{t.nav_cta}</Link>
                </div>
                <div className="lg:hidden">
                  <MobileMenu
                    items={navItems}
                    secondaryCta={{ href: '/login', label: t.nav_login }}
                    primaryCta={{ href: '/register', label: t.nav_cta }}
                  />
                </div>
              </>
            );
          })()}
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
                  {lang === 'en' ? (
                    <>Your Next <span className="text-primary">Job</span><br />starts here.</>
                  ) : lang === 'ru' ? (
                    <>Ваша следующая <span className="text-primary">работа</span><br />начинается здесь.</>
                  ) : (
                    <><span className="text-primary">งาน</span>ต่อไปของคุณ<br />เริ่มที่นี่</>
                  )}
                </h1>
                {/* "No fees" line with gold shimmer */}
                <p className="font-extrabold font-headline mb-6 hero-gold-line" style={{fontSize:'clamp(1.5rem,3vw,2.2rem)'}}>
                  {lang === 'en' ? 'No fees, no middlemen.' : lang === 'ru' ? 'Без комиссий, без посредников.' : 'ไม่มีค่าธรรมเนียม ไม่มีคนกลาง'}
                </p>
                {/* 3 Steps — clear and simple */}
                <ul className="max-w-xl mb-10 space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-on-primary font-bold text-sm flex items-center justify-center mt-0.5">1</span>
                    <span className="text-lg text-on-surface-variant">{t.hero_step1}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-on-primary font-bold text-sm flex items-center justify-center mt-0.5">2</span>
                    <span className="text-lg text-on-surface-variant">{t.hero_step2}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-on-primary font-bold text-sm flex items-center justify-center mt-0.5">3</span>
                    <span className="text-lg text-on-surface-variant">{t.hero_step3}</span>
                  </li>
                </ul>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link className="px-8 py-4 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform text-center" href="/register">{t.hero_cta1}</Link>
                  <a className="px-8 py-4 rounded-xl bg-surface-container-highest text-secondary font-bold text-lg hover:bg-surface-container-high transition-colors text-center" href="#how-it-works">{t.hero_cta2}</a>
                </div>
                <Link className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-primary text-primary font-bold text-sm hover:bg-primary hover:text-white transition-all" href="/employers-browse">{t.hero_browse}</Link>
              </div>
              <div className="relative">
                <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-tertiary/5 rounded-full blur-3xl"></div>
                <div className="relative z-10 bg-white rounded-3xl p-6 sm:p-7 shadow-2xl shadow-on-background/10 border border-gray-100">
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                    <span className="font-bold text-sm sm:text-base font-headline text-on-background">{lang === 'th' ? 'สมาชิกใหม่ล่าสุด' : lang === 'ru' ? 'Новые регистрации' : 'Recently joined'}</span>
                    <span className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      {lang === 'th' ? 'สด' : lang === 'ru' ? 'В реальном времени' : 'Live'}
                    </span>
                  </div>

                  {/* Feed entries — placeholders until wired to Sheets */}
                  <div className="flex items-center gap-3 py-3 border-b border-gray-100">
                    <Image className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-100" src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&h=120&fit=crop&crop=face" alt="" width={40} height={40} unoptimized />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-on-background truncate">Som M.</div>
                      <div className="text-xs text-on-surface-variant mt-0.5">Nanny · Bangkok</div>
                    </div>
                    <span className="text-xs text-gray-400 font-medium flex-shrink-0">2h ago</span>
                  </div>

                  <div className="flex items-center gap-3 py-3 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-sm flex-shrink-0 font-headline" style={{background:'linear-gradient(135deg,#006a62,#0a8a7e)'}}>PT</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-on-background truncate">Ploy T.</div>
                      <div className="text-xs text-on-surface-variant mt-0.5">Private Chef · Phuket</div>
                    </div>
                    <span className="text-xs text-gray-400 font-medium flex-shrink-0">5h ago</span>
                  </div>

                  <div className="flex items-center gap-3 py-3 border-b border-gray-100">
                    <Image className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-100" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face" alt="" width={40} height={40} unoptimized />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-on-background truncate">Nok K.</div>
                      <div className="text-xs text-on-surface-variant mt-0.5">Housekeeper · Chiang Mai</div>
                    </div>
                    <span className="text-xs text-gray-400 font-medium flex-shrink-0">Yesterday</span>
                  </div>

                  <div className="flex items-center gap-3 py-3">
                    <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-sm flex-shrink-0 font-headline" style={{background:'linear-gradient(135deg,#006a62,#0a8a7e)'}}>AC</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-on-background truncate">Apinya C.</div>
                      <div className="text-xs text-on-surface-variant mt-0.5">Caregiver · Hua Hin</div>
                    </div>
                    <span className="text-xs text-gray-400 font-medium flex-shrink-0">2d ago</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
                    <div>
                      <div className="font-headline font-extrabold text-3xl text-primary leading-none tracking-tight">80+</div>
                      <div className="text-xs text-on-surface-variant mt-1.5 font-medium leading-snug">{lang === 'th' ? (<>ผู้ช่วยลงทะเบียน<br/>เพิ่มขึ้นทุกวัน</>) : lang === 'ru' ? (<>Зарегистрировано<br/>и растёт ежедневно</>) : (<>Helpers registered<br/>&amp; growing daily</>)}</div>
                    </div>
                    <div>
                      <div className="font-headline font-extrabold text-3xl text-primary leading-none tracking-tight">20+</div>
                      <div className="text-xs text-on-surface-variant mt-1.5 font-medium leading-snug">{lang === 'th' ? (<>เมือง<br/>ทั่วประเทศไทย</>) : lang === 'ru' ? (<>Городов по<br/>всему Таиланду</>) : (<>Cities across<br/>Thailand</>)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* TRUST BAR */}
          <div className="py-5 px-6">
            <div className="max-w-md mx-auto text-center">
              <div className="flex justify-center mb-3">
                <div className="flex -space-x-2.5">
                  <Image className="w-9 h-9 rounded-full border-2 border-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=80&h=80&fit=crop&crop=face" alt="Verified nanny in Thailand — Maria S." width={36} height={36} />
                  <Image className="w-9 h-9 rounded-full border-2 border-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1596815064285-45ed8a9c0463?w=80&h=80&fit=crop&crop=face" alt="Verified housekeeper in Thailand — Sunisa K." width={36} height={36} />
                  <Image className="w-9 h-9 rounded-full border-2 border-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face" alt="Verified private chef in Thailand — Ana R." width={36} height={36} />
                  <Image className="w-9 h-9 rounded-full border-2 border-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=80&h=80&fit=crop&crop=face" alt="Verified household helper in Thailand" width={36} height={36} />
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
              <div className="flex flex-col gap-4 max-w-4xl mx-auto">
                {PROFILES.map((p, i) => (
                  <HelperCard
                    key={i}
                    mode="browse"
                    helper={{
                      photo: p.photo,
                      name: p.name,
                      age: p.age,
                      verified: p.verified,
                      categoryLabel: p[`category_${lang}`] || p.category_en,
                      city: p.city,
                      area: p.area,
                      bio: p[`bio_${lang}`] || p.bio_en,
                      experience: p.experience,
                      languages: p.languages,
                    }}
                    t={{
                      card_exp: t.preview_exp,
                      card_verified: (t.preview_badge || '').replace(/^✓\s*/, ''),
                      card_signin: t.preview_signin,
                      card_signin_btn: t.preview_signin_btn,
                    }}
                  />
                ))}
              </div>
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
              <div className="flex flex-col items-center gap-3">
                <div className="flex flex-wrap justify-center gap-3">
                  {[
                    { label: t.cat1, href: '/hire/nanny' },
                    { label: t.cat2, href: '/hire/housekeeper' },
                    { label: t.cat3, href: '/hire/chef' },
                    { label: t.cat4, href: '/hire/driver' },
                  ].map((c, i) => (
                    <Link key={i} href={c.href} className="px-6 py-3 rounded-full bg-surface-container-highest text-on-background font-semibold text-sm hover:bg-primary hover:text-on-primary transition-colors">{c.label}</Link>
                  ))}
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  {[
                    { label: t.cat5, href: '/hire/gardener' },
                    { label: t.cat6, href: '/hire/caregiver' },
                    { label: t.cat7, href: '/hire/tutor' },
                  ].map((c, i) => (
                    <Link key={i + 4} href={c.href} className="px-6 py-3 rounded-full bg-surface-container-highest text-on-background font-semibold text-sm hover:bg-primary hover:text-on-primary transition-colors">{c.label}</Link>
                  ))}
                </div>
              </div>
              {/* City links for SEO internal linking */}
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {[
                  { label: 'Bangkok', href: '/hire/bangkok' },
                  { label: 'Phuket', href: '/hire/phuket' },
                  { label: 'Chiang Mai', href: '/hire/chiang-mai' },
                  { label: 'Pattaya', href: '/hire/pattaya' },
                  { label: 'Koh Samui', href: '/hire/koh-samui' },
                  { label: 'Hua Hin', href: '/hire/hua-hin' },
                  { label: 'Krabi', href: '/hire/krabi' },
                  { label: 'Ao Nang', href: '/hire/ao-nang' },
                  { label: 'Koh Phangan', href: '/hire/koh-phangan' },
                  { label: 'Chonburi', href: '/hire/chonburi' },
                ].map((c, i) => (
                  <Link key={i} href={c.href} className="px-4 py-2 rounded-full border border-slate-200 text-on-surface-variant text-xs font-medium hover:border-primary hover:text-primary transition-colors">{c.label}</Link>
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
                  <a aria-label="LINE Official Account" className="w-10 h-10 rounded-full bg-[#06C755] flex items-center justify-center text-white hover:opacity-80 transition-all" href="https://lin.ee/U7B1KX6" target="_blank" rel="noopener noreferrer">
                    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
                <div>
                  <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-widest font-headline whitespace-nowrap">{t.footer_product}</h4>
                  <ul className="space-y-3">
                    <li><a className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="#benefits">{t.footer_find}</a></li>
                    <li><a className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="#categories">{t.footer_hire}</a></li>
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/employers">{t.footer_employers}</Link></li>
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/work-permit-wizard">{t.footer_wizard}</Link></li>
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/directory">{t.footer_directory}</Link></li>
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/blog">{t.nav_blog}</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-widest font-headline whitespace-nowrap">{t.footer_company}</h4>
                  <ul className="space-y-3">
                    <li><a className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="mailto:support@thaihelper.app">{t.footer_contact}</a></li>
                    <li><a className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="https://lin.ee/U7B1KX6" target="_blank" rel="noopener noreferrer">{t.footer_line}</a></li>
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/about">{t.footer_about}</Link></li>
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/faq">{t.footer_faq}</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-widest font-headline whitespace-nowrap">{t.footer_legal}</h4>
                  <ul className="space-y-3">
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/privacy">{t.footer_privacy}</Link></li>
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/terms">{t.footer_terms}</Link></li>
                  </ul>
                </div>
              </div>
            </div>
            {/* SEO footer links — popular searches */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 text-center">
                {lang === 'en' ? 'Popular Searches' : lang === 'ru' ? 'Популярные запросы' : 'ค้นหายอดนิยม'}
              </h4>
              <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
                {[
                  { label: 'Nanny Bangkok', href: '/hire/nanny-bangkok' },
                  { label: 'Housekeeper Phuket', href: '/hire/housekeeper-phuket' },
                  { label: 'Driver Bangkok', href: '/hire/driver-bangkok' },
                  { label: 'Chef Koh Samui', href: '/hire/chef-koh-samui' },
                  { label: 'Caregiver Chiang Mai', href: '/hire/caregiver-chiang-mai' },
                  { label: 'Tutor Bangkok', href: '/hire/tutor-bangkok' },
                  { label: 'Nanny Phuket', href: '/hire/nanny-phuket' },
                  { label: 'Housekeeper Bangkok', href: '/hire/housekeeper-bangkok' },
                  { label: 'Gardener Hua Hin', href: '/hire/gardener-hua-hin' },
                  { label: 'Driver Pattaya', href: '/hire/driver-pattaya' },
                  { label: 'Housekeeper Krabi', href: '/hire/housekeeper-krabi' },
                  { label: 'Chef Ao Nang', href: '/hire/chef-ao-nang' },
                  { label: 'Nanny Koh Phangan', href: '/hire/nanny-koh-phangan' },
                  { label: 'Nanny Chonburi', href: '/hire/nanny-chonburi' },
                  { label: 'Caregiver Chiang Rai', href: '/hire/caregiver-chiang-rai' },
                  { label: 'Housekeeper Pai', href: '/hire/housekeeper-pai' },
                  { label: 'Caregiver Udon Thani', href: '/hire/caregiver-udon-thani' },
                  { label: 'Tutor Khon Kaen', href: '/hire/tutor-khon-kaen' },
                ].map((link, i) => (
                  <Link key={i} href={link.href} className="text-xs text-slate-400 hover:text-primary transition-colors">{link.label}</Link>
                ))}
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-200 text-center">
              <p className="text-slate-400 text-xs leading-relaxed max-w-3xl mx-auto mb-3">{t.footer_disclaimer}</p>
              <p className="text-slate-500 text-xs">© 2026 ThaiHelper. All rights reserved.</p>
            </div>
          </div>
        </footer>

        {/* Floating LINE chat button */}
        <a
          href="https://lin.ee/U7B1KX6"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on LINE"
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-[#06C755] text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all group"
        >
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
          <span className="hidden sm:inline font-semibold text-sm whitespace-nowrap">{lang === 'th' ? 'แชทกับเรา' : lang === 'ru' ? 'Чат в LINE' : 'Chat on LINE'}</span>
        </a>

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

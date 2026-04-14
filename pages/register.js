import { useState, useEffect, useCallback } from 'react';
import SEOHead, { getBreadcrumbSchema } from '@/components/SEOHead';
import LangSwitcher from '@/components/LangSwitcher';
import Turnstile from '@/components/Turnstile';
import { useLang } from './_app';
import Link from 'next/link';
import { registerHelper, uploadProfilePhoto, updateProfile } from '@/lib/api/helpers';

// ─── TRANSLATIONS ──────────────────────────────────────────────────────────────
const T = {
  en: {
    page_title:      'Register as a Provider – ThaiHelper',
    nav_back:        '← Back to Home',
    hero_h1:         'Create Your Free Profile',
    hero_p:          'Takes about 3 minutes · No fees · Get contacted directly by families',
    step1_dot:       'About You',
    step2_dot:       'Experience',
    step3_dot:       'Contact',
    step1_title:     'Tell us about yourself',
    step1_sub:       'First, the basics — what you do and where you work.',
    cat_label:       'Service Category',
    cat_ph:          '— Select your main service —',
    cat_nanny:       'Nanny & Babysitter',
    cat_housekeeper: 'Housekeeper & Cleaner',
    cat_chef:        'Private Chef & Cook',
    cat_driver:      'Driver & Chauffeur',
    cat_gardener:    'Gardener & Pool Care',
    cat_elder:       'Elder Care & Caregiver',
    cat_tutor:       'Tutor & Teacher',
    cat_multiple:    'Multiple Services',
    cat_error:       'Please select a category.',
    skills_label:    'What can you do?',
    skills_sub:      'Select everything that applies — this helps families find you.',
    age_label:       'Your Age',
    age_ph:          '— Select your age —',
    age_error:       'Please select your age.',
    fname_label:     'First Name',
    fname_ph:        'e.g. Maria',
    fname_error:     'Please enter your first name.',
    lname_label:     'Last Name',
    lname_ph:        'e.g. Santos',
    lname_error:     'Please enter your last name.',
    city_label:      'Your Location',
    city_ph:         '— Where are you based? —',
    city_other:      '📍 Other in Thailand',
    city_error:      'Please select your city.',
    area_label:      'Neighborhood / Area',
    area_ph:         'e.g. Rawai, Sukhumvit, Nimman...',
    area_hint:       'Optional — helps families nearby find you faster.',
    btn_next1:       'Next: Your Experience →',
    step2_title:     'Your experience',
    step2_sub:       'Help families understand your background and skills.',
    exp_label:       'Years of Experience',
    exp_ph:          '— How long have you been working? —',
    exp_0:           'Less than 1 year',
    exp_1:           '1–2 years',
    exp_3:           '3–5 years',
    exp_6:           '6–10 years',
    exp_10:          '10+ years',
    exp_error:       'Please select your experience level.',
    lang_label:      'Languages Spoken',
    lang_error:      'Please select at least one language.',
    rate_label:      'Hourly Rate',
    rate_ph:         '— What is your rate per hour? —',
    edu_label:       'Education (optional)',
    edu_ph:          'e.g. High School, Bachelor\'s Degree, Vocational Training…',
    cert_label:      'Certificates & Qualifications (optional)',
    cert_ph:         'e.g. First Aid, Childcare Certificate, Food Safety, Cooking Diploma…',
    bio_label:       'About You',
    bio_ph:          'e.g. I have 5 years of experience as a nanny for a Thai-expat family in Phuket. I speak English and some Thai. I love working with children and am patient, caring and reliable.',
    bio_generate:    '✨ Write bio for me',
    bio_hints_title: 'What to mention:',
    bio_hint1:       'Why are you great at this job?',
    bio_hint2:       'What are you especially good at?',
    bio_hint3:       'Where have you worked before?',
    bio_notice:      'Please do not include phone numbers, email or social media links here.',
    chars_label:     'characters',
    bio_error:       'Please write a short description (at least 30 characters).',
    btn_back:        '← Back',
    btn_next2:       'Next: Finish →',
    step3_title:     'Almost done',
    step3_sub:       'Families will contact you through our platform messaging. Your email stays private and is only used for login and notifications.',
    email_label:     'Email Address',
    email_error:     'Please enter a valid email address.',
    photo_label:     'Profile Photo',
    photo_optional:  '(optional but recommended)',
    photo_strong:    'Upload a photo of yourself',
    photo_desc:      'JPG or PNG · Max 5 MB · Clear face photo works best',
    photo_selected:  '✓ Photo selected – looking great!',
    photo_tips_title:'Tips for a good profile photo:',
    photo_tip1:      '✅ Face clearly visible',
    photo_tip2:      '✅ Good lighting, clean background',
    photo_tip3:      '✅ Friendly, professional look',
    photo_tip4:      '❌ No children or other people',
    photo_tip5:      '❌ No logos or text overlays',
    terms_text:      'I agree to the Terms of Service and Privacy Policy. My profile will be visible to registered families on ThaiHelper.',
    terms_error:     'Please agree to the terms.',
    submit_label:    'Create My Free Profile ✓',
    submitting:      'Submitting...',
    submit_error:    'Something went wrong. Please try again or contact hello@thaihelper.com',
    duplicate_email: 'An account with this email already exists. Please log in instead.',
    photo_size_err:  'Photo must be smaller than 5 MB.',
    success_h2:      'Welcome to ThaiHelper! 🎉',
    success_p1:      '✉️ We sent a verification link to your email. Please click it to activate your profile.',
    success_p2:      'After verification, families can find and message you. Add a photo on your profile page to get more replies.',
    success_share:   'Know other nannies or housekeepers? Share ThaiHelper with them:',
    success_login:   'Go to my profile →',
    trust_secure:    '🔒 Secure & private',
    trust_free:      '✅ 100% free for providers',
    trust_mobile:    '📱 Works on any phone',
  },
  th: {
    page_title:      'ลงทะเบียนเป็นผู้ให้บริการ – ThaiHelper',
    nav_back:        '← กลับหน้าหลัก',
    hero_h1:         'สร้างโปรไฟล์ฟรีของคุณ',
    hero_p:          'ใช้เวลาประมาณ 3 นาที · ไม่มีค่าใช้จ่าย · ครอบครัวติดต่อคุณโดยตรง',
    step1_dot:       'ข้อมูลของคุณ',
    step2_dot:       'ประสบการณ์',
    step3_dot:       'ติดต่อ',
    step1_title:     'แนะนำตัวเอง',
    step1_sub:       'เริ่มต้นด้วยพื้นฐาน — คุณทำอะไรและทำงานที่ไหน',
    cat_label:       'ประเภทบริการ',
    cat_ph:          '— เลือกบริการหลักของคุณ —',
    cat_nanny:       'พี่เลี้ยงเด็ก',
    cat_housekeeper: 'แม่บ้าน / ทำความสะอาด',
    cat_chef:        'พ่อครัว / แม่ครัวส่วนตัว',
    cat_driver:      'คนขับรถ',
    cat_gardener:    'ดูแลสวน / สระน้ำ',
    cat_elder:       'ดูแลผู้สูงอายุ',
    cat_tutor:       'ติวเตอร์ / ครูสอนพิเศษ',
    cat_multiple:    'หลายบริการ',
    cat_error:       'กรุณาเลือกประเภทบริการ',
    skills_label:    'คุณทำอะไรได้บ้าง?',
    skills_sub:      'เลือกทุกอย่างที่เกี่ยวข้อง — ช่วยให้ครอบครัวค้นพบคุณได้ง่ายขึ้น',
    age_label:       'อายุของคุณ',
    age_ph:          '— เลือกช่วงอายุ —',
    age_error:       'กรุณาเลือกอายุ',
    fname_label:     'ชื่อ',
    fname_ph:        'เช่น มาเรีย',
    fname_error:     'กรุณากรอกชื่อของคุณ',
    lname_label:     'นามสกุล',
    lname_ph:        'เช่น ซานโตส',
    lname_error:     'กรุณากรอกนามสกุลของคุณ',
    city_label:      'ที่อยู่ปัจจุบัน',
    city_ph:         '— คุณอยู่ที่ไหน? —',
    city_other:      '📍 ที่อื่นในไทย',
    city_error:      'กรุณาเลือกเมืองของคุณ',
    area_label:      'ย่าน / พื้นที่',
    area_ph:         'เช่น ราไวย์, สุขุมวิท, นิมมาน...',
    area_hint:       'ไม่บังคับ — ช่วยให้ครอบครัวใกล้เคียงค้นหาคุณได้เร็วขึ้น',
    btn_next1:       'ถัดไป: ประสบการณ์ →',
    step2_title:     'ประสบการณ์ของคุณ',
    step2_sub:       'ช่วยให้ครอบครัวเข้าใจภูมิหลังและทักษะของคุณ',
    exp_label:       'ประสบการณ์การทำงาน',
    exp_ph:          '— คุณทำงานมานานแค่ไหน? —',
    exp_0:           'น้อยกว่า 1 ปี',
    exp_1:           '1–2 ปี',
    exp_3:           '3–5 ปี',
    exp_6:           '6–10 ปี',
    exp_10:          'มากกว่า 10 ปี',
    exp_error:       'กรุณาเลือกระดับประสบการณ์',
    lang_label:      'ภาษาที่พูดได้',
    lang_error:      'กรุณาเลือกอย่างน้อยหนึ่งภาษา',
    rate_label:      'ค่าจ้างต่อชั่วโมง',
    rate_ph:         '— คุณต้องการเท่าไหร่ต่อชั่วโมง? —',
    edu_label:       'การศึกษา (ไม่จำเป็น)',
    edu_ph:          'เช่น มัธยมปลาย, ปริญญาตรี, อาชีวศึกษา…',
    cert_label:      'ใบรับรอง / คุณสมบัติ (ไม่จำเป็น)',
    cert_ph:         'เช่น ปฐมพยาบาล, ใบรับรองดูแลเด็ก, อาหารปลอดภัย, ประกาศนียบัตรทำอาหาร…',
    bio_label:       'เกี่ยวกับคุณ',
    bio_ph:          'เช่น ฉันมีประสบการณ์ 5 ปีในการดูแลเด็กให้กับครอบครัวชาวต่างชาติในภูเก็ต พูดภาษาอังกฤษได้และไทยได้บ้าง ฉันรักการทำงานกับเด็กและมีความอดทน ใส่ใจ และน่าเชื่อถือ',
    bio_generate:    '✨ เขียน Bio ให้ฉัน',
    bio_hints_title: 'สิ่งที่ควรกล่าวถึง:',
    bio_hint1:       'ทำไมคุณถึงเหมาะกับงานนี้?',
    bio_hint2:       'คุณถนัดเรื่องอะไรเป็นพิเศษ?',
    bio_hint3:       'คุณเคยทำงานที่ไหนมาบ้าง?',
    bio_notice:      'กรุณาอย่าใส่เบอร์โทร อีเมล หรือลิงก์โซเชียลมีเดียในส่วนนี้',
    chars_label:     'ตัวอักษร',
    bio_error:       'กรุณาเขียนคำอธิบายสั้นๆ (อย่างน้อย 30 ตัวอักษร)',
    btn_back:        '← ย้อนกลับ',
    btn_next2:       'ถัดไป: เสร็จสิ้น →',
    step3_title:     'ใกล้เสร็จแล้ว',
    step3_sub:       'ครอบครัวจะติดต่อคุณผ่านระบบข้อความบนแพลตฟอร์มของเรา อีเมลของคุณเป็นส่วนตัว ใช้สำหรับเข้าสู่ระบบและแจ้งเตือนเท่านั้น',
    email_label:     'อีเมล',
    email_error:     'กรุณากรอกอีเมลที่ถูกต้อง',
    photo_label:     'รูปโปรไฟล์',
    photo_optional:  '(ไม่บังคับ แต่แนะนำ)',
    photo_strong:    'อัปโหลดรูปถ่ายของคุณ',
    photo_desc:      'JPG หรือ PNG · ไม่เกิน 5 MB · รูปถ่ายหน้าชัดจะดีที่สุด',
    photo_selected:  '✓ เลือกรูปแล้ว – ดูดีมาก!',
    photo_tips_title:'เคล็ดลับรูปโปรไฟล์ที่ดี:',
    photo_tip1:      '✅ ใบหน้าชัดเจน',
    photo_tip2:      '✅ แสงดี พื้นหลังสะอาด',
    photo_tip3:      '✅ ดูเป็นมิตรและมืออาชีพ',
    photo_tip4:      '❌ ไม่มีเด็กหรือคนอื่นในรูป',
    photo_tip5:      '❌ ไม่มีโลโก้หรือข้อความซ้อนทับ',
    terms_text:      'ฉันยอมรับเงื่อนไขการใช้บริการและนโยบายความเป็นส่วนตัว โปรไฟล์ของฉันจะปรากฏต่อครอบครัวที่ลงทะเบียนใน ThaiHelper',
    terms_error:     'กรุณายอมรับเงื่อนไข',
    submit_label:    'สร้างโปรไฟล์ฟรีของฉัน ✓',
    submitting:      'กำลังบันทึก...',
    submit_error:    'เกิดข้อผิดพลาด กรุณาลองใหม่หรือติดต่อ hello@thaihelper.com',
    duplicate_email: 'อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบแทน',
    photo_size_err:  'รูปภาพต้องมีขนาดไม่เกิน 5 MB',
    success_h2:      'ยินดีต้อนรับสู่ ThaiHelper! 🎉',
    success_p1:      '✉️ เราส่งลิงก์ยืนยันไปที่อีเมลของคุณแล้ว กรุณาคลิกเพื่อเปิดใช้งานโปรไฟล์',
    success_p2:      'หลังจากยืนยันแล้ว ครอบครัวจะสามารถค้นหาและส่งข้อความถึงคุณได้ เพิ่มรูปในหน้าโปรไฟล์เพื่อรับการตอบกลับมากขึ้น',
    success_share:   'รู้จักพี่เลี้ยงหรือแม่บ้านคนอื่นไหม? แชร์ ThaiHelper ให้พวกเขา:',
    success_login:   'ไปที่โปรไฟล์ของฉัน →',
    trust_secure:    '🔒 ปลอดภัยและเป็นส่วนตัว',
    trust_free:      '✅ ฟรี 100% สำหรับผู้ให้บริการ',
    trust_mobile:    '📱 ใช้งานได้ทุกอุปกรณ์',
  }
};

// ─── SKILLS PER CATEGORY ────────���─────────────────────────────────���──────────
// NOTE: Canonical source is @/lib/constants/categories.js — keep in sync
const SKILLS_BY_CATEGORY = {
  nanny: [
    { value: 'infant_care',   en: '👶 Infant care (0–2 years)',      th: '👶 ดูแลทารก (0–2 ปี)' },
    { value: 'child_care',    en: '🧒 Child care (3–12 years)',       th: '🧒 ดูแลเด็ก (3–12 ปี)' },
    { value: 'school_run',    en: '🚌 School pickup & dropoff',       th: '🚌 รับ-ส่งโรงเรียน' },
    { value: 'homework',      en: '📚 Homework help',                 th: '📚 ช่วยการบ้าน' },
    { value: 'cooking_kids',  en: '🍳 Cooking for children',          th: '🍳 ทำอาหารเด็ก' },
    { value: 'overnight',     en: '🌙 Overnight care',                th: '🌙 ดูแลกลางคืน' },
    { value: 'live_in',       en: '🏠 Live-in (accommodation needed)', th: '🏠 อยู่ประจำ (ต้องการที่พัก)' },
    { value: 'live_out',      en: '🚶 Live-out (commuting daily)',     th: '🚶 ไป-กลับ (เดินทางเอง)' },
    { value: 'pool_superv',   en: '🏊 Pool supervision',              th: '🏊 ดูแลบริเวณสระน้ำ' },
    { value: 'weekend',       en: '📅 Weekend & holiday care',        th: '📅 ดูแลวันหยุด' },
  ],
  housekeeper: [
    { value: 'general_clean', en: '🧹 General cleaning',             th: '🧹 ทำความสะอาดทั่วไป' },
    { value: 'laundry',       en: '👕 Laundry & ironing',            th: '👕 ซักรีด' },
    { value: 'cooking',       en: '🍳 Cooking & meal prep',          th: '🍳 ทำอาหาร' },
    { value: 'windows',       en: '🪟 Window cleaning',              th: '🪟 เช็ดกระจก' },
    { value: 'shopping',      en: '🛒 Grocery shopping',             th: '🛒 ซื้อของตลาด' },
    { value: 'organising',    en: '📦 Organising & tidying',         th: '📦 จัดระเบียบบ้าน' },
  ],
  chef: [
    { value: 'thai_cuisine',  en: '🇹🇭 Thai cuisine',               th: '🇹🇭 อาหารไทย' },
    { value: 'western',       en: '🍝 Western cuisine',              th: '🍝 อาหารตะวันตก' },
    { value: 'asian',         en: '🍜 Other Asian cuisine',          th: '🍜 อาหารเอเชียอื่นๆ' },
    { value: 'vegetarian',    en: '🥗 Vegetarian / vegan',           th: '🥗 มังสวิรัติ / วีแกน' },
    { value: 'baking',        en: '🎂 Baking & desserts',            th: '🎂 ขนมอบ' },
    { value: 'meal_prep',     en: '🥡 Meal planning',                th: '🥡 วางแผนเมนู' },
  ],
  driver: [
    { value: 'airport',       en: '✈️ Airport transfers',           th: '✈️ รับ-ส่งสนามบิน' },
    { value: 'school_run',    en: '🚌 School runs',                  th: '🚌 รับ-ส่งโรงเรียน' },
    { value: 'shopping_trip', en: '🛒 Shopping & errands',           th: '🛒 พาช้อปปิ้ง / ทำธุระ' },
    { value: 'full_time',     en: '🕐 Full-time / live-in driver',   th: '🕐 คนขับประจำ' },
    { value: 'night',         en: '🌙 Night driving',                th: '🌙 ขับรถกลางคืน' },
  ],
  gardener: [
    { value: 'garden_maint',  en: '🌿 Garden maintenance',          th: '🌿 ดูแลสวน' },
    { value: 'pool_clean',    en: '🏊 Pool cleaning',                th: '🏊 ทำความสะอาดสระ' },
    { value: 'pool_chem',     en: '🧪 Pool chemical management',     th: '🧪 จัดการสารเคมีสระน้ำ' },
    { value: 'lawn',          en: '🌱 Lawn mowing',                  th: '🌱 ตัดหญ้า' },
    { value: 'plants',        en: '🪴 Plant care & watering',        th: '🪴 รดน้ำต้นไม้' },
  ],
  elder_care: [
    { value: 'hygiene',       en: '🛁 Personal hygiene assistance',  th: '🛁 ช่วยดูแลสุขอนามัย' },
    { value: 'medication',    en: '💊 Medication reminders',         th: '💊 เตือนทานยา' },
    { value: 'mobility',      en: '🦽 Mobility assistance',          th: '🦽 ช่วยเรื่องการเคลื่อนที่' },
    { value: 'companion',     en: '🤝 Companionship',                th: '🤝 คอยเป็นเพื่อน' },
    { value: 'appointments',  en: '🏥 Medical appointments',         th: '🏥 พาไปพบแพทย์' },
  ],
  tutor: [
    { value: 'math',          en: '🔢 Maths',                        th: '🔢 คณิตศาสตร์' },
    { value: 'english_subj',  en: '📖 English (subject)',            th: '📖 ภาษาอังกฤษ (วิชา)' },
    { value: 'science',       en: '🔬 Science',                      th: '🔬 วิทยาศาสตร์' },
    { value: 'thai_lang',     en: '🇹🇭 Thai language',              th: '🇹🇭 ภาษาไทย' },
    { value: 'russian_lang',  en: '🇷🇺 Russian language',           th: '🇷🇺 ภาษารัสเซีย' },
    { value: 'german_lang',   en: '🇩🇪 German language',            th: '🇩🇪 ภาษาเยอรมัน' },
    { value: 'chinese_lang',  en: '🇨🇳 Chinese / Mandarin',         th: '🇨🇳 ภาษาจีน / แมนดาริน' },
    { value: 'piano',         en: '🎹 Piano',                        th: '🎹 เปียโน' },
    { value: 'guitar',        en: '🎸 Guitar',                       th: '🎸 กีตาร์' },
    { value: 'singing',       en: '🎤 Singing / Voice',              th: '🎤 ร้องเพลง / เสียงร้อง' },
    { value: 'ballet',        en: '🩰 Ballet & Dance',               th: '🩰 บัลเล่ต์ / เต้นรำ' },
    { value: 'art',           en: '🎨 Art & Drawing',                th: '🎨 ศิลปะ / วาดรูป' },
    { value: 'swim_coach',    en: '🏊 Swimming lessons',             th: '🏊 สอนว่ายน้ำ' },
    { value: 'coding',        en: '💻 Coding for kids',              th: '💻 โค้ดดิ้งสำหรับเด็ก' },
  ],
  multiple: [
    { value: 'nanny',         en: '👶 Nanny / childcare',            th: '👶 พี่เลี้ยงเด็ก' },
    { value: 'cleaning',      en: '🧹 Cleaning',                     th: '🧹 ทำความสะอาด' },
    { value: 'cooking',       en: '🍳 Cooking',                      th: '🍳 ทำอาหาร' },
    { value: 'driving',       en: '🚗 Driving',                      th: '🚗 ขับรถ' },
    { value: 'garden',        en: '🌿 Gardening',                    th: '🌿 ดูแลสวน' },
    { value: 'elder',         en: '🏥 Elder care',                   th: '🏥 ดูแลผู้สูงอายุ' },
    { value: 'tutoring',      en: '📚 Tutoring / teaching',          th: '📚 สอนพิเศษ' },
  ],
};

// ─── HOURLY RATES ────────────────────────────────────────────────────────────
const RATES = [
  { value: 'negotiable',   en: 'Negotiable',                   th: 'แล้วแต่ตกลง' },
  { value: 'under_150',    en: 'Under 150 THB / hour',         th: 'ต่ำกว่า 150 บาท / ชั่วโมง' },
  { value: '150_200',      en: '150–200 THB / hour',           th: '150–200 บาท / ชั่วโมง' },
  { value: '200_300',      en: '200–300 THB / hour',           th: '200–300 บาท / ชั่วโมง' },
  { value: '300_500',      en: '300–500 THB / hour',           th: '300–500 บาท / ชั่วโมง' },
  { value: '500_700',      en: '500–700 THB / hour',           th: '500–700 บาท / ชั่วโมง' },
  { value: '700_1000',     en: '700–1,000 THB / hour',         th: '700–1,000 บาท / ชั่วโมง' },
  { value: 'over_1000',    en: '1,000+ THB / hour',            th: '1,000+ บาท / ชั่วโมง' },
];

// ─── LANGUAGES ───────────────────────────────────────────────────────────────
const LANGUAGES = [
  { value: 'english', label: '🇬🇧 English' },
  { value: 'thai',    label: '🇹🇭 Thai' },
  { value: 'tagalog', label: '🇵🇭 Tagalog' },
  { value: 'russian', label: '🇷🇺 Russian' },
  { value: 'german',  label: '🇩🇪 German' },
  { value: 'chinese', label: '🇨🇳 Chinese' },
  { value: 'other',   label: '🌍 Other' },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function generateBio({ lang, category, skills, experience, languages, city }) {
  const catEN = {
    nanny: 'nanny and childcare provider', housekeeper: 'housekeeper and cleaner',
    chef: 'private chef and cook', driver: 'driver and chauffeur',
    gardener: 'gardener and pool care specialist', elder_care: 'elder care and caregiver',
    tutor: 'tutor and private teacher', multiple: 'household services professional',
  };
  const catTH = {
    nanny: 'พี่เลี้ยงเด็ก', housekeeper: 'แม่บ้าน', chef: 'พ่อครัว/แม่ครัวส่วนตัว',
    driver: 'คนขับรถ', gardener: 'คนสวนและดูแลสระ', elder_care: 'ผู้ดูแลผู้สูงอายุ',
    tutor: 'ติวเตอร์และครูสอนพิเศษ', multiple: 'ผู้ให้บริการงานบ้านหลายด้าน',
  };
  const expEN = { '0': 'less than a year', '1': '1–2 years', '3': '3–5 years', '6': '6–10 years', '10': 'over 10 years' };
  const langNames = { english: 'English', thai: 'Thai', tagalog: 'Tagalog', russian: 'Russian', german: 'German', chinese: 'Chinese', other: 'other languages' };
  const cityName = (c) => c ? c.charAt(0).toUpperCase() + c.slice(1).replace(/_/g, ' ') : 'Thailand';

  if (lang === 'th') {
    const cat = catTH[category] || 'ผู้ให้บริการงานบ้าน';
    const loc = city && city !== 'other' ? cityName(city) : 'ประเทศไทย';
    const skillSnippet = skills.length > 0 ? `ทักษะของฉันได้แก่ ${skills.slice(0, 3).map(s => s.replace(/_/g, ' ')).join(', ')} ` : '';
    return `ฉันเป็น${cat}ที่มีประสบการณ์ ทำงานในพื้นที่${loc} ฉันรักงานบริการและมุ่งมั่นในการดูแลทุกครอบครัวอย่างดีที่สุด ${skillSnippet}ฉันมีความขยัน ซื่อสัตย์ น่าเชื่อถือ และพร้อมพูดคุยถึงความต้องการของครอบครัวคุณโดยตรง`;
  }

  const cat = catEN[category] || 'household services professional';
  const exp = expEN[experience] || 'several years';
  const loc = city && city !== 'other' ? cityName(city) : 'Thailand';
  const langList = languages.length > 0 ? languages.map(l => langNames[l] || l).join(' and ') : 'multiple languages';
  const skillSnippet = skills.length > 0 ? `My main skills include ${skills.slice(0, 3).map(s => s.replace(/_/g, ' ')).join(', ')}. ` : '';
  return `I am a dedicated ${cat} based in ${loc} with ${exp} of experience. I take pride in providing reliable, professional service to every family. I speak ${langList}. ${skillSnippet}I am hardworking, trustworthy and easy to reach — feel free to contact me directly to discuss your needs.`.trim();
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function Register() {
  const { lang, setLang: changeLang } = useLang();
  const [step, setStep]             = useState(1);
  const [success, setSuccess]       = useState(false);
  const [refNumber, setRefNumber]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [category,    setCategory]    = useState('');
  const [skills,      setSkills]      = useState([]);
  const [age,         setAge]         = useState('');
  const [firstname,   setFirstname]   = useState('');
  const [lastname,    setLastname]    = useState('');
  const [city,        setCity]        = useState('');
  const [area,        setArea]        = useState('');
  const [experience,  setExperience]  = useState('');
  const [languages,   setLanguages]   = useState([]);
  const [rate,        setRate]        = useState('');
  const [education,   setEducation]   = useState('');
  const [certificates,setCertificates]= useState('');
  const [bio,         setBio]         = useState('');
  const [email,       setEmail]       = useState('');
  const [terms,       setTerms]       = useState(false);
  const [photoFile,   setPhotoFile]   = useState(null);
  const [photoPreview,setPhotoPreview]= useState('');
  const [photoText,   setPhotoText]   = useState('');

  const [turnstileToken, setTurnstileToken] = useState('');
  const handleTurnstileToken = useCallback((token) => setTurnstileToken(token), []);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  const t = T[lang];

  useEffect(() => {
    if (!photoPreview) setPhotoText(T[lang].photo_strong);
  }, [lang]);

  // When category changes, reset skills
  const handleCategoryChange = (val) => {
    setCategory(val);
    setSkills([]);
    setErrors(e => ({ ...e, category: '' }));
  };

  const toggleSkill = (val) => {
    setSkills(prev => prev.includes(val) ? prev.filter(s => s !== val) : [...prev, val]);
  };

  const toggleLanguage = (val) => {
    setLanguages(prev => prev.includes(val) ? prev.filter(l => l !== val) : [...prev, val]);
    setErrors(e => ({ ...e, languages: '' }));
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert(t.photo_size_err);
      e.target.value = '';
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target.result);
      setPhotoText(t.photo_selected);
    };
    reader.readAsDataURL(file);
  };

  // ─── VALIDATION ─────────────────────────────────────────────────────────────
  const validate = (stepNum) => {
    const errs = {};
    if (stepNum === 1) {
      if (!category)             errs.category  = t.cat_error;
      if (!age)                  errs.age       = t.age_error;
      if (!firstname.trim())     errs.firstname = t.fname_error;
      if (!lastname.trim())      errs.lastname  = t.lname_error;
      if (!city)                 errs.city      = t.city_error;
    }
    if (stepNum === 2) {
      if (!experience)           errs.experience = t.exp_error;
      if (languages.length === 0)errs.languages  = t.lang_error;
      if (bio.trim().length < 30)errs.bio        = t.bio_error;
    }
    if (stepNum === 3) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = t.email_error;
      if (!terms)                errs.terms    = t.terms_error;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goToStep = (next) => {
    if (next > step && !validate(step)) return;
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─── SUBMIT ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate(3)) return;
    setSubmitting(true);
    setSubmitError('');

    const data = {
      first_name: firstname.trim(),
      last_name:  lastname.trim(),
      age,
      category,
      skills:     skills.join(', '),
      city,
      area,
      experience,
      languages:  languages.join(', '),
      rate,
      education:    education.trim(),
      certificates: certificates.trim(),
      bio:        bio.trim(),
      email:      email.trim(),
      turnstileToken,
    };

    try {
      // 1) Create the helper account. The API sets a session cookie on
      //    success, so the next two requests are authenticated.
      const result = await registerHelper(data);

      // 2) Upload the profile photo (if any) using the new session.
      //    Failures here are non-fatal: the account exists, the user can
      //    add a photo later from /profile. We log it but still show the
      //    success screen.
      if (photoFile) {
        try {
          const { url } = await uploadProfilePhoto(photoFile);
          if (url) {
            await updateProfile({ photo: url });
          }
        } catch (photoErr) {
          console.warn('Profile photo upload failed (non-fatal):', photoErr);
        }
      }

      setRefNumber(result.ref);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Submit error:', err);
      setSubmitError(err.message === 'duplicate_email' ? t.duplicate_email : t.submit_error);
    } finally {
      setSubmitting(false);
    }
  };

  const dotClass = (n) => {
    if (success || n < step) return 'step-dot done';
    if (n === step)          return 'step-dot active';
    return 'step-dot';
  };

  const currentSkills = SKILLS_BY_CATEGORY[category] || [];

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <>
      <SEOHead
        title="Register as a Helper – Create Your Free Profile"
        description="Create your free profile on ThaiHelper. Get discovered by families in Thailand looking for nannies, housekeepers, chefs, drivers and more."
        path="/register"
        lang={lang}
        jsonLd={getBreadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Register', path: '/register' }])}
      />

      <div className={`register-body ${lang === 'th' ? 'lang-th' : ''}`}>

        {/* NAV */}
        <nav>
          <Link className="nav-brand" href="/">Thai<span>Helper</span></Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <LangSwitcher />
            <Link className="nav-back" href="/">{t.nav_back}</Link>
          </div>
        </nav>

        {/* HERO STRIP */}
        <div className="hero-strip">
          <h1>{t.hero_h1}</h1>
          <p>{t.hero_p}</p>
        </div>

        {/* PROGRESS */}
        <div className="progress-wrap">
          <div className="progress-inner">
            {[t.step1_dot, t.step2_dot, t.step3_dot].map((label, i) => (
              <div className={dotClass(i + 1)} key={i}>
                <div className="dot-circle">{(success || i + 1 < step) ? '✓' : i + 1}</div>
                <div className="dot-label">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* MAIN */}
        <div className="main">
          <div className="card">

            {/* ── SUCCESS ─────────────────────────── */}
            {success && (
              <div className="success-screen">
                <div className="success-icon">🎉</div>
                <h2>{t.success_h2}</h2>
                <p>{t.success_p1}</p>
                <p>{t.success_p2}</p>
                <div className="success-ref">Ref: {refNumber}</div>
                <div style={{ textAlign: 'center', margin: '24px 0' }}>
                  <Link href="/profile" style={{
                    display: 'inline-block', padding: '14px 32px', borderRadius: '10px',
                    background: '#006a62', color: 'white', fontWeight: 700,
                    textDecoration: 'none', fontSize: '16px',
                    boxShadow: '0 4px 12px rgba(0, 106, 98, 0.25)',
                  }}>
                    {t.success_login}
                  </Link>
                </div>
                <div className="success-share">
                  <p>{t.success_share}</p>
                  <a className="share-btn share-wa" href="https://wa.me/?text=I+just+signed+up+on+ThaiHelper%21" target="_blank" rel="noreferrer">💬 Share on WhatsApp</a>
                  <a className="share-btn share-fb" href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fthaihelper.com" target="_blank" rel="noreferrer">📘 Share on Facebook</a>
                </div>
              </div>
            )}

            {/* ── STEP 1: About You ───────────────── */}
            {!success && step === 1 && (
              <div>
                <h2 className="step-title">{t.step1_title}</h2>
                <p className="step-sub">{t.step1_sub}</p>

                {/* Category */}
                <div className={`field ${errors.category ? 'has-error' : ''}`}>
                  <label>{t.cat_label} <span className="req">*</span></label>
                  <select value={category} onChange={e => handleCategoryChange(e.target.value)}>
                    <option value="">{t.cat_ph}</option>
                    <option value="nanny">{t.cat_nanny}</option>
                    <option value="housekeeper">{t.cat_housekeeper}</option>
                    <option value="chef">{t.cat_chef}</option>
                    <option value="driver">{t.cat_driver}</option>
                    <option value="gardener">{t.cat_gardener}</option>
                    <option value="elder_care">{t.cat_elder}</option>
                    <option value="tutor">{t.cat_tutor}</option>
                    <option value="multiple">{t.cat_multiple}</option>
                  </select>
                  <div className="field-error">{errors.category}</div>
                </div>

                {/* Skills checkboxes – appear after category selection */}
                {category && currentSkills.length > 0 && (
                  <div className="field">
                    <label>{t.skills_label}</label>
                    <p className="field-hint" style={{ marginBottom: '12px' }}>{t.skills_sub}</p>
                    <div className="checkbox-grid">
                      {currentSkills.map(s => (
                        <label
                          key={s.value}
                          className={`checkbox-item ${skills.includes(s.value) ? 'checked' : ''}`}
                          onClick={() => toggleSkill(s.value)}
                        >
                          <div className="check-mark">{skills.includes(s.value) ? '✓' : ''}</div>
                          {lang === 'th' ? s.th : s.en}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Name + Age */}
                <div className="name-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className={`field ${errors.firstname ? 'has-error' : ''}`}>
                    <label>{t.fname_label} <span className="req">*</span></label>
                    <input type="text" value={firstname} placeholder={t.fname_ph}
                      onChange={e => { setFirstname(e.target.value); setErrors(ev => ({...ev, firstname:''})); }} />
                    <div className="field-error">{errors.firstname}</div>
                  </div>
                  <div className={`field ${errors.lastname ? 'has-error' : ''}`}>
                    <label>{t.lname_label} <span className="req">*</span></label>
                    <input type="text" value={lastname} placeholder={t.lname_ph}
                      onChange={e => { setLastname(e.target.value); setErrors(ev => ({...ev, lastname:''})); }} />
                    <div className="field-error">{errors.lastname}</div>
                  </div>
                </div>

                {/* Age */}
                <div className={`field ${errors.age ? 'has-error' : ''}`}>
                  <label>{t.age_label} <span className="req">*</span></label>
                  <select value={age} onChange={e => { setAge(e.target.value); setErrors(ev => ({...ev, age:''})); }}>
                    <option value="">{t.age_ph}</option>
                    {['18–24','25–29','30–34','35–39','40–44','45–49','50–54','55–59','60+'].map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                  <div className="field-error">{errors.age}</div>
                </div>

                {/* City */}
                <div className={`field ${errors.city ? 'has-error' : ''}`}>
                  <label>{t.city_label} <span className="req">*</span></label>
                  <select value={city} onChange={e => { setCity(e.target.value); setErrors(ev => ({...ev, city:''})); }}>
                    <option value="">{t.city_ph}</option>
                    <option value="phuket">📍 Phuket</option>
                    <option value="bangkok">📍 Bangkok</option>
                    <option value="chiang_mai">📍 Chiang Mai</option>
                    <option value="pattaya">📍 Pattaya</option>
                    <option value="koh_samui">📍 Koh Samui</option>
                    <option value="hua_hin">📍 Hua Hin</option>
                    <option value="other">{t.city_other}</option>
                  </select>
                  <div className="field-error">{errors.city}</div>
                </div>

                {/* Area / Neighborhood */}
                <div className="field">
                  <label>{t.area_label}</label>
                  <input type="text" value={area} placeholder={t.area_ph} maxLength={60} onChange={e => setArea(e.target.value)} />
                  <div className="field-hint">{t.area_hint}</div>
                </div>

                <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
                  <button className="btn-next" onClick={() => goToStep(2)}>{t.btn_next1}</button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Experience ──────────────── */}
            {!success && step === 2 && (
              <div>
                <h2 className="step-title">{t.step2_title}</h2>
                <p className="step-sub">{t.step2_sub}</p>

                {/* Experience */}
                <div className={`field ${errors.experience ? 'has-error' : ''}`}>
                  <label>{t.exp_label} <span className="req">*</span></label>
                  <select value={experience} onChange={e => { setExperience(e.target.value); setErrors(ev => ({...ev, experience:''})); }}>
                    <option value="">{t.exp_ph}</option>
                    <option value="0">{t.exp_0}</option>
                    <option value="1">{t.exp_1}</option>
                    <option value="3">{t.exp_3}</option>
                    <option value="6">{t.exp_6}</option>
                    <option value="10">{t.exp_10}</option>
                  </select>
                  <div className="field-error">{errors.experience}</div>
                </div>

                {/* Languages */}
                <div className="field">
                  <label>{t.lang_label} <span className="req">*</span></label>
                  <div className="checkbox-grid">
                    {LANGUAGES.map(l => (
                      <label
                        key={l.value}
                        className={`checkbox-item ${languages.includes(l.value) ? 'checked' : ''}`}
                        onClick={() => toggleLanguage(l.value)}
                      >
                        <div className="check-mark">{languages.includes(l.value) ? '✓' : ''}</div>
                        {l.label}
                      </label>
                    ))}
                  </div>
                  {errors.languages && <div className="field-error" style={{ display: 'block' }}>{errors.languages}</div>}
                </div>

                {/* Expected rate (optional) */}
                <div className="field">
                  <label>{t.rate_label} <span style={{ color: 'var(--gray-400)', fontWeight: 400, fontSize: '0.85rem' }}>(optional)</span></label>
                  <select value={rate} onChange={e => setRate(e.target.value)}>
                    <option value="">{t.rate_ph}</option>
                    {RATES.map(r => (
                      <option key={r.value} value={r.value}>{lang === 'th' ? r.th : r.en}</option>
                    ))}
                  </select>
                </div>

                {/* Education (optional) */}
                <div className="field">
                  <label>{t.edu_label}</label>
                  <input type="text" value={education} onChange={e => setEducation(e.target.value)} placeholder={t.edu_ph} />
                </div>

                {/* Certificates (optional) */}
                <div className="field">
                  <label>{t.cert_label}</label>
                  <input type="text" value={certificates} onChange={e => setCertificates(e.target.value)} placeholder={t.cert_ph} />
                </div>

                {/* Bio with hints + generate button */}
                <div className={`field ${errors.bio ? 'has-error' : ''}`}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={{ margin: 0 }}>{t.bio_label} <span className="req">*</span></label>
                    <button
                      type="button"
                      className="btn-generate-bio"
                      onClick={() => {
                        const generated = generateBio({ lang, category, skills, experience, languages, city });
                        setBio(generated);
                        setErrors(ev => ({...ev, bio:''}));
                      }}
                    >
                      {t.bio_generate}
                    </button>
                  </div>
                  <div className="bio-hints">
                    <strong>{t.bio_hints_title}</strong>
                    <ul>
                      <li>{t.bio_hint1}</li>
                      <li>{t.bio_hint2}</li>
                      <li>{t.bio_hint3}</li>
                    </ul>
                    <p className="bio-notice">⚠️ {t.bio_notice}</p>
                  </div>
                  <textarea
                    value={bio} maxLength={500}
                    placeholder={t.bio_ph}
                    onChange={e => { setBio(e.target.value); setErrors(ev => ({...ev, bio:''})); }}
                  />
                  <div className="char-counter">{bio.length} / 500 {t.chars_label}</div>
                  <div className="field-error">{errors.bio}</div>
                </div>

                <div className="btn-row">
                  <button className="btn-back" onClick={() => goToStep(1)}>{t.btn_back}</button>
                  <button className="btn-next" onClick={() => goToStep(3)}>{t.btn_next2}</button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Contact ─────────────────── */}
            {!success && step === 3 && (
              <div>
                <h2 className="step-title">{t.step3_title}</h2>
                <p className="step-sub">{t.step3_sub}</p>

                {/* Email */}
                <div className={`field ${errors.email ? 'has-error' : ''}`}>
                  <label>{t.email_label} <span className="req">*</span></label>
                  <input type="email" value={email} placeholder="your@email.com"
                    onChange={e => { setEmail(e.target.value); setErrors(ev => ({...ev, email:''})); }} />
                  <div className="field-error">{errors.email}</div>
                </div>

                {/* Photo upload */}
                <div className="field">
                  <label>
                    {t.photo_label}{' '}
                    <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>{t.photo_optional}</span>
                  </label>
                  <div className="photo-upload">
                    {photoPreview && (
                      <img src={photoPreview} className="photo-preview" alt="Preview" />
                    )}
                    {!photoPreview && <div className="photo-icon">📷</div>}
                    <strong>{photoText || t.photo_strong}</strong>
                    <p>{t.photo_desc}</p>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} />
                  </div>
                  {/* Photo tips */}
                  <div className="photo-tips">
                    <strong>{t.photo_tips_title}</strong>
                    <div className="photo-tips-grid">
                      <span>{t.photo_tip1}</span>
                      <span>{t.photo_tip2}</span>
                      <span>{t.photo_tip3}</span>
                      <span>{t.photo_tip4}</span>
                      <span>{t.photo_tip5}</span>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="field">
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontWeight: 400 }}>
                    <input
                      type="checkbox" checked={terms}
                      onChange={e => { setTerms(e.target.checked); setErrors(ev => ({...ev, terms:''})); }}
                      style={{ width: '18px', height: '18px', marginTop: '2px', flexShrink: 0 }}
                    />
                    <span style={{ fontSize: '0.875rem', color: 'var(--gray-500)', lineHeight: 1.5 }}>
                      {lang === 'en'
                        ? <>I agree to the <a href="/terms" target="_blank" style={{ color: 'var(--teal)' }}>Terms of Service</a> and <a href="/privacy" target="_blank" style={{ color: 'var(--teal)' }}>Privacy Policy</a>. My profile will be visible to registered families on ThaiHelper.</>
                        : <>ฉันยอมรับ<a href="/terms" target="_blank" style={{ color: 'var(--teal)' }}>ข้อกำหนดการใช้บริการ</a>และ<a href="/privacy" target="_blank" style={{ color: 'var(--teal)' }}>นโยบายความเป็นส่วนตัว</a> โปรไฟล์ของฉันจะปรากฏต่อครอบครัวที่ลงทะเบียนใน ThaiHelper</>
                      }
                    </span>
                  </label>
                  {errors.terms && <div className="field-error" style={{ display: 'block' }}>{errors.terms}</div>}
                </div>

                {/* Cloudflare Turnstile CAPTCHA */}
                <Turnstile onToken={handleTurnstileToken} />

                {submitError && (
                  <div style={{
                    background: '#fee2e2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    marginBottom: '16px',
                    fontSize: '14px',
                  }}>
                    {submitError}
                  </div>
                )}

                <div className="btn-row">
                  <button className="btn-back" onClick={() => goToStep(2)}>{t.btn_back}</button>
                  <button className="btn-submit" onClick={handleSubmit} disabled={submitting}>
                    {submitting
                      ? <><span className="spinner" /> {t.submitting}</>
                      : t.submit_label
                    }
                  </button>
                </div>
              </div>
            )}

          </div>{/* /card */}

          {/* Trust Strip */}
          <div className="trust-strip">
            <div className="trust-item">{t.trust_secure}</div>
            <div className="trust-item">{t.trust_free}</div>
            <div className="trust-item">{t.trust_mobile}</div>
          </div>
        </div>

      </div>
    </>
  );
}

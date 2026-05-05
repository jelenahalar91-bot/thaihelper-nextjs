import { useState, useEffect, useCallback } from 'react';
import SEOHead, { getBreadcrumbSchema } from '@/components/SEOHead';
import LangSwitcher from '@/components/LangSwitcher';
import { MobileMenu } from '@/components/MobileMenu';
import Turnstile from '@/components/Turnstile';
import { useLang } from './_app';
import Link from 'next/link';
import { registerHelper, uploadProfilePhoto, updateProfile } from '@/lib/api/helpers';
import { CITY_OPTIONS, MAX_ADDITIONAL_CITIES } from '@/lib/constants/cities';
import { WP_STATUS_OPTIONS } from '@/lib/constants/work-permit';
import { computeAge, validateDob } from '@/lib/age';
import { event as gaEvent, EVENTS } from '@/lib/analytics';
import LineConnectCard from '@/components/LineConnectCard';
import {
  SKILLS_BY_CATEGORY,
  RATES,
  LANGUAGES,
} from '@/lib/constants/categories';

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
    cat_error:       'Please select at least one category.',
    cat_multi_hint:  'Select everything you can do — pick one or more.',
    skills_label:    'What can you do?',
    skills_sub:      'Select everything that applies — this helps families find you.',
    age_label:       'Date of Birth',
    age_ph:          '',
    age_error:       'Please enter your date of birth.',
    age_too_young:   'You must be at least 18 years old to register.',
    age_too_old:     'Please enter a valid date of birth.',
    age_preview:     'You are {age} years old.',
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
    area_other_label:'City or Province',
    area_other_ph:   'e.g. Nakhon Pathom, Chumphon...',
    area_other_hint: 'Please type the name of your city or province.',
    area_other_error:'Please type your city or province.',
    extra_cities_label: 'Also available in',
    extra_cities_hint:  `Optional — pick up to ${MAX_ADDITIONAL_CITIES} other locations where you can work.`,
    extra_cities_max:   `You can select up to ${MAX_ADDITIONAL_CITIES} additional locations.`,
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
    wp_label:        'Work Permit Status (optional)',
    wp_ph:           '— Select if you wish —',
    wp_hint:         'This is optional. Your answer is only used to help families find you.',
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
    notify_title:    'Get notified about new messages',
    notify_email:    'Email',
    notify_email_sub:'Always on — we send important updates here',
    notify_line:     'LINE',
    notify_line_sub: 'Get instant alerts on your phone',
    notify_whatsapp: 'WhatsApp',
    notify_whatsapp_sub: 'Get instant alerts on your phone',
    notify_disclaimer: 'Notifications only — your conversations always stay on ThaiHelper. We never share your LINE or WhatsApp number with families.',
    notify_coming_soon: 'Coming soon',
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
    cat_error:       'กรุณาเลือกอย่างน้อยหนึ่งประเภท',
    cat_multi_hint:  'เลือกทุกอย่างที่คุณทำได้ — หนึ่งหรือมากกว่า',
    skills_label:    'คุณทำอะไรได้บ้าง?',
    skills_sub:      'เลือกทุกอย่างที่เกี่ยวข้อง — ช่วยให้ครอบครัวค้นพบคุณได้ง่ายขึ้น',
    age_label:       'วันเกิด',
    age_ph:          '',
    age_error:       'กรุณาระบุวันเกิดของคุณ',
    age_too_young:   'คุณต้องมีอายุอย่างน้อย 18 ปีจึงจะลงทะเบียนได้',
    age_too_old:     'กรุณาระบุวันเกิดที่ถูกต้อง',
    age_preview:     'คุณอายุ {age} ปี',
    fname_label:     'ชื่อ',
    fname_ph:        'เช่น มาเรีย',
    fname_error:     'กรุณากรอกชื่อของคุณ',
    lname_label:     'นามสกุล',
    lname_ph:        'เช่น ซานโตส',
    lname_error:     'กรุณากรอกนามสกุลของคุณ',
    city_label:      'ที่อยู่ปัจจุบัน',
    city_ph:         '— คุณอยู่ที่ไหน? —',
    city_other:      '📍 ที่อื่นในไทย',
    area_other_label:'เมืองหรือจังหวัด',
    area_other_ph:   'เช่น นครปฐม, ชุมพร...',
    area_other_hint: 'กรุณาพิมพ์ชื่อเมืองหรือจังหวัดของคุณ',
    area_other_error:'กรุณาพิมพ์ชื่อเมืองหรือจังหวัดของคุณ',
    city_error:      'กรุณาเลือกเมืองของคุณ',
    area_label:      'ย่าน / พื้นที่',
    area_ph:         'เช่น ราไวย์, สุขุมวิท, นิมมาน...',
    area_hint:       'ไม่บังคับ — ช่วยให้ครอบครัวใกล้เคียงค้นหาคุณได้เร็วขึ้น',
    extra_cities_label: 'ทำงานในพื้นที่อื่นด้วย',
    extra_cities_hint:  `ไม่บังคับ — เลือกได้สูงสุด ${MAX_ADDITIONAL_CITIES} พื้นที่ที่คุณสามารถไปทำงานได้`,
    extra_cities_max:   `เลือกได้สูงสุด ${MAX_ADDITIONAL_CITIES} พื้นที่`,
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
    wp_label:        'สถานะใบอนุญาตทำงาน (ไม่บังคับ)',
    wp_ph:           '— เลือกหากต้องการ —',
    wp_hint:         'ไม่บังคับ คำตอบของคุณจะใช้เพื่อช่วยให้ครอบครัวค้นพบคุณเท่านั้น',
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
    notify_title:    'รับการแจ้งเตือนข้อความใหม่',
    notify_email:    'อีเมล',
    notify_email_sub:'เปิดเสมอ — เราส่งการอัปเดตสำคัญทางอีเมล',
    notify_line:     'LINE',
    notify_line_sub: 'รับการแจ้งเตือนทันทีบนมือถือ',
    notify_whatsapp: 'WhatsApp',
    notify_whatsapp_sub: 'รับการแจ้งเตือนทันทีบนมือถือ',
    notify_disclaimer: 'เฉพาะการแจ้งเตือนเท่านั้น — บทสนทนาของคุณจะอยู่บน ThaiHelper เสมอ เราไม่เปิดเผยหมายเลข LINE หรือ WhatsApp ของคุณกับครอบครัว',
    notify_coming_soon: 'เร็วๆ นี้',
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


// ─── HELPERS ─────────────────────────────────────────────────────────────────
function generateBio({ lang, categories, skills, experience, languages, city }) {
  const catEN = {
    nanny: 'nanny and childcare provider', housekeeper: 'housekeeper and cleaner',
    chef: 'private chef and cook', driver: 'driver and chauffeur',
    gardener: 'gardener and pool care specialist', elder_care: 'elder care and caregiver',
    tutor: 'tutor and private teacher',
  };
  const catTH = {
    nanny: 'พี่เลี้ยงเด็ก', housekeeper: 'แม่บ้าน', chef: 'พ่อครัว/แม่ครัวส่วนตัว',
    driver: 'คนขับรถ', gardener: 'คนสวนและดูแลสระ', elder_care: 'ผู้ดูแลผู้สูงอายุ',
    tutor: 'ติวเตอร์และครูสอนพิเศษ',
  };
  // Combine up to two category labels for a natural-reading bio. More than
  // two becomes verbose, so we just say "household services professional".
  const catList = (categories || []).slice(0, 2);
  const expEN = { '0': 'less than a year', '1': '1–2 years', '3': '3–5 years', '6': '6–10 years', '10': 'over 10 years' };
  const langNames = { english: 'English', thai: 'Thai', burmese: 'Burmese', khmer: 'Khmer', lao: 'Lao', vietnamese: 'Vietnamese', tagalog: 'Tagalog', chinese: 'Chinese', russian: 'Russian', german: 'German', other: 'other languages' };
  const cityName = (c) => c ? c.charAt(0).toUpperCase() + c.slice(1).replace(/_/g, ' ') : 'Thailand';

  if (lang === 'th') {
    const cat = catList.length === 0
      ? 'ผู้ให้บริการงานบ้าน'
      : catList.length > 2
        ? 'ผู้ให้บริการงานบ้านหลายด้าน'
        : catList.map(c => catTH[c] || c).join(' และ ');
    const loc = city && city !== 'other' ? cityName(city) : 'ประเทศไทย';
    const skillSnippet = skills.length > 0 ? `ทักษะของฉันได้แก่ ${skills.slice(0, 3).map(s => s.replace(/_/g, ' ')).join(', ')} ` : '';
    return `ฉันเป็น${cat}ที่มีประสบการณ์ ทำงานในพื้นที่${loc} ฉันรักงานบริการและมุ่งมั่นในการดูแลทุกครอบครัวอย่างดีที่สุด ${skillSnippet}ฉันมีความขยัน ซื่อสัตย์ น่าเชื่อถือ และพร้อมพูดคุยถึงความต้องการของครอบครัวคุณโดยตรง`;
  }

  const cat = catList.length === 0
    ? 'household services professional'
    : (categories || []).length > 2
      ? 'household services professional'
      : catList.map(c => catEN[c] || c).join(' and ');
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
  // Returned by /api/register when the helper opted into LINE notifications.
  // Drives the post-registration "Connect LINE" card. null when not opted in.
  const [lineLink, setLineLink]     = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [categories,  setCategories]  = useState([]); // array of slugs — multi-select
  const [skills,      setSkills]      = useState([]);
  const [dob,         setDob]         = useState(''); // YYYY-MM-DD
  const [firstname,   setFirstname]   = useState('');
  const [lastname,    setLastname]    = useState('');
  const [city,        setCity]        = useState('');
  const [area,        setArea]        = useState('');
  const [extraCities, setExtraCities] = useState([]); // array of slugs
  const [experience,  setExperience]  = useState('');
  const [languages,   setLanguages]   = useState([]);
  const [wpStatus,    setWpStatus]    = useState('');
  const [rate,        setRate]        = useState('');
  const [education,   setEducation]   = useState('');
  const [certificates,setCertificates]= useState('');
  const [bio,         setBio]         = useState('');
  const [email,       setEmail]       = useState('');
  const [terms,       setTerms]       = useState(false);
  const [notifyLine,     setNotifyLine]     = useState(false);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(false);
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

  // Toggle a category slug in/out of the selection. Skills not in any of
  // the still-selected categories get pruned so we never submit irrelevant
  // skills (e.g. helper unchecks "nanny" → infant_care drops).
  const toggleCategoryChip = (val) => {
    setErrors(e => ({ ...e, category: '' }));
    setCategories(prev => {
      const next = prev.includes(val) ? prev.filter(c => c !== val) : [...prev, val];
      const allowedSkills = new Set(next.flatMap(c => (SKILLS_BY_CATEGORY[c] || []).map(s => s.value)));
      setSkills(s => s.filter(sk => allowedSkills.has(sk)));
      return next;
    });
  };

  const toggleSkill = (val) => {
    setSkills(prev => prev.includes(val) ? prev.filter(s => s !== val) : [...prev, val]);
  };

  const toggleLanguage = (val) => {
    setLanguages(prev => prev.includes(val) ? prev.filter(l => l !== val) : [...prev, val]);
    setErrors(e => ({ ...e, languages: '' }));
  };

  const toggleExtraCity = (slug) => {
    setExtraCities(prev => {
      if (prev.includes(slug)) return prev.filter(s => s !== slug);
      if (prev.length >= MAX_ADDITIONAL_CITIES) return prev;
      return [...prev, slug];
    });
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
      if (categories.length === 0) errs.category  = t.cat_error;
      const dobCheck = validateDob(dob);
      if (!dobCheck.ok) {
        errs.dob =
          dobCheck.reason === 'too_young' ? t.age_too_young :
          dobCheck.reason === 'too_old'   ? t.age_too_old :
          t.age_error;
      }
      if (!firstname.trim())     errs.firstname = t.fname_error;
      if (!lastname.trim())      errs.lastname  = t.lname_error;
      if (!city)                 errs.city      = t.city_error;
      if (city === 'other' && !area.trim()) errs.area = t.area_other_error;
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
      date_of_birth: dob,
      category: categories.join(', '),
      skills:     skills.join(', '),
      city,
      area,
      additional_cities: extraCities.filter(s => s !== city).join(', '),
      experience,
      languages:  languages.join(', '),
      work_permit_status: wpStatus || null,
      rate,
      education:    education.trim(),
      certificates: certificates.trim(),
      bio:        bio.trim(),
      email:      email.trim(),
      notify_via_line:     notifyLine,
      notify_via_whatsapp: notifyWhatsapp,
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
      setLineLink(result.lineLink || null);
      setSuccess(true);
      gaEvent({ ...EVENTS.REGISTER_COMPLETE, label: 'helper' });
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

  // Skills shown = union of skills across all selected categories, with
  // duplicates collapsed so a shared skill appears once.
  const currentSkills = (() => {
    const seen = new Set();
    const out = [];
    for (const cat of categories) {
      for (const s of SKILLS_BY_CATEGORY[cat] || []) {
        if (!seen.has(s.value)) { seen.add(s.value); out.push(s); }
      }
    }
    return out;
  })();

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LangSwitcher />
            <Link className="nav-back hidden sm:inline" href="/">{t.nav_back}</Link>
            <MobileMenu
              items={[
                { href: '/',                    label: lang === 'th' ? 'หน้าแรก' : 'Home' },
                { href: '/employers',           label: lang === 'th' ? 'สำหรับครอบครัว' : 'For Families' },
                { href: '/helpers',             label: lang === 'th' ? 'ดูผู้ช่วย' : 'Browse Helpers' },
                { href: '/work-permit-wizard',  label: lang === 'th' ? 'ตัวช่วยใบอนุญาตทำงาน' : 'Work Permit Wizard' },
                { href: '/directory',           label: lang === 'th' ? 'รายชื่อผู้เชี่ยวชาญ' : 'Expert Directory' },
                { href: '/about',               label: lang === 'th' ? 'เกี่ยวกับเรา' : 'About' },
                { href: '/faq',                 label: lang === 'th' ? 'คำถามที่พบบ่อย' : 'FAQ' },
                { href: '/blog',                label: lang === 'th' ? 'บล็อก' : 'Blog' },
              ]}
              secondaryCta={{ href: '/login', label: lang === 'th' ? 'เข้าสู่ระบบ' : 'Login' }}
            />
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

                {/* If the helper opted into LINE, show the connect-card
                    inline so they can finish the handshake right here
                    rather than hunting for it later in the dashboard. */}
                {lineLink && (
                  <LineConnectCard
                    token={lineLink.token}
                    message={lineLink.message}
                    addFriendUrl={lineLink.addFriendUrl}
                    lang={lang}
                  />
                )}

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

                {/* Category — multi-select chips. Pick everything you do. */}
                <div className={`field ${errors.category ? 'has-error' : ''}`}>
                  <label>{t.cat_label} <span className="req">*</span></label>
                  <p className="field-hint" style={{ marginBottom: '10px' }}>{t.cat_multi_hint}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {[
                      { value: 'nanny',       label: t.cat_nanny },
                      { value: 'housekeeper', label: t.cat_housekeeper },
                      { value: 'chef',        label: t.cat_chef },
                      { value: 'driver',      label: t.cat_driver },
                      { value: 'gardener',    label: t.cat_gardener },
                      { value: 'elder_care',  label: t.cat_elder },
                      { value: 'tutor',       label: t.cat_tutor },
                    ].map(opt => {
                      const selected = categories.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => toggleCategoryChip(opt.value)}
                          style={{
                            padding: '10px 16px',
                            borderRadius: '999px',
                            border: `1.5px solid ${selected ? '#006a62' : '#e5e7eb'}`,
                            background: selected ? '#e6f5f3' : 'white',
                            color: selected ? '#006a62' : '#4b5563',
                            fontSize: '14px',
                            fontWeight: selected ? 600 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="field-error">{errors.category}</div>
                </div>

                {/* Skills checkboxes – appear after at least one category is selected */}
                {categories.length > 0 && currentSkills.length > 0 && (
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

                {/* Date of birth — exact age computed from this */}
                <div className={`field ${errors.dob ? 'has-error' : ''}`}>
                  <label>{t.age_label} <span className="req">*</span></label>
                  <input
                    type="date"
                    value={dob}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().slice(0, 10)}
                    min={new Date(new Date().setFullYear(new Date().getFullYear() - 80)).toISOString().slice(0, 10)}
                    onChange={e => { setDob(e.target.value); setErrors(ev => ({...ev, dob:''})); }}
                  />
                  {dob && computeAge(dob) !== null && (
                    <div className="field-hint">{t.age_preview.replace('{age}', computeAge(dob))}</div>
                  )}
                  <div className="field-error">{errors.dob}</div>
                </div>

                {/* City */}
                <div className={`field ${errors.city ? 'has-error' : ''}`}>
                  <label>{t.city_label} <span className="req">*</span></label>
                  <select value={city} onChange={e => { setCity(e.target.value); setErrors(ev => ({...ev, city:'', area:''})); }}>
                    <option value="">{t.city_ph}</option>
                    {CITY_OPTIONS.map(c => (
                      <option key={c.slug} value={c.slug}>📍 {c.name}</option>
                    ))}
                    <option value="other">{t.city_other}</option>
                  </select>
                  <div className="field-error">{errors.city}</div>
                </div>

                {/* Area / Neighborhood (required as free-text City when "other") */}
                <div className={`field ${errors.area ? 'has-error' : ''}`}>
                  <label>
                    {city === 'other' ? t.area_other_label : t.area_label}
                    {city === 'other' && <span className="req"> *</span>}
                  </label>
                  <input
                    type="text"
                    value={area}
                    placeholder={city === 'other' ? t.area_other_ph : t.area_ph}
                    maxLength={60}
                    onChange={e => { setArea(e.target.value); setErrors(ev => ({...ev, area:''})); }}
                  />
                  <div className="field-hint">{city === 'other' ? t.area_other_hint : t.area_hint}</div>
                  <div className="field-error">{errors.area}</div>
                </div>

                {/* Additional cities — optional. Hidden until a primary city
                    is picked; "other" skips this since it's free-text already. */}
                {city && city !== 'other' && (
                  <div className="field">
                    <label>{t.extra_cities_label}</label>
                    <p className="field-hint" style={{ marginBottom: '10px' }}>
                      {extraCities.length >= MAX_ADDITIONAL_CITIES ? t.extra_cities_max : t.extra_cities_hint}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {CITY_OPTIONS.filter(c => c.slug !== city).map(c => {
                        const selected = extraCities.includes(c.slug);
                        const atLimit = !selected && extraCities.length >= MAX_ADDITIONAL_CITIES;
                        return (
                          <button
                            key={c.slug}
                            type="button"
                            disabled={atLimit}
                            onClick={() => toggleExtraCity(c.slug)}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '999px',
                              border: `1.5px solid ${selected ? '#006a62' : '#e5e7eb'}`,
                              background: selected ? '#e6f5f3' : 'white',
                              color: selected ? '#006a62' : (atLimit ? '#cbd5e1' : '#4b5563'),
                              fontSize: '13px',
                              fontWeight: selected ? 600 : 500,
                              cursor: atLimit ? 'not-allowed' : 'pointer',
                              opacity: atLimit ? 0.6 : 1,
                              transition: 'all 0.15s',
                            }}
                          >
                            {selected ? '✓ ' : '+ '}{c.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

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

                {/* Work Permit status (optional) */}
                <div className="field">
                  <label>{t.wp_label}</label>
                  <select value={wpStatus} onChange={e => setWpStatus(e.target.value)}>
                    <option value="">{t.wp_ph}</option>
                    {WP_STATUS_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{lang === 'th' ? o.th : o.en}</option>
                    ))}
                  </select>
                  <div style={{ marginTop: 6, fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                    {t.wp_hint}
                  </div>
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
                        const generated = generateBio({ lang, categories, skills, experience, languages, city });
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

                {/* Notification channels — multi-channel opt-in. Email is
                    always on; LINE / WhatsApp are opt-in extras that ping
                    the user's phone when a new message arrives. The actual
                    LINE / WhatsApp connection (friend-add / phone verify)
                    happens after registration; here we just capture intent. */}
                <div className="field">
                  <label style={{ marginBottom: '8px' }}>{t.notify_title}</label>

                  {/* Email row — locked on, no checkbox */}
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                    padding: '12px 14px', borderRadius: '12px',
                    background: '#f0fdfa', border: '1px solid #99f6e4',
                    marginBottom: '8px',
                  }}>
                    <span style={{ fontSize: '20px', lineHeight: 1, marginTop: '2px' }}>✉️</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '15px', color: '#0f766e' }}>{t.notify_email}</div>
                      <div style={{ fontSize: '13px', color: '#0d9488', marginTop: '2px' }}>{t.notify_email_sub}</div>
                    </div>
                    <span style={{ fontSize: '18px', color: '#14b8a6', marginTop: '2px' }}>✓</span>
                  </div>

                  {/* LINE row — checkbox */}
                  <label style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                    padding: '12px 14px', borderRadius: '12px',
                    background: notifyLine ? '#f0fdf4' : '#fafafa',
                    border: `1px solid ${notifyLine ? '#86efac' : '#e5e7eb'}`,
                    marginBottom: '8px', cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}>
                    <input
                      type="checkbox"
                      checked={notifyLine}
                      onChange={e => setNotifyLine(e.target.checked)}
                      style={{ width: '18px', height: '18px', marginTop: '2px', flexShrink: 0, cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: '15px' }}>{t.notify_line}</span>
                        <span style={{
                          fontSize: '11px', fontWeight: 600,
                          padding: '2px 8px', borderRadius: '999px',
                          background: '#fef3c7', color: '#92400e',
                        }}>{t.notify_coming_soon}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--gray-500)', marginTop: '2px' }}>{t.notify_line_sub}</div>
                    </div>
                  </label>

                  {/* WhatsApp row — checkbox */}
                  <label style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                    padding: '12px 14px', borderRadius: '12px',
                    background: notifyWhatsapp ? '#f0fdf4' : '#fafafa',
                    border: `1px solid ${notifyWhatsapp ? '#86efac' : '#e5e7eb'}`,
                    marginBottom: '10px', cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}>
                    <input
                      type="checkbox"
                      checked={notifyWhatsapp}
                      onChange={e => setNotifyWhatsapp(e.target.checked)}
                      style={{ width: '18px', height: '18px', marginTop: '2px', flexShrink: 0, cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: '15px' }}>{t.notify_whatsapp}</span>
                        <span style={{
                          fontSize: '11px', fontWeight: 600,
                          padding: '2px 8px', borderRadius: '999px',
                          background: '#fef3c7', color: '#92400e',
                        }}>{t.notify_coming_soon}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--gray-500)', marginTop: '2px' }}>{t.notify_whatsapp_sub}</div>
                    </div>
                  </label>

                  {/* Disclaimer — privacy reassurance */}
                  <div style={{
                    fontSize: '12px', color: 'var(--gray-500)',
                    lineHeight: 1.5, padding: '0 4px',
                  }}>
                    🔒 {t.notify_disclaimer}
                  </div>
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

import { useState, useEffect, useCallback } from 'react';
import SEOHead, { getBreadcrumbSchema } from '@/components/SEOHead';
import LangSwitcher, { HELPER_LANGS } from '@/components/LangSwitcher';
import { MobileMenu } from '@/components/MobileMenu';
import Turnstile from '@/components/Turnstile';
import { useLang } from './_app';
import Link from 'next/link';
import BrandWordmark from '@/components/BrandWordmark';
import { registerHelper, uploadProfilePhoto, updateProfile } from '@/lib/api/helpers';
import { CITY_OPTIONS, THAI_PROVINCES, MAX_ADDITIONAL_CITIES } from '@/lib/constants/cities';
import { WP_STATUS_OPTIONS } from '@/lib/constants/work-permit';
import { NATIONALITY_OPTIONS } from '@/lib/constants/nationalities';
import WorkPermitNotice from '@/components/WorkPermitNotice';
import { suggestEmail } from '@/lib/email-typo';
import { computeAge, validateDob } from '@/lib/age';
import { event as gaEvent, fbTrack, EVENTS } from '@/lib/analytics';
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
    acct_label:      'Are you registering as an individual or a company?',
    acct_individual:     "I'm an individual",
    acct_individual_sub: 'I offer my own services (nanny, driver, housekeeper…)',
    acct_company:        "We're a company / agency",
    acct_company_sub:    'We provide staff or services as a business',
    company_card_title:  'Companies & agencies go in our Directory',
    company_card_body:   "Helper profiles here are for individuals offering their own work. If you're a company or agency providing staff or services, get listed in our Expert Directory instead — families looking for professional providers will find you there.",
    company_card_cta:    'List your company →',
    cat_label:       'Service Category',
    cat_ph:          '— Select your main service —',
    cat_nanny:       'Nanny & Babysitter',
    cat_housekeeper: 'Housekeeper & Cleaner',
    cat_chef:        'Private Chef & Cook',
    cat_driver:      'Driver & Chauffeur',
    cat_gardener:    'Gardener & Pool Care',
    cat_elder:       'Elder Care & Caregiver',
    cat_tutor:       'Tutor & Teacher',
    cat_petsitter:   'Pet Sitter & Dog Walker',
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
    city_error:      'Please select your city.',
    city_group_popular: 'Popular',
    city_group_all:     'All provinces (A–Z)',
    area_label:      'Neighborhood / Area',
    area_ph:         'e.g. Rawai, Sukhumvit, Nimman...',
    area_hint:       'Optional — helps families nearby find you faster.',
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
    nat_label:       'Nationality',
    nat_ph:          '— Select your nationality —',
    nat_hint:        'Used to determine work permit needs and to help families find the right match.',
    nat_error:       'Please select your nationality.',
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
    email_typo:      'Did you mean',
    email_typo_use:  'Use this',
    email_typo_block:'Looks like a typo in your email — please fix it or use the suggestion above.',
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
    captcha_error:   'Please complete the "I\'m human" check, then try again.',
    duplicate_email: 'An account with this email already exists. Please log in instead.',
    name_not_allowed: 'Please register under your own name. Words like "Support" or "Admin", and the name ThaiHelper itself, are reserved so that nobody can pretend to write to families on our behalf.',
    area_full_address: 'Please enter a general area or neighbourhood (e.g. "Sukhumvit"), not your full home address. You can share your exact address privately once you\'re in touch with a family.',
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
    acct_label:      'คุณลงทะเบียนในฐานะบุคคลทั่วไปหรือบริษัท?',
    acct_individual:     'ฉันเป็นบุคคลทั่วไป',
    acct_individual_sub: 'ฉันให้บริการด้วยตัวเอง (พี่เลี้ยง, คนขับรถ, แม่บ้าน…)',
    acct_company:        'เราเป็นบริษัท / เอเจนซี่',
    acct_company_sub:    'เราให้บริการพนักงานหรือบริการในนามธุรกิจ',
    company_card_title:  'บริษัทและเอเจนซี่ลงในไดเรกทอรีของเรา',
    company_card_body:   'โปรไฟล์ผู้ช่วยที่นี่สำหรับบุคคลที่ให้บริการด้วยตัวเอง หากคุณเป็นบริษัทหรือเอเจนซี่ที่จัดหาพนักงานหรือให้บริการ กรุณาลงรายชื่อใน Expert Directory ของเราแทน — ครอบครัวที่มองหาผู้ให้บริการมืออาชีพจะค้นพบคุณที่นั่น',
    company_card_cta:    'ลงรายชื่อบริษัทของคุณ →',
    cat_label:       'ประเภทบริการ',
    cat_ph:          '— เลือกบริการหลักของคุณ —',
    cat_nanny:       'พี่เลี้ยงเด็ก',
    cat_housekeeper: 'แม่บ้าน / ทำความสะอาด',
    cat_chef:        'พ่อครัว / แม่ครัวส่วนตัว',
    cat_driver:      'คนขับรถ',
    cat_gardener:    'ดูแลสวน / สระน้ำ',
    cat_elder:       'ดูแลผู้สูงอายุ',
    cat_tutor:       'ติวเตอร์ / ครูสอนพิเศษ',
    cat_petsitter:   'ดูแลสัตว์เลี้ยง / พาสุนัขเดินเล่น',
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
    city_group_popular: 'ยอดนิยม',
    city_group_all:     'ทุกจังหวัด (ก–ฮ)',
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
    nat_label:       'สัญชาติ',
    nat_ph:          '— เลือกสัญชาติของคุณ —',
    nat_hint:        'ใช้เพื่อพิจารณาความจำเป็นของใบอนุญาตทำงาน และช่วยให้ครอบครัวหาผู้ช่วยที่เหมาะกับตน',
    nat_error:       'กรุณาเลือกสัญชาติของคุณ',
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
    email_typo:      'คุณหมายถึง',
    email_typo_use:  'ใช้อันนี้',
    email_typo_block:'ดูเหมือนอีเมลของคุณพิมพ์ผิด — กรุณาแก้ไขหรือใช้คำแนะนำด้านบน',
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
    captcha_error:   'กรุณายืนยัน "ฉันไม่ใช่โปรแกรมอัตโนมัติ" แล้วลองใหม่',
    duplicate_email: 'อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบแทน',
    name_not_allowed: 'กรุณาสมัครด้วยชื่อจริงของคุณ คำว่า "Support" หรือ "Admin" รวมถึงชื่อ ThaiHelper นั้นสงวนไว้ เพื่อไม่ให้ใครแอบอ้างเป็นเราในการติดต่อครอบครัว',
    area_full_address: 'กรุณากรอกเขต/ย่านทั่วไป (เช่น "สุขุมวิท") แทนที่จะเป็นที่อยู่บ้านเต็มรูปแบบ คุณสามารถแจ้งที่อยู่ที่ชัดเจนแบบส่วนตัวได้เมื่อได้ติดต่อกับครอบครัวแล้ว',
    photo_size_err:  'รูปภาพต้องมีขนาดไม่เกิน 5 MB',
    success_h2:      'ยินดีต้อนรับสู่ ThaiHelper! 🎉',
    success_p1:      '✉️ เราส่งลิงก์ยืนยันไปที่อีเมลของคุณแล้ว กรุณาคลิกเพื่อเปิดใช้งานโปรไฟล์',
    success_p2:      'หลังจากยืนยันแล้ว ครอบครัวจะสามารถค้นหาและส่งข้อความถึงคุณได้ เพิ่มรูปในหน้าโปรไฟล์เพื่อรับการตอบกลับมากขึ้น',
    success_share:   'รู้จักพี่เลี้ยงหรือแม่บ้านคนอื่นไหม? แชร์ ThaiHelper ให้พวกเขา:',
    success_login:   'ไปที่โปรไฟล์ของฉัน →',
    trust_secure:    '🔒 ปลอดภัยและเป็นส่วนตัว',
    trust_free:      '✅ ฟรี 100% สำหรับผู้ให้บริการ',
    trust_mobile:    '📱 ใช้งานได้ทุกอุปกรณ์',
  },
  // Burmese / Khmer / Lao — added 2026-10-05. Thailand issues household work
  // permits only to nationals of Myanmar, Laos and Cambodia, and most of them
  // read neither Thai nor English: of our 117 Myanmar helpers, 111 speak
  // Burmese and only 45 speak Thai. Every one of them reached this form in a
  // language they could not read. See marketing/fb-ads-burmese-mou-2026-10.md.
  my: {
    page_title:      'ဝန်ဆောင်မှုပေးသူအဖြစ် မှတ်ပုံတင်ရန် – ThaiHelper',
    nav_back:        '← ပင်မစာမျက်နှာသို့',
    hero_h1:         'အခမဲ့ ပရိုဖိုင် ဖန်တီးပါ',
    hero_p:          'ကြာချိန် ၃ မိနစ်ခန့် · အခကြေးငွေ မရှိ · မိသားစုများက တိုက်ရိုက် ဆက်သွယ်ပါမည်',
    step1_dot:       'သင့်အကြောင်း',
    step2_dot:       'အတွေ့အကြုံ',
    step3_dot:       'ဆက်သွယ်ရန်',
    step1_title:     'သင့်အကြောင်း ပြောပြပါ',
    step1_sub:       'အခြေခံအချက်များ — ဘာအလုပ်လုပ်သလဲ၊ ဘယ်နေရာမှာလဲ။',
    acct_label:      'တစ်ဦးချင်း သို့မဟုတ် ကုမ္ပဏီအဖြစ် မှတ်ပုံတင်မှာလား?',
    acct_individual:     'ကျွန်ုပ်သည် တစ်ဦးချင်း ဖြစ်သည်',
    acct_individual_sub: 'ကိုယ်တိုင် ဝန်ဆောင်မှုပေးသည် (ကလေးထိန်း၊ ယာဉ်မောင်း၊ အိမ်အကူ…)',
    acct_company:        'ကျွန်ုပ်တို့သည် ကုမ္ပဏီ / အေဂျင်စီ ဖြစ်သည်',
    acct_company_sub:    'စီးပွားရေးအနေဖြင့် ဝန်ထမ်း သို့မဟုတ် ဝန်ဆောင်မှု ပေးသည်',
    company_card_title:  'ကုမ္ပဏီနှင့် အေဂျင်စီများအတွက် Directory ရှိသည်',
    company_card_body:   'ဤနေရာရှိ ပရိုဖိုင်များသည် ကိုယ်တိုင် အလုပ်လုပ်သူများအတွက် ဖြစ်သည်။ ကုမ္ပဏီ သို့မဟုတ် အေဂျင်စီဖြစ်ပါက ကျွန်ုပ်တို့၏ Expert Directory တွင် စာရင်းသွင်းပါ — ဝန်ဆောင်မှုလုပ်ငန်းများ ရှာဖွေသော မိသားစုများ ထိုနေရာတွင် တွေ့ပါမည်။',
    company_card_cta:    'ကုမ္ပဏီ စာရင်းသွင်းရန် →',
    cat_label:       'ဝန်ဆောင်မှု အမျိုးအစား',
    cat_ph:          '— ပင်မဝန်ဆောင်မှုကို ရွေးပါ —',
    cat_nanny:       'ကလေးထိန်း',
    cat_housekeeper: 'အိမ်အကူ / သန့်ရှင်းရေး',
    cat_chef:        'စားဖိုမှူး',
    cat_driver:      'ယာဉ်မောင်း',
    cat_gardener:    'ဥယျာဉ်မှူး / ရေကူးကန် ထိန်းသိမ်းသူ',
    cat_elder:       'သက်ကြီးရွယ်အို ပြုစုစောင့်ရှောက်သူ',
    cat_tutor:       'ကျူရှင်ဆရာ / ဆရာမ',
    cat_petsitter:   'အိမ်မွေးတိရစ္ဆာန် ထိန်းသိမ်းသူ',
    cat_multiple:    'ဝန်ဆောင်မှု အမျိုးမျိုး',
    cat_error:       'အနည်းဆုံး တစ်ခု ရွေးပါ။',
    cat_multi_hint:  'လုပ်နိုင်သမျှ အားလုံးကို ရွေးပါ — တစ်ခု သို့မဟုတ် အများအပြား။',
    skills_label:    'ဘာတွေ လုပ်နိုင်သလဲ?',
    skills_sub:      'သက်ဆိုင်သမျှ ရွေးပါ — မိသားစုများ သင့်ကို ရှာတွေ့ရန် ကူညီသည်။',
    age_label:       'မွေးသက္ကရာဇ်',
    age_ph:          '',
    age_error:       'မွေးသက္ကရာဇ် ထည့်ပါ။',
    age_too_young:   'မှတ်ပုံတင်ရန် အသက် ၁၈ နှစ် ပြည့်ရပါမည်။',
    age_too_old:     'မှန်ကန်သော မွေးသက္ကရာဇ် ထည့်ပါ။',
    age_preview:     'သင့်အသက် {age} နှစ် ဖြစ်သည်။',
    fname_label:     'အမည် (ရှေ့ပိုင်း)',
    fname_ph:        'ဥပမာ Maria',
    fname_error:     'အမည် ထည့်ပါ။',
    lname_label:     'အမည် (နောက်ပိုင်း)',
    lname_ph:        'ဥပမာ Santos',
    lname_error:     'မျိုးနွယ်အမည် ထည့်ပါ။',
    city_label:      'သင့်တည်နေရာ',
    city_ph:         '— ဘယ်မှာ နေပါသလဲ? —',
    city_error:      'မြို့ကို ရွေးပါ။',
    city_group_popular: 'လူများသော မြို့များ',
    city_group_all:     'ခရိုင်အားလုံး (A–Z)',
    area_label:      'ရပ်ကွက် / ဧရိယာ',
    area_ph:         'ဥပမာ Rawai, Sukhumvit, Nimman...',
    area_hint:       'မဖြည့်လည်းရသည် — အနီးအနားရှိ မိသားစုများ ပိုမြန်မြန် ရှာတွေ့စေသည်။',
    extra_cities_label: 'အခြား အလုပ်လုပ်နိုင်သော နေရာများ',
    extra_cities_hint:  `မဖြည့်လည်းရသည် — အခြားနေရာ ${MAX_ADDITIONAL_CITIES} ခုအထိ ရွေးနိုင်သည်။`,
    extra_cities_max:   `နေရာ ${MAX_ADDITIONAL_CITIES} ခုအထိသာ ရွေးနိုင်သည်။`,
    btn_next1:       'ဆက်လက် — သင့်အတွေ့အကြုံ →',
    step2_title:     'သင့်အတွေ့အကြုံ',
    step2_sub:       'သင့်နောက်ခံနှင့် ကျွမ်းကျင်မှုကို မိသားစုများ နားလည်စေပါ။',
    exp_label:       'အလုပ်အတွေ့အကြုံ (နှစ်)',
    exp_ph:          '— ဘယ်လောက်ကြာပြီလဲ? —',
    exp_0:           '၁ နှစ်အောက်',
    exp_1:           '၁–၂ နှစ်',
    exp_3:           '၃–၅ နှစ်',
    exp_6:           '၆–၁၀ နှစ်',
    exp_10:          '၁၀ နှစ်အထက်',
    exp_error:       'အတွေ့အကြုံ အဆင့်ကို ရွေးပါ။',
    lang_label:      'ပြောတတ်သော ဘာသာစကားများ',
    lang_error:      'အနည်းဆုံး ဘာသာစကား တစ်ခု ရွေးပါ။',
    nat_label:       'နိုင်ငံသား',
    nat_ph:          '— နိုင်ငံသားကို ရွေးပါ —',
    nat_hint:        'အလုပ်လုပ်ခွင့်လက်မှတ် လိုအပ်ချက်ကို သတ်မှတ်ရန်နှင့် သင့်တော်သော မိသားစုနှင့် ချိတ်ဆက်ရန် သုံးသည်။',
    nat_error:       'နိုင်ငံသားကို ရွေးပါ။',
    wp_label:        'အလုပ်လုပ်ခွင့်လက်မှတ် အခြေအနေ (မဖြည့်လည်းရသည်)',
    wp_ph:           '— လိုလျှင် ရွေးပါ —',
    wp_hint:         'မဖြည့်လည်းရသည်။ မိသားစုများ သင့်ကို ရှာတွေ့ရန်သာ သုံးသည်။',
    rate_label:      'တစ်နာရီ လုပ်ခ',
    rate_ph:         '— တစ်နာရီ ဘယ်လောက်လဲ? —',
    edu_label:       'ပညာအရည်အချင်း (မဖြည့်လည်းရသည်)',
    edu_ph:          'ဥပမာ အထက်တန်း၊ ဘွဲ့၊ အသက်မွေးပညာ သင်တန်း…',
    cert_label:      'လက်မှတ်များနှင့် အရည်အချင်းများ (မဖြည့်လည်းရသည်)',
    cert_ph:         'ဥပမာ ရှေးဦးသူနာပြုစု၊ ကလေးထိန်းသိမ်းမှု လက်မှတ်၊ အစားအစာ ဘေးကင်းရေး…',
    bio_label:       'သင့်အကြောင်း',
    bio_ph:          'ဥပမာ ဖူးခက်ရှိ မိသားစုတစ်ခုတွင် ကလေးထိန်းအဖြစ် ၅ နှစ် အတွေ့အကြုံ ရှိပါသည်။ အင်္ဂလိပ်နှင့် ထိုင်းစကား အနည်းငယ် ပြောတတ်သည်။ ကလေးများနှင့် အလုပ်လုပ်ရသည်ကို နှစ်သက်ပြီး စိတ်ရှည်၊ ဂရုစိုက်၊ ယုံကြည်ရသူ ဖြစ်ပါသည်။',
    bio_generate:    '✨ ကိုယ်ရေးအကျဉ်း ရေးပေးပါ',
    bio_hints_title: 'ဖော်ပြသင့်သည်များ -',
    bio_hint1:       'ဤအလုပ်တွင် ဘာကြောင့် ကောင်းသလဲ?',
    bio_hint2:       'အထူး ကျွမ်းကျင်သည်မှာ ဘာလဲ?',
    bio_hint3:       'ယခင် ဘယ်မှာ အလုပ်လုပ်ခဲ့သလဲ?',
    bio_notice:      'ဖုန်းနံပါတ်၊ အီးမေးလ် သို့မဟုတ် ဆိုရှယ်မီဒီယာ လင့်ခ်များ ဤနေရာတွင် မထည့်ပါနှင့်။',
    chars_label:     'စာလုံး',
    bio_error:       'အကျဉ်းချုပ် ရေးပါ (အနည်းဆုံး စာလုံး ၃၀)။',
    btn_back:        '← နောက်သို့',
    btn_next2:       'ဆက်လက် — ပြီးဆုံးရန် →',
    step3_title:     'နီးပါးပြီးပါပြီ',
    step3_sub:       'မိသားစုများသည် ကျွန်ုပ်တို့၏ မက်ဆေ့ချ်စနစ်မှတစ်ဆင့် ဆက်သွယ်ပါမည်။ သင့်အီးမေးလ်မှာ လျှို့ဝှက်ထားပြီး အကောင့်ဝင်ရန်နှင့် အကြောင်းကြားရန်သာ သုံးသည်။',
    email_label:     'အီးမေးလ် လိပ်စာ',
    email_error:     'မှန်ကန်သော အီးမေးလ် ထည့်ပါ။',
    email_typo:      'ဤအတိုင်း ဆိုလိုတာလား',
    email_typo_use:  'ဤဟာကို သုံးမည်',
    email_typo_block:'အီးမေးလ်တွင် စာလုံးမှားနေပုံရသည် — ပြင်ပါ သို့မဟုတ် အထက်ပါ အကြံပြုချက်ကို သုံးပါ။',
    notify_title:    'မက်ဆေ့ချ်အသစ်များကို အကြောင်းကြားစေရန်',
    notify_email:    'အီးမေးလ်',
    notify_email_sub:'အမြဲဖွင့်ထားသည် — အရေးကြီးသော အချက်အလက်များ ဤနေရာသို့ ပို့သည်',
    notify_line:     'LINE',
    notify_line_sub: 'ဖုန်းတွင် ချက်ချင်း အကြောင်းကြားချက် ရယူပါ',
    notify_whatsapp: 'WhatsApp',
    notify_whatsapp_sub: 'ဖုန်းတွင် ချက်ချင်း အကြောင်းကြားချက် ရယူပါ',
    notify_disclaimer: 'အကြောင်းကြားရန်သာ — စကားပြောဆိုမှုများ ThaiHelper တွင်သာ ရှိနေမည်။ သင့် LINE သို့မဟုတ် WhatsApp နံပါတ်ကို မိသားစုများအား ဘယ်တော့မှ မပေးပါ။',
    notify_coming_soon: 'မကြာမီ',
    photo_label:     'ပရိုဖိုင် ဓာတ်ပုံ',
    photo_optional:  '(မဖြည့်လည်းရသည် သို့သော် အကြံပြုသည်)',
    photo_strong:    'သင့်ဓာတ်ပုံ တင်ပါ',
    photo_desc:      'JPG သို့မဟုတ် PNG · အများဆုံး 5 MB · မျက်နှာ ကြည်လင်သော ဓာတ်ပုံ အကောင်းဆုံး',
    photo_selected:  '✓ ဓာတ်ပုံ ရွေးပြီးပါပြီ – ကောင်းပါသည်!',
    photo_tips_title:'ကောင်းသော ပရိုဖိုင်ဓာတ်ပုံအတွက် အကြံပြုချက် -',
    photo_tip1:      '✅ မျက်နှာ ထင်ရှားစွာ မြင်ရရန်',
    photo_tip2:      '✅ အလင်းရောင် ကောင်းပြီး နောက်ခံ သန့်ရှင်းရန်',
    photo_tip3:      '✅ ဖော်ရွေပြီး ပရော်ဖက်ရှင်နယ် ဖြစ်ရန်',
    photo_tip4:      '❌ ကလေးများ သို့မဟုတ် အခြားသူများ မပါရန်',
    photo_tip5:      '❌ လိုဂိုနှင့် စာသားများ မပါရန်',
    terms_text:      'ဝန်ဆောင်မှု စည်းကမ်းချက်များနှင့် ကိုယ်ရေးအချက်အလက် မူဝါဒကို သဘောတူပါသည်။ ကျွန်ုပ်၏ ပရိုဖိုင်ကို ThaiHelper တွင် မှတ်ပုံတင်ထားသော မိသားစုများ မြင်နိုင်ပါမည်။',
    terms_error:     'စည်းကမ်းချက်များကို သဘောတူပါ။',
    submit_label:    'အခမဲ့ ပရိုဖိုင် ဖန်တီးမည် ✓',
    submitting:      'ပေးပို့နေသည်...',
    submit_error:    'တစ်ခုခု မှားယွင်းသွားသည်။ ထပ်မံ ကြိုးစားပါ သို့မဟုတ် hello@thaihelper.com သို့ ဆက်သွယ်ပါ',
    captcha_error:   '"ကျွန်ုပ်သည် လူသားဖြစ်သည်" စစ်ဆေးမှုကို ပြီးအောင်လုပ်ပြီး ထပ်ကြိုးစားပါ။',
    duplicate_email: 'ဤအီးမေးလ်ဖြင့် အကောင့် ရှိနှင့်ပြီးဖြစ်သည်။ အကောင့်ဝင်ပါ။',
    name_not_allowed: 'ကိုယ်ပိုင်အမည်ဖြင့် မှတ်ပုံတင်ပါ။ "Support" သို့မဟုတ် "Admin" ကဲ့သို့ စကားလုံးများနှင့် ThaiHelper အမည်ကို သီးသန့်ထားသည် — မည်သူမျှ ကျွန်ုပ်တို့ကိုယ်စား မိသားစုများထံ စာရေးသယောင် မပြုလုပ်နိုင်စေရန် ဖြစ်သည်။',
    area_full_address: 'ရပ်ကွက် သို့မဟုတ် ဧရိယာကိုသာ ထည့်ပါ (ဥပမာ "Sukhumvit")၊ အိမ်လိပ်စာ အပြည့်အစုံ မဟုတ်ပါ။ မိသားစုနှင့် ဆက်သွယ်မိပြီးမှ တိကျသော လိပ်စာကို သီးသန့် ပေးနိုင်ပါသည်။',
    photo_size_err:  'ဓာတ်ပုံသည် 5 MB အောက် ဖြစ်ရပါမည်။',
    success_h2:      'ThaiHelper မှ ကြိုဆိုပါသည်! 🎉',
    success_p1:      '✉️ အတည်ပြုရန် လင့်ခ်ကို သင့်အီးမေးလ်သို့ ပို့လိုက်ပါပြီ။ ပရိုဖိုင်ကို အသက်သွင်းရန် နှိပ်ပါ။',
    success_p2:      'အတည်ပြုပြီးနောက် မိသားစုများ သင့်ကို ရှာတွေ့ပြီး စာပို့နိုင်ပါမည်။ ပရိုဖိုင်တွင် ဓာတ်ပုံထည့်ပါက ပိုမို အကြောင်းပြန်ကြပါသည်။',
    success_share:   'အခြား ကလေးထိန်း သို့မဟုတ် အိမ်အကူများ သိပါသလား? ThaiHelper ကို မျှဝေပါ -',
    success_login:   'ကျွန်ုပ်၏ ပရိုဖိုင်သို့ →',
    trust_secure:    '🔒 လုံခြုံပြီး သီးသန့်',
    trust_free:      '✅ ဝန်ဆောင်မှုပေးသူများအတွက် အခမဲ့ ၁၀၀%',
    trust_mobile:    '📱 ဖုန်းအားလုံးတွင် အသုံးပြုနိုင်',
  },
  km: {
    page_title:      'ចុះឈ្មោះជាអ្នកផ្តល់សេវា – ThaiHelper',
    nav_back:        '← ត្រឡប់ទៅទំព័រដើម',
    hero_h1:         'បង្កើតប្រវត្តិរូបឥតគិតថ្លៃ',
    hero_p:          'ប្រហែល ៣ នាទី · គ្មានថ្លៃសេវា · គ្រួសារទាក់ទងមកដោយផ្ទាល់',
    step1_dot:       'អំពីអ្នក',
    step2_dot:       'បទពិសោធន៍',
    step3_dot:       'ទំនាក់ទំនង',
    step1_title:     'ប្រាប់យើងអំពីអ្នក',
    step1_sub:       'ព័ត៌មានមូលដ្ឋាន — អ្នកធ្វើការអ្វី និងនៅទីណា។',
    acct_label:      'អ្នកចុះឈ្មោះជាបុគ្គល ឬជាក្រុមហ៊ុន?',
    acct_individual:     'ខ្ញុំជាបុគ្គល',
    acct_individual_sub: 'ខ្ញុំផ្តល់សេវាដោយខ្លួនឯង (មើលថែកុមារ បើកបរ បម្រើផ្ទះ…)',
    acct_company:        'យើងជាក្រុមហ៊ុន / ភ្នាក់ងារ',
    acct_company_sub:    'យើងផ្តល់បុគ្គលិក ឬសេវាជាអាជីវកម្ម',
    company_card_title:  'ក្រុមហ៊ុន និងភ្នាក់ងារ ស្ថិតនៅក្នុង Directory',
    company_card_body:   'ប្រវត្តិរូបនៅទីនេះ សម្រាប់បុគ្គលដែលធ្វើការដោយខ្លួនឯង។ ប្រសិនបើអ្នកជាក្រុមហ៊ុន ឬភ្នាក់ងារ សូមចុះបញ្ជីក្នុង Expert Directory របស់យើងវិញ។',
    company_card_cta:    'ចុះបញ្ជីក្រុមហ៊ុន →',
    cat_label:       'ប្រភេទសេវា',
    cat_ph:          '— ជ្រើសរើសសេវាចម្បង —',
    cat_nanny:       'អ្នកមើលថែកុមារ',
    cat_housekeeper: 'អ្នកបម្រើផ្ទះ / សម្អាត',
    cat_chef:        'ចុងភៅ',
    cat_driver:      'អ្នកបើកបរ',
    cat_gardener:    'អ្នកថែសួន / អាងហែលទឹក',
    cat_elder:       'អ្នកថែទាំមនុស្សចាស់',
    cat_tutor:       'គ្រូបង្រៀន',
    cat_petsitter:   'អ្នកថែទាំសត្វចិញ្ចឹម',
    cat_multiple:    'សេវាច្រើនប្រភេទ',
    cat_error:       'សូមជ្រើសរើសយ៉ាងហោចណាស់មួយ។',
    cat_multi_hint:  'ជ្រើសរើសអ្វីគ្រប់យ៉ាងដែលអ្នកធ្វើបាន — មួយ ឬច្រើន។',
    skills_label:    'អ្នកធ្វើអ្វីបានខ្លះ?',
    skills_sub:      'ជ្រើសរើសអ្វីដែលពាក់ព័ន្ធ — ជួយឱ្យគ្រួសាររកឃើញអ្នក។',
    age_label:       'ថ្ងៃខែឆ្នាំកំណើត',
    age_ph:          '',
    age_error:       'សូមបញ្ចូលថ្ងៃខែឆ្នាំកំណើត។',
    age_too_young:   'អ្នកត្រូវមានអាយុយ៉ាងហោចណាស់ ១៨ ឆ្នាំ ទើបចុះឈ្មោះបាន។',
    age_too_old:     'សូមបញ្ចូលថ្ងៃខែឆ្នាំកំណើតត្រឹមត្រូវ។',
    age_preview:     'អ្នកមានអាយុ {age} ឆ្នាំ។',
    fname_label:     'នាមខ្លួន',
    fname_ph:        'ឧ. Maria',
    fname_error:     'សូមបញ្ចូលនាមខ្លួន។',
    lname_label:     'នាមត្រកូល',
    lname_ph:        'ឧ. Santos',
    lname_error:     'សូមបញ្ចូលនាមត្រកូល។',
    city_label:      'ទីតាំងរបស់អ្នក',
    city_ph:         '— អ្នកនៅទីណា? —',
    city_error:      'សូមជ្រើសរើសទីក្រុង។',
    city_group_popular: 'ពេញនិយម',
    city_group_all:     'ខេត្តទាំងអស់ (A–Z)',
    area_label:      'សង្កាត់ / តំបន់',
    area_ph:         'ឧ. Rawai, Sukhumvit, Nimman...',
    area_hint:       'មិនចាំបាច់ — ជួយឱ្យគ្រួសារនៅជិតរកឃើញអ្នកលឿនជាង។',
    extra_cities_label: 'ទីតាំងផ្សេងទៀតដែលអ្នកធ្វើការបាន',
    extra_cities_hint:  `មិនចាំបាច់ — ជ្រើសរើសបានរហូតដល់ ${MAX_ADDITIONAL_CITIES} ទីតាំង។`,
    extra_cities_max:   `អ្នកជ្រើសរើសបានត្រឹម ${MAX_ADDITIONAL_CITIES} ទីតាំងប៉ុណ្ណោះ។`,
    btn_next1:       'បន្ទាប់ — បទពិសោធន៍ →',
    step2_title:     'បទពិសោធន៍របស់អ្នក',
    step2_sub:       'ជួយឱ្យគ្រួសារយល់អំពីប្រវត្តិ និងជំនាញរបស់អ្នក។',
    exp_label:       'បទពិសោធន៍ (ឆ្នាំ)',
    exp_ph:          '— អ្នកធ្វើការយូរប៉ុណ្ណា? —',
    exp_0:           'តិចជាង ១ ឆ្នាំ',
    exp_1:           '១–២ ឆ្នាំ',
    exp_3:           '៣–៥ ឆ្នាំ',
    exp_6:           '៦–១០ ឆ្នាំ',
    exp_10:          'លើស ១០ ឆ្នាំ',
    exp_error:       'សូមជ្រើសរើសកម្រិតបទពិសោធន៍។',
    lang_label:      'ភាសាដែលនិយាយបាន',
    lang_error:      'សូមជ្រើសរើសភាសាយ៉ាងហោចណាស់មួយ។',
    nat_label:       'សញ្ជាតិ',
    nat_ph:          '— ជ្រើសរើសសញ្ជាតិ —',
    nat_hint:        'ប្រើសម្រាប់កំណត់តម្រូវការលិខិតអនុញ្ញាតការងារ និងជួយផ្គូផ្គងនឹងគ្រួសារសមស្រប។',
    nat_error:       'សូមជ្រើសរើសសញ្ជាតិ។',
    wp_label:        'ស្ថានភាពលិខិតអនុញ្ញាតការងារ (មិនចាំបាច់)',
    wp_ph:           '— ជ្រើសរើសបើចង់ —',
    wp_hint:         'មិនចាំបាច់។ ចម្លើយរបស់អ្នកប្រើសម្រាប់ជួយគ្រួសាររកឃើញអ្នកតែប៉ុណ្ណោះ។',
    rate_label:      'ប្រាក់ឈ្នួលក្នុងមួយម៉ោង',
    rate_ph:         '— មួយម៉ោងប៉ុន្មាន? —',
    edu_label:       'ការអប់រំ (មិនចាំបាច់)',
    edu_ph:          'ឧ. វិទ្យាល័យ បរិញ្ញាបត្រ វគ្គបណ្តុះបណ្តាលវិជ្ជាជីវៈ…',
    cert_label:      'វិញ្ញាបនបត្រ និងសមត្ថភាព (មិនចាំបាច់)',
    cert_ph:         'ឧ. បឋមសិក្សាសង្គ្រោះ វិញ្ញាបនបត្រថែទាំកុមារ សុវត្ថិភាពចំណីអាហារ…',
    bio_label:       'អំពីអ្នក',
    bio_ph:          'ឧ. ខ្ញុំមានបទពិសោធន៍ ៥ ឆ្នាំ ជាអ្នកមើលថែកុមារនៅ Phuket។ ខ្ញុំនិយាយភាសាអង់គ្លេស និងថៃបន្តិច។ ខ្ញុំចូលចិត្តធ្វើការជាមួយកុមារ មានចិត្តអត់ធ្មត់ និងអាចទុកចិត្តបាន។',
    bio_generate:    '✨ សរសេរប្រវត្តិរូបឱ្យខ្ញុំ',
    bio_hints_title: 'អ្វីដែលគួរលើកឡើង៖',
    bio_hint1:       'ហេតុអ្វីអ្នកពូកែការងារនេះ?',
    bio_hint2:       'អ្នកពូកែជាពិសេសខាងអ្វី?',
    bio_hint3:       'អ្នកធ្លាប់ធ្វើការនៅទីណាខ្លះ?',
    bio_notice:      'សូមកុំដាក់លេខទូរស័ព្ទ អ៊ីមែល ឬតំណសង្គមនៅទីនេះ។',
    chars_label:     'តួអក្សរ',
    bio_error:       'សូមសរសេរការពិពណ៌នាខ្លី (យ៉ាងហោចណាស់ ៣០ តួអក្សរ)។',
    btn_back:        '← ត្រឡប់ក្រោយ',
    btn_next2:       'បន្ទាប់ — បញ្ចប់ →',
    step3_title:     'ជិតរួចរាល់ហើយ',
    step3_sub:       'គ្រួសារនឹងទាក់ទងអ្នកតាមប្រព័ន្ធសារក្នុងវេទិកា។ អ៊ីមែលរបស់អ្នកនៅឯកជន ប្រើសម្រាប់ចូលគណនី និងការជូនដំណឹងតែប៉ុណ្ណោះ។',
    email_label:     'អាសយដ្ឋានអ៊ីមែល',
    email_error:     'សូមបញ្ចូលអ៊ីមែលត្រឹមត្រូវ។',
    email_typo:      'តើអ្នកចង់សរសេរ',
    email_typo_use:  'ប្រើវិញ',
    email_typo_block:'អ៊ីមែលហាក់មានកំហុសអក្ខរាវិរុទ្ធ — សូមកែ ឬប្រើការណែនាំខាងលើ។',
    notify_title:    'ទទួលការជូនដំណឹងអំពីសារថ្មី',
    notify_email:    'អ៊ីមែល',
    notify_email_sub:'បើកជានិច្ច — យើងផ្ញើព័ត៌មានសំខាន់មកទីនេះ',
    notify_line:     'LINE',
    notify_line_sub: 'ទទួលការជូនដំណឹងភ្លាមៗលើទូរស័ព្ទ',
    notify_whatsapp: 'WhatsApp',
    notify_whatsapp_sub: 'ទទួលការជូនដំណឹងភ្លាមៗលើទូរស័ព្ទ',
    notify_disclaimer: 'សម្រាប់ការជូនដំណឹងតែប៉ុណ្ណោះ — ការសន្ទនានៅតែស្ថិតក្នុង ThaiHelper។ យើងមិនចែករំលែកលេខ LINE ឬ WhatsApp របស់អ្នកជាមួយគ្រួសារឡើយ។',
    notify_coming_soon: 'នឹងមានឆាប់ៗ',
    photo_label:     'រូបថតប្រវត្តិរូប',
    photo_optional:  '(មិនចាំបាច់ តែណែនាំ)',
    photo_strong:    'ផ្ទុករូបថតរបស់អ្នក',
    photo_desc:      'JPG ឬ PNG · អតិបរមា 5 MB · រូបថតមុខច្បាស់ល្អបំផុត',
    photo_selected:  '✓ បានជ្រើសរើសរូបថត – មើលទៅល្អណាស់!',
    photo_tips_title:'គន្លឹះសម្រាប់រូបថតល្អ៖',
    photo_tip1:      '✅ មើលឃើញមុខច្បាស់',
    photo_tip2:      '✅ ពន្លឺល្អ ផ្ទៃខាងក្រោយស្អាត',
    photo_tip3:      '✅ មើលទៅរាក់ទាក់ និងមានវិជ្ជាជីវៈ',
    photo_tip4:      '❌ គ្មានកុមារ ឬមនុស្សផ្សេង',
    photo_tip5:      '❌ គ្មានឡូហ្គោ ឬអក្សរពីលើ',
    terms_text:      'ខ្ញុំយល់ព្រមតាមលក្ខខណ្ឌសេវា និងគោលការណ៍ឯកជនភាព។ ប្រវត្តិរូបរបស់ខ្ញុំនឹងបង្ហាញដល់គ្រួសារដែលបានចុះឈ្មោះលើ ThaiHelper។',
    terms_error:     'សូមយល់ព្រមតាមលក្ខខណ្ឌ។',
    submit_label:    'បង្កើតប្រវត្តិរូបឥតគិតថ្លៃ ✓',
    submitting:      'កំពុងផ្ញើ...',
    submit_error:    'មានបញ្ហាកើតឡើង។ សូមព្យាយាមម្តងទៀត ឬទាក់ទង hello@thaihelper.com',
    captcha_error:   'សូមបំពេញការត្រួតពិនិត្យ "ខ្ញុំជាមនុស្ស" រួចព្យាយាមម្តងទៀត។',
    duplicate_email: 'មានគណនីជាមួយអ៊ីមែលនេះរួចហើយ។ សូមចូលគណនីវិញ។',
    name_not_allowed: 'សូមចុះឈ្មោះក្រោមឈ្មោះពិតរបស់អ្នក។ ពាក្យដូចជា "Support" ឬ "Admin" និងឈ្មោះ ThaiHelper ត្រូវបានរក្សាទុក ដើម្បីកុំឱ្យនរណាម្នាក់ធ្វើពុតជាសរសេរទៅគ្រួសារជំនួសយើង។',
    area_full_address: 'សូមបញ្ចូលតំបន់ ឬសង្កាត់ (ឧ. "Sukhumvit") មិនមែនអាសយដ្ឋានផ្ទះពេញលេញទេ។ អ្នកអាចប្រាប់អាសយដ្ឋានពិតជាឯកជន ពេលទាក់ទងជាមួយគ្រួសាររួច។',
    photo_size_err:  'រូបថតត្រូវតូចជាង 5 MB។',
    success_h2:      'សូមស្វាគមន៍មកកាន់ ThaiHelper! 🎉',
    success_p1:      '✉️ យើងបានផ្ញើតំណផ្ទៀងផ្ទាត់ទៅអ៊ីមែលរបស់អ្នក។ សូមចុចដើម្បីធ្វើឱ្យប្រវត្តិរូបសកម្ម។',
    success_p2:      'ក្រោយផ្ទៀងផ្ទាត់ គ្រួសារអាចរកឃើញ និងផ្ញើសារមកអ្នក។ បន្ថែមរូបថតដើម្បីទទួលការឆ្លើយតបច្រើនជាង។',
    success_share:   'ស្គាល់អ្នកមើលថែកុមារ ឬអ្នកបម្រើផ្ទះផ្សេងទៀតទេ? ចែករំលែក ThaiHelper៖',
    success_login:   'ទៅកាន់ប្រវត្តិរូបរបស់ខ្ញុំ →',
    trust_secure:    '🔒 សុវត្ថិភាព និងឯកជន',
    trust_free:      '✅ ឥតគិតថ្លៃ ១០០% សម្រាប់អ្នកផ្តល់សេវា',
    trust_mobile:    '📱 ប្រើបានលើទូរស័ព្ទគ្រប់ប្រភេទ',
  },
  lo: {
    page_title:      'ລົງທະບຽນເປັນຜູ້ໃຫ້ບໍລິການ – ThaiHelper',
    nav_back:        '← ກັບໄປໜ້າຫຼັກ',
    hero_h1:         'ສ້າງໂປຣໄຟລ໌ຟຣີ',
    hero_p:          'ປະມານ 3 ນາທີ · ບໍ່ເສຍຄ່າ · ຄອບຄົວຕິດຕໍ່ຫາໂດຍກົງ',
    step1_dot:       'ກ່ຽວກັບທ່ານ',
    step2_dot:       'ປະສົບການ',
    step3_dot:       'ຕິດຕໍ່',
    step1_title:     'ບອກພວກເຮົາກ່ຽວກັບທ່ານ',
    step1_sub:       'ຂໍ້ມູນພື້ນຖານ — ທ່ານເຮັດວຽກຫຍັງ ແລະ ຢູ່ໃສ.',
    acct_label:      'ທ່ານລົງທະບຽນເປັນບຸກຄົນ ຫຼື ບໍລິສັດ?',
    acct_individual:     'ຂ້ອຍເປັນບຸກຄົນ',
    acct_individual_sub: 'ຂ້ອຍໃຫ້ບໍລິການດ້ວຍຕົນເອງ (ລ້ຽງເດັກ, ຂັບລົດ, ແມ່ບ້ານ…)',
    acct_company:        'ພວກເຮົາເປັນບໍລິສັດ / ຕົວແທນ',
    acct_company_sub:    'ພວກເຮົາໃຫ້ພະນັກງານ ຫຼື ບໍລິການແບບທຸລະກິດ',
    company_card_title:  'ບໍລິສັດ ແລະ ຕົວແທນ ຢູ່ໃນ Directory',
    company_card_body:   'ໂປຣໄຟລ໌ຢູ່ນີ້ແມ່ນສຳລັບຜູ້ທີ່ເຮັດວຽກດ້ວຍຕົນເອງ. ຖ້າທ່ານເປັນບໍລິສັດ ຫຼື ຕົວແທນ ກະລຸນາລົງທະບຽນໃນ Expert Directory ຂອງພວກເຮົາແທນ.',
    company_card_cta:    'ລົງທະບຽນບໍລິສັດ →',
    cat_label:       'ປະເພດບໍລິການ',
    cat_ph:          '— ເລືອກບໍລິການຫຼັກ —',
    cat_nanny:       'ຜູ້ລ້ຽງເດັກ',
    cat_housekeeper: 'ແມ່ບ້ານ / ທຳຄວາມສະອາດ',
    cat_chef:        'ແມ່ຄົວ',
    cat_driver:      'ຜູ້ຂັບລົດ',
    cat_gardener:    'ຜູ້ດູແລສວນ / ສະລອຍນ້ຳ',
    cat_elder:       'ຜູ້ເບິ່ງແຍງຜູ້ສູງອາຍຸ',
    cat_tutor:       'ຄູສອນ',
    cat_petsitter:   'ຜູ້ເບິ່ງແຍງສັດລ້ຽງ',
    cat_multiple:    'ຫຼາຍບໍລິການ',
    cat_error:       'ກະລຸນາເລືອກຢ່າງໜ້ອຍໜຶ່ງຢ່າງ.',
    cat_multi_hint:  'ເລືອກທຸກຢ່າງທີ່ທ່ານເຮັດໄດ້ — ໜຶ່ງ ຫຼື ຫຼາຍຢ່າງ.',
    skills_label:    'ທ່ານເຮັດຫຍັງໄດ້ແດ່?',
    skills_sub:      'ເລືອກທຸກຢ່າງທີ່ກ່ຽວຂ້ອງ — ຊ່ວຍໃຫ້ຄອບຄົວຊອກຫາທ່ານໄດ້.',
    age_label:       'ວັນເດືອນປີເກີດ',
    age_ph:          '',
    age_error:       'ກະລຸນາໃສ່ວັນເດືອນປີເກີດ.',
    age_too_young:   'ທ່ານຕ້ອງມີອາຍຸຢ່າງໜ້ອຍ 18 ປີ ຈຶ່ງລົງທະບຽນໄດ້.',
    age_too_old:     'ກະລຸນາໃສ່ວັນເດືອນປີເກີດທີ່ຖືກຕ້ອງ.',
    age_preview:     'ທ່ານມີອາຍຸ {age} ປີ.',
    fname_label:     'ຊື່',
    fname_ph:        'ຕົວຢ່າງ Maria',
    fname_error:     'ກະລຸນາໃສ່ຊື່.',
    lname_label:     'ນາມສະກຸນ',
    lname_ph:        'ຕົວຢ່າງ Santos',
    lname_error:     'ກະລຸນາໃສ່ນາມສະກຸນ.',
    city_label:      'ທີ່ຢູ່ຂອງທ່ານ',
    city_ph:         '— ທ່ານຢູ່ໃສ? —',
    city_error:      'ກະລຸນາເລືອກເມືອງ.',
    city_group_popular: 'ນິຍົມ',
    city_group_all:     'ແຂວງທັງໝົດ (A–Z)',
    area_label:      'ຄຸ້ມ / ເຂດ',
    area_ph:         'ຕົວຢ່າງ Rawai, Sukhumvit, Nimman...',
    area_hint:       'ບໍ່ຈຳເປັນ — ຊ່ວຍໃຫ້ຄອບຄົວໃກ້ຄຽງຊອກຫາທ່ານໄດ້ໄວຂຶ້ນ.',
    extra_cities_label: 'ສະຖານທີ່ອື່ນທີ່ທ່ານເຮັດວຽກໄດ້',
    extra_cities_hint:  `ບໍ່ຈຳເປັນ — ເລືອກໄດ້ເຖິງ ${MAX_ADDITIONAL_CITIES} ສະຖານທີ່.`,
    extra_cities_max:   `ທ່ານເລືອກໄດ້ສູງສຸດ ${MAX_ADDITIONAL_CITIES} ສະຖານທີ່.`,
    btn_next1:       'ຕໍ່ໄປ — ປະສົບການ →',
    step2_title:     'ປະສົບການຂອງທ່ານ',
    step2_sub:       'ຊ່ວຍໃຫ້ຄອບຄົວເຂົ້າໃຈປະຫວັດ ແລະ ຄວາມຊຳນານຂອງທ່ານ.',
    exp_label:       'ປະສົບການ (ປີ)',
    exp_ph:          '— ທ່ານເຮັດວຽກມາດົນປານໃດ? —',
    exp_0:           'ໜ້ອຍກວ່າ 1 ປີ',
    exp_1:           '1–2 ປີ',
    exp_3:           '3–5 ປີ',
    exp_6:           '6–10 ປີ',
    exp_10:          'ຫຼາຍກວ່າ 10 ປີ',
    exp_error:       'ກະລຸນາເລືອກລະດັບປະສົບການ.',
    lang_label:      'ພາສາທີ່ເວົ້າໄດ້',
    lang_error:      'ກະລຸນາເລືອກຢ່າງໜ້ອຍໜຶ່ງພາສາ.',
    nat_label:       'ສັນຊາດ',
    nat_ph:          '— ເລືອກສັນຊາດ —',
    nat_hint:        'ໃຊ້ເພື່ອກຳນົດຄວາມຕ້ອງການໃບອະນຸຍາດເຮັດວຽກ ແລະ ຈັບຄູ່ກັບຄອບຄົວທີ່ເໝາະສົມ.',
    nat_error:       'ກະລຸນາເລືອກສັນຊາດ.',
    wp_label:        'ສະຖານະໃບອະນຸຍາດເຮັດວຽກ (ບໍ່ຈຳເປັນ)',
    wp_ph:           '— ເລືອກຖ້າຕ້ອງການ —',
    wp_hint:         'ບໍ່ຈຳເປັນ. ຄຳຕອບຂອງທ່ານໃຊ້ເພື່ອຊ່ວຍໃຫ້ຄອບຄົວຊອກຫາທ່ານເທົ່ານັ້ນ.',
    rate_label:      'ຄ່າຈ້າງຕໍ່ຊົ່ວໂມງ',
    rate_ph:         '— ຊົ່ວໂມງລະເທົ່າໃດ? —',
    edu_label:       'ການສຶກສາ (ບໍ່ຈຳເປັນ)',
    edu_ph:          'ຕົວຢ່າງ ມັດທະຍົມ, ປະລິນຍາຕີ, ຝຶກອົບຮົມວິຊາຊີບ…',
    cert_label:      'ໃບຢັ້ງຢືນ ແລະ ຄຸນວຸດທິ (ບໍ່ຈຳເປັນ)',
    cert_ph:         'ຕົວຢ່າງ ປະຖົມພະຍາບານ, ໃບຢັ້ງຢືນການລ້ຽງເດັກ, ຄວາມປອດໄພອາຫານ…',
    bio_label:       'ກ່ຽວກັບທ່ານ',
    bio_ph:          'ຕົວຢ່າງ ຂ້ອຍມີປະສົບການ 5 ປີ ເປັນຜູ້ລ້ຽງເດັກຢູ່ພູເກັດ. ຂ້ອຍເວົ້າພາສາອັງກິດ ແລະ ພາສາໄທໄດ້ໜ້ອຍໜຶ່ງ. ຂ້ອຍມັກເຮັດວຽກກັບເດັກ ມີຄວາມອົດທົນ ເອົາໃຈໃສ່ ແລະ ເຊື່ອຖືໄດ້.',
    bio_generate:    '✨ ຂຽນປະຫວັດໃຫ້ຂ້ອຍ',
    bio_hints_title: 'ສິ່ງທີ່ຄວນກ່າວເຖິງ:',
    bio_hint1:       'ເປັນຫຍັງທ່ານຈຶ່ງເກັ່ງວຽກນີ້?',
    bio_hint2:       'ທ່ານຊຳນານພິເສດດ້ານໃດ?',
    bio_hint3:       'ທ່ານເຄີຍເຮັດວຽກຢູ່ໃສມາແລ້ວ?',
    bio_notice:      'ກະລຸນາຢ່າໃສ່ເບີໂທ, ອີເມວ ຫຼື ລິ້ງໂຊຊຽວຢູ່ນີ້.',
    chars_label:     'ຕົວອັກສອນ',
    bio_error:       'ກະລຸນາຂຽນຄຳອະທິບາຍສັ້ນໆ (ຢ່າງໜ້ອຍ 30 ຕົວອັກສອນ).',
    btn_back:        '← ກັບຄືນ',
    btn_next2:       'ຕໍ່ໄປ — ສຳເລັດ →',
    step3_title:     'ເກືອບສຳເລັດແລ້ວ',
    step3_sub:       'ຄອບຄົວຈະຕິດຕໍ່ທ່ານຜ່ານລະບົບຂໍ້ຄວາມຂອງພວກເຮົາ. ອີເມວຂອງທ່ານເປັນສ່ວນຕົວ ໃຊ້ສຳລັບເຂົ້າລະບົບ ແລະ ແຈ້ງເຕືອນເທົ່ານັ້ນ.',
    email_label:     'ທີ່ຢູ່ອີເມວ',
    email_error:     'ກະລຸນາໃສ່ອີເມວທີ່ຖືກຕ້ອງ.',
    email_typo:      'ທ່ານໝາຍເຖິງ',
    email_typo_use:  'ໃຊ້ອັນນີ້',
    email_typo_block:'ອີເມວເບິ່ງຄືວ່າພິມຜິດ — ກະລຸນາແກ້ໄຂ ຫຼື ໃຊ້ຄຳແນະນຳຂ້າງເທິງ.',
    notify_title:    'ຮັບແຈ້ງເຕືອນເມື່ອມີຂໍ້ຄວາມໃໝ່',
    notify_email:    'ອີເມວ',
    notify_email_sub:'ເປີດຕະຫຼອດ — ພວກເຮົາສົ່ງຂໍ້ມູນສຳຄັນມາທີ່ນີ້',
    notify_line:     'LINE',
    notify_line_sub: 'ຮັບແຈ້ງເຕືອນທັນທີໃນໂທລະສັບ',
    notify_whatsapp: 'WhatsApp',
    notify_whatsapp_sub: 'ຮັບແຈ້ງເຕືອນທັນທີໃນໂທລະສັບ',
    notify_disclaimer: 'ສຳລັບແຈ້ງເຕືອນເທົ່ານັ້ນ — ການສົນທະນາຢູ່ໃນ ThaiHelper ສະເໝີ. ພວກເຮົາບໍ່ເຄີຍແບ່ງປັນເບີ LINE ຫຼື WhatsApp ຂອງທ່ານໃຫ້ຄອບຄົວ.',
    notify_coming_soon: 'ຈະມີໃນໄວໆນີ້',
    photo_label:     'ຮູບໂປຣໄຟລ໌',
    photo_optional:  '(ບໍ່ຈຳເປັນ ແຕ່ແນະນຳ)',
    photo_strong:    'ອັບໂຫລດຮູບຂອງທ່ານ',
    photo_desc:      'JPG ຫຼື PNG · ສູງສຸດ 5 MB · ຮູບໜ້າຊັດເຈນດີທີ່ສຸດ',
    photo_selected:  '✓ ເລືອກຮູບແລ້ວ – ເບິ່ງດີຫຼາຍ!',
    photo_tips_title:'ຄຳແນະນຳສຳລັບຮູບໂປຣໄຟລ໌ທີ່ດີ:',
    photo_tip1:      '✅ ເຫັນໜ້າຊັດເຈນ',
    photo_tip2:      '✅ ແສງດີ ພື້ນຫຼັງສະອາດ',
    photo_tip3:      '✅ ເບິ່ງເປັນມິດ ແລະ ເປັນມືອາຊີບ',
    photo_tip4:      '❌ ບໍ່ມີເດັກ ຫຼື ຄົນອື່ນ',
    photo_tip5:      '❌ ບໍ່ມີໂລໂກ້ ຫຼື ຕົວອັກສອນທັບ',
    terms_text:      'ຂ້ອຍຍອມຮັບເງື່ອນໄຂການບໍລິການ ແລະ ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ. ໂປຣໄຟລ໌ຂອງຂ້ອຍຈະສະແດງໃຫ້ຄອບຄົວທີ່ລົງທະບຽນໃນ ThaiHelper ເຫັນ.',
    terms_error:     'ກະລຸນາຍອມຮັບເງື່ອນໄຂ.',
    submit_label:    'ສ້າງໂປຣໄຟລ໌ຟຣີຂອງຂ້ອຍ ✓',
    submitting:      'ກຳລັງສົ່ງ...',
    submit_error:    'ມີບາງຢ່າງຜິດພາດ. ກະລຸນາລອງໃໝ່ ຫຼື ຕິດຕໍ່ hello@thaihelper.com',
    captcha_error:   'ກະລຸນາເຮັດການກວດສອບ "ຂ້ອຍເປັນມະນຸດ" ແລ້ວລອງໃໝ່.',
    duplicate_email: 'ມີບັນຊີດ້ວຍອີເມວນີ້ແລ້ວ. ກະລຸນາເຂົ້າລະບົບແທນ.',
    name_not_allowed: 'ກະລຸນາລົງທະບຽນດ້ວຍຊື່ຈິງຂອງທ່ານ. ຄຳວ່າ "Support" ຫຼື "Admin" ແລະ ຊື່ ThaiHelper ຖືກສະຫງວນໄວ້ ເພື່ອບໍ່ໃຫ້ຜູ້ໃດປອມເປັນພວກເຮົາຂຽນຫາຄອບຄົວ.',
    area_full_address: 'ກະລຸນາໃສ່ເຂດ ຫຼື ຄຸ້ມ (ຕົວຢ່າງ "Sukhumvit") ບໍ່ແມ່ນທີ່ຢູ່ເຮືອນເຕັມ. ທ່ານສາມາດບອກທີ່ຢູ່ແທ້ເປັນສ່ວນຕົວ ເມື່ອຕິດຕໍ່ກັບຄອບຄົວແລ້ວ.',
    photo_size_err:  'ຮູບຕ້ອງນ້ອຍກວ່າ 5 MB.',
    success_h2:      'ຍິນດີຕ້ອນຮັບສູ່ ThaiHelper! 🎉',
    success_p1:      '✉️ ພວກເຮົາສົ່ງລິ້ງຢືນຢັນໄປອີເມວຂອງທ່ານແລ້ວ. ກະລຸນາກົດເພື່ອເປີດໃຊ້ໂປຣໄຟລ໌.',
    success_p2:      'ຫຼັງຢືນຢັນແລ້ວ ຄອບຄົວຈະຊອກຫາ ແລະ ສົ່ງຂໍ້ຄວາມຫາທ່ານໄດ້. ເພີ່ມຮູບເພື່ອໄດ້ຮັບການຕອບກັບຫຼາຍຂຶ້ນ.',
    success_share:   'ຮູ້ຈັກຜູ້ລ້ຽງເດັກ ຫຼື ແມ່ບ້ານຄົນອື່ນບໍ? ແບ່ງປັນ ThaiHelper ໃຫ້ເຂົາເຈົ້າ:',
    success_login:   'ໄປທີ່ໂປຣໄຟລ໌ຂອງຂ້ອຍ →',
    trust_secure:    '🔒 ປອດໄພ ແລະ ເປັນສ່ວນຕົວ',
    trust_free:      '✅ ຟຣີ 100% ສຳລັບຜູ້ໃຫ້ບໍລິການ',
    trust_mobile:    '📱 ໃຊ້ໄດ້ກັບທຸກໂທລະສັບ',
  },
};


// ─── HELPERS ─────────────────────────────────────────────────────────────────
function generateBio({ lang, categories, skills, experience, languages, city }) {
  const catEN = {
    nanny: 'nanny and childcare provider', housekeeper: 'housekeeper and cleaner',
    chef: 'private chef and cook', driver: 'driver and chauffeur',
    gardener: 'gardener and pool care specialist', elder_care: 'elder care and caregiver',
    tutor: 'tutor and private teacher', petsitter: 'pet sitter and dog walker',
  };
  const catTH = {
    nanny: 'พี่เลี้ยงเด็ก', housekeeper: 'แม่บ้าน', chef: 'พ่อครัว/แม่ครัวส่วนตัว',
    driver: 'คนขับรถ', gardener: 'คนสวนและดูแลสระ', elder_care: 'ผู้ดูแลผู้สูงอายุ',
    tutor: 'ติวเตอร์และครูสอนพิเศษ', petsitter: 'ผู้ดูแลสัตว์เลี้ยง',
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
  // Individual vs company gate — companies belong in the Expert Directory
  // (/partners), not the individual helper list. 'company' swaps the form
  // for a redirect card. Default keeps the normal individual flow untouched.
  const [accountType, setAccountType] = useState('individual');
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
  const [nationality, setNationality] = useState('');
  const [wpStatus,    setWpStatus]    = useState('');
  const [rate,        setRate]        = useState('');
  const [education,   setEducation]   = useState('');
  const [certificates,setCertificates]= useState('');
  const [bio,         setBio]         = useState('');
  const [email,       setEmail]       = useState('');
  const [emailSuggestion, setEmailSuggestion] = useState('');
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

  const t = T[lang] || T.en;

  useEffect(() => {
    if (!photoPreview) setPhotoText((T[lang] || T.en).photo_strong);
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
    }
    if (stepNum === 2) {
      if (!experience)           errs.experience  = t.exp_error;
      if (languages.length === 0)errs.languages   = t.lang_error;
      if (!nationality)          errs.nationality = t.nat_error;
      if (bio.trim().length < 30)errs.bio         = t.bio_error;
    }
    if (stepNum === 3) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errs.email = t.email_error;
      } else {
        // Hard-block submission when our typo detector has a confident
        // suggestion (e.g. gmail.co → gmail.com, hotmail.con → hotmail.com).
        // Users still see the existing yellow "Did you mean" hint; we just
        // also refuse to submit until they accept it or fix the address.
        const typoFix = suggestEmail(email);
        if (typoFix) {
          setEmailSuggestion(typoFix);
          errs.email = t.email_typo_block;
        }
      }
      if (!terms)                errs.terms    = t.terms_error;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step navigation. On forward moves we validate first; if anything is
  // wrong we scroll the first error into view so the user actually sees
  // why the "Next" button didn't advance. Without this, mobile users hit
  // Next, the page stays put, and they think the button is broken.
  const goToStep = (next) => {
    if (next > step && !validate(step)) {
      // Find the first .has-error field and scroll it into view. Wait a
      // microtask so React has rendered the error state.
      requestAnimationFrame(() => {
        const firstError = document.querySelector('.field.has-error');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
      return;
    }
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
      nationality: nationality || null,
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
      fbTrack('CompleteRegistration', { content_name: 'helper_signup' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Submit error:', err);
      const knownErrors = { duplicate_email: t.duplicate_email, area_full_address: t.area_full_address, name_not_allowed: t.name_not_allowed };
      let msg = knownErrors[err.message];
      // CAPTCHA errors come back as "CAPTCHA verification failed" / "Missing
      // CAPTCHA token" etc. — tell the user to redo it instead of a vague
      // "something went wrong".
      if (!msg && /captcha/i.test(err.message || '')) msg = t.captcha_error;
      setSubmitError(msg || t.submit_error);
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
          <BrandWordmark />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LangSwitcher languages={HELPER_LANGS} />
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

        {/* What-this-is guard — positive and ALWAYS bilingual, mirrors the
            employer page. Reassures helpers they're in the right place and
            quietly redirects employers who landed here by mistake. Thai font
            is inline because body.lang-th only applies in full Thai mode. */}
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{
            maxWidth: '640px', margin: '0 auto', background: '#ffffff',
            border: '2px solid #006a62', borderRadius: '16px', padding: '16px 18px',
            boxShadow: '0 6px 20px rgba(0,106,98,0.15)', display: 'flex',
            alignItems: 'center', gap: '14px', flexWrap: 'wrap',
          }}>
            <div style={{ fontSize: '30px', lineHeight: 1, flexShrink: 0 }}>👋</div>
            <div style={{ flex: 1, minWidth: '230px' }}>
              <div style={{ fontWeight: 800, color: 'var(--navy)', fontSize: '15px', lineHeight: 1.4 }}>
                Here you create your free helper account, so families &amp; individuals can contact you — or you can apply for a job.
              </div>
              <div style={{ fontFamily: "var(--font-thai), 'Sarabun', sans-serif", fontWeight: 700, color: '#006a62', fontSize: '15px', lineHeight: 1.55, marginTop: '6px' }}>
                ที่นี่คุณสร้างบัญชีผู้ช่วยฟรี เพื่อให้ครอบครัวและบุคคลทั่วไปติดต่อคุณได้ — หรือคุณสามารถสมัครงานได้
              </div>
              <Link href="/employer-register" style={{ display: 'inline-block', marginTop: '8px', color: '#8a6d1a', fontWeight: 700, fontSize: '13.5px', textDecoration: 'underline' }}>
                Want to hire a helper instead? · ต้องการจ้างผู้ช่วย? →
              </Link>
            </div>
          </div>
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
                  <a className="share-btn share-fb" href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.thaihelper.app" target="_blank" rel="noreferrer">📘 Share on Facebook</a>
                </div>
              </div>
            )}

            {/* ── STEP 1: About You ───────────────── */}
            {!success && step === 1 && (
              <div>
                <h2 className="step-title">{t.step1_title}</h2>
                <p className="step-sub">{t.step1_sub}</p>

                {/* Individual vs company gate. Companies that pick "company"
                    get redirected to the Expert Directory signup instead of
                    filling out an individual helper profile. */}
                <div className="field">
                  <label>{t.acct_label}</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                    {[
                      { value: 'individual', title: t.acct_individual, sub: t.acct_individual_sub },
                      { value: 'company',    title: t.acct_company,    sub: t.acct_company_sub },
                    ].map(opt => {
                      const selected = accountType === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setAccountType(opt.value)}
                          style={{
                            textAlign: 'left',
                            padding: '12px 14px',
                            borderRadius: '12px',
                            border: `1.5px solid ${selected ? '#006a62' : '#e5e7eb'}`,
                            background: selected ? '#e6f5f3' : 'white',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: '14px', color: selected ? '#006a62' : '#1f2937' }}>{opt.title}</div>
                          <div style={{ fontSize: '12.5px', color: 'var(--gray-500)', marginTop: '3px', lineHeight: 1.4 }}>{opt.sub}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Company → redirect card. Replaces the individual form. */}
                {accountType === 'company' && (
                  <div style={{
                    background: '#fffdf5', border: '2px solid #F4A261', borderRadius: '16px',
                    padding: '20px 22px', marginTop: '4px',
                  }}>
                    <div style={{ fontSize: '28px', lineHeight: 1, marginBottom: '8px' }}>🏢</div>
                    <div style={{ fontWeight: 800, color: 'var(--navy)', fontSize: '16px', marginBottom: '8px' }}>
                      {t.company_card_title}
                    </div>
                    <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.55, margin: '0 0 16px' }}>
                      {t.company_card_body}
                    </p>
                    <Link href="/partners" style={{
                      display: 'inline-block', padding: '12px 24px', borderRadius: '10px',
                      background: '#F4A261', color: '#3b2600', fontWeight: 700,
                      textDecoration: 'none', fontSize: '15px',
                    }}>
                      {t.company_card_cta}
                    </Link>
                  </div>
                )}

                {accountType === 'individual' && (<>
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
                      { value: 'petsitter',   label: t.cat_petsitter },
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
                    <label htmlFor="f-firstname">{t.fname_label} <span className="req">*</span></label>
                    <input id="f-firstname" type="text" value={firstname} placeholder={t.fname_ph}
                      onChange={e => { setFirstname(e.target.value); setErrors(ev => ({...ev, firstname:''})); }} />
                    <div className="field-error">{errors.firstname}</div>
                  </div>
                  <div className={`field ${errors.lastname ? 'has-error' : ''}`}>
                    <label htmlFor="f-lastname">{t.lname_label} <span className="req">*</span></label>
                    <input id="f-lastname" type="text" value={lastname} placeholder={t.lname_ph}
                      onChange={e => { setLastname(e.target.value); setErrors(ev => ({...ev, lastname:''})); }} />
                    <div className="field-error">{errors.lastname}</div>
                  </div>
                </div>

                {/* Date of birth — exact age computed from this */}
                <div className={`field ${errors.dob ? 'has-error' : ''}`}>
                  <label htmlFor="f-dob">{t.age_label} <span className="req">*</span></label>
                  <input id="f-dob"
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

                {/* City — a complete, Thailand-only list. The popular
                    shortlist sits at the top; every other province follows
                    A–Z. There is intentionally no free-text "other" option:
                    it previously let people type a country (e.g.
                    "Philippines") into what is meant to be a Thai location. */}
                <div className={`field ${errors.city ? 'has-error' : ''}`}>
                  <label htmlFor="f-city">{t.city_label} <span className="req">*</span></label>
                  <select id="f-city" value={city} onChange={e => { setCity(e.target.value); setErrors(ev => ({...ev, city:'', area:''})); }}>
                    <option value="">{t.city_ph}</option>
                    <optgroup label={t.city_group_popular}>
                      {CITY_OPTIONS.map(c => (
                        <option key={c.slug} value={c.slug}>📍 {c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label={t.city_group_all}>
                      {THAI_PROVINCES
                        .filter(p => !CITY_OPTIONS.some(c => c.slug === p.slug))
                        .map(p => (
                          <option key={p.slug} value={p.slug}>{p.name}</option>
                        ))}
                    </optgroup>
                  </select>
                  <div className="field-error">{errors.city}</div>
                </div>

                {/* Area / Neighborhood — optional free text, just a finer
                    locality within the chosen city/province. Never the city
                    itself anymore. */}
                <div className="field">
                  <label htmlFor="f-area">{t.area_label}</label>
                  <input id="f-area"
                    type="text"
                    value={area}
                    placeholder={t.area_ph}
                    maxLength={60}
                    onChange={e => { setArea(e.target.value); }}
                  />
                  <div className="field-hint">{t.area_hint}</div>
                </div>

                {/* Additional cities — optional. Hidden until a primary city
                    is picked. */}
                {city && (
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
                </>)}
              </div>
            )}

            {/* ── STEP 2: Experience ──────────────── */}
            {!success && step === 2 && (
              <div>
                <h2 className="step-title">{t.step2_title}</h2>
                <p className="step-sub">{t.step2_sub}</p>

                {/* Experience */}
                <div className={`field ${errors.experience ? 'has-error' : ''}`}>
                  <label htmlFor="f-experience">{t.exp_label} <span className="req">*</span></label>
                  <select id="f-experience" value={experience} onChange={e => { setExperience(e.target.value); setErrors(ev => ({...ev, experience:''})); }}>
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

                {/* Nationality (required) — drives WP-status auto-derivation. */}
                <div className={`field ${errors.nationality ? 'has-error' : ''}`}>
                  <label htmlFor="f-nationality">{t.nat_label} <span className="req">*</span></label>
                  <select id="f-nationality"
                    value={nationality}
                    onChange={e => { setNationality(e.target.value); setErrors(ev => ({ ...ev, nationality: '' })); }}
                  >
                    <option value="">{t.nat_ph}</option>
                    {NATIONALITY_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>
                        {o.flag} {lang === 'th' ? o.th : o.en}
                      </option>
                    ))}
                  </select>
                  <div style={{ marginTop: 6, fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                    {t.nat_hint}
                  </div>
                  {errors.nationality && <div className="field-error" style={{ display: 'block' }}>{errors.nationality}</div>}
                  {/* Nationality × category guidance. Informational only —
                      never blocks the signup, never shown to employers. */}
                  <WorkPermitNotice nationality={nationality} categories={categories} lang={lang} />
                </div>

                {/* Work Permit status (optional) */}
                <div className="field">
                  <label htmlFor="f-wpstatus">{t.wp_label}</label>
                  <select id="f-wpstatus" value={wpStatus} onChange={e => setWpStatus(e.target.value)}>
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
                  <label htmlFor="f-rate">{t.rate_label} <span style={{ color: 'var(--gray-400)', fontWeight: 400, fontSize: '0.85rem' }}>(optional)</span></label>
                  <select id="f-rate" value={rate} onChange={e => setRate(e.target.value)}>
                    <option value="">{t.rate_ph}</option>
                    {RATES.map(r => (
                      <option key={r.value} value={r.value}>{lang === 'th' ? r.th : r.en}</option>
                    ))}
                  </select>
                </div>

                {/* Education (optional) */}
                <div className="field">
                  <label htmlFor="f-education">{t.edu_label}</label>
                  <input id="f-education" type="text" value={education} onChange={e => setEducation(e.target.value)} placeholder={t.edu_ph} />
                </div>

                {/* Certificates (optional) */}
                <div className="field">
                  <label htmlFor="f-certificates">{t.cert_label}</label>
                  <input id="f-certificates" type="text" value={certificates} onChange={e => setCertificates(e.target.value)} placeholder={t.cert_ph} />
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
                  <label htmlFor="f-email">{t.email_label} <span className="req">*</span></label>
                  <input id="f-email" type="email" value={email} placeholder="your@email.com"
                    onChange={e => {
                      setEmail(e.target.value);
                      setErrors(ev => ({ ...ev, email: '' }));
                      setEmailSuggestion('');
                    }}
                    onBlur={() => setEmailSuggestion(suggestEmail(email) || '')} />
                  {emailSuggestion && (
                    <div style={{
                      marginTop: 6, fontSize: '0.9rem',
                      background: '#fffbeb', border: '1px solid #fde68a',
                      color: '#92400e', borderRadius: 8, padding: '8px 12px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                    }}>
                      <span>{t.email_typo} <strong>{emailSuggestion}</strong>?</span>
                      <button type="button"
                        onClick={() => { setEmail(emailSuggestion); setEmailSuggestion(''); setErrors(ev => ({ ...ev, email: '' })); }}
                        style={{
                          background: '#f59e0b', color: 'white', border: 'none',
                          padding: '4px 10px', borderRadius: 6, fontSize: '0.85rem',
                          fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                        }}>
                        {t.email_typo_use}
                      </button>
                    </div>
                  )}
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

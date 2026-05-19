// Account deletion instructions — required by Google Play Data Safety.
// Linked from the Play Store listing under "Account deletion URL".

import Head from 'next/head';
import Link from 'next/link';
import { useLang } from './_app';

const T = {
  en: {
    title: 'Delete your ThaiHelper account',
    intro: 'You can request deletion of your ThaiHelper account and all associated data at any time. This page explains how to do it and what happens to your data afterwards.',
    steps_h: 'How to request deletion',
    step1_h: '1. Send an email from your registered address',
    step1_b: 'Email <a href="mailto:support@thaihelper.app?subject=Delete%20my%20ThaiHelper%20account">support@thaihelper.app</a> from the same email address you used to sign up. Use the subject line "Delete my ThaiHelper account".',
    step2_h: '2. Confirm in the reply',
    step2_b: 'We will reply within 2 business days to confirm the request. Reply once more confirming you want to proceed — this prevents accidental deletions.',
    step3_h: '3. Deletion within 14 days',
    step3_b: 'After your confirmation, we permanently delete your profile, messages, references, certificates and any uploaded photos within 14 days.',
    deleted_h: 'What gets deleted',
    deleted_list: [
      'Your profile (name, photo, bio, contact details)',
      'Your messages — both sent and received conversations',
      'Uploaded references, certificates and ID documents',
      'Favorites, search history, push subscriptions',
      'LINE Bot link (if linked)',
    ],
    kept_h: 'What we keep — and for how long',
    kept_list: [
      '<strong>Email audit log</strong> — your email address may appear in Resend\'s delivery logs for up to 30 days, after which it is purged automatically.',
      '<strong>Database backups</strong> — encrypted Supabase backups are rotated automatically; your data is fully gone from backups within ~30 days of deletion.',
      '<strong>Aggregated, anonymized analytics</strong> — counts (e.g. "5 new helpers in May") with no personal information attached are retained indefinitely.',
    ],
    partial_h: 'Removing only some of your data',
    partial_b: 'If you want to remove only certain fields (e.g. a single message, a photo, a reference) without deleting your whole account, log in and remove it directly from your dashboard — or email <a href="mailto:support@thaihelper.app">support@thaihelper.app</a> with the specific request.',
    contact_h: 'Questions?',
    contact_b: 'Email <a href="mailto:support@thaihelper.app">support@thaihelper.app</a> — we usually reply within one business day.',
    back: '← Back to home',
    privacy_link: 'Read our full Privacy Policy',
  },
  th: {
    title: 'ลบบัญชี ThaiHelper ของคุณ',
    intro: 'คุณสามารถขอลบบัญชี ThaiHelper และข้อมูลทั้งหมดของคุณเมื่อใดก็ได้ หน้านี้อธิบายขั้นตอนและสิ่งที่จะเกิดขึ้นกับข้อมูลของคุณ',
    steps_h: 'วิธีขอลบบัญชี',
    step1_h: '1. ส่งอีเมลจากที่อยู่ที่ลงทะเบียนไว้',
    step1_b: 'ส่งอีเมลถึง <a href="mailto:support@thaihelper.app?subject=Delete%20my%20ThaiHelper%20account">support@thaihelper.app</a> จากที่อยู่อีเมลเดียวกับที่คุณใช้สมัคร ใช้หัวข้อ "Delete my ThaiHelper account"',
    step2_h: '2. ยืนยันในการตอบกลับ',
    step2_b: 'เราจะตอบกลับภายใน 2 วันทำการเพื่อยืนยันคำขอ ตอบกลับอีกครั้งเพื่อยืนยันว่าคุณต้องการดำเนินการต่อ — เพื่อป้องกันการลบโดยไม่ตั้งใจ',
    step3_h: '3. ลบภายใน 14 วัน',
    step3_b: 'หลังจากที่คุณยืนยัน เราจะลบโปรไฟล์ ข้อความ การอ้างอิง ใบรับรอง และรูปภาพที่อัปโหลดทั้งหมดของคุณอย่างถาวรภายใน 14 วัน',
    deleted_h: 'สิ่งที่จะถูกลบ',
    deleted_list: [
      'โปรไฟล์ของคุณ (ชื่อ รูปภาพ ประวัติ ข้อมูลติดต่อ)',
      'ข้อความของคุณ — ทั้งที่ส่งและรับ',
      'การอ้างอิง ใบรับรอง และเอกสารแสดงตัวตนที่อัปโหลด',
      'รายการโปรด ประวัติการค้นหา การสมัครรับการแจ้งเตือน',
      'การเชื่อมโยง LINE Bot (ถ้ามี)',
    ],
    kept_h: 'สิ่งที่เราเก็บไว้ — และนานแค่ไหน',
    kept_list: [
      '<strong>บันทึกการส่งอีเมล</strong> — ที่อยู่อีเมลของคุณอาจปรากฏในบันทึกการส่งของ Resend นานสูงสุด 30 วัน หลังจากนั้นจะถูกลบโดยอัตโนมัติ',
      '<strong>การสำรองข้อมูลฐานข้อมูล</strong> — การสำรองข้อมูลที่เข้ารหัสของ Supabase จะหมุนเวียนโดยอัตโนมัติ ข้อมูลของคุณจะหายไปจากการสำรองข้อมูลภายใน ~30 วันหลังการลบ',
      '<strong>สถิติรวมที่ไม่ระบุตัวตน</strong> — จำนวน (เช่น "ผู้ช่วยใหม่ 5 คนในเดือนพฤษภาคม") โดยไม่มีข้อมูลส่วนบุคคลแนบมาด้วย จะเก็บไว้อย่างไม่มีกำหนด',
    ],
    partial_h: 'ลบข้อมูลบางส่วนเท่านั้น',
    partial_b: 'หากคุณต้องการลบเฉพาะบางฟิลด์ (เช่น ข้อความเดียว รูปภาพ การอ้างอิง) โดยไม่ลบบัญชีทั้งหมด เข้าสู่ระบบและลบโดยตรงจากแดชบอร์ดของคุณ — หรือส่งอีเมลถึง <a href="mailto:support@thaihelper.app">support@thaihelper.app</a> พร้อมคำขอเฉพาะเจาะจง',
    contact_h: 'มีคำถาม?',
    contact_b: 'ส่งอีเมลถึง <a href="mailto:support@thaihelper.app">support@thaihelper.app</a> — เรามักตอบกลับภายในหนึ่งวันทำการ',
    back: '← กลับหน้าแรก',
    privacy_link: 'อ่านนโยบายความเป็นส่วนตัวฉบับเต็ม',
  },
};

export default function AccountDelete() {
  const { lang } = useLang();
  const t = T[lang] || T.en;

  const linkStyle = { color: '#006a62', fontWeight: 600 };

  return (
    <>
      <Head>
        <title>{t.title} · ThaiHelper</title>
        <meta name="description" content={t.intro} />
        <meta name="robots" content="index, follow" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: '#f8faf9',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        padding: '24px',
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          padding: '40px 32px',
          maxWidth: '720px',
          width: '100%',
          margin: '40px auto',
          color: '#1a1a1a',
          lineHeight: 1.7,
        }}>
          <div style={{ marginBottom: '24px' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: '#1a1a1a' }}>
                Thai<span style={{ color: '#006a62' }}>Helper</span>
              </span>
            </Link>
          </div>

          <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 16px' }}>
            {t.title}
          </h1>

          <p style={{ fontSize: '15px', color: '#444', margin: '0 0 32px' }}>
            {t.intro}
          </p>

          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '32px 0 12px' }}>
            {t.steps_h}
          </h2>

          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '20px 0 6px' }}>
            {t.step1_h}
          </h3>
          <p style={{ fontSize: '14px', color: '#444', margin: '0 0 12px' }}
             dangerouslySetInnerHTML={{ __html: t.step1_b.replace(/<a /g, `<a style="color:#006a62;font-weight:600;" `) }} />

          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '20px 0 6px' }}>
            {t.step2_h}
          </h3>
          <p style={{ fontSize: '14px', color: '#444', margin: '0 0 12px' }}>
            {t.step2_b}
          </p>

          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '20px 0 6px' }}>
            {t.step3_h}
          </h3>
          <p style={{ fontSize: '14px', color: '#444', margin: '0 0 12px' }}>
            {t.step3_b}
          </p>

          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '36px 0 12px' }}>
            {t.deleted_h}
          </h2>
          <ul style={{ fontSize: '14px', color: '#444', paddingLeft: '20px', margin: '0 0 12px' }}>
            {t.deleted_list.map((line, i) => (
              <li key={i} style={{ marginBottom: '6px' }}>{line}</li>
            ))}
          </ul>

          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '36px 0 12px' }}>
            {t.kept_h}
          </h2>
          <ul style={{ fontSize: '14px', color: '#444', paddingLeft: '20px', margin: '0 0 12px' }}>
            {t.kept_list.map((line, i) => (
              <li key={i} style={{ marginBottom: '6px' }} dangerouslySetInnerHTML={{ __html: line }} />
            ))}
          </ul>

          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '36px 0 12px' }}>
            {t.partial_h}
          </h2>
          <p style={{ fontSize: '14px', color: '#444', margin: '0 0 12px' }}
             dangerouslySetInnerHTML={{ __html: t.partial_b.replace(/<a /g, `<a style="color:#006a62;font-weight:600;" `) }} />

          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '36px 0 12px' }}>
            {t.contact_h}
          </h2>
          <p style={{ fontSize: '14px', color: '#444', margin: '0 0 24px' }}
             dangerouslySetInnerHTML={{ __html: t.contact_b.replace(/<a /g, `<a style="color:#006a62;font-weight:600;" `) }} />

          <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <Link href="/" style={{ fontSize: '14px', color: '#666', textDecoration: 'underline' }}>
              {t.back}
            </Link>
            <Link href="/privacy" style={linkStyle}>
              {t.privacy_link}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

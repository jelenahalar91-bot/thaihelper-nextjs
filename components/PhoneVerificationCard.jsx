import { useState, useEffect, useCallback } from 'react';
import { Phone, Check, RefreshCw, MessageCircle } from 'lucide-react';

/**
 * Phone Verification flow — used in both /profile (helper) and
 * /employer-dashboard (family). Self-contained:
 *
 *   <PhoneVerificationCard
 *     role="helper" | "employer"
 *     phoneVerifiedAt={profile.phone_verified_at}
 *     phoneNumber={profile.phone_number}
 *     phoneCountryCode={profile.phone_country_code}
 *     lineLinkedAt={profile.line_linked_at}
 *     lang="en" | "th"
 *     onVerified={() => refetchProfile()}
 *     onLinkLine={() => goToLineLink()}
 *   />
 *
 * State machine:
 *   idle       → user enters number + clicks Send
 *   sending    → API call in flight
 *   awaiting   → SMS sent, user enters 6-digit code
 *   verifying  → verify API call in flight
 *   verified   → success state (shows badge + change option)
 *   error      → shows error message, lets user retry
 */

// Common country codes for ThaiHelper users — Thailand first, then
// Myanmar / Philippines (the largest non-Thai helper groups), then
// the expat home countries that dominate the family side.
const COUNTRY_CODES = [
  { code: '+66', label: '🇹🇭 Thailand (+66)' },
  { code: '+95', label: '🇲🇲 Myanmar (+95)' },
  { code: '+63', label: '🇵🇭 Philippines (+63)' },
  { code: '+856', label: '🇱🇦 Laos (+856)' },
  { code: '+855', label: '🇰🇭 Cambodia (+855)' },
  { code: '+1',  label: '🇺🇸 USA / Canada (+1)' },
  { code: '+44', label: '🇬🇧 United Kingdom (+44)' },
  { code: '+49', label: '🇩🇪 Germany (+49)' },
  { code: '+33', label: '🇫🇷 France (+33)' },
  { code: '+61', label: '🇦🇺 Australia (+61)' },
  { code: '+64', label: '🇳🇿 New Zealand (+64)' },
  { code: '+39', label: '🇮🇹 Italy (+39)' },
  { code: '+34', label: '🇪🇸 Spain (+34)' },
  { code: '+31', label: '🇳🇱 Netherlands (+31)' },
  { code: '+46', label: '🇸🇪 Sweden (+46)' },
  { code: '+47', label: '🇳🇴 Norway (+47)' },
  { code: '+45', label: '🇩🇰 Denmark (+45)' },
  { code: '+81', label: '🇯🇵 Japan (+81)' },
  { code: '+82', label: '🇰🇷 South Korea (+82)' },
  { code: '+65', label: '🇸🇬 Singapore (+65)' },
  { code: '+852', label: '🇭🇰 Hong Kong (+852)' },
  { code: '+86', label: '🇨🇳 China (+86)' },
];

const T = {
  en: {
    title: 'Phone Verification',
    sub_unverified: 'Verify your phone number so families know your account is real. Your number is never shown publicly — only the green checkmark badge appears on your profile.',
    sub_verified_helper: 'Your number is verified. The green checkmark badge is now visible on your profile.',
    sub_verified_employer: 'Your number is verified.',
    label_country: 'Country',
    label_number: 'Phone number',
    placeholder_number: 'e.g. 089 123 4567',
    btn_send: 'Send verification code',
    btn_sending: 'Sending…',
    btn_resend: 'Resend code',
    btn_verify: 'Verify code',
    btn_verifying: 'Verifying…',
    btn_change: 'Change number',
    btn_line: 'Or verify via LINE',
    label_code: 'Enter the 6-digit code from the SMS',
    placeholder_code: '123456',
    msg_sent: 'Code sent. Check your SMS.',
    msg_expires: 'Code expires in 10 minutes.',
    msg_attempts_left: '{n} attempts left.',
    badge_verified: 'Phone verified',
    privacy: 'Your number is stored securely and shown to no one.',
    err_invalid_phone: 'That doesn\'t look like a valid phone number.',
    err_rate_limited: 'Too many requests. Try again in {n} minutes.',
    err_sms_failed: 'Could not send SMS. Try LINE instead, or contact support.',
    err_wrong_code: 'Wrong code. {n} attempts left.',
    err_too_many_attempts: 'Too many wrong attempts. Request a new code.',
    err_expired: 'Code expired. Request a new one.',
    err_generic: 'Something went wrong. Try again.',
    line_already: 'LINE already connected ✓',
    why: 'Why?',
    why_text: 'A verified phone number signals to families that the account belongs to a real, reachable person. Profiles with the green checkmark badge get significantly more contact requests.',
  },
  th: {
    title: 'ยืนยันเบอร์โทรศัพท์',
    sub_unverified: 'ยืนยันเบอร์โทรเพื่อให้ครอบครัวเห็นว่าบัญชีของคุณเป็นของจริง เบอร์ของคุณจะไม่ถูกเปิดเผยต่อสาธารณะ — เห็นเพียงเครื่องหมายถูกสีเขียวบนโปรไฟล์',
    sub_verified_helper: 'เบอร์ของคุณยืนยันแล้ว เครื่องหมายถูกสีเขียวจะปรากฏบนโปรไฟล์',
    sub_verified_employer: 'เบอร์ของคุณยืนยันแล้ว',
    label_country: 'ประเทศ',
    label_number: 'เบอร์โทรศัพท์',
    placeholder_number: 'เช่น 089 123 4567',
    btn_send: 'ส่งรหัสยืนยัน',
    btn_sending: 'กำลังส่ง…',
    btn_resend: 'ส่งรหัสอีกครั้ง',
    btn_verify: 'ยืนยันรหัส',
    btn_verifying: 'กำลังตรวจสอบ…',
    btn_change: 'เปลี่ยนเบอร์',
    btn_line: 'หรือยืนยันผ่าน LINE',
    label_code: 'กรอกรหัส 6 หลักจาก SMS',
    placeholder_code: '123456',
    msg_sent: 'ส่งรหัสแล้ว ตรวจสอบ SMS',
    msg_expires: 'รหัสหมดอายุใน 10 นาที',
    msg_attempts_left: 'เหลือ {n} ครั้ง',
    badge_verified: 'ยืนยันเบอร์แล้ว',
    privacy: 'เบอร์ของคุณเก็บไว้อย่างปลอดภัย และไม่แสดงต่อใคร',
    err_invalid_phone: 'รูปแบบเบอร์ไม่ถูกต้อง',
    err_rate_limited: 'ส่งบ่อยเกินไป กรุณาลองอีกครั้งใน {n} นาที',
    err_sms_failed: 'ส่ง SMS ไม่สำเร็จ ลองใช้ LINE แทนหรือติดต่อทีมงาน',
    err_wrong_code: 'รหัสไม่ถูกต้อง เหลือ {n} ครั้ง',
    err_too_many_attempts: 'ใส่ผิดมากเกินไป กรุณาขอรหัสใหม่',
    err_expired: 'รหัสหมดอายุ กรุณาขอรหัสใหม่',
    err_generic: 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง',
    line_already: 'เชื่อมต่อ LINE แล้ว ✓',
    why: 'ทำไม?',
    why_text: 'การยืนยันเบอร์โทรช่วยให้ครอบครัวมั่นใจว่าบัญชีของคุณเป็นของบุคคลจริง โปรไฟล์ที่มีเครื่องหมายยืนยันได้รับการติดต่อมากกว่าอย่างมีนัยสำคัญ',
  },
};

export default function PhoneVerificationCard({
  role = 'helper',
  phoneVerifiedAt,
  phoneNumber,
  phoneCountryCode,
  lineLinkedAt,
  lang = 'en',
  onVerified,
  onLinkLine,
}) {
  const t = T[lang] || T.en;
  const isVerified = !!phoneVerifiedAt;
  const lineLinked = !!lineLinkedAt;

  const [countryCode, setCountryCode] = useState(phoneCountryCode || '+66');
  const [number, setNumber] = useState('');
  const [code, setCode] = useState('');
  const [state, setState] = useState(isVerified ? 'verified' : 'idle');
  // 'idle' | 'sending' | 'awaiting' | 'verifying' | 'verified' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [info, setInfo] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(null);

  // If the props change (e.g. user logs back in, profile refetched),
  // sync local state.
  useEffect(() => {
    setState(isVerified ? 'verified' : 'idle');
  }, [isVerified]);

  const send = useCallback(async () => {
    setErrorMsg('');
    setInfo('');
    if (!number || number.replace(/\D/g, '').length < 6) {
      setErrorMsg(t.err_invalid_phone);
      return;
    }
    setState('sending');
    try {
      const resp = await fetch('/api/phone/send-otp', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: number,
          country_code: countryCode,
          language: lang,
          role,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        if (data.error === 'rate_limited') {
          setErrorMsg(t.err_rate_limited.replace('{n}', Math.ceil((data.retryAfterSec || 0) / 60)));
        } else if (data.error === 'invalid_phone') {
          setErrorMsg(t.err_invalid_phone);
        } else if (data.error === 'sms_send_failed') {
          setErrorMsg(t.err_sms_failed);
        } else {
          setErrorMsg(t.err_generic);
        }
        setState('idle');
        return;
      }
      setInfo(`${t.msg_sent} ${t.msg_expires}`);
      setState('awaiting');
    } catch (err) {
      setErrorMsg(t.err_generic);
      setState('idle');
    }
  }, [number, countryCode, lang, role, t]);

  const verify = useCallback(async () => {
    setErrorMsg('');
    setInfo('');
    const clean = code.replace(/\D/g, '');
    if (clean.length < 4) {
      setErrorMsg(t.err_generic);
      return;
    }
    setState('verifying');
    try {
      const resp = await fetch('/api/phone/verify-otp', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: clean, role }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        if (data.error === 'wrong_code') {
          setAttemptsLeft(data.attemptsLeft);
          setErrorMsg(t.err_wrong_code.replace('{n}', data.attemptsLeft));
          setState('awaiting');
        } else if (data.error === 'too_many_attempts') {
          setErrorMsg(t.err_too_many_attempts);
          setState('idle');
        } else if (data.error === 'otp_expired') {
          setErrorMsg(t.err_expired);
          setState('idle');
        } else {
          setErrorMsg(t.err_generic);
          setState('awaiting');
        }
        return;
      }
      setState('verified');
      setCode('');
      if (onVerified) onVerified();
    } catch (err) {
      setErrorMsg(t.err_generic);
      setState('awaiting');
    }
  }, [code, role, t, onVerified]);

  const startChange = () => {
    setNumber('');
    setCode('');
    setErrorMsg('');
    setInfo('');
    setState('idle');
  };

  const handleLine = () => {
    if (onLinkLine) onLinkLine();
  };

  // ─── render ──────────────────────────────────────────────────────

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          <Phone size={18} className="text-[#006a62]" />
          <h3 className="text-lg font-bold text-[#001b3d]">{t.title}</h3>
        </div>
        {state === 'verified' && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            <Check size={12} /> {t.badge_verified}
          </span>
        )}
      </div>

      {state === 'verified' ? (
        <>
          <p className="text-sm text-gray-600 mb-4">
            {role === 'helper' ? t.sub_verified_helper : t.sub_verified_employer}
          </p>
          <button
            type="button"
            onClick={startChange}
            className="text-sm font-semibold text-[#006a62] hover:underline"
          >
            {t.btn_change}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-4">{t.sub_unverified}</p>

          {/* Country code + number input */}
          <div className="grid grid-cols-1 sm:grid-cols-[180px,1fr] gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t.label_country}</label>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                disabled={state === 'sending' || state === 'awaiting' || state === 'verifying'}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t.label_number}</label>
              <input
                type="tel"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                disabled={state === 'sending' || state === 'awaiting' || state === 'verifying'}
                placeholder={t.placeholder_number}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Send button (idle and after expiry / wrong) */}
          {(state === 'idle' || state === 'sending') && (
            <button
              type="button"
              onClick={send}
              disabled={state === 'sending'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#006a62] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#004d47] disabled:opacity-60"
            >
              {state === 'sending' ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> {t.btn_sending}
                </>
              ) : (
                t.btn_send
              )}
            </button>
          )}

          {/* OTP input + verify (after send succeeded) */}
          {(state === 'awaiting' || state === 'verifying') && (
            <div className="mt-2 rounded-xl bg-gray-50 p-4">
              <label className="block text-xs font-semibold text-gray-700 mb-2">{t.label_code}</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder={t.placeholder_code}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-base font-mono tracking-widest text-center"
                />
                <button
                  type="button"
                  onClick={verify}
                  disabled={state === 'verifying' || code.length < 4}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#006a62] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#004d47] disabled:opacity-60"
                >
                  {state === 'verifying' ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> {t.btn_verifying}
                    </>
                  ) : (
                    t.btn_verify
                  )}
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>{info}</span>
                <button
                  type="button"
                  onClick={send}
                  disabled={state === 'verifying'}
                  className="font-semibold text-[#006a62] hover:underline"
                >
                  {t.btn_resend}
                </button>
              </div>
            </div>
          )}

          {/* LINE alternative */}
          <div className="mt-4 border-t border-gray-100 pt-4">
            {lineLinked ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                <Check size={14} /> {t.line_already}
              </span>
            ) : (
              <button
                type="button"
                onClick={handleLine}
                className="inline-flex items-center gap-2 rounded-lg border border-[#06C755] bg-[#06C755]/5 px-4 py-2 text-sm font-bold text-[#06C755] hover:bg-[#06C755]/10"
              >
                <MessageCircle size={14} /> {t.btn_line}
              </button>
            )}
          </div>

          <p className="mt-4 text-xs text-gray-500">{t.privacy}</p>
        </>
      )}

      {errorMsg && (
        <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {errorMsg}
        </div>
      )}
    </div>
  );
}

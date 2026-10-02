import { useState } from 'react';
import { PHONE_COUNTRY_CODES as COUNTRY_CODES } from '@/lib/constants/phone-countries';

/**
 * Phone verification inside a registration form, before any account exists.
 *
 * Sibling of components/PhoneVerificationCard.jsx, not a replacement for it.
 * That one lives on a dashboard, talks to the session-authenticated OTP routes
 * and writes straight onto the account row. This one has no account to write
 * to: it calls the signup-side routes and hands the parent form a proof token
 * to submit (see lib/phone-signup-token.js).
 *
 * Deliberately not merged with the card. Sharing it would mean one component
 * branching on whether its user exists yet, across the request it makes, the
 * state it keeps and everything it renders — and this is the one path where a
 * bug lets somebody register without a number at all.
 *
 * Props:
 *   lang            'en' | 'th'
 *   onVerified      (phoneToken | null) — null when the number is edited after
 *                   verifying, so the parent drops a proof that no longer
 *                   matches what is on screen
 *   turnstileToken  a FRESH token; sending the code consumes it
 *   onSpendToken    called after it has been spent, so the parent resets the
 *                   widget and has another ready for submit
 *   invalid         true to show the field as the reason a submit was refused
 */

const T = {
  en: {
    label: 'Mobile number',
    required: 'Required — we send you a code by SMS',
    why: 'Helpers see that a family has a verified number. It is never shown to them.',
    placeholder: '08X XXX XXXX',
    send: 'Send code',
    sending: 'Sending…',
    resend: 'Send a new code',
    code_label: 'Enter the 6-digit code',
    code_ph: '123456',
    check: 'Confirm',
    checking: 'Checking…',
    sent: 'We sent a code to {phone}. It arrives within a minute.',
    verified: 'Number verified',
    change: 'Use a different number',
    err_invalid_phone: 'That does not look like a mobile number. Check the country code and try again.',
    err_phone_in_use: 'This number is already on another ThaiHelper account. Log in to that one, or use a different number.',
    err_phone_blocked: 'This number cannot be used to register. Contact support@thaihelper.app if you think that is wrong.',
    err_rate_limited: 'Too many codes requested for this number. Please try again in an hour.',
    err_wrong_code: 'That code is not right. Check the SMS and try again.',
    err_otp_expired: 'That code has expired. Ask for a new one.',
    err_too_many: 'Too many attempts. Please request a new code in a few minutes.',
    err_captcha: 'The spam check did not pass. Reload the page and try again.',
    err_generic: 'The code could not be sent. Please try again in a moment.',
  },
  th: {
    label: 'เบอร์โทรศัพท์มือถือ',
    required: 'จำเป็น — เราจะส่งรหัสให้ทาง SMS',
    why: 'ผู้ช่วยจะเห็นว่าครอบครัวนี้ยืนยันเบอร์แล้ว แต่จะไม่เห็นเบอร์ของคุณ',
    placeholder: '08X XXX XXXX',
    send: 'ส่งรหัส',
    sending: 'กำลังส่ง…',
    resend: 'ส่งรหัสใหม่',
    code_label: 'กรอกรหัส 6 หลัก',
    code_ph: '123456',
    check: 'ยืนยัน',
    checking: 'กำลังตรวจสอบ…',
    sent: 'เราส่งรหัสไปที่ {phone} แล้ว จะได้รับภายใน 1 นาที',
    verified: 'ยืนยันเบอร์แล้ว',
    change: 'ใช้เบอร์อื่น',
    err_invalid_phone: 'เบอร์นี้ดูไม่ถูกต้อง กรุณาตรวจรหัสประเทศแล้วลองอีกครั้ง',
    err_phone_in_use: 'เบอร์นี้ถูกใช้กับบัญชี ThaiHelper อื่นแล้ว กรุณาเข้าสู่ระบบบัญชีนั้น หรือใช้เบอร์อื่น',
    err_phone_blocked: 'เบอร์นี้ไม่สามารถใช้สมัครได้ หากคิดว่าไม่ถูกต้อง ติดต่อ support@thaihelper.app',
    err_rate_limited: 'ขอรหัสสำหรับเบอร์นี้บ่อยเกินไป กรุณาลองใหม่ในอีก 1 ชั่วโมง',
    err_wrong_code: 'รหัสไม่ถูกต้อง กรุณาตรวจสอบ SMS แล้วลองอีกครั้ง',
    err_otp_expired: 'รหัสหมดอายุแล้ว กรุณาขอรหัสใหม่',
    err_too_many: 'ลองผิดหลายครั้งเกินไป กรุณาขอรหัสใหม่ในอีกสองสามนาที',
    err_captcha: 'การตรวจสอบสแปมไม่ผ่าน กรุณาโหลดหน้าใหม่แล้วลองอีกครั้ง',
    err_generic: 'ส่งรหัสไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
  },
};

export default function SignupPhoneVerification({
  lang = 'en',
  onVerified,
  turnstileToken,
  onSpendToken,
  invalid = false,
}) {
  const t = T[lang] || T.en;

  const [countryCode, setCountryCode] = useState('+66');
  const [number, setNumber] = useState('');
  const [stage, setStage] = useState('entry'); // entry → code → done
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const errorText = (key) => t[`err_${key}`] || t.err_generic;

  // Editing the number after verifying must invalidate the proof: it names the
  // number it was minted for, so leaving it attached would submit a different
  // number than the one on screen and the server would refuse it with no
  // explanation the user can act on.
  const editNumber = (value) => {
    setNumber(value);
    if (stage !== 'entry') {
      setStage('entry');
      setCode('');
      onVerified?.(null);
    }
  };

  const sendCode = async () => {
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/phone/signup-send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: number.trim(),
          country_code: countryCode,
          language: lang,
          turnstileToken,
        }),
      });
      // Spent whether or not it was accepted — Cloudflare counts the attempt,
      // so the parent needs a new one either way.
      onSpendToken?.();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(errorText(data.error));
        return;
      }
      setStage('code');
    } catch {
      onSpendToken?.();
      setError(t.err_generic);
    } finally {
      setBusy(false);
    }
  };

  const checkCode = async () => {
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/phone/signup-verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: number.trim(),
          country_code: countryCode,
          code: code.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.phoneToken) {
        setError(errorText(data.error));
        return;
      }
      setStage('done');
      onVerified?.(data.phoneToken);
    } catch {
      setError(t.err_generic);
    } finally {
      setBusy(false);
    }
  };

  const verified = stage === 'done';

  return (
    <div className="field">
      <label htmlFor="f-phone">
        {t.label}{' '}
        <span style={{ color: '#b3261e', fontWeight: 700 }}>*</span>
      </label>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <select
          aria-label="Country code"
          value={countryCode}
          onChange={(e) => { setCountryCode(e.target.value); editNumber(number); }}
          disabled={verified}
          style={{ flex: '0 0 auto', maxWidth: '190px' }}
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.code}>{c.label}</option>
          ))}
        </select>
        <input
          id="f-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={number}
          onChange={(e) => editNumber(e.target.value)}
          placeholder={t.placeholder}
          disabled={verified}
          style={{
            flex: '1 1 160px',
            minWidth: '140px',
            borderColor: invalid && !verified ? '#b3261e' : undefined,
          }}
        />
      </div>

      {verified ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
          marginTop: '10px', fontSize: '14px', fontWeight: 700, color: '#0a6c3d',
        }}>
          <span aria-hidden="true">✓</span>
          <span>{t.verified}</span>
          <button
            type="button"
            onClick={() => editNumber('')}
            style={{
              background: 'none', border: 'none', padding: 0,
              color: 'var(--gray-500)', fontSize: '13px', fontWeight: 500,
              textDecoration: 'underline', cursor: 'pointer',
            }}
          >
            {t.change}
          </button>
        </div>
      ) : stage === 'code' ? (
        <>
          <p style={{ fontSize: '13px', color: 'var(--gray-500)', margin: '10px 0 6px' }}>
            {t.sent.replace('{phone}', `${countryCode} ${number.trim()}`)}
          </p>
          <label htmlFor="f-phone-code" style={{ fontSize: '13px', fontWeight: 600 }}>
            {t.code_label}
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
            <input
              id="f-phone-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder={t.code_ph}
              style={{ flex: '1 1 120px', minWidth: '110px', letterSpacing: '2px' }}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={checkCode}
              disabled={busy || code.trim().length < 4}
              style={{ flex: '0 0 auto' }}
            >
              {busy ? t.checking : t.check}
            </button>
          </div>
          <button
            type="button"
            onClick={sendCode}
            disabled={busy}
            style={{
              background: 'none', border: 'none', padding: 0, marginTop: '8px',
              color: '#006a62', fontSize: '13px', fontWeight: 600,
              textDecoration: 'underline', cursor: 'pointer',
            }}
          >
            {t.resend}
          </button>
        </>
      ) : (
        <div style={{ marginTop: '10px' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={sendCode}
            disabled={busy || number.trim().length < 6}
          >
            {busy ? t.sending : t.send}
          </button>
        </div>
      )}

      {error && (
        <p style={{ fontSize: '13px', color: '#b3261e', marginTop: '8px', fontWeight: 500 }}>
          {error}
        </p>
      )}

      <p style={{ fontSize: '13px', color: 'var(--gray-400)', marginTop: '6px' }}>
        {verified ? t.why : `${t.required} · ${t.why}`}
      </p>
    </div>
  );
}

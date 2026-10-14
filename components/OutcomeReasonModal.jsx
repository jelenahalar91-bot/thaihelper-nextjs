/**
 * "Why are you switching off?" — asked the moment someone pauses or hides
 * their profile (family) or marks themselves working / hidden (helper).
 *
 * People leave for one of three reasons, and until 2026-10-14 we could not
 * tell them apart: 46 of the 50 families who had paused or hidden their
 * profile had never told us whether they found someone. The question is
 * asked AFTER the status is saved, so a person who just wants out is never
 * blocked — the modal is a courtesy, and "Skip" always works.
 *
 * Three answers:
 *   found_here   → pick who, from the conversations they already have.
 *                  Posts hired_here with the counterparty ref.
 *   found_else   → where? (agency / Facebook / friends / other) + optional
 *                  name. Posts hired_elsewhere. The agency names are the
 *                  market research for the agency directory.
 *   not_looking  → posts stopped_looking.
 *
 * Posting goes through pages/api/hiring-outcome.js with trigger
 * 'status_change'. Nothing here sends an email except the one case that
 * already did before: a HELPER naming the family she works for triggers the
 * one-per-pair review request (lib/hire-confirmation.js). The copy for that
 * answer says so, in the same words as the button under the chat.
 *
 * Self-contained translations (like AvailabilityPill / EmployerStatusPill)
 * so both dashboards render identical copy.
 */

import { useEffect, useState } from 'react';

const T = {
  en: {
    title_employer: 'Quick question before you go',
    title_helper: 'Quick question before you go',
    sub_employer: 'It helps us understand whether ThaiHelper is working for families like you.',
    sub_helper: 'It helps us understand whether ThaiHelper is working for helpers like you.',
    found_here_employer: 'I found someone on ThaiHelper',
    found_here_helper: 'I found a job through ThaiHelper',
    found_else_employer: 'I found someone somewhere else',
    found_else_helper: 'I found a job somewhere else',
    not_looking_employer: 'I’m not looking right now',
    not_looking_helper: 'I’m taking a break from looking',
    who_employer: 'Who did you hire?',
    who_helper: 'Which family do you work for?',
    who_hint_helper: 'Only if you have started. We will email them once and ask them to review you.',
    no_convs_employer: 'We can’t see a conversation with them here — that’s fine, just tell us it worked out.',
    no_convs_helper: 'We can’t see a conversation with them here — that’s fine, just tell us it worked out.',
    someone_not_listed: 'Someone not listed here',
    where: 'Where did you find them?',
    where_helper: 'Where did you find it?',
    src_agency: 'Through an agency',
    src_facebook: 'Facebook group',
    src_friends: 'Friends or word of mouth',
    src_other: 'Somewhere else',
    agency_name: 'Which agency? (optional)',
    agency_name_ph: 'Agency name',
    submit: 'Done',
    back: 'Back',
    skip: 'Skip',
    thanks: 'Thank you — that helps.',
    error: 'Could not save that. You can skip for now.',
  },
  th: {
    title_employer: 'ขอถามสั้น ๆ ก่อนออกไป',
    title_helper: 'ขอถามสั้น ๆ ก่อนออกไป',
    sub_employer: 'ช่วยให้เรารู้ว่า ThaiHelper ช่วยครอบครัวแบบคุณได้จริงหรือไม่',
    sub_helper: 'ช่วยให้เรารู้ว่า ThaiHelper ช่วยผู้ช่วยแบบคุณได้จริงหรือไม่',
    found_here_employer: 'ฉันหาคนได้แล้วบน ThaiHelper',
    found_here_helper: 'ฉันได้งานผ่าน ThaiHelper',
    found_else_employer: 'ฉันหาคนได้จากที่อื่น',
    found_else_helper: 'ฉันได้งานจากที่อื่น',
    not_looking_employer: 'ตอนนี้ยังไม่หา',
    not_looking_helper: 'พักการหางานไว้ก่อน',
    who_employer: 'คุณจ้างใคร?',
    who_helper: 'คุณทำงานให้ครอบครัวไหน?',
    who_hint_helper: 'กดเมื่อเริ่มทำงานแล้วเท่านั้น เราจะส่งอีเมลหาเขาหนึ่งครั้งเพื่อขอให้รีวิวคุณ',
    no_convs_employer: 'เราไม่เห็นการสนทนากับเขาที่นี่ — ไม่เป็นไร แค่บอกเราว่าสำเร็จแล้ว',
    no_convs_helper: 'เราไม่เห็นการสนทนากับเขาที่นี่ — ไม่เป็นไร แค่บอกเราว่าสำเร็จแล้ว',
    someone_not_listed: 'คนอื่นที่ไม่อยู่ในรายการนี้',
    where: 'คุณหาเขาได้จากที่ไหน?',
    where_helper: 'คุณได้งานจากที่ไหน?',
    src_agency: 'ผ่านเอเจนซี่',
    src_facebook: 'กลุ่ม Facebook',
    src_friends: 'เพื่อนหรือคนรู้จักแนะนำ',
    src_other: 'ที่อื่น',
    agency_name: 'เอเจนซี่ไหน? (ไม่บังคับ)',
    agency_name_ph: 'ชื่อเอเจนซี่',
    submit: 'เสร็จสิ้น',
    back: 'ย้อนกลับ',
    skip: 'ข้าม',
    thanks: 'ขอบคุณค่ะ — ช่วยได้มาก',
    error: 'บันทึกไม่สำเร็จ ข้ามไปก่อนได้',
  },
};

const SOURCES = ['agency', 'facebook', 'friends', 'other'];

/**
 * Turn a dashboard's conversation list into picker entries, one per
 * counterparty. Both dashboards get `counterparty: { ref, firstName,
 * lastName }` from /api/conversations; a thread without a resolvable
 * counterparty (deleted account) is skipped.
 */
export function counterpartiesForOutcome(conversations = []) {
  const seen = new Set();
  const out = [];
  for (const c of conversations) {
    const cp = c?.counterparty;
    if (!cp?.ref || seen.has(cp.ref)) continue;
    seen.add(cp.ref);
    out.push({ ref: cp.ref, name: [cp.firstName, cp.lastName].filter(Boolean).join(' ') || cp.ref });
  }
  return out;
}

/**
 * @param {'employer'|'helper'} role      who is answering
 * @param {Array} counterparties          [{ ref, name }] from their conversations
 * @param {() => void} onClose            called after submit or skip
 */
export default function OutcomeReasonModal({ role, counterparties = [], lang = 'en', onClose }) {
  const t = T[lang === 'th' ? 'th' : 'en'];
  const [step, setStep] = useState('choice'); // choice | who | where | done
  const [pickedRef, setPickedRef] = useState(null);
  const [source, setSource] = useState(null);
  const [detail, setDetail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Escape closes, like every other modal on the dashboards.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function post(payload) {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/hiring-outcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, trigger: 'status_change', ...payload }),
      });
      if (!res.ok) throw new Error('save failed');
      setStep('done');
      setTimeout(onClose, 1400);
    } catch {
      setError(t.error);
    } finally {
      setSaving(false);
    }
  }

  const sk = (key) => t[`${key}_${role}`] || t[key];

  const btn = (extra = {}) => ({
    display: 'block', width: '100%', textAlign: 'left',
    padding: '13px 16px', borderRadius: '12px',
    border: '2px solid #E2ECF0', background: 'white',
    color: '#1B3A4B', fontWeight: 600, fontSize: '14px',
    cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1.3,
    ...extra,
  });
  const primary = {
    padding: '11px 18px', borderRadius: '10px', border: 'none',
    background: '#006a62', color: 'white', fontWeight: 700,
    fontSize: '14px', cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit',
    opacity: saving ? 0.7 : 1,
  };
  const ghost = {
    padding: '11px 14px', borderRadius: '10px', border: 'none',
    background: 'transparent', color: '#6B8999', fontWeight: 600,
    fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="outcome-reason-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 950,
        background: 'rgba(27,58,75,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div style={{
        width: '100%', maxWidth: '440px', background: 'white',
        borderRadius: '18px', padding: '22px 22px 18px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        fontFamily: 'inherit',
      }}>
        {step === 'done' ? (
          <div style={{ textAlign: 'center', padding: '12px 0', fontSize: '15px', fontWeight: 700, color: '#006a62' }}>
            ✅ {t.thanks}
          </div>
        ) : (
          <>
            <h2 id="outcome-reason-title" style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: '#1B3A4B' }}>
              {sk('title')}
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6B8999', lineHeight: 1.5 }}>
              {sk('sub')}
            </p>

            {step === 'choice' && (
              <div style={{ display: 'grid', gap: '8px' }}>
                <button type="button" style={btn()} onClick={() => setStep('who')}>
                  🎉 {sk('found_here')}
                </button>
                <button type="button" style={btn()} onClick={() => setStep('where')}>
                  {sk('found_else')}
                </button>
                <button
                  type="button"
                  style={btn()}
                  disabled={saving}
                  onClick={() => post({ outcome: 'stopped_looking' })}
                >
                  {sk('not_looking')}
                </button>
              </div>
            )}

            {step === 'who' && (
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1B3A4B', marginBottom: '8px' }}>
                  {sk('who')}
                </div>
                {role === 'helper' && (
                  <p style={{ margin: '0 0 10px', fontSize: '12.5px', color: '#A6612A', lineHeight: 1.5 }}>
                    {t.who_hint_helper}
                  </p>
                )}
                {counterparties.length === 0 && (
                  <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#6B8999', lineHeight: 1.5 }}>
                    {sk('no_convs')}
                  </p>
                )}
                <div style={{ display: 'grid', gap: '6px', maxHeight: '240px', overflowY: 'auto', marginBottom: '12px' }}>
                  {counterparties.map((c) => {
                    const active = pickedRef === c.ref;
                    return (
                      <button
                        key={c.ref}
                        type="button"
                        onClick={() => setPickedRef(c.ref)}
                        style={btn({
                          padding: '10px 14px',
                          border: `2px solid ${active ? '#006a62' : '#E2ECF0'}`,
                          background: active ? 'rgba(0,106,98,0.08)' : 'white',
                        })}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setPickedRef('__none__')}
                    style={btn({
                      padding: '10px 14px', fontWeight: 500, color: '#6B8999',
                      border: `2px solid ${pickedRef === '__none__' ? '#006a62' : '#E2ECF0'}`,
                      background: pickedRef === '__none__' ? 'rgba(0,106,98,0.08)' : 'white',
                    })}
                  >
                    {t.someone_not_listed}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button type="button" style={ghost} onClick={() => { setPickedRef(null); setStep('choice'); }}>{t.back}</button>
                  <button
                    type="button"
                    style={{ ...primary, opacity: !pickedRef || saving ? 0.5 : 1 }}
                    disabled={!pickedRef || saving}
                    onClick={() => post(
                      // "Found someone here, but not one of these" — a hire we
                      // cannot pin to a pair. Still hired_here, just without a
                      // counterparty (and therefore no hire_confirmations row).
                      pickedRef === '__none__'
                        ? { outcome: 'hired_here' }
                        : { outcome: 'hired_here', counterpartyRef: pickedRef }
                    )}
                  >
                    {t.submit}
                  </button>
                </div>
              </div>
            )}

            {step === 'where' && (
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1B3A4B', marginBottom: '8px' }}>
                  {role === 'helper' ? t.where_helper : t.where}
                </div>
                <div style={{ display: 'grid', gap: '6px', marginBottom: '12px' }}>
                  {SOURCES.map((s) => {
                    const active = source === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSource(s)}
                        style={btn({
                          padding: '10px 14px',
                          border: `2px solid ${active ? '#006a62' : '#E2ECF0'}`,
                          background: active ? 'rgba(0,106,98,0.08)' : 'white',
                        })}
                      >
                        {t[`src_${s}`]}
                      </button>
                    );
                  })}
                </div>
                {source === 'agency' && (
                  <label style={{ display: 'block', marginBottom: '12px' }}>
                    <span style={{ display: 'block', fontSize: '12.5px', color: '#6B8999', marginBottom: '4px' }}>{t.agency_name}</span>
                    <input
                      type="text"
                      value={detail}
                      maxLength={120}
                      onChange={(e) => setDetail(e.target.value)}
                      placeholder={t.agency_name_ph}
                      style={{
                        width: '100%', boxSizing: 'border-box', padding: '10px 12px',
                        borderRadius: '10px', border: '1px solid #D8E3E8',
                        fontSize: '14px', fontFamily: 'inherit',
                      }}
                    />
                  </label>
                )}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button type="button" style={ghost} onClick={() => { setSource(null); setStep('choice'); }}>{t.back}</button>
                  <button
                    type="button"
                    style={{ ...primary, opacity: !source || saving ? 0.5 : 1 }}
                    disabled={!source || saving}
                    onClick={() => post({
                      outcome: 'hired_elsewhere',
                      source,
                      sourceDetail: source === 'agency' && detail.trim() ? detail.trim() : null,
                    })}
                  >
                    {t.submit}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div style={{ marginTop: '10px', fontSize: '13px', color: '#b91c1c' }}>{error}</div>
            )}

            <div style={{ marginTop: '14px', textAlign: 'center' }}>
              <button type="button" onClick={onClose} style={{ ...ghost, fontSize: '13px', textDecoration: 'underline' }}>
                {t.skip}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

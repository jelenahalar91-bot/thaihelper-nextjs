/**
 * The 1-5 star + comment form a family fills in about a helper.
 *
 * Lived inside HelperProfileModal until 2026-09-16, which is exactly why
 * nobody found it: rating meant opening a conversation, opening the profile,
 * and scrolling past certificates and references to the bottom. It is now
 * shared, and the conversation itself (ConversationDetail) shows it in place
 * the moment a family becomes eligible.
 *
 * Posts to /api/ratings, which re-checks eligibility server-side — this
 * component being rendered is never the authorisation.
 */

import { useState } from 'react';
import { StarRatingInput } from './StarRating';

// A low review is confirmed before it is sent; 3 stars and up go straight
// through.
//
// 2026-10-20: EMP-NDSUPV gave a helper 1 star with no comment, and it was her
// only review — so for fifteen hours her entire public score was ★1.0. Asked
// about it, he said he had hit the wrong star on his phone and had not
// noticed. The star row sits directly above the comment box, which is where
// the keyboard is, and the leftmost star is the easiest one to hit by
// accident. Nothing between that tap and a public verdict read the number
// back to him.
//
// The threshold is 2 and not 5 on purpose: a mis-tapped 5 is a review that
// is slightly too kind, a mis-tapped 1 is the whole reputation of someone
// who is trying to get hired. Families already need three messages each way
// and a day's wait to reach this form at all (lib/rating-eligibility.js) —
// adding a tap to every happy review would cost more reviews than it saves.
// Same number as the admin alert in pages/api/ratings.js, for the same
// reason.
const CONFIRM_AT_OR_BELOW = 2;

export default function RateForm({ helperRef, helperName, existingRating, onSubmitted, lang }) {
  const [stars, setStars] = useState(existingRating?.stars || 0);
  const [comment, setComment] = useState(existingRating?.comment || '');
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const MAX = 400;

  const who = helperName || (lang === 'th' ? 'ผู้ช่วยคนนี้' : 'this helper');

  const labels = lang === 'th' ? {
    title: existingRating ? 'แก้ไขรีวิวของคุณ' : 'ให้คะแนนผู้ช่วยคนนี้',
    placeholder: 'แชร์ประสบการณ์ของคุณ (ไม่บังคับ)',
    submit: existingRating ? 'อัปเดต' : 'ส่ง',
    remove: 'ลบรีวิวของฉัน',
    pickStars: 'กรุณาเลือกจำนวนดาว',
    saved: 'บันทึกแล้ว',
    failed: 'บันทึกไม่สำเร็จ',
    confirmTitle: `ให้ ${who} ${stars} ดาว?`,
    confirmBody: 'คะแนนนี้จะแสดงบนโปรไฟล์สาธารณะของเธอ และเราจะส่งอีเมลแจ้งเธอด้วย',
    confirmYes: 'ใช่ ส่งเลย',
    confirmBack: 'ย้อนกลับ',
  } : {
    title: existingRating ? 'Update your review' : 'Rate this helper',
    placeholder: 'Share your experience (optional)',
    submit: existingRating ? 'Update' : 'Submit',
    remove: 'Remove my review',
    pickStars: 'Please pick a star rating',
    saved: 'Saved',
    failed: 'Could not save',
    confirmTitle: `Give ${who} ${stars} star${stars === 1 ? '' : 's'}?`,
    confirmBody: 'This shows on her public profile, and we email it to her.',
    confirmYes: 'Yes, submit',
    confirmBack: 'Go back',
  };

  // Changing the stars while the question is up answers it: they are looking
  // at the number, which is the whole point of asking.
  function pickStars(n) {
    setStars(n);
    setConfirming(false);
    setError('');
  }

  function onSubmitClick() {
    if (!stars) { setError(labels.pickStars); return; }
    if (stars <= CONFIRM_AT_OR_BELOW && !confirming) {
      setConfirming(true);
      setError('');
      return;
    }
    submit();
  }

  async function submit() {
    if (!stars) { setError(labels.pickStars); return; }
    setConfirming(false);
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helperRef,
          stars,
          comment: comment.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || labels.failed);
      } else if (onSubmitted) {
        await onSubmitted();
      }
    } catch (err) {
      setError(labels.failed);
    }
    setSubmitting(false);
  }

  async function remove() {
    if (!existingRating) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/ratings?helper=${encodeURIComponent(helperRef)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || labels.failed);
      } else {
        setStars(0);
        setComment('');
        if (onSubmitted) await onSubmitted();
      }
    } catch (err) {
      setError(labels.failed);
    }
    setSubmitting(false);
  }

  return (
    <div style={{
      marginTop: '16px', padding: '14px 16px',
      background: '#f9fafb', borderRadius: '12px',
      border: '1px solid #e5e7eb',
    }}>
      <div style={{
        fontSize: '13px', fontWeight: 700, color: '#1a1a1a',
        marginBottom: '10px',
      }}>
        {labels.title}
      </div>
      <div style={{ marginBottom: '10px' }}>
        <StarRatingInput value={stars} onChange={pickStars} size="lg" disabled={submitting} />
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, MAX))}
        placeholder={labels.placeholder}
        rows={3}
        disabled={submitting}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '10px',
          border: '1px solid #e5e7eb',
          fontSize: '14px',
          fontFamily: 'inherit',
          resize: 'vertical',
          minHeight: '70px',
          boxSizing: 'border-box',
        }}
      />
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: '6px', fontSize: '11px', color: '#9ca3af',
      }}>
        <span>{comment.length}/{MAX}</span>
        {error && <span style={{ color: '#dc2626', fontWeight: 600 }}>{error}</span>}
      </div>
      {confirming && (
        <div style={{
          marginTop: '12px', padding: '12px 14px',
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: '10px',
        }}>
          <div style={{
            fontSize: '13px', fontWeight: 700, color: '#991b1b', marginBottom: '4px',
          }}>
            {labels.confirmTitle}
          </div>
          <p style={{ fontSize: '12px', color: '#7f1d1d', margin: 0, lineHeight: 1.5 }}>
            {labels.confirmBody}
          </p>
        </div>
      )}
      <div style={{
        display: 'flex', gap: '8px', marginTop: '12px',
        alignItems: 'center', flexWrap: 'wrap',
      }}>
        {confirming && (
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={submitting}
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              background: 'white',
              color: '#1B3A4B',
              fontSize: '13px',
              fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {labels.confirmBack}
          </button>
        )}
        <button
          type="button"
          onClick={onSubmitClick}
          disabled={submitting || !stars}
          style={{
            padding: '9px 18px',
            borderRadius: '10px',
            border: 'none',
            background: confirming ? '#b91c1c' : '#006a62',
            color: 'white',
            fontSize: '13px',
            fontWeight: 700,
            cursor: submitting || !stars ? 'not-allowed' : 'pointer',
            opacity: submitting || !stars ? 0.6 : 1,
          }}
        >
          {submitting ? '...' : (confirming ? labels.confirmYes : labels.submit)}
        </button>
        {existingRating && !confirming && (
          <button
            type="button"
            onClick={remove}
            disabled={submitting}
            style={{
              padding: '9px 14px',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              background: 'white',
              color: '#dc2626',
              fontSize: '12px',
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {labels.remove}
          </button>
        )}
      </div>
    </div>
  );
}

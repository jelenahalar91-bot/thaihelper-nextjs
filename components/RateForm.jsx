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

export default function RateForm({ helperRef, existingRating, onSubmitted, lang }) {
  const [stars, setStars] = useState(existingRating?.stars || 0);
  const [comment, setComment] = useState(existingRating?.comment || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const MAX = 400;

  const labels = lang === 'th' ? {
    title: existingRating ? 'แก้ไขรีวิวของคุณ' : 'ให้คะแนนผู้ช่วยคนนี้',
    placeholder: 'แชร์ประสบการณ์ของคุณ (ไม่บังคับ)',
    submit: existingRating ? 'อัปเดต' : 'ส่ง',
    remove: 'ลบรีวิวของฉัน',
    pickStars: 'กรุณาเลือกจำนวนดาว',
    saved: 'บันทึกแล้ว',
    failed: 'บันทึกไม่สำเร็จ',
  } : {
    title: existingRating ? 'Update your review' : 'Rate this helper',
    placeholder: 'Share your experience (optional)',
    submit: existingRating ? 'Update' : 'Submit',
    remove: 'Remove my review',
    pickStars: 'Please pick a star rating',
    saved: 'Saved',
    failed: 'Could not save',
  };

  async function submit() {
    if (!stars) { setError(labels.pickStars); return; }
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
        <StarRatingInput value={stars} onChange={setStars} size="lg" disabled={submitting} />
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
      <div style={{
        display: 'flex', gap: '8px', marginTop: '12px',
        alignItems: 'center', flexWrap: 'wrap',
      }}>
        <button
          type="button"
          onClick={submit}
          disabled={submitting || !stars}
          style={{
            padding: '9px 18px',
            borderRadius: '10px',
            border: 'none',
            background: '#006a62',
            color: 'white',
            fontSize: '13px',
            fontWeight: 700,
            cursor: submitting || !stars ? 'not-allowed' : 'pointer',
            opacity: submitting || !stars ? 0.6 : 1,
          }}
        >
          {submitting ? '...' : labels.submit}
        </button>
        {existingRating && (
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

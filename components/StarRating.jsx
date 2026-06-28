import { useState, useId } from 'react';

// Shared star-rating primitives.
//
//  <StarRatingDisplay>  — read-only: shows N filled stars + average + count.
//                         Three sizes (sm / md / lg) for cards, modal header,
//                         and full-review section. Renders nothing if a
//                         helper has no ratings yet UNLESS `showEmpty` is set.
//
//  <StarRatingInput>    — interactive: 5 clickable stars + hover preview.
//                         Used in the rating form inside HelperProfileModal.
//
// SVG stars rather than Unicode ★ so they look identical across OSes
// and we can do partial fills (4.7 → 4 full + 1 70%-filled) cleanly.

function StarIcon({ filled = 1, size = 16, color = '#F4A261' }) {
  // `filled` is 0..1 — 0 = empty outline, 1 = solid, anything in between
  // gets a clipPath so we can render half/partial stars for averages.
  // useId() gives a stable, SSR-safe unique id (Math.random would differ
  // between server and client and trip a hydration mismatch). Strip the
  // colons React adds so the id is safe inside url(#…).
  const id = `star-clip-${useId().replace(/:/g, '')}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <defs>
        <clipPath id={id}>
          <rect x="0" y="0" width={24 * filled} height="24" />
        </clipPath>
      </defs>
      {/* outline base */}
      <path
        d="M12 2.5l2.94 6.36 6.96.62-5.26 4.72 1.6 6.84L12 17.77l-6.24 3.27 1.6-6.84L2.1 9.48l6.96-.62L12 2.5z"
        fill="none"
        stroke="#d4a574"
        strokeWidth="1.2"
      />
      {/* filled portion clipped */}
      {filled > 0 && (
        <path
          d="M12 2.5l2.94 6.36 6.96.62-5.26 4.72 1.6 6.84L12 17.77l-6.24 3.27 1.6-6.84L2.1 9.48l6.96-.62L12 2.5z"
          fill={color}
          clipPath={`url(#${id})`}
        />
      )}
    </svg>
  );
}

const SIZE_PX = { sm: 14, md: 18, lg: 22 };

/**
 * Read-only rating badge.
 * Props:
 *   avg       — number 1-5 (or null/undefined for "no ratings")
 *   count     — integer number of reviews
 *   size      — 'sm' | 'md' | 'lg' (default 'sm')
 *   showEmpty — if true, render "(no reviews yet)" instead of null
 */
export function StarRatingDisplay({ avg, count = 0, size = 'sm', showEmpty = false, lang = 'en', dark = false }) {
  const px = SIZE_PX[size] || SIZE_PX.sm;
  // `dark` flips text colors to white-on-dark for use over the teal
  // header. Star fill colour stays gold either way for consistency.
  const textColor = dark ? '#ffffff' : '#374151';
  const dimColor  = dark ? 'rgba(255,255,255,0.75)' : '#9ca3af';

  if (!count || avg == null) {
    if (!showEmpty) return null;
    const emptyLabel = lang === 'th' ? 'ยังไม่มีรีวิว' : 'No reviews yet';
    return (
      <span style={{ fontSize: `${px - 4}px`, color: dimColor }}>
        {emptyLabel}
      </span>
    );
  }

  // Build 5 stars with appropriate fill levels for the average.
  const stars = [0, 1, 2, 3, 4].map(i => {
    const fillAmount = Math.max(0, Math.min(1, avg - i));
    return <StarIcon key={i} filled={fillAmount} size={px} />;
  });

  const fontSize = `${Math.round(px * 0.78)}px`;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      fontSize, color: textColor, fontWeight: 600,
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '1px' }}>
        {stars}
      </span>
      <span>{avg.toFixed(1)}</span>
      <span style={{ color: dimColor, fontWeight: 500 }}>({count})</span>
    </span>
  );
}

/**
 * Interactive 5-star input.
 * Props:
 *   value      — currently selected stars (0-5; 0 = none selected)
 *   onChange   — callback(stars: 1-5)
 *   size       — 'sm' | 'md' | 'lg' (default 'lg')
 *   disabled
 */
export function StarRatingInput({ value = 0, onChange, size = 'lg', disabled = false }) {
  const px = SIZE_PX[size] || SIZE_PX.lg;
  // Track hovered star so the user gets immediate visual feedback as
  // they slide across — without this it feels like clicking blind.
  const [hover, setHover] = useState(0);

  return (
    <div
      role="radiogroup"
      aria-label="Star rating"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}
    >
      {[1, 2, 3, 4, 5].map(i => {
        const shown = hover || value;
        const filled = i <= shown ? 1 : 0;
        return (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => onChange && onChange(i)}
            onMouseEnter={() => !disabled && setHover(i)}
            onMouseLeave={() => !disabled && setHover(0)}
            aria-checked={value === i}
            role="radio"
            aria-label={`${i} star${i > 1 ? 's' : ''}`}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '4px',
              cursor: disabled ? 'default' : 'pointer',
              lineHeight: 0,
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <StarIcon filled={filled} size={px} />
          </button>
        );
      })}
    </div>
  );
}

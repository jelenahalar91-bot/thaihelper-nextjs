/**
 * Soft-pill badge that shows whether a helper is currently:
 *   - 'available'       — actively looking for work (teal)
 *   - 'open_to_offers'  — has a job but interested in offers (gold)
 *   - 'working'         — has a job, doesn't want to be contacted (navy)
 *
 * Used on helper cards, the "Recently joined" panel, and the helper's
 * own profile dashboard. Defaults to 'available' when status is missing
 * or unrecognised so existing rows pre-migration still render.
 */

const LABELS = {
  available:      { en: 'Available',      th: 'พร้อมรับงาน' },
  open_to_offers: { en: 'Open to offers', th: 'เปิดรับข้อเสนอ' },
  working:        { en: 'Working',        th: 'มีงานแล้ว' },
};

// Soft pill styles using brand colour tokens with low-alpha backgrounds.
// Order: bg + text + (optional) border.
const STYLES = {
  available:      'bg-primary/10 text-primary',
  open_to_offers: 'bg-gold/15 text-[#A6612A]',
  working:        'bg-on-background/10 text-on-background/75',
};

export default function AvailabilityPill({ status, lang = 'en', size = 'md', className = '' }) {
  const key = LABELS[status] ? status : 'available';
  const label = LABELS[key][lang === 'th' ? 'th' : 'en'];
  const colour = STYLES[key];
  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-[10px]'
    : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${sizeClasses} ${colour} ${className}`}>
      {label}
    </span>
  );
}

export const AVAILABILITY_VALUES = Object.keys(LABELS);
export const AVAILABILITY_LABELS = LABELS;

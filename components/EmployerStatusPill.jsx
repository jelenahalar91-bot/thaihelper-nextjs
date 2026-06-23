/**
 * Soft-pill badge showing an employer's current hiring status:
 *   - 'searching' — actively hiring (teal)
 *   - 'paused'    — not hiring right now, still listed (gold)
 *   - 'hidden'    — offline, not shown to helpers at all (navy)
 *
 * Mirrors AvailabilityPill on the helper side. Defaults to 'searching'
 * when the status is missing or unrecognised so pre-migration rows
 * (search_status = NULL) still render as actively hiring.
 *
 * Note: a 'hidden' employer is filtered out of the public list before it
 * ever reaches a helper, so the 'hidden' style here is only ever seen by
 * the employer themselves on their own dashboard.
 */

const LABELS = {
  searching: { en: 'Actively hiring',   th: 'กำลังหาผู้ช่วย' },
  paused:    { en: 'Not hiring now',    th: 'ตอนนี้ยังไม่หา' },
  hidden:    { en: 'Hidden',            th: 'ซ่อนอยู่' },
};

const STYLES = {
  searching: 'bg-primary/10 text-primary',
  paused:    'bg-gold/15 text-[#A6612A]',
  hidden:    'bg-on-background/10 text-on-background/75',
};

export default function EmployerStatusPill({ status, lang = 'en', size = 'md', className = '' }) {
  const key = LABELS[status] ? status : 'searching';
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

export const SEARCH_STATUS_VALUES = Object.keys(LABELS);
export const SEARCH_STATUS_LABELS = LABELS;

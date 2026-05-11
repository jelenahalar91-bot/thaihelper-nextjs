// Shared display utilities for the "Recently joined" / "Available helpers"
// panels on the homepage and employers page. Both consume the same
// /api/recent-helpers endpoint and render the same data with slightly
// different framing.

// Compact role labels — the panel needs short text, not the full
// "Nanny & Babysitter" / "Private Chef & Cook" form.
export const ROLE_LABELS = {
  nanny:       { en: 'Nanny',         th: 'พี่เลี้ยงเด็ก' },
  housekeeper: { en: 'Housekeeper',   th: 'แม่บ้าน' },
  chef:        { en: 'Private Chef',  th: 'พ่อครัวส่วนตัว' },
  driver:      { en: 'Driver',        th: 'คนขับรถ' },
  gardener:    { en: 'Gardener',      th: 'คนสวน' },
  elder_care:  { en: 'Elder Care',    th: 'ผู้ดูแลผู้สูงอายุ' },
  tutor:       { en: 'Tutor',         th: 'ติวเตอร์' },
  multiple:    { en: 'Multiple',      th: 'หลายบริการ' },
};

export const CITY_LABELS = {
  bangkok: 'Bangkok', chiang_mai: 'Chiang Mai', phuket: 'Phuket',
  pattaya: 'Pattaya', hua_hin: 'Hua Hin', krabi: 'Krabi',
  ao_nang: 'Ao Nang', koh_samui: 'Koh Samui', koh_phangan: 'Koh Phangan',
  koh_tao: 'Koh Tao', koh_lanta: 'Koh Lanta', koh_chang: 'Koh Chang',
  chonburi: 'Chonburi', rayong: 'Rayong', nonthaburi: 'Nonthaburi',
  samut_prakan: 'Samut Prakan', chiang_rai: 'Chiang Rai', pai: 'Pai',
  khon_kaen: 'Khon Kaen', udon_thani: 'Udon Thani',
};

export function roleLabel(category, lang) {
  if (!category) return '';
  // Helpers can register with multiple categories stored as a comma-
  // separated string ("elder_care, chef"). Split, translate each part
  // individually, and join back together so we never render a raw slug.
  return String(category)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((part) => {
      const cat = ROLE_LABELS[part];
      if (cat) return cat[lang === 'th' ? 'th' : 'en'];
      // Unknown slug — replace underscores with spaces and title-case
      // so "elder_care" → "Elder Care" instead of leaking the raw slug.
      return part.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    })
    .join(', ');
}

export function cityLabel(slug) {
  if (!slug) return '';
  if (CITY_LABELS[slug]) return CITY_LABELS[slug];
  return String(slug).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function relativeTime(iso, lang) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (lang === 'th') {
    if (min < 1) return 'เมื่อสักครู่';
    if (min < 60) return `${min} นาทีที่แล้ว`;
    if (hr < 24) return `${hr} ชม. ที่แล้ว`;
    if (day === 1) return 'เมื่อวาน';
    if (day < 7) return `${day} วันที่แล้ว`;
    if (day < 30) return `${Math.floor(day / 7)} สัปดาห์ที่แล้ว`;
    return `${Math.floor(day / 30)} เดือนที่แล้ว`;
  }
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day === 1) return 'Yesterday';
  if (day < 7) return `${day}d ago`;
  if (day < 30) return `${Math.floor(day / 7)}w ago`;
  return `${Math.floor(day / 30)}mo ago`;
}

export function entryInitials(firstName, lastInitial) {
  const f = (firstName || '?').charAt(0).toUpperCase();
  const l = (lastInitial || '').replace(/[^A-Za-z]/g, '').charAt(0).toUpperCase();
  return (f + l) || '?';
}

// Initial render fallback used while the live API request is in flight,
// or if it fails. timeLabel avoids hydration mismatch from Date.now()
// so SSR markup matches the first client render. 8 entries — helpers
// homepage takes the first 4, employers page takes all 8.
export const FALLBACK_HELPERS = [
  { firstName: 'Som',     lastInitial: 'M.', category: 'nanny',       city: 'bangkok',    photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&h=120&fit=crop&crop=face',  availabilityStatus: 'available',      timeLabel: { en: '2h ago',    th: '2 ชม. ที่แล้ว' } },
  { firstName: 'Ploy',    lastInitial: 'T.', category: 'chef',        city: 'phuket',     photo: null,                                                                                            availabilityStatus: 'available',      timeLabel: { en: '5h ago',    th: '5 ชม. ที่แล้ว' } },
  { firstName: 'Nok',     lastInitial: 'K.', category: 'housekeeper', city: 'chiang_mai', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face',  availabilityStatus: 'open_to_offers', timeLabel: { en: 'Yesterday', th: 'เมื่อวาน' } },
  { firstName: 'Apinya',  lastInitial: 'C.', category: 'elder_care',  city: 'hua_hin',    photo: null,                                                                                            availabilityStatus: 'available',      timeLabel: { en: '2d ago',    th: '2 วันที่แล้ว' } },
  { firstName: 'Niran',   lastInitial: 'P.', category: 'driver',      city: 'bangkok',    photo: null,                                                                                            availabilityStatus: 'working',        timeLabel: { en: '3d ago',    th: '3 วันที่แล้ว' } },
  { firstName: 'Malai',   lastInitial: 'S.', category: 'tutor',       city: 'chiang_mai', photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=face',  availabilityStatus: 'available',      timeLabel: { en: '4d ago',    th: '4 วันที่แล้ว' } },
  { firstName: 'Wassana', lastInitial: 'K.', category: 'housekeeper', city: 'pattaya',    photo: null,                                                                                            availabilityStatus: 'open_to_offers', timeLabel: { en: '5d ago',    th: '5 วันที่แล้ว' } },
  { firstName: 'Kanya',   lastInitial: 'R.', category: 'nanny',       city: 'koh_samui',  photo: null,                                                                                            availabilityStatus: 'available',      timeLabel: { en: '1w ago',    th: '1 สัปดาห์ที่แล้ว' } },
];

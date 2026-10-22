/**
 * Dialling codes offered in phone-verification inputs.
 *
 * Extracted from components/PhoneVerificationCard.jsx when the signup flow
 * grew its own verification step: two copies of this list would drift, and the
 * one a family sees while registering must match the one they see later on the
 * dashboard — otherwise a number they verified is a number they cannot re-enter.
 *
 * This select is the ONLY gate on the country code — no API route checks it
 * against a list — so a country missing here is a country that cannot
 * register at all. Since 2026-10-02 the number is collected before the account
 * exists, which means the whole signup dead-ends with nothing stored. Michael
 * Lang reported exactly that from Switzerland on 2026-10-19: +41 was not in
 * the 22 entries this file used to hold, and neither were Austria, Belgium,
 * Ireland, Portugal, Poland, India, the UAE or anywhere else a family in
 * Thailand might plausibly be from. He wrote in; nobody else did.
 *
 * So the list is no longer curated. It covers every country we could
 * reasonably be asked for, the five helpers actually come from stay pinned at
 * the top so a Thai helper does not scroll, and the rest are alphabetical.
 *
 * Flags are derived from the ISO code rather than typed, because a hand-typed
 * regional-indicator pair is a silent wrong-flag bug nobody reviews.
 *
 * Dial codes must stay unique: both components key their <option> on `code`.
 * Where a code is shared (+1, +7) the entry names both countries.
 *
 * Adding a code here is enough on its own. normalisePhone() in lib/phone-otp.js
 * applies the E.164 trunk-zero rule to every country, not to a list.
 */

// [ISO 3166-1 alpha-2, dialling code, display name]
const PINNED = [
  ['TH', '+66', 'Thailand'],
  ['MM', '+95', 'Myanmar'],
  ['PH', '+63', 'Philippines'],
  ['LA', '+856', 'Laos'],
  ['KH', '+855', 'Cambodia'],
];

const REST = [
  ['AF', '+93', 'Afghanistan'],
  ['AL', '+355', 'Albania'],
  ['DZ', '+213', 'Algeria'],
  ['AD', '+376', 'Andorra'],
  ['AO', '+244', 'Angola'],
  ['AR', '+54', 'Argentina'],
  ['AM', '+374', 'Armenia'],
  ['AU', '+61', 'Australia'],
  ['AT', '+43', 'Austria'],
  ['AZ', '+994', 'Azerbaijan'],
  ['BH', '+973', 'Bahrain'],
  ['BD', '+880', 'Bangladesh'],
  ['BY', '+375', 'Belarus'],
  ['BE', '+32', 'Belgium'],
  ['BT', '+975', 'Bhutan'],
  ['BO', '+591', 'Bolivia'],
  ['BA', '+387', 'Bosnia and Herzegovina'],
  ['BW', '+267', 'Botswana'],
  ['BR', '+55', 'Brazil'],
  ['BN', '+673', 'Brunei'],
  ['BG', '+359', 'Bulgaria'],
  ['CM', '+237', 'Cameroon'],
  ['CL', '+56', 'Chile'],
  ['CN', '+86', 'China'],
  ['CO', '+57', 'Colombia'],
  ['CR', '+506', 'Costa Rica'],
  ['HR', '+385', 'Croatia'],
  ['CY', '+357', 'Cyprus'],
  ['CZ', '+420', 'Czechia'],
  ['DK', '+45', 'Denmark'],
  ['EC', '+593', 'Ecuador'],
  ['EG', '+20', 'Egypt'],
  ['EE', '+372', 'Estonia'],
  ['ET', '+251', 'Ethiopia'],
  ['FJ', '+679', 'Fiji'],
  ['FI', '+358', 'Finland'],
  ['FR', '+33', 'France'],
  ['GE', '+995', 'Georgia'],
  ['DE', '+49', 'Germany'],
  ['GH', '+233', 'Ghana'],
  ['GR', '+30', 'Greece'],
  ['GT', '+502', 'Guatemala'],
  ['HK', '+852', 'Hong Kong'],
  ['HU', '+36', 'Hungary'],
  ['IS', '+354', 'Iceland'],
  ['IN', '+91', 'India'],
  ['ID', '+62', 'Indonesia'],
  ['IR', '+98', 'Iran'],
  ['IQ', '+964', 'Iraq'],
  ['IE', '+353', 'Ireland'],
  ['IL', '+972', 'Israel'],
  ['IT', '+39', 'Italy'],
  ['JP', '+81', 'Japan'],
  ['JO', '+962', 'Jordan'],
  ['KE', '+254', 'Kenya'],
  ['KW', '+965', 'Kuwait'],
  ['KG', '+996', 'Kyrgyzstan'],
  ['LV', '+371', 'Latvia'],
  ['LB', '+961', 'Lebanon'],
  ['LY', '+218', 'Libya'],
  ['LT', '+370', 'Lithuania'],
  ['LU', '+352', 'Luxembourg'],
  ['MO', '+853', 'Macau'],
  ['MG', '+261', 'Madagascar'],
  ['MY', '+60', 'Malaysia'],
  ['MV', '+960', 'Maldives'],
  ['MT', '+356', 'Malta'],
  ['MU', '+230', 'Mauritius'],
  ['MX', '+52', 'Mexico'],
  ['MD', '+373', 'Moldova'],
  ['MC', '+377', 'Monaco'],
  ['MN', '+976', 'Mongolia'],
  ['ME', '+382', 'Montenegro'],
  ['MA', '+212', 'Morocco'],
  ['MZ', '+258', 'Mozambique'],
  ['NA', '+264', 'Namibia'],
  ['NP', '+977', 'Nepal'],
  ['NL', '+31', 'Netherlands'],
  ['NZ', '+64', 'New Zealand'],
  ['NG', '+234', 'Nigeria'],
  ['MK', '+389', 'North Macedonia'],
  ['NO', '+47', 'Norway'],
  ['OM', '+968', 'Oman'],
  ['PK', '+92', 'Pakistan'],
  ['PS', '+970', 'Palestine'],
  ['PA', '+507', 'Panama'],
  ['PG', '+675', 'Papua New Guinea'],
  ['PY', '+595', 'Paraguay'],
  ['PE', '+51', 'Peru'],
  ['PL', '+48', 'Poland'],
  ['PT', '+351', 'Portugal'],
  ['QA', '+974', 'Qatar'],
  ['RO', '+40', 'Romania'],
  ['RU', '+7', 'Russia / Kazakhstan'],
  ['RW', '+250', 'Rwanda'],
  ['SA', '+966', 'Saudi Arabia'],
  ['SN', '+221', 'Senegal'],
  ['RS', '+381', 'Serbia'],
  ['SG', '+65', 'Singapore'],
  ['SK', '+421', 'Slovakia'],
  ['SI', '+386', 'Slovenia'],
  ['ZA', '+27', 'South Africa'],
  ['KR', '+82', 'South Korea'],
  ['ES', '+34', 'Spain'],
  ['LK', '+94', 'Sri Lanka'],
  ['SE', '+46', 'Sweden'],
  ['CH', '+41', 'Switzerland'],
  ['TW', '+886', 'Taiwan'],
  ['TZ', '+255', 'Tanzania'],
  ['TN', '+216', 'Tunisia'],
  ['TR', '+90', 'Turkey'],
  ['TM', '+993', 'Turkmenistan'],
  ['AE', '+971', 'United Arab Emirates'],
  ['UG', '+256', 'Uganda'],
  ['UA', '+380', 'Ukraine'],
  ['GB', '+44', 'United Kingdom'],
  ['US', '+1', 'USA / Canada'],
  ['UY', '+598', 'Uruguay'],
  ['UZ', '+998', 'Uzbekistan'],
  ['VE', '+58', 'Venezuela'],
  ['VN', '+84', 'Vietnam'],
  ['ZM', '+260', 'Zambia'],
  ['ZW', '+263', 'Zimbabwe'],
];

/** 'CH' → 🇨🇭 — two regional-indicator letters, offset from 'A'. */
function flag(iso) {
  return String.fromCodePoint(
    ...[...iso.toUpperCase()].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65)
  );
}

const toEntry = ([iso, code, name]) => ({
  code,
  label: `${flag(iso)} ${name} (${code})`,
});

export const PHONE_COUNTRY_CODES = [
  ...PINNED.map(toEntry),
  ...[...REST].sort((a, b) => a[2].localeCompare(b[2])).map(toEntry),
];

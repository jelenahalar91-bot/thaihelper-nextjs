/**
 * Dialling codes offered in phone-verification inputs.
 *
 * Extracted from components/PhoneVerificationCard.jsx when the signup flow
 * grew its own verification step: two copies of this list would drift, and the
 * one a family sees while registering must match the one they see later on the
 * dashboard — otherwise a number they verified is a number they cannot re-enter.
 *
 * Order is deliberate, not alphabetical: the countries helpers actually come
 * from first (Thailand, Myanmar, Philippines, Laos, Cambodia), then the
 * countries families come from. A Thai helper should not have to scroll.
 *
 * Adding a code here is now enough on its own. normalisePhone() in
 * lib/phone-otp.js used to strip the national trunk zero only for a listed set
 * of countries, so every entry added here without a matching entry there was
 * quietly broken — 8 of the 22 below were, including Myanmar, the Philippines,
 * Laos and Cambodia. It now applies the E.164 rule to every country, so there
 * is no second list to keep in step.
 */
export const PHONE_COUNTRY_CODES = [
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

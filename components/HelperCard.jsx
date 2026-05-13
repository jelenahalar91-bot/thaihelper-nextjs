import Link from 'next/link';
import Image from 'next/image';
import { useLang } from '../pages/_app';
import { formatCity, formatAdditionalCities } from '../lib/constants/cities';
import AvailabilityPill from './AvailabilityPill';

// Thai / CJK / other non-Latin script ranges — used to detect data
// quality issues where helpers typed text into structured fields
// (e.g. "หาดใหญ่" in the city slug field, or "30+ปี" in experience).
const NONLATIN = /[฀-๿一-鿿぀-ヿ]/;

// Strip everything except digits, +, -, . from the free-text experience
// field. Most legit values are numbers like "5" or "10+"; some users
// typed Thai ("30+ปี") or full sentences (which we hide entirely by
// returning empty).
function cleanExperience(exp) {
  if (!exp) return '';
  const cleaned = String(exp).replace(/[^\d+\-.]/g, '').trim();
  // If after cleaning we have something other than a single digit or 0,
  // it's plausibly a year count. Otherwise hide.
  return /\d/.test(cleaned) ? cleaned : '';
}

/**
 * Shared helper card — used by:
 *   • the public landing           (mode="preview",  static marketing data)
 *   • /helpers public browse page  (mode="browse",   sign-in CTA)
 *   • employer dashboard           (ctaSlot override, "Message" button)
 *
 * Keeping the layout in one place guarantees that what helpers see in the
 * landing preview matches what employers see when browsing.
 *
 * Expected `helper` shape (all fields optional unless noted):
 *   photo, name OR (firstName + lastName) [required],
 *   age, categoryLabel, city, area, bio,
 *   experience, languages, verified
 *
 * Expected `t` keys: card_exp, card_signin, card_signin_btn,
 *   card_preview_note, card_verified
 *
 * `ctaSlot` (optional ReactNode): if provided, replaces the default
 * CTA section entirely. Use this from authenticated contexts that
 * need a custom action (e.g. employer dashboard "Message" button).
 *
 * NOTE: WhatsApp/Email contact badges are intentionally NOT shown.
 * All communication happens on-platform; users decide what contact
 * data to share AFTER messaging through ThaiHelper.
 */
export default function HelperCard({
  helper,
  mode = 'browse',
  t,
  ctaSlot,
  isFavorite = false,
  onToggleFavorite,
  favoriteHint,
  onViewProfile,
}) {
  const { lang } = useLang();
  const displayName =
    helper.name || [helper.firstName, helper.lastName].filter(Boolean).join(' ');

  // Show the English translation when the viewer's UI is English and we have
  // one stored. Thai viewers (and the helper themselves) always see the
  // original they wrote.
  const displayBio = lang === 'th' ? helper.bio : (helper.bioEn || helper.bio);

  const showFavBtn = typeof onToggleFavorite === 'function' && helper.ref;
  const hintText = favoriteHint ||
    (isFavorite ? (t?.fav_remove || 'Remove from favorites') : (t?.fav_add || 'Save to favorites'));

  const clickable = typeof onViewProfile === 'function' && helper.ref;
  // Open the profile modal on card click. The heart button and the CTA
  // button both stopPropagation so clicking them doesn't ALSO open the
  // modal. We also guard against clicks on interactive elements inside
  // ctaSlot (buttons, links) which might not stopPropagation themselves.
  const handleCardClick = (e) => {
    if (!clickable) return;
    const target = e.target;
    if (target.closest && target.closest('button, a, input, textarea, select, label')) return;
    onViewProfile(helper);
  };
  const handleCardKeyDown = (e) => {
    if (!clickable) return;
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.target.closest && e.target.closest('button, a, input')) return;
      e.preventDefault();
      onViewProfile(helper);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `${t?.card_view_profile || 'View profile'}: ${displayName}` : undefined}
      className={`bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow flex flex-col sm:flex-row ${clickable ? 'cursor-pointer hover:border-[#006a62]/40 focus:outline-none focus:ring-2 focus:ring-[#006a62]/40' : ''}`}>
      {/* Photo */}
      <div className="relative bg-gray-100 overflow-hidden flex-shrink-0 sm:w-56 aspect-[16/9] sm:aspect-square">
        {showFavBtn && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(helper.ref, !isFavorite); }}
            aria-label={hintText}
            title={hintText}
            className="absolute top-2 right-2 z-10 w-10 h-10 rounded-full bg-white/95 shadow-sm hover:bg-white hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
          >
            <span
              aria-hidden="true"
              style={{ fontSize: '20px', lineHeight: 1, color: isFavorite ? '#e11d48' : '#9ca3af' }}
            >
              {isFavorite ? '♥' : '♡'}
            </span>
          </button>
        )}
        {helper.photo ? (
          // Local images (/images/...) get full next/image optimization;
          // user-uploaded photos (data: URLs or unknown remote hosts) fall
          // back to a plain <img> so they still render reliably.
          helper.photo.startsWith('/') ? (
            <Image
              src={helper.photo}
              alt={displayName}
              fill
              sizes="(max-width: 640px) 100vw, 224px"
              className="object-cover"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={helper.photo}
              alt={displayName}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl text-gray-300">
            👤
          </div>
        )}
        {helper.verified && (
          <span className="absolute top-2 left-2 inline-flex items-center px-2 py-1 rounded-full bg-white/95 text-[#006a62] text-[10px] font-bold shadow-sm">
            ✓ {t.card_verified || 'Verified'}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-5 sm:p-6 flex flex-col flex-1 min-w-0 gap-3">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-xl font-bold text-gray-900 leading-tight flex-1 min-w-0">
              {displayName}
              {helper.age && (
                <span className="text-gray-400 font-medium text-base ml-1">
                  · {helper.age}
                </span>
              )}
            </h3>
            {helper.availabilityStatus && (
              <AvailabilityPill status={helper.availabilityStatus} lang={lang} size="sm" />
            )}
          </div>
          {helper.categoryLabel && (
            <div className="text-sm text-gray-700 mt-1 font-medium">
              {helper.categoryLabel}
            </div>
          )}
          <div className="text-sm text-gray-500 mt-1">
            📍 {(() => {
              // City should be a slug ("bangkok") that formatCity maps to
              // a display name. A few legacy rows have free Thai text in
              // the city field instead of a slug — in EN mode that reads
              // as gibberish to non-Thai viewers, so we hide it and let
              // area_en carry the location.
              let cityLabel = formatCity(helper.city);
              if (lang === 'en' && NONLATIN.test(cityLabel)) cityLabel = '';
              const area = lang === 'en' && helper.areaEn ? helper.areaEn : helper.area;
              if (!cityLabel && !area) return '—';
              if (!cityLabel) return area;
              if (!area || area === cityLabel) return cityLabel;
              return `${cityLabel} · ${area}`;
            })()}
          </div>
          {helper.additionalCities && (() => {
            const extras = formatAdditionalCities(helper.additionalCities, helper.city);
            if (!extras) return null;
            const alsoLabel = lang === 'th' ? 'ทำงานที่' : 'also';
            return (
              <div className="text-xs text-gray-500 mt-0.5">
                <span className="text-gray-400">↳ {alsoLabel}:</span> {extras}
              </div>
            );
          })()}
        </div>

        {displayBio && (
          <p className="text-sm text-gray-600 leading-relaxed">{displayBio}</p>
        )}

        <div className="flex flex-wrap gap-1.5 text-sm">
          {(() => {
            // Sanitise experience: see cleanExperience above. Hides the
            // badge entirely when the field contains a full sentence or
            // is otherwise non-numeric.
            const exp = cleanExperience(helper.experience);
            if (!exp) return null;
            return (
              <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700">
                ⏱ {exp} {t.card_exp}
              </span>
            );
          })()}
          {helper.languages && (
            <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700">
              🗣 {helper.languages}
            </span>
          )}
          {helper.wpStatus === 'thai_national' && (
            <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 font-medium">
              🇹🇭 {lang === 'th' ? 'คนไทย' : 'Thai National'}
            </span>
          )}
          {helper.wpStatus === 'valid_wp' && (
            <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-800 font-medium">
              ✅ {lang === 'th' ? 'มีใบอนุญาตทำงาน' : 'Work Permit'}
            </span>
          )}
        </div>

        {/* CTA */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          {ctaSlot ? (
            ctaSlot
          ) : mode === 'preview' ? (
            <div className="text-sm text-gray-500 text-center py-2">
              🔒 {t.card_preview_note}
            </div>
          ) : (
            <>
              <div className="text-sm text-gray-500 text-center mb-2">
                🔒 {t.card_signin}
              </div>
              <Link
                href="/login"
                className="block w-full text-center px-4 py-2.5 rounded-lg bg-[#006a62] text-white text-sm font-bold hover:bg-[#004d47] transition-colors"
              >
                {t.card_signin_btn}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

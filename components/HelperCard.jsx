import Link from 'next/link';

/**
 * Shared helper card — used by:
 *   • the public landing (mode="preview", static marketing data)
 *   • the employer browse page /helpers (mode="browse", live API data)
 *
 * Keeping the layout in one place guarantees that what helpers see in the
 * landing preview matches what employers see when browsing.
 *
 * Expected `helper` shape (all fields optional unless noted):
 *   photo, name OR (firstName + lastName) [required],
 *   age, categoryLabel, city, area, bio,
 *   experience, languages, hasWhatsApp, hasEmail, verified
 *
 * Expected `t` keys: card_exp, card_wa, card_email,
 *   card_signin, card_signin_btn, card_preview_note, card_verified
 */
export default function HelperCard({ helper, mode = 'browse', t }) {
  const displayName =
    helper.name || [helper.firstName, helper.lastName].filter(Boolean).join(' ');

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow flex flex-col sm:flex-row">
      {/* Photo */}
      <div className="relative bg-gray-100 overflow-hidden flex-shrink-0 sm:w-56 aspect-[16/9] sm:aspect-square">
        {helper.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={helper.photo}
            alt={displayName}
            className="w-full h-full object-cover"
          />
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
          <h3 className="text-xl font-bold text-gray-900 leading-tight">
            {displayName}
            {helper.age && (
              <span className="text-gray-400 font-medium text-base ml-1">
                · {helper.age}
              </span>
            )}
          </h3>
          {helper.categoryLabel && (
            <div className="text-sm text-gray-700 mt-1 font-medium">
              {helper.categoryLabel}
            </div>
          )}
          <div className="text-xs text-gray-500 mt-1">
            📍 {helper.city}
            {helper.area ? ` · ${helper.area}` : ''}
          </div>
        </div>

        {helper.bio && (
          <p className="text-sm text-gray-600 leading-relaxed">{helper.bio}</p>
        )}

        <div className="flex flex-wrap gap-1.5 text-xs">
          {helper.experience && (
            <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700">
              ⏱ {helper.experience} {t.card_exp}
            </span>
          )}
          {helper.languages && (
            <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700">
              🗣 {helper.languages}
            </span>
          )}
          {helper.hasWhatsApp && (
            <span className="px-2 py-1 rounded-md bg-green-50 text-green-700 font-medium">
              ✓ {t.card_wa || 'WhatsApp'}
            </span>
          )}
          {helper.hasEmail && (
            <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 font-medium">
              ✓ {t.card_email || 'Email'}
            </span>
          )}
        </div>

        {/* CTA */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          {mode === 'preview' ? (
            <div className="text-xs text-gray-500 text-center py-2">
              🔒 {t.card_preview_note}
            </div>
          ) : (
            <>
              <div className="text-xs text-gray-500 text-center mb-2">
                🔒 {t.card_signin}
              </div>
              <Link
                href="/employer-login"
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

/**
 * AppStoreBadge — link to the ThaiHelper iOS app on the App Store.
 *
 * The app went live 27 Aug 2026 (app id 6801794164). Every page already
 * gets organic traffic, so surfacing the app here is the cheapest install
 * channel we have — no ad spend, visitors are already on the site.
 *
 * Uses Apple's official badge artwork (self-hosted in /public so we don't
 * depend on Apple's CDN). Apple's marketing guidelines require the badge
 * to keep its aspect ratio and clear space, hence the fixed height + the
 * untouched SVG.
 *
 * Android ships from the Play Store as "ThaiHelper – Nannies & Maids"
 * (app.thaihelper.mobile); Android visitors get AndroidAppBanner instead.
 */

export const APP_STORE_URL = 'https://apps.apple.com/app/thaihelper-app/id6801794164';

const COPY = {
  en: { label: 'Download ThaiHelper on the App Store', tagline: 'Get the free iPhone app' },
  th: { label: 'ดาวน์โหลด ThaiHelper บน App Store', tagline: 'รับแอป iPhone ฟรี' },
};

export default function AppStoreBadge({ lang = 'en', showTagline = false, className = '' }) {
  const t = COPY[lang] || COPY.en;

  return (
    <div className={className}>
      {showTagline && (
        <p className="text-sm mb-2 opacity-80">{t.tagline}</p>
      )}
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t.label}
        className="inline-block transition-opacity hover:opacity-80 focus:opacity-80"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/app-store-badge.svg"
          alt={t.label}
          width={135}
          height={45}
          style={{ height: '45px', width: 'auto', display: 'block' }}
          loading="lazy"
        />
      </a>
    </div>
  );
}

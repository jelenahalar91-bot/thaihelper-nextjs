/**
 * PlayStoreBadge — link to the ThaiHelper Android app on Google Play.
 *
 * The Android app went live 1 Sep 2026 after clearing Google's closed-test
 * requirement (12+ testers over 14 days). It is the same native codebase as
 * the iOS app, not the old WebView wrapper.
 *
 * Badge artwork is self-hosted in /public for the same reason as the Apple
 * one: no dependency on Google's CDN. Google's brand guidelines require the
 * badge to keep its aspect ratio and clear space, hence the fixed height.
 */

export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=app.thaihelper.mobile';

const COPY = {
  en: { label: 'Get ThaiHelper on Google Play' },
  th: { label: 'ดาวน์โหลด ThaiHelper บน Google Play' },
};

export default function PlayStoreBadge({ lang = 'en', className = '' }) {
  const t = COPY[lang] || COPY.en;

  return (
    <div className={className}>
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t.label}
        className="inline-block transition-opacity hover:opacity-80 focus:opacity-80"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/google-play-badge.svg"
          alt={t.label}
          width={152}
          height={45}
          style={{ height: '45px', width: 'auto', display: 'block' }}
          loading="lazy"
        />
      </a>
    </div>
  );
}

/**
 * AppBadges — the iOS and Android store badges side by side.
 *
 * Both apps run the same native codebase, so we always show both: sending an
 * Android visitor to an iPhone-only badge was costing us installs. Wraps so
 * the two badges stack on narrow screens instead of overflowing.
 */

import AppStoreBadge from './AppStoreBadge';
import PlayStoreBadge from './PlayStoreBadge';

export default function AppBadges({ lang = 'en', className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <AppStoreBadge lang={lang} />
      <PlayStoreBadge lang={lang} />
    </div>
  );
}

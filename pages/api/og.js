// Dynamic Open Graph image generator. Any page can request a
// branded 1200x630 PNG by linking to:
//
//   /api/og?title=…&subtitle=…&tag=…
//
// SEOHead.jsx builds this URL automatically when a page doesn't pass
// a custom ogImage, so every blog post, hire page and guide gets its
// own branded share image rather than the generic default.
//
// Satori (the rendering engine behind next/og) has two gotchas:
//   1. The default sans font doesn't carry glyphs for ★, ☆, emoji —
//      anything outside basic Latin shows as a tofu box. Use inline
//      SVG for stars and brand marks instead.
//   2. Every nested element in a flex container becomes a flex item,
//      and text wrapping inherits the parent flex-direction. Set
//      flexDirection explicitly on every flex container, and wrap
//      inline text in a <span> rendered as a block so letters stay
//      together.
//
// Edge runtime renders the image in <50ms once warm and gets cached
// at the Vercel CDN per unique query string.
import { ImageResponse } from 'next/og';

export const config = { runtime: 'edge' };

const Star = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#F4A261">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

export default function handler(req) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get('title') || 'ThaiHelper').slice(0, 110);
  const subtitle = (searchParams.get('subtitle') || '').slice(0, 90);
  const tag = (searchParams.get('tag') || '').slice(0, 32);

  // Dark teal with a diagonal highlight band. More depth than a flat gradient.
  const bg =
    'radial-gradient(ellipse 70% 50% at 85% 15%, rgba(244,162,97,0.18), transparent 60%),' +
    'linear-gradient(135deg, #003330 0%, #004d47 45%, #006a62 100%)';

  const image = new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '70px 80px',
          background: bg,
          color: '#ffffff',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Top row — brand mark */}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              width: '52px',
              height: '52px',
              background: '#F4A261',
              borderRadius: '14px',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#003330',
              fontSize: '32px',
              fontWeight: 900,
            }}
          >
            T
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: '34px',
              fontWeight: 800,
              letterSpacing: '-0.01em',
            }}
          >
            <span style={{ color: '#ffffff' }}>Thai</span>
            <span style={{ color: '#F4A261' }}>Helper</span>
          </div>
        </div>

        {/* Middle — title block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {tag ? (
            <div
              style={{
                display: 'flex',
                alignSelf: 'flex-start',
                padding: '10px 24px',
                background: 'rgba(244,162,97,0.18)',
                border: '1px solid rgba(244,162,97,0.45)',
                borderRadius: '999px',
                fontSize: '26px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#F4A261',
              }}
            >
              {tag}
            </div>
          ) : null}
          <div
            style={{
              display: 'flex',
              fontSize: title.length > 70 ? '58px' : title.length > 45 ? '72px' : '86px',
              lineHeight: 1.08,
              fontWeight: 800,
              letterSpacing: '-0.025em',
              maxWidth: '1040px',
            }}
          >
            {title}
          </div>
          {subtitle ? (
            <div
              style={{
                display: 'flex',
                fontSize: '32px',
                color: 'rgba(255,255,255,0.82)',
                maxWidth: '960px',
                lineHeight: 1.3,
                fontWeight: 400,
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>

        {/* Bottom row — URL + Trustpilot */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '28px',
            borderTop: '1px solid rgba(255,255,255,0.14)',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: '30px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.95)',
            }}
          >
            thaihelper.app
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '10px',
              fontSize: '26px',
              color: 'rgba(255,255,255,0.82)',
            }}
          >
            <div style={{ display: 'flex', gap: '2px' }}>
              <Star />
              <Star />
              <Star />
              <Star />
              <Star />
            </div>
            <div style={{ display: 'flex', paddingLeft: '8px', fontWeight: 600 }}>
              4.1 on Trustpilot
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );

  // One hour fresh + 24 hours stale-while-revalidate at the Vercel CDN.
  image.headers.set('cache-control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  return image;
}

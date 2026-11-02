// Dynamic Open Graph image generator. Any page can request a
// branded 1200x630 PNG by linking to:
//
//   /api/og?title=…&subtitle=…&tag=…
//
// The three params shape the layout:
//   title    = main headline (big, bold, up to ~80 chars)
//   subtitle = optional secondary line (city, salary range, read time)
//   tag      = small pill above the title (category, "Blog", "Guide")
//
// SEOHead.jsx builds this URL automatically when a page doesn't pass
// a custom ogImage, so every blog post, hire page and guide gets its
// own branded share image rather than the generic default.
//
// Edge runtime renders the image in <50ms once warm and gets cached
// at the Vercel CDN per unique query string.
import { ImageResponse } from 'next/og';

export const config = { runtime: 'edge' };

export default function handler(req) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get('title') || 'ThaiHelper').slice(0, 110);
  const subtitle = (searchParams.get('subtitle') || '').slice(0, 90);
  const tag = (searchParams.get('tag') || '').slice(0, 32);

  // Brand teal gradient. Subtle enough that the title stays legible
  // in both light and dark Facebook/LinkedIn/WhatsApp preview panes.
  const bg = 'linear-gradient(135deg, #006a62 0%, #004d47 55%, #003330 100%)';

  return new ImageResponse(
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
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {tag ? (
            <div
              style={{
                display: 'flex',
                alignSelf: 'flex-start',
                padding: '8px 20px',
                background: 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.28)',
                borderRadius: '999px',
                fontSize: '26px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {tag}
            </div>
          ) : null}
          <div
            style={{
              fontSize: title.length > 70 ? '58px' : title.length > 45 ? '70px' : '82px',
              lineHeight: 1.1,
              fontWeight: 800,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </div>
          {subtitle ? (
            <div
              style={{
                fontSize: '32px',
                color: 'rgba(255,255,255,0.82)',
                maxWidth: '960px',
                lineHeight: 1.3,
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '28px',
            color: 'rgba(255,255,255,0.9)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                background: '#F4A261',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#003330',
                fontSize: '28px',
                fontWeight: 900,
              }}
            >
              T
            </div>
            <div style={{ display: 'flex', fontWeight: 700, fontSize: '32px' }}>
              thaihelper.app
            </div>
          </div>
          <div style={{ display: 'flex' }}>★ 4.1 / 5 on Trustpilot</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

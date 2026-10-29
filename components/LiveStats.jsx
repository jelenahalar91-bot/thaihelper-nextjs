import { useEffect, useRef, useState } from 'react';

const LABELS = {
  en: {
    matches: 'Matches started',
    helpers: 'Verified helpers',
    families: 'Verified families',
    live: 'Live',
  },
  th: {
    matches: 'คู่สนทนาที่เริ่มแล้ว',
    helpers: 'ผู้ช่วยที่ยืนยันแล้ว',
    families: 'ครอบครัวที่ยืนยันแล้ว',
    live: 'สด',
  },
};

function formatNumber(n, lang) {
  return new Intl.NumberFormat(lang === 'th' ? 'th-TH' : 'en-US').format(n);
}

function useCountUp(target, run, durationMs = 1500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run || !target) {
      if (!run) setValue(0);
      return undefined;
    }
    let frameId;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / durationMs);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [target, run, durationMs]);
  return value;
}

export default function LiveStats({ lang = 'en', accent = 'primary', className = '' }) {
  const [stats, setStats] = useState(null);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const labels = LABELS[lang] || LABELS.en;

  useEffect(() => {
    let cancelled = false;
    fetch('/api/stats/live')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setStats(data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }
    const el = ref.current;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const run = visible && !!stats;
  const matches = useCountUp(stats?.matches || 0, run);
  const helpers = useCountUp(stats?.helpers || 0, run);
  const families = useCountUp(stats?.families || 0, run);

  const accentCls = accent === 'gold' ? 'text-gold' : 'text-primary';
  const dotCls = accent === 'gold' ? 'bg-gold' : 'bg-emerald-500';
  const dotPingCls = accent === 'gold' ? 'bg-gold/70' : 'bg-emerald-400';

  const items = [
    { key: 'matches', value: matches, label: labels.matches },
    { key: 'helpers', value: helpers, label: labels.helpers },
    { key: 'families', value: families, label: labels.families },
  ];

  return (
    <div
      ref={ref}
      className={`inline-flex flex-wrap items-center gap-4 sm:gap-6 ${className}`}
      aria-live="polite"
    >
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotPingCls} opacity-75`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotCls}`}></span>
        </span>
        {labels.live}
      </span>
      {items.map((item, idx) => (
        <div key={item.key} className="flex items-baseline gap-2">
          {idx > 0 && <span className="hidden sm:inline text-on-surface-variant/40">·</span>}
          <span className={`font-headline font-extrabold ${accentCls} leading-none tabular-nums`} style={{ fontSize: 'clamp(1.25rem, 2.4vw, 1.75rem)' }}>
            {stats ? formatNumber(item.value, lang) : '—'}
          </span>
          <span className="text-xs sm:text-sm text-on-surface-variant whitespace-nowrap">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

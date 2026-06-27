import Link from 'next/link';

/**
 * Shared brand wordmark — single source of truth for the "ThaiHelper" logo.
 * "Thai" renders in navy, "Helper" in primary teal (#006a62), always in the
 * headline font (Plus Jakarta Sans). Use this everywhere the logo appears so
 * the header/footer wordmark stays identical across the whole site.
 *
 * Props:
 *  - href:  link target. Pass `null` to render a non-clickable <span> (footers).
 *  - size:  'sm' | 'md' | 'lg'  (md = responsive xl→2xl, the header default)
 *  - className: extra classes (e.g. spacing) appended to the base styles.
 */
const SIZES = {
  sm: 'text-xl',
  md: 'text-xl md:text-2xl',
  lg: 'text-2xl',
};

export default function BrandWordmark({ href = '/', size = 'md', className = '' }) {
  const cls = `font-bold font-headline text-navy leading-none ${SIZES[size] || SIZES.md} ${className}`.trim();
  const inner = (
    <>
      Thai<span className="text-primary">Helper</span>
    </>
  );

  if (href === null) {
    return <span className={cls}>{inner}</span>;
  }

  return (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

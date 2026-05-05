/**
 * Shared header navigation primitives:
 *
 *   <ResourcesDropdown />  — small dropdown for the desktop header
 *   <MobileMenu />         — hamburger + slide-in panel for < lg
 *
 * Both are driven by the same `items` array so the desktop and mobile
 * navs stay in sync per page. The mobile panel is rendered through a
 * React portal because most page headers use `backdrop-blur`, which
 * establishes a containing block for fixed-position descendants —
 * without the portal the panel snaps to the header's bounding box
 * instead of the viewport.
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import LangSwitcher from './LangSwitcher';

// Desktop dropdown — labels only, no icons. Closes on click-outside or Escape.
export function ResourcesDropdown({ label, items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e) {
      if (!ref.current?.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1 text-xs md:text-sm font-semibold text-[#001b3d] hover:text-primary transition-colors"
      >
        {label}
        <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor" className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden>
          <path d="M0 0l5 6 5-6z" />
        </svg>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              role="menuitem"
              className="block px-4 py-2.5 text-sm font-semibold text-[#001b3d] hover:bg-gray-50 hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// Hamburger + slide-in panel for narrow viewports.
//
// Props:
//   items:        [{ href, label }]  — main nav items
//   primaryCta:   { href, label }    — dark "Register" / sign-up CTA
//   secondaryCta: { href, label }    — light "Login" CTA
export function MobileMenu({ items, primaryCta, secondaryCta }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // createPortal needs document.body, which is undefined during SSR.
  useEffect(() => { setMounted(true); }, []);

  // Lock body scroll while the panel is open so the page behind doesn't
  // scroll when the user pans the menu.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  const overlay = (
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close menu"
        onClick={close}
        className="fixed inset-0 bg-black/45 z-[1000]"
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white z-[1001] shadow-2xl flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="text-xl font-bold font-headline">
            <span>Thai</span><span style={{ color: '#006a62' }}>Helper</span>
          </span>
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="p-2 -mr-2 text-gray-500 hover:text-gray-900"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Auth CTAs — side-by-side, prominent */}
        {(secondaryCta || primaryCta) && (
          <div className="grid grid-cols-2 gap-3 px-5 py-4">
            {secondaryCta && (
              <Link
                href={secondaryCta.href}
                onClick={close}
                className="text-center px-4 py-3 rounded-xl bg-gray-100 text-[#001b3d] text-sm font-bold hover:bg-gray-200 transition-colors"
              >
                {secondaryCta.label}
              </Link>
            )}
            {primaryCta && (
              <Link
                href={primaryCta.href}
                onClick={close}
                className="text-center px-4 py-3 rounded-xl bg-[#001b3d] text-white text-sm font-bold hover:bg-[#002d5f] transition-colors"
              >
                {primaryCta.label}
              </Link>
            )}
          </div>
        )}

        {/* Nav links. <div role="menu"> rather than <nav> — globals.css
            has `nav { display: flex; height: 64px; ... }` for the
            page-level header which would force these items into a
            single horizontal strip. */}
        <div role="menu" className="px-2 py-2 border-t border-gray-100">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              role="menuitem"
              className="flex w-full items-center justify-between gap-3 px-4 py-4 rounded-lg hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
            >
              <span className="text-base font-semibold text-[#001b3d]">{item.label}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 flex-shrink-0" aria-hidden>
                <path d="M9 6l6 6-6 6" />
              </svg>
            </Link>
          ))}
        </div>

        {/* Footer — language switcher, pinned to bottom */}
        <div className="mt-auto px-5 py-4 border-t border-gray-100">
          <LangSwitcher />
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="p-2 -mr-2 text-[#001b3d] hover:text-primary transition-colors"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {open && mounted && createPortal(overlay, document.body)}
    </>
  );
}

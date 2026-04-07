/**
 * Avatar dropdown menu for employer pages.
 *
 * Mirrors the helper-side menu (see pages/profile.js) so the two roles
 * feel identical to the user. Renders a circular avatar (photo or initial)
 * which, when clicked, opens a card with:
 *   - User header (avatar + name + email)
 *   - Dashboard / Profile / Settings menu items
 *   - Logout (in red) at the bottom
 *
 * The "current" prop highlights the active page.
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { employerLogout } from '@/lib/api/employer-auth-client';

const T = {
  en: {
    menu_dashboard: 'Dashboard',
    menu_profile: 'Profile',
    menu_settings: 'Settings',
    logout: 'Log out',
  },
  th: {
    menu_dashboard: 'แดชบอร์ด',
    menu_profile: 'โปรไฟล์',
    menu_settings: 'ตั้งค่า',
    logout: 'ออกจากระบบ',
  },
};

export default function EmployerProfileMenu({ profile, lang = 'en', current }) {
  const router = useRouter();
  const t = T[lang] || T.en;
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  async function handleLogout() {
    await employerLogout();
    router.replace('/login');
  }

  const firstInitial = (profile?.first_name || '?')[0]?.toUpperCase() || '?';
  const lastInitial = (profile?.last_name || '')[0]?.toUpperCase() || '';
  const initials = `${firstInitial}${lastInitial}`;
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');

  return (
    <div ref={wrapRef} className="relative">
      {/* Avatar trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-11 h-11 rounded-full overflow-hidden bg-[#e6f5f3] border-2 border-[#006a62] flex items-center justify-center hover:opacity-80 transition-opacity"
        aria-label="Profile menu"
      >
        {profile?.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.photo_url}
            alt={fullName}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-sm font-bold text-[#006a62]">{initials}</span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+12px)] w-[280px] max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-[100]">
          {/* User header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-full overflow-hidden bg-[#e6f5f3] border-2 border-[#006a62] flex items-center justify-center flex-shrink-0" style={{ width: 52, height: 52 }}>
              {profile?.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.photo_url}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-base font-bold text-[#006a62]">{initials}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-semibold text-gray-900 truncate">
                {fullName || 'Employer'}
              </div>
              {profile?.email && (
                <div className="text-xs text-gray-500 mt-0.5 truncate">
                  {profile.email}
                </div>
              )}
            </div>
          </div>

          {/* Menu items */}
          <div className="py-2">
            <MenuItem
              icon={<IconDashboard />}
              label={t.menu_dashboard}
              active={current === 'dashboard'}
              onClick={() => { setOpen(false); router.push('/employer-dashboard'); }}
            />
            <MenuItem
              icon={<IconUser />}
              label={t.menu_profile}
              active={current === 'profile'}
              onClick={() => { setOpen(false); router.push('/employer-profile'); }}
            />
            <MenuItem
              icon={<IconSettings />}
              label={t.menu_settings}
              active={current === 'settings'}
              onClick={() => { setOpen(false); router.push('/employer-profile#settings'); }}
            />

            <div className="border-t border-gray-100 mt-1.5">
              <MenuItem
                icon={<IconLogout />}
                label={t.logout}
                onClick={handleLogout}
                danger
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────

function MenuItem({ icon, label, onClick, danger, active }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 px-5 py-3 text-[15px] font-medium text-left transition-colors ${
        danger
          ? 'text-red-600 hover:bg-red-50'
          : active
            ? 'bg-[#e6f5f3] text-[#006a62]'
            : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
        {icon}
      </span>
      {label}
    </button>
  );
}

// ─── Icons ───────────────────────────────────────────────────────────────

const iconProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function IconDashboard() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg {...iconProps}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg {...iconProps}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// Legacy URL — kept so links in older welcome emails still work.
// The login page is now unified at /login (auto-detects helper vs employer
// from the reference number prefix).
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function EmployerLoginRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/login');
  }, [router]);
  return null;
}

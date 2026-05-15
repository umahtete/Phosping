'use client';

import { useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AccessCodeModal } from '@/components/access-code-modal';

const PUBLIC_PATHS = ['/classroom'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export function AccessCodeGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [status, setStatus] = useState<{
    enabled: boolean;
    authenticated: boolean;
    loading: boolean;
  }>({ enabled: false, authenticated: false, loading: true });

  const skipAuth = isPublicPath(pathname);

  useEffect(() => {
    if (skipAuth) return;
    let cancelled = false;
    fetch('/api/access-code/status')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setStatus({
            enabled: data.enabled,
            authenticated: data.authenticated,
            loading: false,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus({ enabled: true, authenticated: false, loading: false });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [skipAuth]);

  if (skipAuth) return <>{children}</>;

  const needsAuth = !status.loading && status.enabled && !status.authenticated;

  return (
    <>
      {needsAuth && (
        <AccessCodeModal
          open={true}
          onSuccess={() => setStatus((s) => ({ ...s, authenticated: true }))}
        />
      )}
      {children}
    </>
  );
}

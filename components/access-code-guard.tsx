'use client';

import { useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AccessCodeModal } from '@/components/access-code-modal';

/** Routes that bypass access-code authentication. */
const PUBLIC_PATHS = ['/classroom', '/lti', '/api/lti'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export function AccessCodeGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [status, setStatus] = useState<{
    enabled: boolean;
    authenticated: boolean;
    ltiSession: boolean;
    loading: boolean;
  }>({ enabled: false, authenticated: false, ltiSession: false, loading: true });

  const skipAuth = isPublicPath(pathname);

  useEffect(() => {
    if (skipAuth) return;
    let cancelled = false;

    // Check LTI session first
    fetch('/api/lti/session')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.valid) {
          setStatus({ enabled: false, authenticated: true, ltiSession: true, loading: false });
          return;
        }
        // Fall back to access code check
        return fetch('/api/access-code/status')
          .then((res) => res.json())
          .then((data) => {
            if (!cancelled) {
              setStatus({
                enabled: data.enabled,
                authenticated: data.authenticated,
                ltiSession: false,
                loading: false,
              });
            }
          });
      })
      .catch(() => {
        if (!cancelled) {
          // On error, try access code status directly
          fetch('/api/access-code/status')
            .then((res) => res.json())
            .then((data) => {
              if (!cancelled) {
                setStatus({
                  enabled: data.enabled,
                  authenticated: data.authenticated,
                  ltiSession: false,
                  loading: false,
                });
              }
            })
            .catch(() => {
              if (!cancelled) {
                setStatus({ enabled: true, authenticated: false, ltiSession: false, loading: false });
              }
            });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [skipAuth]);

  if (skipAuth) return <>{children}</>;

  const needsAuth = !status.loading && status.enabled && !status.authenticated && !status.ltiSession;

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

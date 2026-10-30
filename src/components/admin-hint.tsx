'use client';

import { useEffect, useState } from 'react';
import { ADMIN_HINT_COOKIE, ADMIN_HINT_MAX_AGE } from '@/lib/constants';

function hasHint() {
  return document.cookie.split('; ').some((entry) => entry.startsWith(`${ADMIN_HINT_COOKIE}=`));
}

function writeHint(maxAge: number) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${ADMIN_HINT_COOKIE}=1; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

/** Monté dans l'admin, une fois la session vérifiée : signale au site public que l'administrateur est connecté. */
export function AdminHint() {
  useEffect(() => writeHint(ADMIN_HINT_MAX_AGE), []);
  return null;
}

/**
 * Vrai seulement pour l'administrateur connecté. Les pages publiques restent statiques : la vérification se fait
 * dans le navigateur, et uniquement en présence du témoin, si bien qu'un visiteur ne déclenche aucune requête.
 * Le témoin seul ne suffit pas : la session est confirmée auprès du serveur, et le témoin effacé si elle a expiré.
 */
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!hasHint()) return;
    let cancelled = false;
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((session: { user?: { role?: string } } | null) => {
        if (cancelled) return;
        if (session?.user?.role === 'ADMIN') setIsAdmin(true);
        else writeHint(0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return isAdmin;
}

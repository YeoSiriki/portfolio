'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export const adminLinks = [
  { href: '/admin', label: 'Tableau de bord' },
  { href: '/admin/projets', label: 'Projets' },
  { href: '/admin/recherche', label: 'Recherche & publications' },
  { href: '/admin/experiences', label: 'Expériences' },
  { href: '/admin/formation', label: 'Formation & certifications' },
  { href: '/admin/enseignement', label: 'Enseignement & ressources' },
  { href: '/admin/blog', label: 'Blog' },
  { href: '/admin/messages', label: 'Messages' },
  { href: '/admin/reglages', label: 'Profil & réglages' },
] as const;

/** Liens de la barre latérale. `pathname` est absent dans la version de repli (avant hydratation). */
export function AdminNavList({ pathname, badge }: { pathname?: string; badge?: ReactNode }) {
  return (
    <ul className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
      {adminLinks.map((link) => {
        const active =
          pathname !== undefined && (link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href));
        return (
          <li key={link.href} className="shrink-0">
            <Link
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-11 items-center justify-between gap-3 rounded-[10px] px-3 text-[0.95rem] whitespace-nowrap transition-colors ${
                active ? 'bg-surface font-bold text-ink' : 'text-ink-2 hover:bg-surface-admin hover:text-ink'
              }`}
            >
              {link.label}
              {link.href === '/admin/messages' && badge}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminNav({ badge }: { badge?: ReactNode }) {
  return <AdminNavList pathname={usePathname()} badge={badge} />;
}

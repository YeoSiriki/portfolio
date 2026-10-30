import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getProjects } from '@/lib/queries';

// Tout le site public doit rester statique : la construction échoue si une page se met à dépendre
// de la requête. Une adresse inconnue attend son rendu complet et reçoit ainsi un vrai code 404.
export const ensureStatic = 'navigation';

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const projects = await getProjects();

  return (
    <>
      <a
        href="#contenu"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-50 focus-visible:rounded-[10px] focus-visible:bg-accent focus-visible:px-4 focus-visible:py-3 focus-visible:font-semibold focus-visible:text-on-accent"
      >
        Aller au contenu
      </a>
      <SiteHeader projectCount={projects.length} />
      <main id="contenu">{children}</main>
      <SiteFooter />
    </>
  );
}

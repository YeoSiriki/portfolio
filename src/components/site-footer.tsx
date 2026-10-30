import { ArrowUp } from 'lucide-react';
import Link from 'next/link';
import { getCurrentYear, getProfile, hasPosts } from '@/lib/queries';
import { Container } from './ui';

export async function SiteFooter() {
  const [profile, blogHasPosts, year] = await Promise.all([getProfile(), hasPosts(), getCurrentYear()]);

  const pages = [
    { href: '/recherche', label: 'Recherche' },
    { href: '/projets', label: 'Projets' },
    { href: '/parcours', label: 'Parcours' },
    { href: '/enseignement', label: 'Enseignement' },
    // Le blog n'est annoncé que lorsqu'il contient au moins un article.
    ...(blogHasPosts ? [{ href: '/blog', label: 'Blog' }] : []),
    { href: '/cv', label: 'CV' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <footer className="theme-inverse theme-deep" style={{ viewTransitionName: 'site-footer' }}>
      <Container className="py-10">
        <nav aria-label="Pages du site">
          <ul className="-mx-2 flex flex-wrap gap-x-1 gap-y-0">
            {pages.map((page) => (
              <li key={page.href}>
                <Link
                  href={page.href}
                  className="inline-flex min-h-11 items-center px-2 text-sm text-ink-2 transition-colors hover:text-accent"
                >
                  {page.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-6 flex flex-col gap-2 border-t border-line pt-6 font-mono text-[0.8125rem] text-ink-3 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {profile.fullName}
          </p>
          <ul className="-mx-2 flex flex-wrap items-center gap-x-1">
            <li>
              <Link href="/confidentialite" className="inline-flex min-h-11 items-center px-2 hover:text-ink">
                Confidentialité
              </Link>
            </li>
            <li>
              <Link href="/conditions-utilisation" className="inline-flex min-h-11 items-center px-2 hover:text-ink">
                Conditions d&apos;utilisation
              </Link>
            </li>
          </ul>
          <a href="#haut" className="nudge-up -mx-2 inline-flex min-h-11 items-center gap-1.5 px-2 hover:text-ink">
            Retour en haut <ArrowUp size={15} aria-hidden />
          </a>
        </div>
      </Container>
    </footer>
  );
}

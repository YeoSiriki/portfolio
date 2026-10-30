'use client';

import { LayoutDashboard, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { homeSections } from '@/lib/site';
import { useIsAdmin } from './admin-hint';
import { Wordmark } from './ui';

const sectionIds = homeSections.map((section) => section.href.split('#')[1]);

export function SiteHeader({ projectCount }: { projectCount: number }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Section de l'accueil actuellement à l'écran : un trait d'accent glisse sous le lien correspondant.
  const [active, setActive] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  // Le lien vers l'admin n'existe que pour l'administrateur connecté.
  const isAdmin = useIsAdmin();

  // Le filet sous la barre n'apparaît qu'une fois la page défilée.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Repérage de la section en cours. Les sections n'existent que sur l'accueil : on les
  // (ré)observe à chaque changement de page, détecté par le remplacement du contenu de <main>.
  useEffect(() => {
    const main = document.getElementById('contenu');
    const visible = new Set<string>();
    let sections: IntersectionObserver | null = null;

    const observeSections = () => {
      sections?.disconnect();
      visible.clear();
      const elements = sectionIds.flatMap((id) => document.getElementById(id) ?? []);
      if (elements.length === 0) return false;
      sections = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) visible.add(entry.target.id);
            else visible.delete(entry.target.id);
          }
          // Une bande étroite au milieu de l'écran : la dernière section qui la touche l'emporte.
          setActive([...sectionIds].reverse().find((id) => visible.has(id)) ?? null);
        },
        { rootMargin: '-42% 0px -52% 0px' },
      );
      for (const element of elements) sections.observe(element);
      return true;
    };

    observeSections();
    const pages = new MutationObserver(() => {
      if (!observeSections()) setActive(null);
    });
    if (main) pages.observe(main, { childList: true });

    return () => {
      sections?.disconnect();
      pages.disconnect();
    };
  }, []);

  // Position de l'indicateur : calée sur le lien actif, recalculée si la barre change de taille.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const place = () => {
      const link = active ? list.querySelector<HTMLElement>(`[data-section="${active}"]`) : null;
      list.style.setProperty('--indicator-opacity', link ? '1' : '0');
      if (!link) return;
      const inset = 12;
      list.style.setProperty('--indicator-x', `${link.offsetLeft + inset}px`);
      list.style.setProperty('--indicator-width', `${link.offsetWidth - inset * 2}px`);
    };
    place();
    const resize = new ResizeObserver(place);
    resize.observe(list);
    return () => resize.disconnect();
  }, [active]);

  const links = homeSections.map((section) => ({
    ...section,
    id: section.href.split('#')[1],
    count: section.href === '/#projets' ? `(${projectCount})` : null,
  }));

  return (
    <header
      // Nom de transition : la barre reste fixe pendant qu'une page remplace l'autre.
      style={{ viewTransitionName: 'site-header' }}
      className={`sticky top-0 z-40 border-b bg-bg/85 backdrop-blur-md transition-colors duration-300 ${
        scrolled || open ? 'border-line' : 'border-transparent'
      }`}
    >
      <div className="mx-auto flex h-[4.5rem] w-full max-w-[1240px] items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="-mx-2 inline-flex min-h-11 items-center px-2">
          <Wordmark />
        </Link>

        <nav aria-label="Navigation principale" className="hidden lg:block">
          <ul ref={listRef} className="relative flex items-center gap-1">
            {links.map((link) => {
              const current = link.id === active;
              return (
                <li key={link.href} data-section={link.id}>
                  <Link
                    href={link.href}
                    aria-current={current ? 'location' : undefined}
                    className={`inline-flex min-h-11 items-center px-3 text-[0.9rem] transition-colors duration-300 hover:text-accent ${
                      current ? 'text-ink' : 'text-ink-2'
                    }`}
                  >
                    {link.label}
                    {link.count && <span className="ml-1.5 text-ink-3">{link.count}</span>}
                  </Link>
                </li>
              );
            })}
            <li className="nav-indicator" aria-hidden />
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link href="/admin" prefetch={false} className="btn btn-secondary hidden sm:inline-flex">
              <LayoutDashboard size={17} aria-hidden /> Espace admin
            </Link>
          )}
          <Link href="/#contact" className="btn btn-primary hidden sm:inline-flex">
            Me contacter
          </Link>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-[10px] border border-field text-ink lg:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="menu-mobile" aria-label="Navigation principale" className="border-t border-line lg:hidden">
          <ul className="mx-auto flex w-full max-w-[1240px] flex-col px-5 py-3 sm:px-8">
            {links.map((link, index) => (
              <li key={link.href} className="rise" style={{ animationDelay: `${index * 45}ms` }}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center border-b border-line/60 text-base text-ink"
                >
                  {link.label}
                  {link.count && <span className="ml-1.5 text-ink-3">{link.count}</span>}
                </Link>
              </li>
            ))}
            <li className="rise flex flex-col gap-2 pt-4 pb-2" style={{ animationDelay: `${links.length * 45}ms` }}>
              <Link href="/#contact" onClick={() => setOpen(false)} className="btn btn-primary w-full">
                Me contacter
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  prefetch={false}
                  onClick={() => setOpen(false)}
                  className="btn btn-secondary w-full"
                >
                  <LayoutDashboard size={17} aria-hidden /> Espace admin
                </Link>
              )}
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

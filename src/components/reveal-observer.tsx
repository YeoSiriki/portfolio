'use client';

import { type ReactNode, useEffect, useRef } from 'react';

// Un seul observateur pour tout le site, partagé par tous les blocs.
let observer: IntersectionObserver | null = null;
const pending = new Set<Element>();

function show(element: Element) {
  element.removeAttribute('data-pending');
  pending.delete(element);
  observer?.unobserve(element);
}

// Filet de sécurité : un défilement très rapide (touche Fin, ancre) peut sauter un bloc sans que
// l'observateur le voie passer. À chaque défilement, tout bloc déjà atteint est donc affiché.
function revealPassed() {
  for (const element of pending) {
    if (element.getBoundingClientRect().top < window.innerHeight) show(element);
  }
}

let frame = 0;
function onScroll() {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    revealPassed();
  });
}

function sharedObserver() {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) show(entry.target);
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    window.addEventListener('scroll', onScroll, { passive: true });
  }
  return observer;
}

/**
 * Bloc qui apparaît à son entrée dans l'écran, une seule fois (l'animation est en CSS, globals.css).
 * L'attente est posée dans un effet, donc après l'hydratation du bloc : le HTML du serveur reste celui
 * qu'attend React. Ce qui est déjà à l'écran n'est jamais masqué et, sans JavaScript, rien ne l'est.
 */
export function RevealBox({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || element.getBoundingClientRect().top < window.innerHeight) return;
    element.setAttribute('data-pending', '');
    pending.add(element);
    sharedObserver().observe(element);
    return () => {
      show(element);
    };
  }, []);

  return (
    <div ref={ref} data-reveal className={className}>
      {children}
    </div>
  );
}

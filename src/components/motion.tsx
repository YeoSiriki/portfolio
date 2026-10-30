// Apparitions au défilement. L'animation est en CSS (globals.css) ; le déclenchement est assuré par
// <RevealBox>, qui partage un seul observateur pour tout le site.
// Sans JavaScript, rien n'est masqué : le contenu reste lisible.
import type { ReactNode } from 'react';
import { RevealBox } from './reveal-observer';

type Props = { children: ReactNode; className?: string };

/** Apparition discrète à l'entrée dans l'écran, une seule fois. */
export function Reveal({ children, className }: Props) {
  return <RevealBox className={className}>{children}</RevealBox>;
}

/** Groupe dont les enfants <RevealItem> apparaissent l'un après l'autre. */
export function RevealGroup({ children, className }: Props) {
  return (
    <div data-reveal-group className={className}>
      {children}
    </div>
  );
}

export function RevealItem({ children, className }: Props) {
  return <RevealBox className={className}>{children}</RevealBox>;
}

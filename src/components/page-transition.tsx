// Transitions entre pages, avec le composant <ViewTransition> de React (API View Transitions du
// navigateur). Les animations elles-mêmes sont dans globals.css, section « Transitions entre pages ».
// Sans prise en charge par le navigateur, la navigation fonctionne normalement, sans animation.
import { type ReactNode, ViewTransition } from 'react';

// Types de navigation posés sur les liens : entrer dans une fiche, ou en revenir.
export const NAV_FORWARD = ['nav-forward'];
export const NAV_BACK = ['nav-back'];

const directional = { 'nav-forward': 'nav-forward', 'nav-back': 'nav-back' };

/**
 * Enveloppe le contenu d'une page. Par défaut, l'ancienne page s'efface et la nouvelle monte ;
 * pour un lien « vers une fiche » ou « retour », le contenu glisse dans le sens du déplacement.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter={{ ...directional, default: 'page-enter' }}
      exit={{ ...directional, default: 'page-exit' }}
      default="none"
    >
      <div>{children}</div>
    </ViewTransition>
  );
}

/**
 * Élément partagé entre deux pages : le même nom des deux côtés, et le navigateur anime l'un vers
 * l'autre (le titre d'une carte devient le titre de la fiche, par exemple).
 */
export function Shared({ name, children }: { name: string; children: ReactNode }) {
  return (
    <ViewTransition name={name} share="morph" default="none">
      {children}
    </ViewTransition>
  );
}

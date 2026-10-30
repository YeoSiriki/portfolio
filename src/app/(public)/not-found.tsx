import type { Metadata } from 'next';
import { NotFoundContent } from '@/components/not-found-content';

export const metadata: Metadata = {
  title: 'Page introuvable',
  robots: { index: false },
};

// Projet, publication ou article introuvable : la page s'affiche dans la mise en page du site,
// qui fournit déjà l'en-tête, le pied de page et l'élément <main>.
export default function PublicNotFound() {
  return <NotFoundContent />;
}

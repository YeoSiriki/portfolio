import { PanelSkeleton } from '@/components/admin/panel-skeleton';

// Chaque page de l'admin vérifie la session avant de s'afficher : pendant ce temps, le squelette
// s'affiche aussitôt, si bien qu'un clic dans le menu donne une réponse immédiate.
export default function PanelLoading() {
  return <PanelSkeleton />;
}

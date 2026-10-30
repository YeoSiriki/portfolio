/** Squelette affiché pendant le chargement d'une page de l'admin. */
export function PanelSkeleton() {
  return (
    <div className="space-y-4 p-6 sm:p-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">Chargement...</span>
      <div className="h-4 w-36 rounded bg-surface" />
      <div className="h-10 w-64 rounded bg-surface" />
      <div className="h-64 rounded-card bg-surface-admin" />
    </div>
  );
}

import { getProfile } from '@/lib/queries';

/** En-tête d'une page de l'admin : fil d'Ariane en mono, titre, et rappel du badge de disponibilité. */
export async function AdminPageHeader({ breadcrumb, title }: { breadcrumb: string; title: string }) {
  const profile = await getProfile();
  const initials = profile.shortName
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="mb-8 flex scroll-mt-12 flex-wrap items-start justify-between gap-4">
      <div>
        <p className="label-mono">{breadcrumb}</p>
        <h1 className="display mt-2 text-[clamp(1.9rem,4vw,2.6rem)] text-ink">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        {profile.availabilityBadge && (
          <p className="hidden max-w-72 items-center gap-2.5 truncate rounded-[10px] border border-field px-3.5 py-2 text-sm font-semibold text-ink sm:inline-flex">
            <span className="size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
            <span className="truncate">{profile.availabilityBadge}</span>
          </p>
        )}
        <span
          className="inline-flex size-11 items-center justify-center rounded-full bg-surface text-sm font-bold text-ink"
          aria-hidden
        >
          {initials}
        </span>
      </div>
    </header>
  );
}

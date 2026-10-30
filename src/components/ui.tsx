import type { ReactNode, SVGProps } from 'react';
import { type ProjectState, projectStateLabel } from '@/lib/constants';
import { siteName } from '@/lib/site';

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1240px] px-5 sm:px-8 ${className}`}>{children}</div>;
}

/** Signature du site : les initiales dans un carré bleu, puis le nom en serif. */
export function Wordmark() {
  const initials = siteName
    .split(' ')
    .map((word) => word.charAt(0))
    .join('');
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-accent font-serif text-[0.95rem] font-medium text-on-accent"
        aria-hidden
      >
        {initials}
      </span>
      <span className="font-serif text-[1.3rem] leading-none font-medium tracking-[-0.01em] text-ink">{siteName}</span>
    </span>
  );
}

/** Surtitre en petites capitales, précédé d'un filet or. La barre oblique des anciens libellés est retirée. */
export function SectionLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`eyebrow flex items-center gap-3 ${className}`}>
      <span className="h-px w-8 shrink-0 bg-gold" aria-hidden />
      {typeof children === 'string' ? children.replace(/^\//, '') : children}
    </p>
  );
}

/**
 * En-tête de section, à la manière d'un article : un filet qui se trace, le numéro et le nom de la
 * section, le titre en serif ; à droite, l'introduction et le lien vers la page dédiée.
 */
export function SectionHeading({
  number,
  label,
  title,
  id,
  intro,
  action,
}: {
  number?: string;
  label: string;
  title: string;
  id?: string;
  intro?: ReactNode;
  action?: ReactNode;
}) {
  return (
    // Avec une introduction : deux colonnes alignées en haut, l'introduction face au titre.
    // Avec un simple lien : le titre prend la largeur, le lien se cale sur sa dernière ligne.
    <div
      className={`section-rule grid gap-x-16 gap-y-6 pt-8 ${
        intro ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]' : 'lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end'
      }`}
    >
      <div>
        <p className="eyebrow">
          {number && (
            <>
              <span className="text-warm">{number}</span> <span aria-hidden>·</span>{' '}
            </>
          )}
          {label}
        </p>
        <h2 id={id} className="display mt-4 text-[clamp(2.4rem,5.6vw,4.25rem)] text-ink">
          <span className="mask-line">
            <span>{title}</span>
          </span>
        </h2>
      </div>
      {(intro || action) && (
        <div className={intro ? 'lg:pt-9' : 'lg:pb-1.5'}>
          {intro && <p className="max-w-[36rem] text-lg leading-relaxed text-ink-2">{intro}</p>}
          {action && <div className={intro ? 'mt-4' : ''}>{action}</div>}
        </div>
      )}
    </div>
  );
}

const stateStyles: Record<ProjectState, string> = {
  TERMINE: 'bg-done-bg text-accent',
  EN_COURS: 'bg-progress-bg text-progress',
  TERRAIN: 'bg-terrain-bg text-terrain',
  EXPERIMENTAL: 'bg-line text-ink-2',
};

export function StateBadge({ state }: { state: ProjectState }) {
  return <span className={`badge ${stateStyles[state]}`}>{projectStateLabel[state]}</span>;
}

export function Tags({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item} className="tag">
          {item}
        </li>
      ))}
    </ul>
  );
}

// Les icônes de marque ne font plus partie de Lucide : tracés fins maison, même épaisseur (1,8 px).
const brandProps: SVGProps<SVGSVGElement> = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export function GitHubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...brandProps} {...props}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export function LinkedInIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...brandProps} {...props}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

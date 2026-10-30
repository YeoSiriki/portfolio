'use client';

import { ArrowUpRight, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { PROJECT_CATEGORIES, type ProjectCategory, type ProjectState, projectCategoryLabel } from '@/lib/constants';
import { NAV_FORWARD, Shared } from './page-transition';
import { ProjectCover, coverBackground } from './project-cover';
import { RevealBox } from './reveal-observer';
import { StateBadge, Tags } from './ui';

export type ProjectCardData = {
  id: string;
  slug: string;
  title: string;
  category: ProjectCategory;
  state: ProjectState;
  year: number;
  summary: string;
  techs: string[];
  coverUrl: string | null;
};

type Filter = 'TOUS' | ProjectCategory;

/** Compare sans tenir compte des accents ni de la casse. */
const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function ProjectCard({ project, Heading }: { project: ProjectCardData; Heading: 'h2' | 'h3' }) {
  return (
    <article className="card lift group relative flex h-full flex-col overflow-hidden hover:border-field">
      <div
        className={`relative aspect-[16/10] overflow-hidden ${project.coverUrl ? 'bg-sand' : coverBackground[project.category]}`}
      >
        {project.coverUrl ? (
          <Image
            src={project.coverUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]"
          />
        ) : (
          // Sans capture : un dessin au trait propre à la catégorie, jamais d'image factice.
          <ProjectCover category={project.category} seed={project.slug} />
        )}
        <span
          className="absolute top-4 left-4 rounded-[6px] bg-surface/95 px-2.5 py-1 text-xs font-semibold tracking-[0.08em] text-ink uppercase"
          aria-hidden
        >
          {projectCategoryLabel[project.category]}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="meta-mono">
            <span className="sr-only">{projectCategoryLabel[project.category]}, </span>
            {project.year}
          </p>
          <StateBadge state={project.state} />
        </div>
        <Heading className="mt-3 font-serif text-[1.6rem] leading-tight font-medium text-ink">
          {/* Le lien couvre toute la carte : une seule cible, large, au clavier comme au toucher. */}
          <Link
            href={`/projets/${project.slug}`}
            transitionTypes={NAV_FORWARD}
            className="after:absolute after:inset-0 after:rounded-card"
          >
            {/* Élément partagé : ce titre devient celui de la fiche pendant la navigation. */}
            <Shared name={`titre-projet-${project.slug}`}>
              <span className="inline-block">{project.title}</span>
            </Shared>
          </Link>
        </Heading>
        {project.summary && <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-2">{project.summary}</p>}
        <div className="mt-5">
          <Tags items={project.techs} />
        </div>
        <p
          className="nudge mt-auto inline-flex items-center gap-1.5 pt-6 text-[0.95rem] font-semibold text-ink underline decoration-field underline-offset-4 transition-colors group-hover:decoration-accent"
          aria-hidden
        >
          Voir le projet <ArrowUpRight size={16} />
        </p>
      </div>
    </article>
  );
}

export function ProjectsExplorer({
  projects,
  withSearch = false,
  headingLevel = 3,
}: {
  projects: ProjectCardData[];
  withSearch?: boolean;
  /** Niveau de titre des cartes, pour respecter la hiérarchie de la page hôte. */
  headingLevel?: 2 | 3;
}) {
  const [filter, setFilter] = useState<Filter>('TOUS');
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLUListElement>(null);

  // Changement de filtre animé avec l'API View Transitions du navigateur : les cartes qui restent
  // glissent à leur place, les autres s'effacent. La mise à jour est appliquée de façon synchrone
  // (flushSync) : avec une transition React asynchrone, un texte tapé dans la recherche pendant
  // l'animation pouvait être perdu. Sans cette API, ou si les animations sont réduites, le
  // changement est immédiat.
  const selectFilter = (next: Filter) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || reduced) {
      setFilter(next);
      return;
    }
    // Chaque carte porte un nom le temps de la transition seulement, pour ne pas interférer avec
    // les transitions de page gérées par React.
    const cards = () => listRef.current?.querySelectorAll<HTMLElement>('li[data-card]') ?? [];
    const tag = () => {
      for (const card of cards()) {
        card.style.setProperty('view-transition-name', `carte-${card.dataset.card}`);
        card.style.setProperty('view-transition-class', 'card');
      }
    };
    const untag = () => {
      for (const card of cards()) {
        card.style.removeProperty('view-transition-name');
        card.style.removeProperty('view-transition-class');
      }
    };

    tag();
    const transition = document.startViewTransition(() => {
      flushSync(() => setFilter(next));
      tag();
    });
    void transition.finished.finally(untag);
  };

  const visible = useMemo(() => {
    const needle = normalize(query.trim());
    return projects.filter((project) => {
      if (filter !== 'TOUS' && project.category !== filter) return false;
      if (!needle) return true;
      const haystack = normalize(
        [project.title, project.summary, projectCategoryLabel[project.category], ...project.techs].join(' '),
      );
      return haystack.includes(needle);
    });
  }, [projects, filter, query]);

  const filters: { value: Filter; label: string }[] = [
    { value: 'TOUS', label: `Tous (${projects.length})` },
    ...PROJECT_CATEGORIES.map((category) => ({ value: category, label: projectCategoryLabel[category] })),
  ];

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Filtrer par catégorie" className="flex flex-wrap gap-2">
          {filters.map((item) => {
            const active = item.value === filter;
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={active}
                onClick={() => selectFilter(item.value)}
                className={`inline-flex min-h-11 items-center rounded-[8px] border px-4 text-[0.9rem] font-semibold transition-colors duration-300 ${
                  active ? 'border-accent bg-accent text-on-accent' : 'border-field text-ink hover:border-ink-3'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {withSearch && (
          <div className="relative w-full lg:w-80">
            <label htmlFor="recherche-projets" className="sr-only">
              Rechercher un projet
            </label>
            <Search
              size={17}
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3"
              aria-hidden
            />
            <input
              id="recherche-projets"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Titre, technologie, mot-clé..."
              className="field pl-10"
            />
          </div>
        )}
      </div>

      <p className="sr-only" role="status">
        {visible.length} projet{visible.length > 1 ? 's' : ''} affiché{visible.length > 1 ? 's' : ''}
      </p>

      {visible.length > 0 ? (
        <ul ref={listRef} data-reveal-group className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((project) => (
            <li key={project.id} data-card={project.id}>
              <RevealBox className="h-full">
                <ProjectCard project={project} Heading={headingLevel === 2 ? 'h2' : 'h3'} />
              </RevealBox>
            </li>
          ))}
        </ul>
      ) : (
        <p className="card mt-8 p-8 text-center text-ink-2">Aucun projet ne correspond à cette recherche.</p>
      )}
    </div>
  );
}

// Vues de détail, utilisées à la fois par le site public et par l'aperçu de l'admin.
import { ArrowLeft, ArrowUpRight, Download, FileText } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  type ProjectCategory,
  type ProjectState,
  type PublicationStatus,
  type PublicationType,
  projectCategoryLabel,
  publicationStatusLabel,
  publicationTypeLabel,
} from '@/lib/constants';
import { formatDate, formatPoint } from '@/lib/format';
import { ClusterDiagram } from './cluster-diagram';
import { Markdown } from './markdown';
import { NAV_BACK, NAV_FORWARD, Shared } from './page-transition';
import { ProjectCover, coverBackground } from './project-cover';
import { Container, SectionLabel, StateBadge, Tags } from './ui';

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      transitionTypes={NAV_BACK}
      className="nudge-back -ml-2 inline-flex min-h-11 items-center gap-2 px-2 font-mono text-[0.8125rem] text-ink-2 hover:text-accent"
    >
      <ArrowLeft size={16} aria-hidden /> {children}
    </Link>
  );
}

export function PageHeader({ label, title, intro }: { label: string; title: string; intro?: string }) {
  return (
    <header>
      <SectionLabel className="rise">{label}</SectionLabel>
      <h1 className="display rise-soft mt-3 text-[clamp(2.4rem,7vw,4.75rem)] text-ink">{title}</h1>
      {intro && <p className="rise-soft mt-5 max-w-[44rem] text-lg leading-relaxed text-ink-2">{intro}</p>}
    </header>
  );
}

function AsideBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-t border-line pt-5">
      <h2 className="font-mono text-xs tracking-[0.12em] text-ink-3 uppercase">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export type ProjectViewData = {
  slug: string;
  title: string;
  category: ProjectCategory;
  state: ProjectState;
  year: number;
  summary: string;
  role: string;
  body: string;
  techs: string[];
  linkUrl: string | null;
  coverUrl: string | null;
  images: { url: string; alt: string }[];
};

export function ProjectView({ project }: { project: ProjectViewData }) {
  return (
    <article className="py-10 sm:py-14">
      <Container>
        <BackLink href="/projets">Tous les projets</BackLink>

        <header className="rise-soft mt-6">
          <div className="flex flex-wrap items-center gap-3">
            <p className="meta-mono">
              {projectCategoryLabel[project.category]} <span aria-hidden>·</span> {project.year}
            </p>
            <StateBadge state={project.state} />
          </div>
          <Shared name={`titre-projet-${project.slug}`}>
            <h1 className="display mt-4 text-[clamp(2.2rem,6.5vw,4.5rem)] text-ink">{project.title}</h1>
          </Shared>
          {project.summary && (
            <p className="mt-6 max-w-[46rem] text-xl leading-relaxed text-ink-2">{project.summary}</p>
          )}
        </header>

        {project.coverUrl ? (
          <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-card border border-line bg-surface">
            <Image
              src={project.coverUrl}
              alt={`Illustration du projet ${project.title}`}
              fill
              priority
              sizes="(min-width: 1240px) 1176px, 100vw"
              className="object-cover"
            />
          </div>
        ) : (
          // Même dessin que sur la carte du projet, en bandeau.
          <div
            className={`relative mt-10 aspect-[16/9] overflow-hidden rounded-card sm:aspect-[2/1] ${coverBackground[project.category]}`}
          >
            <ProjectCover category={project.category} seed={project.slug} />
          </div>
        )}

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16">
          <div>{project.body ? <Markdown>{project.body}</Markdown> : null}</div>

          <aside className="space-y-7">
            {project.role && (
              <AsideBlock title="Mon rôle">
                <p className="text-[0.95rem] leading-relaxed text-ink-2">{project.role}</p>
              </AsideBlock>
            )}
            {project.techs.length > 0 && (
              <AsideBlock title="Technologies">
                <Tags items={project.techs} />
              </AsideBlock>
            )}
            {project.linkUrl && (
              <AsideBlock title="Lien">
                <a
                  href={project.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link nudge inline-flex min-h-11 items-center gap-1.5 break-all text-ink"
                >
                  {project.linkUrl.replace(/^https?:\/\/(www\.)?/, '')}{' '}
                  <ArrowUpRight size={15} className="shrink-0" aria-hidden />
                  <span className="sr-only">(nouvel onglet)</span>
                </a>
              </AsideBlock>
            )}
          </aside>
        </div>

        {project.images.length > 0 && (
          <section aria-labelledby="titre-galerie" className="mt-16">
            <h2 id="titre-galerie" className="font-mono text-xs tracking-[0.12em] text-ink-3 uppercase">
              Galerie
            </h2>
            <ul className="mt-5 grid gap-5 sm:grid-cols-2">
              {project.images.map((image) => (
                <li key={image.url}>
                  <figure>
                    <div className="relative aspect-[16/10] overflow-hidden rounded-card border border-line bg-surface">
                      <Image
                        src={image.url}
                        alt={image.alt}
                        fill
                        sizes="(min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                    {image.alt && <figcaption className="mt-2 text-sm text-ink-3">{image.alt}</figcaption>}
                  </figure>
                </li>
              ))}
            </ul>
          </section>
        )}
      </Container>
    </article>
  );
}

export type PublicationViewData = {
  slug: string;
  type: PublicationType;
  status: PublicationStatus;
  title: string;
  authors: string;
  venue: string;
  date: string;
  abstract: string;
  keywords: string[];
  url: string | null;
  pdfUrl: string | null;
  hasPage: boolean;
  body: string;
};

function PublicationMeta({ publication }: { publication: PublicationViewData }) {
  return (
    <p className="meta-mono">
      {[
        publicationTypeLabel[publication.type],
        publicationStatusLabel[publication.status],
        publication.date && formatPoint(publication.date),
      ]
        .filter(Boolean)
        .join(' · ')}
    </p>
  );
}

function PublicationLinks({ publication }: { publication: PublicationViewData }) {
  if (!publication.pdfUrl && !publication.url) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {publication.pdfUrl && (
        <a href={publication.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary nudge-down">
          <Download size={17} aria-hidden /> Télécharger le PDF
        </a>
      )}
      {publication.url && (
        <a href={publication.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary nudge">
          Consulter en ligne <ArrowUpRight size={17} aria-hidden />
        </a>
      )}
    </div>
  );
}

export function PublicationCard({ publication }: { publication: PublicationViewData }) {
  return (
    <article className="card p-7 sm:p-9">
      <PublicationMeta publication={publication} />
      <h2 className="mt-3 font-serif text-[1.75rem] leading-tight font-medium text-ink">
        {publication.hasPage ? (
          <Link href={`/recherche/${publication.slug}`} transitionTypes={NAV_FORWARD} className="link">
            <Shared name={`titre-publication-${publication.slug}`}>
              <span className="inline-block">{publication.title}</span>
            </Shared>
          </Link>
        ) : (
          publication.title
        )}
      </h2>
      {(publication.authors || publication.venue) && (
        <p className="mt-2 text-[0.95rem] text-ink-2">
          {[publication.authors, publication.venue].filter(Boolean).join(', ')}
        </p>
      )}
      {publication.abstract && <p className="mt-4 max-w-[52rem] leading-relaxed text-ink-2">{publication.abstract}</p>}
      {publication.keywords.length > 0 && (
        <div className="mt-5">
          <Tags items={publication.keywords} />
        </div>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        {publication.hasPage && (
          <Link
            href={`/recherche/${publication.slug}`}
            transitionTypes={NAV_FORWARD}
            className="btn btn-primary nudge-x"
          >
            <FileText size={17} aria-hidden /> Lire la page dédiée
          </Link>
        )}
        <PublicationLinks publication={publication} />
      </div>
    </article>
  );
}

/** Page dédiée d'une publication (la page SCAT). Les chiffres clés viennent du bloc d'accueil. */
export function PublicationPage({
  publication,
  kpis,
}: {
  publication: PublicationViewData;
  kpis: { value: string; label: string }[];
}) {
  return (
    <article className="py-10 sm:py-14">
      <Container>
        <BackLink href="/recherche">Recherche et publications</BackLink>

        <header className="rise-soft mt-6 grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-16">
          <div>
            <PublicationMeta publication={publication} />
            <Shared name={`titre-publication-${publication.slug}`}>
              <h1 className="display mt-4 text-[clamp(2rem,5.2vw,3.6rem)] leading-[1.02] text-ink">
                {publication.title}
              </h1>
            </Shared>
            {(publication.authors || publication.venue) && (
              <p className="mt-5 text-lg text-ink-2">
                {[publication.authors, publication.venue].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
          <ClusterDiagram />
        </header>

        {kpis.length > 0 && (
          <dl className="mt-10 grid overflow-hidden rounded-card border border-line md:grid-cols-3">
            {kpis.map((kpi, index) => (
              <div key={kpi.value} className="-mt-px -ml-px border-t border-l border-line p-7">
                <dt className={`display text-[clamp(1.9rem,4vw,2.75rem)] ${index === 0 ? 'text-accent' : 'text-ink'}`}>
                  {kpi.value}
                </dt>
                <dd className="mt-2 text-[0.95rem] leading-snug text-ink-2">{kpi.label}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16">
          <div>
            {publication.abstract && <p className="text-xl leading-relaxed text-ink">{publication.abstract}</p>}
            {publication.body && (
              <div className="mt-10">
                <Markdown>{publication.body}</Markdown>
              </div>
            )}
          </div>

          <aside className="space-y-7">
            {publication.keywords.length > 0 && (
              <AsideBlock title="Mots-clés">
                <Tags items={publication.keywords} />
              </AsideBlock>
            )}
            {(publication.pdfUrl || publication.url) && (
              <AsideBlock title="Document">
                <PublicationLinks publication={publication} />
              </AsideBlock>
            )}
          </aside>
        </div>
      </Container>
    </article>
  );
}

export type PostViewData = {
  slug: string;
  title: string;
  category: string;
  publishAt: Date | null;
  readTime: number;
  coverUrl: string | null;
  excerpt: string;
  content: string;
};

export function PostView({ post }: { post: PostViewData }) {
  return (
    <article className="py-10 sm:py-14">
      <Container className="max-w-[820px]">
        <BackLink href="/blog">Tous les articles</BackLink>

        <header className="rise-soft mt-6">
          <p className="meta-mono">
            {[
              post.category,
              post.publishAt && formatDate(post.publishAt),
              post.readTime > 0 && `${post.readTime} min de lecture`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <Shared name={`titre-article-${post.slug}`}>
            <h1 className="display mt-4 text-[clamp(2rem,5.5vw,3.5rem)] leading-[1.03] text-ink">{post.title}</h1>
          </Shared>
          {post.excerpt && <p className="mt-6 text-xl leading-relaxed text-ink-2">{post.excerpt}</p>}
        </header>

        {post.coverUrl && (
          <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-card border border-line bg-surface">
            <Image
              src={post.coverUrl}
              alt=""
              fill
              priority
              sizes="(min-width: 820px) 756px, 100vw"
              className="object-cover"
            />
          </div>
        )}

        <div className="mt-10">
          <Markdown>{post.content}</Markdown>
        </div>
      </Container>
    </article>
  );
}

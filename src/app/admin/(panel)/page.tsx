import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AdminPageHeader } from '@/components/admin/page-header';
import { prisma } from '@/lib/db';
import { formatRelative } from '@/lib/format';
import { requireAdmin } from '@/lib/guard';
import { mailConfigured } from '@/lib/mail';
import { siteUrl } from '@/lib/site';
import { storageKind } from '@/lib/storage';

export const metadata: Metadata = { title: 'Tableau de bord' };

type Todo = { label: string; href: string };

// Sections attendues sur la page de recherche dédiée (cahier des charges, section 5.1).
const RESEARCH_SECTIONS = ['Objectifs', 'Limites', 'Perspectives'];

/** Liste « À compléter », calculée à partir de l'état réel du contenu et de la configuration. */
async function buildTodos(): Promise<Todo[]> {
  const [profile, projects, publications, publishedResources, publishedPosts] = await Promise.all([
    prisma.profile.findUnique({ where: { id: 1 } }),
    prisma.project.findMany({ select: { title: true, coverUrl: true, isPublished: true } }),
    prisma.publication.findMany({ where: { hasPage: true }, select: { title: true, pdfUrl: true, body: true } }),
    prisma.resource.count({ where: { status: 'PUBLIE' } }),
    prisma.post.count({ where: { status: 'PUBLIE' } }),
  ]);

  const todos: Todo[] = [];
  const add = (condition: unknown, label: string, href: string) => {
    if (condition) todos.push({ label, href });
  };

  add(!profile?.photoUrl, 'Ajouter une photo professionnelle', '/admin/reglages');
  add(!profile?.cvFrUrl, 'Téléverser le CV français (PDF)', '/admin/reglages');
  add(!profile?.cvEnUrl, 'Téléverser le CV anglais (PDF)', '/admin/reglages');
  add(!profile?.linkedinUrl, 'Renseigner le lien LinkedIn', '/admin/reglages');

  const hidden = projects.filter((project) => !project.isPublished);
  add(
    hidden.length > 0,
    `Confirmer puis publier : ${hidden.map((project) => project.title).join(', ')}`,
    '/admin/projets',
  );
  const withoutCover = projects.filter((project) => project.isPublished && !project.coverUrl);
  add(withoutCover.length > 0, `Ajouter une capture à ${withoutCover.length} projet(s) visible(s)`, '/admin/projets');

  for (const publication of publications) {
    add(!publication.pdfUrl, `Téléverser le PDF : ${publication.title}`, '/admin/recherche');
    const missing = RESEARCH_SECTIONS.filter((section) => !publication.body.includes(`## ${section}`));
    add(missing.length > 0, `Page dédiée, sections à rédiger : ${missing.join(', ')}`, '/admin/recherche');
  }

  add(publishedResources === 0, 'Publier une première ressource pédagogique', '/admin/enseignement');
  add(publishedPosts === 0, 'Publier un premier article', '/admin/blog');
  add(!profile?.privacyPolicy || !profile?.termsOfUse, 'Relire les pages légales', '/admin/reglages?onglet=legal');

  // Configuration technique.
  add(
    !mailConfigured(),
    "Configurer l'envoi d'e-mails (variables SMTP_*) pour être notifié des messages",
    '/admin/messages',
  );
  add(siteUrl.includes('localhost'), 'Brancher le nom de domaine (variable NEXT_PUBLIC_SITE_URL)', '/admin/reglages');
  add(
    process.env.NODE_ENV === 'production' && storageKind() === 'local',
    'Configurer le stockage S3 (variables S3_*) pour conserver les fichiers en production',
    '/admin/reglages',
  );

  return todos;
}

export default async function DashboardPage() {
  await requireAdmin();

  const [
    visibleProjects,
    hiddenProjects,
    unread,
    totalMessages,
    publications,
    publishedPosts,
    draftPosts,
    latest,
    todos,
  ] = await Promise.all([
    prisma.project.count({ where: { isPublished: true } }),
    prisma.project.count({ where: { isPublished: false } }),
    prisma.message.count({ where: { status: 'NEW' } }),
    prisma.message.count({ where: { status: { in: ['NEW', 'READ'] } } }),
    prisma.publication.count(),
    prisma.post.count({ where: { status: 'PUBLIE' } }),
    prisma.post.count({ where: { status: { not: 'PUBLIE' } } }),
    prisma.message.findMany({ where: { status: { in: ['NEW', 'READ'] } }, orderBy: { createdAt: 'desc' }, take: 5 }),
    buildTodos(),
  ]);
  const now = new Date();

  const stats = [
    {
      label: 'Projets visibles',
      value: visibleProjects,
      detail: `${hiddenProjects} masqué(s)`,
      href: '/admin/projets',
      accent: false,
    },
    {
      label: 'Messages non lus',
      value: unread,
      detail: `${totalMessages} dans la boîte`,
      href: '/admin/messages',
      accent: unread > 0,
    },
    {
      label: 'Publications',
      value: publications,
      detail: 'Mémoire, articles, communications',
      href: '/admin/recherche',
      accent: false,
    },
    {
      label: 'Articles publiés',
      value: publishedPosts,
      detail: `${draftPosts} brouillon(s) ou programmé(s)`,
      href: '/admin/blog',
      accent: false,
    },
  ];

  return (
    <>
      <AdminPageHeader breadcrumb="/Admin" title="Tableau de bord" />

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <li key={stat.label}>
            <Link href={stat.href} className="card block bg-surface-admin p-6 transition-colors hover:border-field">
              <p className="text-sm font-semibold text-ink-2">{stat.label}</p>
              <p className={`display mt-3 text-5xl ${stat.accent ? 'text-accent' : 'text-ink'}`}>{stat.value}</p>
              <p className="mt-2 text-sm text-ink-3">{stat.detail}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section aria-labelledby="titre-derniers-messages" className="card bg-surface-admin p-6 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <h2 id="titre-derniers-messages" className="text-lg font-bold [font-stretch:112%] text-ink">
              Derniers messages
            </h2>
            <Link
              href="/admin/messages"
              className="link nudge-x inline-flex min-h-11 items-center gap-1.5 text-sm text-ink"
            >
              Tout voir <ArrowRight size={15} aria-hidden />
            </Link>
          </div>
          {latest.length > 0 ? (
            <ul className="mt-2 divide-y divide-line">
              {latest.map((message) => (
                <li key={message.id}>
                  <Link
                    href={`/admin/messages?id=${message.id}`}
                    className="flex min-h-14 items-center gap-3 py-3 hover:text-accent"
                  >
                    <span
                      className={`size-2 shrink-0 rounded-full ${message.status === 'NEW' ? 'bg-accent' : 'bg-field'}`}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.95rem] font-semibold text-ink">{message.name}</span>
                      <span className="block truncate text-sm text-ink-3">{message.topic}</span>
                    </span>
                    <span className="meta-mono shrink-0 text-xs">{formatRelative(message.createdAt, now)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-ink-3">Aucun message pour le moment.</p>
          )}
        </section>

        <section aria-labelledby="titre-a-completer" className="card bg-surface-admin p-6 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <h2 id="titre-a-completer" className="text-lg font-bold [font-stretch:112%] text-ink">
              À compléter
            </h2>
            <span className="meta-mono text-xs">{todos.length} restant(s)</span>
          </div>
          {todos.length > 0 ? (
            <ul className="mt-3 space-y-1">
              {todos.map((todo) => (
                <li key={todo.label}>
                  <Link
                    href={todo.href}
                    className="flex min-h-11 items-start gap-3 py-2 text-[0.95rem] text-ink-2 hover:text-ink"
                  >
                    <span className="mt-1.5 size-2 shrink-0 rounded-[3px] border border-ink-3" aria-hidden />
                    {todo.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-ink-3">Tout est complet.</p>
          )}
        </section>
      </div>
    </>
  );
}

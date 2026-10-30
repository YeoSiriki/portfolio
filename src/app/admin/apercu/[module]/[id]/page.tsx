import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { type ReactNode, Suspense } from 'react';
import { EducationItem, ExperienceItem } from '@/components/sections';
import { Container } from '@/components/ui';
import { PostView, ProjectView, PublicationCard, PublicationPage } from '@/components/views';
import { resourceKindLabel } from '@/lib/constants';
import { prisma } from '@/lib/db';
import { isModuleKey } from '@/lib/forms';
import { requireAdmin } from '@/lib/guard';
import { homeSchema } from '@/lib/schemas';

export const metadata: Metadata = {
  title: 'Aperçu',
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ module: string; id: string }> };

function Framed({ children }: { children: ReactNode }) {
  return <Container className="max-w-[820px] py-12">{children}</Container>;
}

// Aperçu : rend un élément avec les composants du site public, qu'il soit publié ou non.
async function Preview({ params }: Props) {
  await requireAdmin();
  const { module: key, id } = await params;
  if (!isModuleKey(key)) notFound();

  let view: ReactNode = null;
  let published = false;

  if (key === 'projets') {
    const project = await prisma.project.findUnique({
      where: { id },
      include: { images: { orderBy: { position: 'asc' } } },
    });
    if (project) {
      published = project.isPublished;
      view = <ProjectView project={project} />;
    }
  } else if (key === 'recherche') {
    const [publication, profile] = await Promise.all([
      prisma.publication.findUnique({ where: { id } }),
      prisma.profile.findUnique({ where: { id: 1 } }),
    ]);
    if (publication) {
      published = publication.isPublished;
      const kpis = profile ? homeSchema.parse(profile.home).scat.kpis.filter((kpi) => kpi.value) : [];
      view = publication.hasPage ? (
        <PublicationPage publication={publication} kpis={kpis} />
      ) : (
        <Framed>
          <PublicationCard publication={publication} />
        </Framed>
      );
    }
  } else if (key === 'blog') {
    const post = await prisma.post.findUnique({ where: { id } });
    if (post) {
      published = post.status === 'PUBLIE';
      view = <PostView post={post} />;
    }
  } else if (key === 'experiences') {
    const experience = await prisma.experience.findUnique({ where: { id } });
    if (experience) {
      published = experience.isPublished;
      view = (
        <Framed>
          <ExperienceItem experience={experience} level={2} />
        </Framed>
      );
    }
  } else if (key === 'formation') {
    const education = await prisma.education.findUnique({ where: { id }, omit: { proofUrl: true } });
    if (education) {
      published = education.isPublished;
      view = (
        <Framed>
          <EducationItem education={education} level={2} />
        </Framed>
      );
    }
  } else {
    const resource = await prisma.resource.findUnique({ where: { id } });
    if (resource) {
      published = resource.status === 'PUBLIE';
      view = (
        <Framed>
          <div className="card p-6">
            <p className="meta-mono">
              {[resource.level, resourceKindLabel[resource.kind], resource.subject].filter(Boolean).join(' · ')}
            </p>
            <h1 className="mt-3 text-lg font-bold text-ink">{resource.title}</h1>
            {resource.description && (
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-2">{resource.description}</p>
            )}
            <p className="mt-5 text-sm text-ink-3">
              {resource.fileUrl && resource.allowDownload
                ? 'Téléchargement proposé aux visiteurs.'
                : 'Document consultable sur demande.'}
            </p>
          </div>
        </Framed>
      );
    }
  }

  if (!view) notFound();

  return (
    <>
      <div className="sticky top-0 z-50 border-b border-line bg-surface">
        <Container className="flex min-h-12 flex-wrap items-center justify-between gap-3 py-2 font-mono text-[0.8125rem]">
          <p className="text-ink">
            Aperçu{' '}
            <span className="text-ink-3">· {published ? 'élément visible sur le site' : 'élément non publié'}</span>
          </p>
          <Link href={`/admin/${key}?id=${id}`} className="link text-ink">
            Revenir à l&apos;édition
          </Link>
        </Container>
      </div>
      <main>{view}</main>
    </>
  );
}

export default function PreviewPage(props: Props) {
  return (
    <Suspense fallback={<p className="p-10 font-mono text-sm text-ink-3">Chargement de l&apos;aperçu...</p>}>
      <Preview {...props} />
    </Suspense>
  );
}

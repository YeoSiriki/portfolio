import { PageTransition } from '@/components/page-transition';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProjectView } from '@/components/views';
import { getProjectBySlug, getProjects } from '@/lib/queries';

type Props = { params: Promise<{ slug: string }> };

// La page attend son contenu complet avant de s'afficher : une adresse inconnue reçoit ainsi un vrai
// code 404, et le titre de la carte peut se transformer en titre de la fiche pendant la navigation.
export const instant = false;

// Les fiches connues sont générées à la construction ; les nouvelles le sont à la première visite.
// Next.js exige au moins une valeur : « __aucun__ » sert de repli si aucun projet n'est publié.
export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.length > 0 ? projects.map((project) => ({ slug: project.slug })) : [{ slug: '__aucun__' }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await getProjectBySlug((await params).slug);
  if (!project) return { title: 'Projet introuvable' };
  return {
    title: project.title,
    description: project.summary || undefined,
    alternates: { canonical: `/projets/${project.slug}` },
    openGraph: { title: project.title, description: project.summary || undefined, type: 'article' },
  };
}

export default async function ProjectPage({ params }: Props) {
  const project = await getProjectBySlug((await params).slug);
  if (!project) notFound();
  return (
    <PageTransition>
      <ProjectView project={project} />
    </PageTransition>
  );
}

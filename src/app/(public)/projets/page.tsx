import { PageTransition } from '@/components/page-transition';
import type { Metadata } from 'next';
import { ProjectsExplorer } from '@/components/projects-explorer';
import { Container } from '@/components/ui';
import { PageHeader } from '@/components/views';
import { getProjects } from '@/lib/queries';

export const metadata: Metadata = {
  title: 'Projets',
  description: 'Projets de recherche, de réseaux, de développement et d’enseignement, filtrables par catégorie.',
  alternates: { canonical: '/projets' },
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <PageTransition>
      <Container className="py-12 sm:py-16">
        <PageHeader label="/Projets" title="Ce que j'ai réalisé" />
        <div className="mt-10">
          <ProjectsExplorer projects={projects} withSearch headingLevel={2} />
        </div>
      </Container>
    </PageTransition>
  );
}

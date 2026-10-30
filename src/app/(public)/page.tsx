import { PageTransition } from '@/components/page-transition';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Hero } from '@/components/hero';
import { Marquee } from '@/components/marquee';
import { Reveal } from '@/components/motion';
import { ProjectsExplorer } from '@/components/projects-explorer';
import { ScatHighlight } from '@/components/scat-highlight';
import { ContactBlock, Journey, SkillsGrid, TeachingBlocks } from '@/components/sections';
import { Container, SectionHeading } from '@/components/ui';
import { getEducation, getExperiences, getProfile, getProjects, getPublications, getSkillGroups } from '@/lib/queries';
import { jsonLd, siteUrl } from '@/lib/site';

function SectionLink({ href, children }: { href: string; children: string }) {
  return (
    <Link href={href} className="link nudge-x inline-flex min-h-11 items-center gap-2 font-semibold text-ink">
      {children} <ArrowRight size={17} aria-hidden />
    </Link>
  );
}

export default async function HomePage() {
  const [profile, projects, publications, experiences, education, skills] = await Promise.all([
    getProfile(),
    getProjects(),
    getPublications(),
    getExperiences(),
    getEducation(),
    getSkillGroups(),
  ]);
  const researchPage = publications.find((publication) => publication.hasPage);
  const master = education.find((item) => item.kind === 'DIPLOME');
  const current = experiences.find((item) => item.isCurrent) ?? experiences[0];

  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.fullName,
    alternateName: profile.shortName,
    url: siteUrl,
    jobTitle: profile.headline,
    description: profile.bio,
    email: `mailto:${profile.publicEmail}`,
    address: { '@type': 'PostalAddress', addressLocality: profile.city },
    ...(master?.school ? { alumniOf: { '@type': 'CollegeOrUniversity', name: master.school } } : {}),
    sameAs: [profile.githubUrl, profile.linkedinUrl].filter(Boolean),
  };

  return (
    <PageTransition>
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(person) }} />

        <Hero profile={profile} current={current} diploma={master} />
        <Marquee items={profile.tickerItems} />
        <ScatHighlight scat={profile.home.scat} pageHref={researchPage ? `/recherche/${researchPage.slug}` : null} />

        {/* Sections numérotées comme un article ; les fonds alternent (blanc cassé, gris chaud). */}
        <section id="projets" aria-labelledby="titre-projets" className="band-sand py-20 sm:py-28">
          <Container>
            <Reveal>
              <SectionHeading
                number="02"
                label="Projets"
                title="Ce que j'ai réalisé"
                id="titre-projets"
                action={<SectionLink href="/projets">Tous les projets</SectionLink>}
              />
            </Reveal>
            <div className="mt-12">
              <ProjectsExplorer projects={projects} />
            </div>
          </Container>
        </section>

        <section id="competences" aria-labelledby="titre-competences" className="py-20 sm:py-28">
          <Container>
            <Reveal>
              <SectionHeading number="03" label="Compétences" title="Ma boîte à outils" id="titre-competences" />
            </Reveal>
            <div className="mt-12">
              <SkillsGrid groups={skills} />
            </div>
          </Container>
        </section>

        <section id="parcours" aria-labelledby="titre-parcours" className="band-sand py-20 sm:py-28">
          <Container>
            <Reveal>
              <SectionHeading
                number="04"
                label="Parcours"
                title="Expériences & formation"
                id="titre-parcours"
                action={<SectionLink href="/parcours">Parcours complet</SectionLink>}
              />
            </Reveal>
            <div className="mt-12">
              <Journey experiences={experiences} education={education} languages={profile.home.languages} />
            </div>
          </Container>
        </section>

        <section id="enseignement" aria-labelledby="titre-enseignement" className="py-20 sm:py-28">
          <Container>
            <Reveal>
              <SectionHeading
                number="05"
                label="Enseignement"
                title="Transmettre"
                id="titre-enseignement"
                intro={profile.home.teaching.intro}
                action={<SectionLink href="/enseignement">Toutes les ressources</SectionLink>}
              />
            </Reveal>
            <div className="mt-12">
              <TeachingBlocks blocks={profile.home.teaching.blocks} />
            </div>
          </Container>
        </section>

        <section id="contact" aria-labelledby="titre-contact" className="theme-inverse py-20 sm:py-28">
          <Container>
            <ContactBlock profile={profile} headingId="titre-contact" number="06" />
          </Container>
        </section>
      </>
    </PageTransition>
  );
}

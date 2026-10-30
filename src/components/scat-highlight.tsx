import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { HomeContent } from '@/lib/schemas';
import { ClusterDiagram } from './cluster-diagram';
import { Reveal, RevealGroup, RevealItem } from './motion';
import { NAV_FORWARD } from './page-transition';
import { Container, SectionHeading } from './ui';

/** Le mémoire présenté comme un article : en-tête, problème et solution face au schéma, résultats, phases. */
export function ScatHighlight({ scat, pageHref }: { scat: HomeContent['scat']; pageHref: string | null }) {
  return (
    <section id="recherche" aria-labelledby="titre-recherche" className="py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading
            number="01"
            label="Recherche · projet phare"
            title={scat.title}
            id="titre-recherche"
            intro={scat.tagline}
            action={
              pageHref && (
                <Link
                  href={pageHref}
                  transitionTypes={NAV_FORWARD}
                  className="link nudge-x inline-flex min-h-11 items-center gap-2 font-semibold text-ink"
                >
                  Lire l&apos;étude complète <ArrowRight size={17} aria-hidden />
                </Link>
              )
            }
          />
        </Reveal>

        <div className="mt-14 grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <RevealGroup className="space-y-10">
            <RevealItem>
              <h3 className="font-serif text-[1.75rem] font-medium text-ink">Le problème</h3>
              <p className="mt-3 text-[1.05rem] leading-relaxed text-ink-2">{scat.problem}</p>
            </RevealItem>
            <RevealItem>
              <h3 className="font-serif text-[1.75rem] font-medium text-ink">La solution</h3>
              <p className="mt-3 text-[1.05rem] leading-relaxed text-ink-2">{scat.solution}</p>
            </RevealItem>
          </RevealGroup>
          <Reveal>
            <ClusterDiagram />
          </Reveal>
        </div>

        {/* Résultats : chaque valeur monte à son tour. */}
        <dl data-reveal-group className="mt-14 grid border-y border-line md:grid-cols-3">
          {scat.kpis.map((kpi, index) => (
            <RevealItem
              key={kpi.value}
              className="border-line py-8 max-md:not-first:border-t md:px-8 md:first:pl-0 md:not-first:border-l"
            >
              <dt className={`display text-[clamp(2.2rem,3.6vw,3rem)] ${index === 0 ? 'text-accent' : 'text-ink'}`}>
                {kpi.value}
              </dt>
              <dd className="mt-2 text-[0.95rem] leading-snug text-ink-2">{kpi.label}</dd>
            </RevealItem>
          ))}
        </dl>

        {/* Les trois phases : un filet d'accent se trace sur chacune, l'une après l'autre. */}
        <RevealGroup className="mt-12 grid gap-8 md:grid-cols-3">
          {scat.phases.map((phase, index) => (
            <RevealItem key={phase.title} className="draw-line pt-6">
              <p className="eyebrow">Phase {String(index + 1).padStart(2, '0')}</p>
              <h3 className="mt-2 font-serif text-[1.5rem] font-medium text-ink">{phase.title}</h3>
              <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-2">{phase.text}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}

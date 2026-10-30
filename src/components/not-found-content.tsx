import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Container, SectionLabel } from './ui';

/** Message de la page 404, partagé par la page racine et celle du site public. */
export function NotFoundContent() {
  return (
    <Container className="flex flex-1 flex-col justify-center py-16 sm:py-24">
      <SectionLabel className="rise">/Erreur 404</SectionLabel>
      <h1
        className="display rise-soft mt-4 text-[clamp(2.75rem,9vw,6.5rem)] text-ink"
        style={{ animationDelay: '120ms' }}
      >
        Page introuvable
      </h1>
      <p className="rise mt-6 max-w-xl text-lg leading-relaxed text-ink-2" style={{ animationDelay: '200ms' }}>
        Cette adresse n&apos;existe pas ou a été déplacée.
      </p>
      <div className="rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: '280ms' }}>
        <Link href="/" className="btn btn-primary nudge-x">
          Retour à l&apos;accueil <ArrowRight size={17} aria-hidden />
        </Link>
        <Link href="/projets" className="btn btn-secondary">
          Voir les projets
        </Link>
      </div>
    </Container>
  );
}

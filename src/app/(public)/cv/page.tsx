import { PageTransition } from '@/components/page-transition';
import { Download } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui';
import { PageHeader } from '@/components/views';
import { getProfile } from '@/lib/queries';
import { slugify } from '@/lib/slug';

export const metadata: Metadata = {
  title: 'CV',
  description: 'Aperçu et téléchargement du curriculum vitae.',
  alternates: { canonical: '/cv' },
};

export default async function CvPage() {
  const profile = await getProfile();
  const fileName = `cv-${slugify(profile.shortName)}`;
  const versions = [
    { label: 'CV en français', url: profile.cvFrUrl, file: `${fileName}.pdf` },
    { label: 'CV en anglais', url: profile.cvEnUrl, file: `${fileName}-en.pdf` },
  ].filter((version): version is { label: string; url: string; file: string } => Boolean(version.url));
  const preview = versions[0];

  return (
    <PageTransition>
      <Container className="py-12 sm:py-16">
        <PageHeader label="/CV" title="Curriculum vitae" />

        {preview ? (
          <>
            <ul className="mt-8 flex flex-wrap gap-3">
              {versions.map((version, index) => (
                <li key={version.url}>
                  <a
                    href={version.url}
                    download={version.file}
                    className={`btn nudge-down ${index === 0 ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    <Download size={17} aria-hidden /> Télécharger le {version.label} (PDF)
                  </a>
                </li>
              ))}
            </ul>

            {/* Aperçu intégré : masqué sur petit écran, où les navigateurs affichent mal les PDF. */}
            <div className="mt-8 hidden overflow-hidden rounded-card border border-line bg-surface md:block">
              <iframe
                src={`${preview.url}#view=FitH`}
                title={`Aperçu du ${preview.label}`}
                className="h-[80vh] w-full"
              />
            </div>
          </>
        ) : (
          <p className="card mt-10 p-8 text-ink-2">
            Le CV sera bientôt disponible ici. En attendant, le{' '}
            <Link href="/parcours" className="link text-ink">
              parcours détaillé
            </Link>{' '}
            est en ligne.
          </p>
        )}
      </Container>
    </PageTransition>
  );
}

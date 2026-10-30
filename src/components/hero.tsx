import { ArrowDown, ArrowRight, Mail } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { between, seeded } from '@/lib/pattern';
import type { PublicEducation, PublicExperience, PublicProfile } from '@/lib/queries';
import { slugify } from '@/lib/slug';
import { ProjectCover } from './project-cover';
import { Container, GitHubIcon, LinkedInIcon } from './ui';

const order = (index: number) => ({ '--i': index }) as CSSProperties;

/**
 * Trame de fond : un réseau de nœuds reliés à leurs deux plus proches voisins, clin d'œil au sujet de
 * recherche. Les liens se tracent un à un au chargement, puis trois nœuds signalent leur activité.
 */
function Backdrop() {
  const random = seeded('accueil');
  const nodes = Array.from({ length: 24 }, () => ({ x: between(random, 10, 690), y: between(random, 10, 610) }));
  const links = new Map<string, [number, number]>();
  nodes.forEach((node, i) => {
    const nearest = nodes
      .map((other, j) => ({ j, distance: (node.x - other.x) ** 2 + (node.y - other.y) ** 2 }))
      .filter((candidate) => candidate.j !== i)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2);
    for (const { j } of nearest) links.set(`${Math.min(i, j)}-${Math.max(i, j)}`, [i, j]);
  });
  const active = new Set([3, 11, 19]);

  return (
    <svg
      viewBox="0 0 700 620"
      preserveAspectRatio="xMaxYMid slice"
      className="hero-backdrop pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[46%] lg:block"
      aria-hidden
      focusable="false"
    >
      {[...links.values()].map(([a, b], n) => (
        <line
          key={`${a}-${b}`}
          x1={nodes[a].x}
          y1={nodes[a].y}
          x2={nodes[b].x}
          y2={nodes[b].y}
          pathLength={1}
          className="trace"
          style={{ '--n': n } as CSSProperties}
          stroke="var(--color-line)"
          strokeWidth={1.2}
        />
      ))}
      {nodes.map((node, i) =>
        active.has(i) ? (
          <g key={i}>
            <circle cx={node.x} cy={node.y} r={14} fill="var(--color-gold)" className="pulse-dot" opacity={0.25} />
            <circle cx={node.x} cy={node.y} r={4.5} fill="var(--color-accent)" />
          </g>
        ) : (
          <circle key={i} cx={node.x} cy={node.y} r={3} fill="var(--color-field)" opacity={0.5} />
        ),
      )}
    </svg>
  );
}

function ProfileCard({
  profile,
  current,
  diploma,
}: {
  profile: PublicProfile;
  current?: PublicExperience;
  diploma?: PublicEducation;
}) {
  const initials = profile.shortName
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .slice(0, 2);
  const socialClass =
    'inline-flex size-11 items-center justify-center rounded-[8px] border border-line text-ink-2 transition-colors hover:border-accent hover:text-accent';

  return (
    <div className="theme-inverse relative overflow-hidden rounded-card shadow-[0_40px_70px_-40px_rgb(21_34_63/0.75)]">
      {profile.photoUrl ? (
        <div className="relative aspect-[5/4]">
          <Image
            src={profile.photoUrl}
            alt={`Portrait de ${profile.fullName}`}
            fill
            priority
            sizes="(min-width: 1024px) 340px, 100vw"
            className="object-cover object-top"
          />
        </div>
      ) : (
        // En attendant une photo : le motif des clusters de drones et les initiales, jamais de portrait factice.
        <div
          className="relative h-32 border-b border-line"
          style={{ '--cover-bg': 'var(--color-bg)' } as CSSProperties}
        >
          <ProjectCover category="RECHERCHE" seed="profil" />
          <span
            className="absolute bottom-4 left-6 flex size-14 items-center justify-center rounded-[10px] bg-accent font-serif text-2xl font-medium text-on-accent"
            aria-hidden
          >
            {initials}
          </span>
        </div>
      )}

      <dl className="divide-y divide-line px-6">
        {current && (
          <div className="py-5">
            <dt className="eyebrow">Aujourd&apos;hui</dt>
            <dd className="mt-2">
              <p className="font-serif text-xl leading-snug font-medium text-ink">{current.role}</p>
              {current.org && <p className="mt-1 text-sm leading-relaxed text-ink-2">{current.org}</p>}
            </dd>
          </div>
        )}
        {diploma && (
          <div className="py-5">
            <dt className="eyebrow">Diplôme</dt>
            <dd className="mt-2">
              <p className="font-serif text-xl leading-snug font-medium text-ink">{diploma.title}</p>
              {diploma.school && <p className="mt-1 text-sm leading-relaxed text-ink-2">{diploma.school}</p>}
              {diploma.mention && <p className="badge mt-3 bg-accent/15 text-accent">Mention {diploma.mention}</p>}
            </dd>
          </div>
        )}
      </dl>

      <ul className="flex gap-2 border-t border-line px-6 py-5">
        {profile.githubUrl && (
          <li>
            <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className={socialClass}>
              <GitHubIcon />
              <span className="sr-only">GitHub (nouvel onglet)</span>
            </a>
          </li>
        )}
        {profile.linkedinUrl && (
          <li>
            <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className={socialClass}>
              <LinkedInIcon />
              <span className="sr-only">LinkedIn (nouvel onglet)</span>
            </a>
          </li>
        )}
        <li>
          <a href={`mailto:${profile.publicEmail}`} className={socialClass}>
            <Mail size={20} aria-hidden />
            <span className="sr-only">Écrire à {profile.publicEmail}</span>
          </a>
        </li>
      </ul>
    </div>
  );
}

export function Hero({
  profile,
  current,
  diploma,
}: {
  profile: PublicProfile;
  /** Poste actuel, affiché dans la carte de profil. */
  current?: PublicExperience;
  /** Dernier diplôme obtenu. */
  diploma?: PublicEducation;
}) {
  // « Siriki Yeo » : le prénom sur la première ligne, le nom en italique d'accent sur la seconde.
  const [firstLine, ...rest] = profile.shortName.split(' ');
  const secondLine = rest.join(' ');

  return (
    <section aria-labelledby="titre-accueil" className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
      <Backdrop />
      <Container className="relative grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-20">
        {/* Le nom est dimensionné sur la largeur de cette colonne : il n'est jamais coupé par la carte. */}
        <div className="@container">
          {profile.availabilityBadge && (
            <p
              className="rise inline-flex items-center gap-2.5 rounded-[8px] border border-line bg-surface px-3.5 py-2 text-[0.8125rem] text-ink-2 shadow-[var(--shadow-soft)]"
              style={order(0)}
            >
              <span className="pulse-dot size-2 shrink-0 rounded-full bg-gold" aria-hidden />
              {profile.availabilityBadge}
            </p>
          )}

          <p className="rise mt-10 font-serif text-xl text-ink-3 italic" style={order(1)}>
            Bonjour, je suis
          </p>

          <h1
            id="titre-accueil"
            className="display mt-4 text-[clamp(3.4rem,21cqi,8.75rem)] leading-[0.86] tracking-[-0.035em]"
          >
            <span className="line-mask" style={order(0)}>
              <span>{firstLine}</span>
            </span>
            {secondLine && (
              <span className="line-mask" style={order(1)}>
                <span className="text-accent italic">
                  {secondLine}
                  <span className="text-gold not-italic" aria-hidden>
                    .
                  </span>
                </span>
              </span>
            )}
          </h1>

          <p className="rise mt-7 font-mono text-[0.85rem] text-ink-3" style={order(3)}>
            {profile.fullName} <span aria-hidden>·</span> {profile.city}
          </p>

          <div className="rise-soft mt-8 max-w-[38rem] border-l-2 border-gold pl-6" style={order(2)}>
            <p className="font-serif text-[1.45rem] leading-snug text-ink">{profile.headline}.</p>
            <p className="mt-3 text-lg leading-relaxed text-ink-2">{profile.bio}</p>
          </div>

          <div className="rise mt-10 flex flex-wrap gap-3" style={order(5)}>
            <Link href="/#projets" className="btn btn-primary btn-lg nudge-x">
              Découvrir mes travaux <ArrowRight size={18} aria-hidden />
            </Link>
            {profile.cvFrUrl ? (
              <a
                href={profile.cvFrUrl}
                download={`cv-${slugify(profile.shortName)}.pdf`}
                className="btn btn-secondary btn-lg nudge-down bg-surface"
              >
                Télécharger mon CV <ArrowDown size={18} aria-hidden />
              </a>
            ) : (
              <Link href="/cv" className="btn btn-secondary btn-lg bg-surface">
                Voir mon CV
              </Link>
            )}
          </div>
        </div>

        <div className="rise lg:justify-self-end" style={order(4)}>
          <div className="w-full max-w-[340px]">
            <ProfileCard profile={profile} current={current} diploma={diploma} />
          </div>
        </div>
      </Container>
    </section>
  );
}

// Sections partagées entre la page d'accueil et les pages dédiées (parcours, enseignement, contact).
import { ArrowUpRight } from 'lucide-react';
import { type ReactNode, createElement } from 'react';
import type { PublicEducation, PublicExperience, PublicProfile, SkillGroup } from '@/lib/queries';
import { formatPeriod, formatYears } from '@/lib/format';
import type { HomeContent } from '@/lib/schemas';
import { ContactForm } from './contact-form';
import { Reveal, RevealGroup, RevealItem } from './motion';
import { SectionLabel } from './ui';

/** Compétences présentées en tableau : le domaine à gauche, les outils à droite, une ligne par domaine. */
export function SkillsGrid({ groups }: { groups: SkillGroup[] }) {
  return (
    <RevealGroup className="border-t border-line">
      {groups.map((group, index) => (
        <RevealItem
          key={group.name}
          className="grid gap-4 border-b border-line py-7 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] md:gap-12"
        >
          <h3 className="flex items-baseline gap-4 font-serif text-[1.6rem] leading-tight font-medium text-ink">
            <span className="font-mono text-xs text-warm">{String(index + 1).padStart(2, '0')}</span>
            {group.name}
          </h3>
          <ul className="flex flex-wrap gap-2 md:pt-1">
            {group.labels.map((label) => (
              <li
                key={label}
                className="rounded-[6px] border border-line bg-surface px-3 py-1.5 text-[0.9rem] text-ink-2 transition-colors hover:border-accent hover:text-accent"
              >
                {label}
              </li>
            ))}
          </ul>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}

type Level = 2 | 3 | 4;

/** Titre dont le niveau (h2 à h4) dépend de la page hôte, pour garder une hiérarchie correcte. */
function Heading({ level, className, children }: { level: Level; className?: string; children: ReactNode }) {
  return createElement(`h${level}`, { className }, children);
}

function SubHeading({ children, level }: { children: string; level: Level }) {
  return (
    <Heading level={level} className="eyebrow border-b border-line pb-4 text-ink-3">
      {children}
    </Heading>
  );
}

/** Une étape de la frise : la période, un point sur le fil (plein pour le poste actuel), puis le contenu. */
export function ExperienceItem({ experience, level = 4 }: { experience: PublicExperience; level?: Level }) {
  const place = [experience.org, experience.city].filter(Boolean).join(', ');
  return (
    <div className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-4 sm:grid-cols-[8.5rem_1.25rem_minmax(0,1fr)] sm:gap-x-6">
      <p className="meta-mono col-start-2 pt-0.5 sm:col-start-1 sm:row-start-1 sm:text-right">
        {formatPeriod(experience)}
      </p>
      <span
        className={`timeline-rail col-start-1 row-span-2 row-start-1 sm:col-start-2 ${experience.isCurrent ? 'is-current' : ''}`}
        aria-hidden
      />
      <div className="col-start-2 pt-1.5 pb-10 sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:pt-0">
        <Heading level={level} className="font-serif text-[1.45rem] leading-snug font-medium text-ink">
          {experience.role}
        </Heading>
        {place && <p className="mt-0.5 text-[0.95rem] text-accent">{place}</p>}
        {experience.missions.length > 0 && (
          <ul className="mt-2.5 space-y-1 text-[0.95rem] leading-relaxed text-ink-2">
            {experience.missions.map((mission) => (
              <li key={mission}>{mission}</li>
            ))}
          </ul>
        )}
        {experience.tools.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {experience.tools.map((tool) => (
              <li key={tool} className="tag">
                {tool}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function EducationItem({ education, level = 4 }: { education: PublicEducation; level?: Level }) {
  const place = [education.school, education.city].filter(Boolean).join(', ');
  const years = formatYears(education.startYear, education.endYear);

  if (education.kind === 'CERTIFICATION') {
    return (
      <div>
        <Heading level={level} className="font-serif text-lg leading-snug font-medium text-ink">
          {education.title}
        </Heading>
        <p className="mt-0.5 text-sm text-ink-2">{[place, years].filter(Boolean).join(' · ')}</p>
        {education.description && <p className="mt-1.5 text-sm leading-relaxed text-ink-3">{education.description}</p>}
      </div>
    );
  }

  return (
    <div className="border-b border-line py-6">
      {years && <p className="meta-mono">{years}</p>}
      <Heading level={level} className="mt-1 font-serif text-[1.3rem] leading-snug font-medium text-ink">
        {education.title}
      </Heading>
      {place && <p className="mt-0.5 text-[0.95rem] text-ink-2">{place}</p>}
      {education.mention && <p className="badge mt-3 bg-done-bg text-accent">Mention {education.mention}</p>}
      {education.description && <p className="mt-2.5 text-sm leading-relaxed text-ink-3">{education.description}</p>}
    </div>
  );
}

export function Journey({
  experiences,
  education,
  languages,
  level = 3,
}: {
  experiences: PublicExperience[];
  education: PublicEducation[];
  languages: HomeContent['languages'];
  /** Niveau des intertitres : 3 sous le h2 de l'accueil, 2 sur la page Parcours. */
  level?: 2 | 3;
}) {
  const itemLevel = (level + 1) as Level;
  const diplomas = education.filter((item) => item.kind === 'DIPLOME');
  const certifications = education.filter((item) => item.kind === 'CERTIFICATION');

  return (
    <div className="grid gap-x-12 gap-y-14 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
      <div>
        <SubHeading level={level}>Expériences</SubHeading>
        <RevealGroup className="timeline mt-8">
          {experiences.map((experience) => (
            <RevealItem key={experience.id}>
              <ExperienceItem experience={experience} level={itemLevel} />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>

      <div className="card space-y-12 self-start p-6 sm:p-8">
        <div>
          <SubHeading level={level}>Formation</SubHeading>
          {/* Dans la carte, le dernier diplôme n'a pas de filet de séparation. */}
          <RevealGroup className="[&>:last-child>div]:border-b-0 [&>:last-child>div]:pb-0">
            {diplomas.map((item) => (
              <RevealItem key={item.id}>
                <EducationItem education={item} level={itemLevel} />
              </RevealItem>
            ))}
          </RevealGroup>
        </div>

        {certifications.length > 0 && (
          <div>
            <SubHeading level={level}>Certifications</SubHeading>
            <div className="mt-6 space-y-5">
              {certifications.map((item) => (
                <EducationItem key={item.id} education={item} level={itemLevel} />
              ))}
            </div>
          </div>
        )}

        {languages.length > 0 && (
          <div>
            <SubHeading level={level}>Langues</SubHeading>
            <dl className="mt-6 space-y-2 text-[0.95rem]">
              {languages.map((language) => (
                <div key={language.name} className="flex gap-2">
                  <dt className="font-semibold text-ink">{language.name}</dt>
                  <dd className="text-ink-2">{language.level}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}

// Un filet alterné pour chaque bloc : bleu encre, or, puis on recommence.
const blockAccents = ['bg-accent', 'bg-gold'];

export function TeachingBlocks({ blocks, level = 3 }: { blocks: HomeContent['teaching']['blocks']; level?: 2 | 3 }) {
  return (
    <RevealGroup className="grid gap-5 md:grid-cols-3">
      {blocks.map((block, index) => (
        <RevealItem key={block.title} className="card lift relative overflow-hidden p-7 pt-9">
          <span
            className={`absolute inset-x-0 top-0 h-[3px] ${blockAccents[index % blockAccents.length]}`}
            aria-hidden
          />
          <div className="flex items-start justify-between gap-4">
            <p className="eyebrow pt-1">{block.tag}</p>
            <span className="display text-[2.6rem] leading-none text-gold italic" aria-hidden>
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>
          <Heading level={level} className="mt-4 font-serif text-[1.6rem] leading-tight font-medium text-ink">
            {block.title}
          </Heading>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-2">{block.text}</p>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}

export function ContactBlock({
  profile,
  headingId,
  number,
  as: Heading = 'h2',
}: {
  profile: PublicProfile;
  headingId: string;
  /** Numéro de section sur l'accueil ; absent sur la page Contact. */
  number?: string;
  as?: 'h1' | 'h2';
}) {
  const githubLabel = profile.githubUrl?.replace(/^https?:\/\/(www\.)?/, '');
  const linkClass = 'link nudge inline-flex min-h-11 items-center gap-1.5 text-ink';

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-16">
      {/* Taille du titre en unités de conteneur : « Travaillons » tient toujours dans sa colonne. */}
      <Reveal className="@container">
        <SectionLabel>{number ? `${number} · Contact` : 'Contact'}</SectionLabel>
        <Heading id={headingId} className="display mt-4 text-[clamp(2.6rem,14cqi,5.25rem)] leading-[0.98] text-ink">
          <span className="mask-line">
            <span>Travaillons</span>
          </span>{' '}
          <span className="mask-line">
            <span className="text-accent italic">ensemble.</span>
          </span>
        </Heading>
        {profile.home.contactIntro && (
          <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-2">{profile.home.contactIntro}</p>
        )}
        <ul className="mt-6">
          <li>
            <a href={`mailto:${profile.publicEmail}`} className={linkClass}>
              {profile.publicEmail}
            </a>
          </li>
          {profile.linkedinUrl && (
            <li>
              <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                LinkedIn <ArrowUpRight size={15} aria-hidden />
                <span className="sr-only">(nouvel onglet)</span>
              </a>
            </li>
          )}
          {profile.githubUrl && (
            <li>
              <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                {githubLabel} <ArrowUpRight size={15} aria-hidden />
                <span className="sr-only">(nouvel onglet)</span>
              </a>
            </li>
          )}
          <li className="flex min-h-11 items-center text-ink-2">{profile.city}</li>
        </ul>
      </Reveal>

      <Reveal className="theme-light card p-6 sm:p-9">
        <ContactForm />
      </Reveal>
    </div>
  );
}

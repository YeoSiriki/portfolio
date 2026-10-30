import type { Metadata } from 'next';
import Link from 'next/link';
import { changePassword, saveLegal, saveProfile } from '@/actions/settings';
import { githubLoginEnabled } from '@/auth';
import { EntityForm } from '@/components/admin/entity-form';
import { AdminPageHeader } from '@/components/admin/page-header';
import { HomeForm, SkillsForm } from '@/components/admin/settings-forms';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guard';
import { homeSchema } from '@/lib/schemas';

export const metadata: Metadata = { title: 'Profil & réglages' };

// La page lit la session et dépend de l'adresse (onglet ouvert) : elle peut attendre le serveur.
export const instant = false;

const TABS = [
  { key: 'profil', label: 'Profil' },
  { key: 'accueil', label: "Page d'accueil" },
  { key: 'competences', label: 'Compétences' },
  { key: 'legal', label: 'Pages légales' },
  { key: 'compte', label: 'Compte' },
] as const;

type Props = { searchParams: Promise<{ onglet?: string }> };

export default async function SettingsPage({ searchParams }: Props) {
  const admin = await requireAdmin();
  const { onglet } = await searchParams;
  const tab = TABS.find((item) => item.key === onglet)?.key ?? 'profil';

  const profile = await prisma.profile.findUniqueOrThrow({ where: { id: 1 } });

  let content;
  if (tab === 'profil') {
    content = (
      <EntityForm
        formKey="profil"
        heading="Profil & page d'accueil"
        save={saveProfile}
        previewHref="/"
        initialValues={{
          fullName: profile.fullName,
          shortName: profile.shortName,
          headline: profile.headline,
          publicEmail: profile.publicEmail,
          city: profile.city,
          availabilityBadge: profile.availabilityBadge,
          bio: profile.bio,
          tickerItems: profile.tickerItems,
          photoUrl: profile.photoUrl ?? '',
          cvFrUrl: profile.cvFrUrl ?? '',
          cvEnUrl: profile.cvEnUrl ?? '',
          githubUrl: profile.githubUrl ?? '',
          linkedinUrl: profile.linkedinUrl ?? '',
        }}
      />
    );
  } else if (tab === 'accueil') {
    content = <HomeForm initialValues={homeSchema.parse(profile.home)} />;
  } else if (tab === 'competences') {
    const skills = await prisma.skill.findMany({ orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] });
    const groups: { name: string; labels: string[] }[] = [];
    for (const skill of skills) {
      const group = groups.find((item) => item.name === skill.group);
      if (group) group.labels.push(skill.label);
      else groups.push({ name: skill.group, labels: [skill.label] });
    }
    content = <SkillsForm initialGroups={groups} />;
  } else if (tab === 'legal') {
    content = (
      <EntityForm
        formKey="legal"
        heading="Pages légales"
        save={saveLegal}
        initialValues={{ privacyPolicy: profile.privacyPolicy, termsOfUse: profile.termsOfUse }}
      />
    );
  } else {
    content = (
      <div className="space-y-6">
        <EntityForm
          formKey="motdepasse"
          heading="Changer le mot de passe"
          save={changePassword}
          submitLabel="Modifier le mot de passe"
          initialValues={{ current: '', next: '', confirm: '' }}
        />
        <div className="card bg-surface-admin p-6 text-sm leading-relaxed text-ink-2 sm:p-7">
          <p>
            Compte administrateur : <span className="font-semibold text-ink">{admin.email}</span>
          </p>
          <p className="mt-2">
            Connexion GitHub :{' '}
            {githubLoginEnabled
              ? 'activée, limitée au compte du propriétaire.'
              : 'désactivée (variables AUTH_GITHUB_ID, AUTH_GITHUB_SECRET et ADMIN_GITHUB_LOGIN non définies).'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminPageHeader breadcrumb="/Admin/reglages" title="Profil & réglages" />

      <nav aria-label="Sections des réglages" className="mb-6">
        <ul className="flex flex-wrap gap-2">
          {TABS.map((item) => {
            const active = item.key === tab;
            return (
              <li key={item.key}>
                <Link
                  href={item.key === 'profil' ? '/admin/reglages' : `/admin/reglages?onglet=${item.key}`}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex min-h-11 items-center rounded-[10px] border px-4 text-sm font-semibold transition-colors ${
                    active ? 'border-accent bg-accent text-on-accent' : 'border-field text-ink hover:border-ink-3'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="max-w-[900px]">{content}</div>
    </>
  );
}

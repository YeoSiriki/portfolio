'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CircleCheck, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type ReactNode, useState } from 'react';
import { type FieldPath, type FieldValues, type UseFormRegister, useFieldArray, useForm } from 'react-hook-form';
import { saveHome, saveSkills } from '@/actions/settings';
import type { ActionResult } from '@/lib/forms';
import { type HomeContent, homeSchema } from '@/lib/schemas';

type Status = { tone: 'ok' | 'error'; text: string } | null;

function StatusLine({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <p
      role={status.tone === 'error' ? 'alert' : 'status'}
      className={`flex items-center gap-2 rounded-[10px] border px-4 py-3 text-sm ${
        status.tone === 'error'
          ? 'border-danger/40 bg-danger-bg text-danger'
          : 'border-accent/30 bg-done-bg text-accent'
      }`}
    >
      {status.tone === 'ok' && <CircleCheck size={17} aria-hidden />}
      {status.text}
    </p>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-line pt-6 first:border-t-0 first:pt-0">
      <legend className="float-left mb-4 w-full text-lg font-bold [font-stretch:112%] text-ink">{title}</legend>
      <div className="clear-both space-y-4">{children}</div>
    </fieldset>
  );
}

/** Champ texte ou zone de texte relié à react-hook-form, avec son libellé. */
function Field<T extends FieldValues>({
  register,
  name,
  label,
  rows,
  error,
}: {
  register: UseFormRegister<T>;
  name: FieldPath<T>;
  label: string;
  rows?: number;
  error?: string;
}) {
  const id = `champ-${name.replace(/\./g, '-')}`;
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {rows ? (
        <textarea id={id} rows={rows} className="field resize-y" aria-invalid={Boolean(error)} {...register(name)} />
      ) : (
        <input id={id} type="text" className="field" aria-invalid={Boolean(error)} {...register(name)} />
      )}
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
}

function useSubmit<T>(action: (values: T) => Promise<ActionResult>) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(null);

  const submit = async (values: T) => {
    setStatus(null);
    try {
      const result = await action(values);
      if (!result.ok) {
        const details = Object.values(result.fieldErrors ?? {}).join(' ');
        setStatus({ tone: 'error', text: [result.error, details].filter(Boolean).join(' ') });
        return;
      }
      setStatus({ tone: 'ok', text: result.message ?? 'Enregistré.' });
      router.refresh();
    } catch {
      setStatus({ tone: 'error', text: "L'enregistrement a échoué. Vérifie ta connexion et réessaie." });
    }
  };

  return { status, submit };
}

/** Blocs de la page d'accueil : SCAT, enseignement, langues, texte de contact. */
export function HomeForm({ initialValues }: { initialValues: HomeContent }) {
  const {
    register,
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<HomeContent>({ resolver: zodResolver(homeSchema), defaultValues: initialValues });
  const languages = useFieldArray({ control, name: 'languages' });
  const { status, submit } = useSubmit<HomeContent>(saveHome);

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="card space-y-8 bg-surface-admin p-6 sm:p-7">
      <Group title="Recherche : bloc SCAT">
        <Field register={register} name="scat.title" label="Titre" />
        <Field register={register} name="scat.tagline" label="Sous-titre" rows={2} />
        <Field register={register} name="scat.problem" label="Le problème" rows={3} />
        <Field register={register} name="scat.solution" label="La solution" rows={3} />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="space-y-3 rounded-[12px] border border-line p-4">
              <p className="label-mono">Chiffre clé {index + 1}</p>
              <Field register={register} name={`scat.kpis.${index}.value`} label="Valeur" />
              <Field register={register} name={`scat.kpis.${index}.label`} label="Légende" rows={3} />
            </div>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="space-y-3 rounded-[12px] border border-line p-4">
              <p className="label-mono">Phase {index + 1}</p>
              <Field register={register} name={`scat.phases.${index}.title`} label="Nom" />
              <Field register={register} name={`scat.phases.${index}.text`} label="Description" rows={3} />
            </div>
          ))}
        </div>
      </Group>

      <Group title="Enseignement">
        <Field register={register} name="teaching.intro" label="Introduction" rows={3} />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="space-y-3 rounded-[12px] border border-line p-4">
              <p className="label-mono">Bloc {index + 1}</p>
              <Field register={register} name={`teaching.blocks.${index}.tag`} label="Étiquette" />
              <Field register={register} name={`teaching.blocks.${index}.title`} label="Titre" />
              <Field register={register} name={`teaching.blocks.${index}.text`} label="Texte" rows={4} />
            </div>
          ))}
        </div>
      </Group>

      <Group title="Langues">
        <ul className="space-y-3">
          {languages.fields.map((item, index) => (
            <li key={item.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto] items-end gap-3">
              <Field register={register} name={`languages.${index}.name`} label="Langue" />
              <Field register={register} name={`languages.${index}.level`} label="Niveau" />
              <button
                type="button"
                className="inline-flex size-11 items-center justify-center text-ink-3 hover:text-danger"
                onClick={() => languages.remove(index)}
                aria-label={`Retirer la langue ${index + 1}`}
              >
                <Trash2 size={17} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="btn btn-secondary text-sm"
          onClick={() => languages.append({ name: '', level: '' })}
        >
          <Plus size={16} aria-hidden /> Ajouter une langue
        </button>
      </Group>

      <Group title="Contact">
        <Field register={register} name="contactIntro" label="Phrase d'introduction" rows={2} />
      </Group>

      <StatusLine status={status} />
      <button type="submit" className="btn btn-primary min-w-36" disabled={isSubmitting}>
        {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </form>
  );
}

type SkillsValues = { groups: { name: string; labels: string }[] };

/** Compétences : une ligne par catégorie, les éléments séparés par des virgules. */
export function SkillsForm({ initialGroups }: { initialGroups: { name: string; labels: string[] }[] }) {
  const {
    register,
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SkillsValues>({
    defaultValues: { groups: initialGroups.map((group) => ({ name: group.name, labels: group.labels.join(', ') })) },
  });
  const groups = useFieldArray({ control, name: 'groups' });
  // La validation se fait côté serveur avec skillsSchema, une fois les listes découpées.
  const { status, submit } = useSubmit<SkillsValues>((values) =>
    saveSkills({
      groups: values.groups.map((group) => ({
        name: group.name,
        labels: group.labels
          .split(',')
          .map((label) => label.trim())
          .filter(Boolean),
      })),
    }),
  );

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="card space-y-5 bg-surface-admin p-6 sm:p-7">
      <p className="text-sm text-ink-3">
        Une catégorie par ligne. Pas de pourcentage ni de jauge : seulement les compétences, séparées par des virgules.
      </p>
      <ul className="space-y-4">
        {groups.fields.map((item, index) => (
          <li
            key={item.id}
            className="grid items-end gap-3 rounded-[12px] border border-line p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)_auto]"
          >
            <Field register={register} name={`groups.${index}.name`} label={`Catégorie ${index + 1}`} />
            <Field register={register} name={`groups.${index}.labels`} label="Compétences" />
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center text-ink-3 hover:text-danger"
              onClick={() => groups.remove(index)}
              aria-label={`Retirer la catégorie ${index + 1}`}
            >
              <Trash2 size={17} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="btn btn-secondary text-sm"
        onClick={() => groups.append({ name: '', labels: '' })}
      >
        <Plus size={16} aria-hidden /> Ajouter une catégorie
      </button>

      <StatusLine status={status} />
      <button type="submit" className="btn btn-primary min-w-36" disabled={isSubmitting}>
        {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </form>
  );
}

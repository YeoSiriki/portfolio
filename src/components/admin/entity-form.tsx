'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CircleCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { Controller, type Resolver, useForm } from 'react-hook-form';
import { type ActionResult, type FieldDef, type FormKey, forms } from '@/lib/forms';
import { slugify } from '@/lib/slug';
import { ConfirmDialog } from './confirm-dialog';
import { FileField, GalleryField, type GalleryItem } from './file-field';

type Values = Record<string, unknown>;

/** Liste saisie comme du texte (virgules ou lignes), stockée comme un tableau. */
function ListInput({
  id,
  value,
  onChange,
  separator,
  rows,
  invalid,
  describedBy,
}: {
  id: string;
  value: string[];
  onChange: (items: string[]) => void;
  separator: 'comma' | 'line';
  rows?: number;
  invalid: boolean;
  describedBy?: string;
}) {
  const joiner = separator === 'comma' ? ', ' : '\n';
  const [text, setText] = useState(() => value.join(joiner));

  const update = (next: string) => {
    setText(next);
    onChange(
      next
        .split(separator === 'comma' ? ',' : '\n')
        .map((item) => item.trim())
        .filter(Boolean),
    );
  };

  return separator === 'comma' ? (
    <input
      id={id}
      type="text"
      className="field"
      value={text}
      aria-invalid={invalid}
      aria-describedby={describedBy}
      onChange={(event) => update(event.target.value)}
    />
  ) : (
    <textarea
      id={id}
      rows={rows ?? 4}
      className="field resize-y"
      value={text}
      aria-invalid={invalid}
      aria-describedby={describedBy}
      onChange={(event) => update(event.target.value)}
    />
  );
}

export function EntityForm({
  formKey,
  initialValues,
  save,
  remove,
  listHref,
  previewHref,
  heading,
  notice,
  submitLabel = 'Enregistrer',
  deleteLabel,
}: {
  formKey: FormKey;
  initialValues: Values;
  save: (values: unknown) => Promise<ActionResult>;
  remove?: () => Promise<ActionResult>;
  /** Liste du module : après un enregistrement, on y revient avec l'élément sélectionné. */
  listHref?: string;
  previewHref?: string;
  heading?: string;
  notice?: string;
  submitLabel?: string;
  /** Nom de l'élément, rappelé dans la confirmation de suppression. */
  deleteLabel?: string;
}) {
  const { schema, fields } = forms[formKey];
  const router = useRouter();
  const uid = useId();
  const [status, setStatus] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Le slug suit le titre tant qu'il n'a pas été saisi à la main ni déjà enregistré.
  const [slugLocked, setSlugLocked] = useState(Boolean(initialValues.slug));

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    getValues,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema as never) as unknown as Resolver<Values>,
    defaultValues: initialValues,
  });

  const fieldId = (name: string) => `${uid}-${name}`;
  const errorOf = (name: string) => errors[name]?.message as string | undefined;

  const onSubmit = handleSubmit(async (values) => {
    setStatus(null);
    try {
      const result = await save(values);
      if (!result.ok) {
        for (const [name, message] of Object.entries(result.fieldErrors ?? {})) setError(name, { message });
        setStatus({ tone: 'error', text: result.error });
        return;
      }
      reset(values);
      setStatus({ tone: 'ok', text: result.message ?? 'Enregistré.' });
      if (listHref && result.id) router.replace(`${listHref}?id=${result.id}`, { scroll: false });
      router.refresh();
    } catch {
      setStatus({ tone: 'error', text: "L'enregistrement a échoué. Vérifie ta connexion et réessaie." });
    }
  });

  const onDelete = async () => {
    if (!remove) return;
    setDeleting(true);
    try {
      const result = await remove();
      if (!result.ok) {
        setStatus({ tone: 'error', text: result.error });
        return;
      }
      if (listHref) router.replace(listHref);
      router.refresh();
    } catch {
      setStatus({ tone: 'error', text: 'La suppression a échoué. Réessaie.' });
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  function renderControl(field: FieldDef) {
    const id = fieldId(field.name);
    const error = errorOf(field.name);
    const describedBy = [error && `${id}-erreur`, field.hint && `${id}-aide`].filter(Boolean).join(' ') || undefined;
    const common = { id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy };

    switch (field.type) {
      case 'text':
      case 'password':
        return (
          <input
            type={field.type}
            className="field"
            placeholder={field.placeholder}
            autoComplete={field.autoComplete ?? 'off'}
            {...common}
            {...register(field.name, {
              onChange: (event) => {
                const slugField = fields.find((item) => item.type === 'slug' && item.source === field.name);
                if (slugField && !slugLocked)
                  setValue(slugField.name, slugify(String(event.target.value)), { shouldDirty: true });
              },
            })}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            inputMode="numeric"
            className="field"
            {...common}
            {...register(field.name, {
              setValueAs: (value) => {
                if (value === '' || value === null || value === undefined) return field.nullable ? null : Number.NaN;
                return Number(value);
              },
            })}
          />
        );
      case 'textarea':
      case 'markdown':
        return (
          <textarea
            rows={field.rows ?? 4}
            placeholder={field.placeholder}
            className={`field resize-y ${field.type === 'markdown' ? 'font-mono text-[0.85rem] leading-relaxed' : ''}`}
            {...common}
            {...register(field.name)}
          />
        );
      case 'select':
        return (
          <select className="field" {...common} {...register(field.name)}>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'datetime':
        return <input type="datetime-local" className="field" {...common} {...register(field.name)} />;
      case 'slug':
        return (
          <div className="flex items-stretch">
            <span className="inline-flex items-center rounded-l-[10px] border border-r-0 border-field bg-surface px-3 font-mono text-[0.8125rem] text-ink-3">
              {field.prefix}
            </span>
            <input
              type="text"
              className="field rounded-l-none font-mono text-[0.85rem]"
              placeholder="généré depuis le titre"
              autoComplete="off"
              spellCheck={false}
              {...common}
              {...register(field.name, { onChange: () => setSlugLocked(true) })}
            />
            <button
              type="button"
              className="btn btn-secondary ml-2 shrink-0 text-sm"
              onClick={() => {
                setValue(field.name, slugify(String(getValues(field.source ?? 'title') ?? '')), {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                setSlugLocked(true);
              }}
            >
              Régénérer
            </button>
          </div>
        );
      case 'tags':
      case 'lines':
        return (
          <Controller
            control={control}
            name={field.name}
            render={({ field: controller }) => (
              <ListInput
                id={id}
                value={(controller.value as string[]) ?? []}
                onChange={controller.onChange}
                separator={field.type === 'tags' ? 'comma' : 'line'}
                rows={field.rows}
                invalid={Boolean(error)}
                describedBy={describedBy}
              />
            )}
          />
        );
      case 'image':
      case 'document':
      case 'justificatif':
        return (
          <Controller
            control={control}
            name={field.name}
            render={({ field: controller }) => (
              <FileField
                kind={field.type as 'image' | 'document' | 'justificatif'}
                folder={field.folder ?? 'projets'}
                value={(controller.value as string) ?? ''}
                onChange={controller.onChange}
                describedBy={describedBy}
              />
            )}
          />
        );
      case 'gallery':
        return (
          <Controller
            control={control}
            name={field.name}
            render={({ field: controller }) => (
              <GalleryField
                folder={field.folder ?? 'projets'}
                value={(controller.value as GalleryItem[]) ?? []}
                onChange={controller.onChange}
              />
            )}
          />
        );
      default:
        return null;
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="card bg-surface-admin p-6 sm:p-7">
      {heading && <h2 className="mb-6 text-xl font-bold [font-stretch:112%] text-ink">{heading}</h2>}
      {notice && (
        <p className="mb-6 rounded-[10px] border border-progress/40 bg-progress-bg px-4 py-3 text-sm text-progress">
          {notice}
        </p>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
        {fields.map((field) => {
          const id = fieldId(field.name);
          const error = errorOf(field.name);
          const span = field.half ? 'col-span-2 sm:col-span-1' : 'col-span-2';

          if (field.type === 'checkbox') {
            return (
              <div key={field.name} className={span}>
                <label
                  htmlFor={id}
                  className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-[0.95rem] text-ink"
                >
                  <input id={id} type="checkbox" className="size-5 accent-accent" {...register(field.name)} />
                  {field.label}
                </label>
              </div>
            );
          }

          // Les champs fichier et galerie portent leur propre <label> sur la zone de dépôt.
          const isFile = ['image', 'document', 'justificatif', 'gallery'].includes(field.type);
          return (
            <div key={field.name} className={span}>
              {isFile ? (
                <p className="field-label">{field.label}</p>
              ) : (
                <label htmlFor={id} className="field-label">
                  {field.label}
                </label>
              )}
              {renderControl(field)}
              {field.hint && (
                <p id={`${id}-aide`} className="mt-1.5 text-[0.8125rem] text-ink-3">
                  {field.hint}
                </p>
              )}
              {error && (
                <p id={`${id}-erreur`} className="mt-1.5 text-sm text-danger">
                  {error}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {status && (
        <p
          role={status.tone === 'error' ? 'alert' : 'status'}
          className={`mt-6 flex items-center gap-2 rounded-[10px] border px-4 py-3 text-sm ${
            status.tone === 'error'
              ? 'border-danger/40 bg-danger-bg text-danger'
              : 'border-accent/30 bg-done-bg text-accent'
          }`}
        >
          {status.tone === 'ok' && <CircleCheck size={17} aria-hidden />}
          {status.text}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-primary min-w-36" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement...' : submitLabel}
        </button>
        {previewHref && (
          <a
            href={previewHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            title={isDirty ? "Enregistre d'abord pour voir les dernières modifications" : undefined}
          >
            Prévisualiser
          </a>
        )}
        {remove && (
          <button type="button" className="btn btn-danger ml-auto" onClick={() => setConfirming(true)}>
            Supprimer
          </button>
        )}
      </div>
      {previewHref && isDirty && (
        <p className="mt-3 text-[0.8125rem] text-ink-3">L&apos;aperçu montre la dernière version enregistrée.</p>
      )}

      {remove && (
        <ConfirmDialog
          open={confirming}
          title="Confirmer la suppression"
          description={`${deleteLabel ? `« ${deleteLabel} »` : 'Cet élément'} sera supprimé définitivement, avec ses fichiers.`}
          pending={deleting}
          onConfirm={onDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
    </form>
  );
}

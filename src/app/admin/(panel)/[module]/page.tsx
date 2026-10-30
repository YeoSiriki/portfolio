import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { deleteEntity, saveEntity } from '@/actions/entities';
import { EntityForm } from '@/components/admin/entity-form';
import { AdminPageHeader } from '@/components/admin/page-header';
import { SortableList } from '@/components/admin/sortable-list';
import { repos } from '@/lib/admin-repo';
import { isModuleKey, modules } from '@/lib/forms';
import { requireAdmin } from '@/lib/guard';

// La page lit la session et dépend de l'adresse (module, élément ouvert) : elle peut attendre le serveur
// à chaque navigation, comme le recommande le guide « authentication with Cache Components » de Next.js.
export const instant = false;

type Props = {
  params: Promise<{ module: string }>;
  searchParams: Promise<{ id?: string; nouveau?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { module: key } = await params;
  return { title: isModuleKey(key) ? modules[key].title : 'Introuvable' };
}

// Une même page sert les six modules de contenu : liste à gauche, formulaire à droite (maquettes 06 à 11).
export default async function ModulePage({ params, searchParams }: Props) {
  await requireAdmin();
  const [{ module: key }, query] = await Promise.all([params, searchParams]);
  if (!isModuleKey(key)) notFound();

  const definition = modules[key];
  const repo = repos[key];
  const basePath = `/admin/${key}`;
  const rows = await repo.list();

  // Sans sélection explicite, le premier élément est ouvert ; sans aucun élément, le formulaire de création.
  const creating = query.nouveau === '1' || rows.length === 0;
  const selectedId = creating ? null : (query.id ?? rows[0]?.id ?? null);
  const stored = selectedId ? await repo.getValues(selectedId) : null;
  if (selectedId && !stored) notFound();

  const initialValues = stored ?? {
    ...definition.defaults,
    ...('year' in definition.defaults ? { year: new Date().getFullYear() } : {}),
  };
  const selectedTitle = rows.find((row) => row.id === selectedId)?.title;

  return (
    <>
      <AdminPageHeader breadcrumb={`/Admin/${key}`} title={definition.title} />

      <div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <SortableList
          moduleKey={key}
          rows={rows}
          columns={definition.columns}
          selectedId={selectedId}
          sortable={definition.sortable}
          basePath={basePath}
          searchPlaceholder={definition.searchPlaceholder}
          newLabel={definition.newLabel}
          emptyLabel={definition.emptyLabel}
        />

        <div id="formulaire" className="scroll-mt-6">
          <EntityForm
            // La clé remonte un formulaire neuf à chaque changement d'élément.
            key={selectedId ?? 'nouveau'}
            formKey={key}
            initialValues={initialValues}
            save={saveEntity.bind(null, key, selectedId)}
            remove={selectedId ? deleteEntity.bind(null, key, selectedId) : undefined}
            listHref={basePath}
            previewHref={selectedId ? `/admin/apercu/${key}/${selectedId}` : undefined}
            heading={selectedId ? definition.editLabel : definition.newLabel}
            notice={definition.notice}
            deleteLabel={selectedTitle}
          />
        </div>
      </div>
    </>
  );
}

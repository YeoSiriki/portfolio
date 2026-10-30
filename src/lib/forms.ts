// Description des formulaires de l'admin. Ce fichier est partagé entre le client (affichage,
// validation immédiate) et le serveur (validation finale) : un seul schéma par formulaire.
import type { z } from 'zod';
import {
  EDUCATION_KINDS,
  EXPERIENCE_KINDS,
  POST_STATUSES,
  PROJECT_CATEGORIES,
  PROJECT_STATES,
  PUBLICATION_STATUSES,
  PUBLICATION_TYPES,
  RESOURCE_KINDS,
  RESOURCE_STATUSES,
  educationKindLabel,
  experienceKindLabel,
  postStatusLabel,
  projectCategoryLabel,
  projectStateLabel,
  publicationStatusLabel,
  publicationTypeLabel,
  resourceKindLabel,
  resourceStatusLabel,
  toOptions,
} from './constants';
import {
  educationSchema,
  experienceSchema,
  legalSchema,
  passwordSchema,
  postSchema,
  profileSchema,
  projectSchema,
  publicationSchema,
  resourceSchema,
} from './schemas';

export const MODULE_KEYS = ['projets', 'recherche', 'experiences', 'formation', 'enseignement', 'blog'] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];
export type FormKey = ModuleKey | 'profil' | 'legal' | 'motdepasse';

export function isModuleKey(value: string): value is ModuleKey {
  return (MODULE_KEYS as readonly string[]).includes(value);
}

export type FieldType =
  | 'text'
  | 'password'
  | 'number'
  | 'textarea'
  | 'markdown'
  | 'select'
  | 'checkbox'
  | 'tags'
  | 'lines'
  | 'datetime'
  | 'slug'
  | 'image'
  | 'document'
  | 'justificatif'
  | 'gallery';

export type FieldDef = {
  name: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  placeholder?: string;
  hint?: string;
  rows?: number;
  half?: boolean;
  /** Champ numérique facultatif : vide devient null. */
  nullable?: boolean;
  /** Champ slug : nom du champ source et préfixe d'URL affiché. */
  source?: string;
  prefix?: string;
  /** Dossier de stockage des fichiers téléversés. */
  folder?: string;
  autoComplete?: string;
};

export type FormDef = { schema: z.ZodType; fields: FieldDef[] };

export type ModuleDef = {
  title: string;
  newLabel: string;
  editLabel: string;
  searchPlaceholder: string;
  emptyLabel: string;
  columns: [string, string, string];
  sortable: boolean;
  notice?: string;
  defaults: Record<string, unknown>;
};

const visible: FieldDef = { name: 'isPublished', label: 'Visible sur le site', type: 'checkbox' };
const PERIOD_HINT = 'Format AAAA ou AAAA-MM, par exemple 2025-09.';

export const modules: Record<ModuleKey, ModuleDef> = {
  projets: {
    title: 'Projets',
    newLabel: 'Nouveau projet',
    editLabel: 'Modifier le projet',
    searchPlaceholder: 'Rechercher un projet...',
    emptyLabel: 'Aucun projet pour le moment.',
    columns: ['Projet', 'Catégorie', 'État'],
    sortable: true,
    defaults: {
      title: '',
      slug: '',
      category: 'RECHERCHE',
      state: 'TERMINE',
      // L'année courante est renseignée par la page au moment de l'ouverture du formulaire.
      year: 0,
      summary: '',
      role: '',
      body: '',
      techs: [],
      linkUrl: '',
      coverUrl: '',
      images: [],
      isPublished: false,
    },
  },
  recherche: {
    title: 'Recherche & publications',
    newLabel: 'Nouvelle publication',
    editLabel: 'Modifier la publication',
    searchPlaceholder: 'Rechercher une publication...',
    emptyLabel: 'Aucune publication pour le moment.',
    columns: ['Publication', 'Type', 'Statut'],
    sortable: true,
    defaults: {
      title: '',
      slug: '',
      type: 'ARTICLE',
      status: 'EN_PREPARATION',
      authors: '',
      venue: '',
      date: '',
      abstract: '',
      keywords: [],
      url: '',
      pdfUrl: '',
      hasPage: false,
      body: '',
      isPublished: false,
    },
  },
  experiences: {
    title: 'Expériences',
    newLabel: 'Nouvelle expérience',
    editLabel: "Modifier l'expérience",
    searchPlaceholder: 'Rechercher une expérience...',
    emptyLabel: 'Aucune expérience pour le moment.',
    columns: ['Poste', 'Type', 'Période'],
    sortable: true,
    defaults: {
      role: '',
      org: '',
      city: '',
      kind: 'EMPLOI',
      start: '',
      end: '',
      isCurrent: false,
      missions: [],
      tools: [],
      isPublished: false,
    },
  },
  formation: {
    title: 'Formation & certifications',
    newLabel: 'Nouveau diplôme',
    editLabel: 'Modifier la formation',
    searchPlaceholder: 'Rechercher une formation...',
    emptyLabel: 'Aucune formation pour le moment.',
    columns: ['Intitulé', 'Type', 'Années'],
    sortable: true,
    defaults: {
      title: '',
      kind: 'DIPLOME',
      school: '',
      city: '',
      startYear: null,
      endYear: null,
      mention: '',
      description: '',
      proofUrl: '',
      isPublished: false,
    },
  },
  enseignement: {
    title: 'Enseignement & ressources',
    newLabel: 'Nouvelle ressource',
    editLabel: 'Modifier la ressource',
    searchPlaceholder: 'Rechercher une ressource...',
    emptyLabel: 'Aucune ressource pour le moment.',
    columns: ['Ressource', 'Niveau', 'Type'],
    sortable: true,
    notice: 'Ne publie que les documents dont tu détiens les droits.',
    defaults: {
      title: '',
      level: '',
      subject: 'Mathématiques',
      kind: 'SUJET_CORRIGE',
      status: 'BROUILLON',
      description: '',
      fileUrl: '',
      allowDownload: false,
    },
  },
  blog: {
    title: 'Blog',
    newLabel: 'Nouvel article',
    editLabel: "Modifier l'article",
    searchPlaceholder: 'Rechercher un article...',
    emptyLabel: 'Aucun article pour le moment.',
    columns: ['Article', 'Catégorie', 'Date'],
    sortable: false,
    defaults: {
      title: '',
      slug: '',
      category: '',
      status: 'BROUILLON',
      publishAt: '',
      readTime: 0,
      coverUrl: '',
      excerpt: '',
      content: '',
    },
  },
};

export const forms: Record<FormKey, FormDef> = {
  projets: {
    schema: projectSchema,
    fields: [
      {
        name: 'coverUrl',
        label: 'Capture ou schéma',
        type: 'image',
        folder: 'projets',
        hint: 'JPEG, PNG ou WebP, 5 Mo maximum. Image convertie en WebP.',
      },
      { name: 'title', label: 'Titre', type: 'text' },
      { name: 'slug', label: 'Adresse de la fiche', type: 'slug', source: 'title', prefix: '/projets/' },
      {
        name: 'category',
        label: 'Catégorie',
        type: 'select',
        half: true,
        options: toOptions(PROJECT_CATEGORIES, projectCategoryLabel),
      },
      {
        name: 'state',
        label: 'État',
        type: 'select',
        half: true,
        options: toOptions(PROJECT_STATES, projectStateLabel),
      },
      { name: 'year', label: 'Année', type: 'number' },
      { name: 'summary', label: 'Problème résolu et résultat', type: 'textarea', rows: 3 },
      {
        name: 'role',
        label: 'Mon rôle',
        type: 'textarea',
        rows: 2,
        placeholder: 'Conception, développement, rédaction...',
      },
      { name: 'techs', label: 'Technologies (séparées par des virgules)', type: 'tags' },
      {
        name: 'linkUrl',
        label: 'Lien (GitHub, démo ou PDF)',
        type: 'text',
        placeholder: 'https://github.com/YeoSiriki/...',
      },
      {
        name: 'body',
        label: 'Fiche détaillée (Markdown)',
        type: 'markdown',
        rows: 10,
        hint: 'Contexte, objectifs, démarche et architecture, résultats et limites.',
      },
      { name: 'images', label: 'Galerie (captures, schémas)', type: 'gallery', folder: 'projets' },
      visible,
    ],
  },
  recherche: {
    schema: publicationSchema,
    fields: [
      { name: 'title', label: 'Titre', type: 'text' },
      { name: 'slug', label: 'Adresse de la page', type: 'slug', source: 'title', prefix: '/recherche/' },
      {
        name: 'type',
        label: 'Type',
        type: 'select',
        half: true,
        options: toOptions(PUBLICATION_TYPES, publicationTypeLabel),
      },
      {
        name: 'status',
        label: 'Statut',
        type: 'select',
        half: true,
        options: toOptions(PUBLICATION_STATUSES, publicationStatusLabel),
      },
      { name: 'authors', label: 'Auteurs', type: 'text' },
      { name: 'venue', label: 'Revue, conférence ou établissement', type: 'text' },
      { name: 'date', label: 'Date', type: 'text', placeholder: '2026-06', hint: PERIOD_HINT },
      { name: 'abstract', label: 'Résumé', type: 'textarea', rows: 5 },
      { name: 'keywords', label: 'Mots-clés (séparés par des virgules)', type: 'tags' },
      { name: 'url', label: 'DOI ou URL', type: 'text', placeholder: 'https://doi.org/...' },
      { name: 'pdfUrl', label: 'Document PDF', type: 'document', folder: 'publications', hint: 'PDF, 20 Mo maximum.' },
      { name: 'hasPage', label: 'Page dédiée sur le site', type: 'checkbox' },
      {
        name: 'body',
        label: 'Contenu de la page dédiée (Markdown)',
        type: 'markdown',
        rows: 14,
        hint: 'Titres avec ##, formules entre $...$ ou $$...$$ (KaTeX).',
      },
      visible,
    ],
  },
  experiences: {
    schema: experienceSchema,
    fields: [
      { name: 'role', label: 'Poste', type: 'text' },
      { name: 'org', label: 'Organisme', type: 'text' },
      { name: 'city', label: 'Ville', type: 'text', half: true },
      {
        name: 'kind',
        label: 'Type',
        type: 'select',
        half: true,
        options: toOptions(EXPERIENCE_KINDS, experienceKindLabel),
      },
      { name: 'start', label: 'Début', type: 'text', half: true, placeholder: '2025-09', hint: PERIOD_HINT },
      {
        name: 'end',
        label: 'Fin',
        type: 'text',
        half: true,
        placeholder: '2026-06',
        hint: 'Laisse vide pour une seule période.',
      },
      { name: 'isCurrent', label: 'Poste actuel', type: 'checkbox' },
      { name: 'missions', label: 'Missions (une par ligne)', type: 'lines', rows: 4 },
      { name: 'tools', label: 'Outils (séparés par des virgules)', type: 'tags' },
      visible,
    ],
  },
  formation: {
    schema: educationSchema,
    fields: [
      {
        name: 'kind',
        label: 'Type',
        type: 'select',
        half: true,
        options: toOptions(EDUCATION_KINDS, educationKindLabel),
      },
      { name: 'mention', label: 'Mention', type: 'text', half: true, placeholder: 'Très Bien' },
      { name: 'title', label: 'Intitulé', type: 'text' },
      { name: 'school', label: 'Établissement', type: 'text' },
      { name: 'city', label: 'Ville', type: 'text' },
      { name: 'startYear', label: 'Année de début', type: 'number', half: true, nullable: true },
      { name: 'endYear', label: 'Année de fin', type: 'number', half: true, nullable: true },
      { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
      {
        name: 'proofUrl',
        label: 'Justificatif (PDF ou image)',
        type: 'justificatif',
        folder: 'justificatifs',
        hint: "Reste privé : il n'apparaît pas sur le site public.",
      },
      visible,
    ],
  },
  enseignement: {
    schema: resourceSchema,
    fields: [
      { name: 'title', label: 'Titre', type: 'text' },
      { name: 'level', label: 'Niveau', type: 'text', half: true, placeholder: '3e, Terminale D...' },
      { name: 'subject', label: 'Matière', type: 'text', half: true },
      {
        name: 'kind',
        label: 'Type',
        type: 'select',
        half: true,
        options: toOptions(RESOURCE_KINDS, resourceKindLabel),
      },
      {
        name: 'status',
        label: 'Statut',
        type: 'select',
        half: true,
        options: toOptions(RESOURCE_STATUSES, resourceStatusLabel),
      },
      { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
      {
        name: 'fileUrl',
        label: 'Fichier (PDF ou .tex)',
        type: 'document',
        folder: 'ressources',
        hint: 'PDF ou .tex, 20 Mo maximum.',
      },
      { name: 'allowDownload', label: 'Téléchargement autorisé', type: 'checkbox' },
    ],
  },
  blog: {
    schema: postSchema,
    fields: [
      { name: 'title', label: 'Titre', type: 'text' },
      { name: 'slug', label: "Adresse de l'article", type: 'slug', source: 'title', prefix: '/blog/' },
      { name: 'category', label: 'Catégorie', type: 'text', half: true, placeholder: 'Réseaux' },
      {
        name: 'status',
        label: 'Statut',
        type: 'select',
        half: true,
        options: toOptions(POST_STATUSES, postStatusLabel),
      },
      {
        name: 'publishAt',
        label: 'Date de publication',
        type: 'datetime',
        half: true,
        hint: 'Heure GMT. Obligatoire pour un article programmé.',
      },
      {
        name: 'readTime',
        label: 'Temps de lecture (min)',
        type: 'number',
        half: true,
        hint: '0 : calcul automatique.',
      },
      {
        name: 'coverUrl',
        label: 'Image de couverture',
        type: 'image',
        folder: 'blog',
        hint: 'JPEG, PNG ou WebP, 5 Mo maximum.',
      },
      { name: 'excerpt', label: 'Résumé', type: 'textarea', rows: 3 },
      {
        name: 'content',
        label: 'Contenu (Markdown)',
        type: 'markdown',
        rows: 18,
        hint: 'Titres avec ##, formules entre $...$ ou $$...$$ (KaTeX).',
      },
    ],
  },
  profil: {
    schema: profileSchema,
    fields: [
      {
        name: 'photoUrl',
        label: 'Photo professionnelle',
        type: 'image',
        folder: 'profil',
        hint: 'Portrait, 5 Mo maximum.',
      },
      { name: 'fullName', label: 'Nom complet', type: 'text', half: true },
      { name: 'shortName', label: "Nom d'usage (grand titre de l'accueil)", type: 'text', half: true },
      { name: 'headline', label: 'Titre', type: 'text' },
      { name: 'publicEmail', label: 'E-mail public', type: 'text', half: true },
      { name: 'city', label: 'Ville', type: 'text', half: true },
      { name: 'availabilityBadge', label: 'Badge de disponibilité', type: 'text' },
      { name: 'bio', label: 'Présentation', type: 'textarea', rows: 4 },
      { name: 'tickerItems', label: 'Bandeau défilant (séparé par des virgules)', type: 'tags' },
      { name: 'cvFrUrl', label: 'CV français (PDF)', type: 'document', folder: 'cv', half: true },
      { name: 'cvEnUrl', label: 'CV anglais (PDF)', type: 'document', folder: 'cv', half: true },
      { name: 'githubUrl', label: 'GitHub', type: 'text', half: true },
      { name: 'linkedinUrl', label: 'LinkedIn', type: 'text', half: true },
    ],
  },
  legal: {
    schema: legalSchema,
    fields: [
      { name: 'privacyPolicy', label: 'Politique de confidentialité (Markdown)', type: 'markdown', rows: 16 },
      { name: 'termsOfUse', label: "Conditions générales d'utilisation (Markdown)", type: 'markdown', rows: 16 },
    ],
  },
  motdepasse: {
    schema: passwordSchema,
    fields: [
      { name: 'current', label: 'Mot de passe actuel', type: 'password', autoComplete: 'current-password' },
      {
        name: 'next',
        label: 'Nouveau mot de passe',
        type: 'password',
        autoComplete: 'new-password',
        hint: '12 caractères au minimum.',
      },
      { name: 'confirm', label: 'Confirmation', type: 'password', autoComplete: 'new-password' },
    ],
  },
};

export type ActionResult =
  { ok: true; id?: string; message?: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

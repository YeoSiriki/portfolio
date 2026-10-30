// Valeurs d'énumération partagées entre le client, le serveur et les schémas Zod.
// Elles doivent rester alignées sur les enums de prisma/schema.prisma.

export const PROJECT_CATEGORIES = ['RECHERCHE', 'RESEAUX', 'DEVELOPPEMENT', 'ENSEIGNEMENT'] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];
export const projectCategoryLabel: Record<ProjectCategory, string> = {
  RECHERCHE: 'Recherche',
  RESEAUX: 'Réseaux',
  DEVELOPPEMENT: 'Développement',
  ENSEIGNEMENT: 'Enseignement',
};

export const PROJECT_STATES = ['TERMINE', 'EN_COURS', 'EXPERIMENTAL', 'TERRAIN'] as const;
export type ProjectState = (typeof PROJECT_STATES)[number];
export const projectStateLabel: Record<ProjectState, string> = {
  TERMINE: 'Terminé',
  EN_COURS: 'En cours',
  EXPERIMENTAL: 'Expérimental',
  TERRAIN: 'Terrain',
};

export const PUBLICATION_TYPES = ['MEMOIRE', 'ARTICLE', 'COMMUNICATION'] as const;
export type PublicationType = (typeof PUBLICATION_TYPES)[number];
export const publicationTypeLabel: Record<PublicationType, string> = {
  MEMOIRE: 'Mémoire',
  ARTICLE: 'Article',
  COMMUNICATION: 'Communication',
};

export const PUBLICATION_STATUSES = ['SOUTENU', 'PUBLIE', 'EN_REVISION', 'SOUMIS', 'EN_PREPARATION'] as const;
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];
export const publicationStatusLabel: Record<PublicationStatus, string> = {
  SOUTENU: 'Soutenu',
  PUBLIE: 'Publié',
  EN_REVISION: 'En révision',
  SOUMIS: 'Soumis',
  EN_PREPARATION: 'En préparation',
};

export const EXPERIENCE_KINDS = ['EMPLOI', 'STAGE', 'BENEVOLAT', 'INDEPENDANT'] as const;
export type ExperienceKind = (typeof EXPERIENCE_KINDS)[number];
export const experienceKindLabel: Record<ExperienceKind, string> = {
  EMPLOI: 'Emploi',
  STAGE: 'Stage',
  BENEVOLAT: 'Bénévolat',
  INDEPENDANT: 'Activité indépendante',
};

export const EDUCATION_KINDS = ['DIPLOME', 'CERTIFICATION'] as const;
export type EducationKind = (typeof EDUCATION_KINDS)[number];
export const educationKindLabel: Record<EducationKind, string> = {
  DIPLOME: 'Diplôme',
  CERTIFICATION: 'Certification',
};

export const RESOURCE_KINDS = ['COURS', 'SUJET_CORRIGE', 'FICHE', 'FORMATION'] as const;
export type ResourceKind = (typeof RESOURCE_KINDS)[number];
export const resourceKindLabel: Record<ResourceKind, string> = {
  COURS: 'Cours',
  SUJET_CORRIGE: 'Sujet et corrigé',
  FICHE: 'Fiche',
  FORMATION: 'Formation',
};

export const RESOURCE_STATUSES = ['BROUILLON', 'PUBLIE'] as const;
export type ResourceStatus = (typeof RESOURCE_STATUSES)[number];
export const resourceStatusLabel: Record<ResourceStatus, string> = {
  BROUILLON: 'Brouillon',
  PUBLIE: 'Publié',
};

export const POST_STATUSES = ['BROUILLON', 'PROGRAMME', 'PUBLIE'] as const;
export type PostStatus = (typeof POST_STATUSES)[number];
export const postStatusLabel: Record<PostStatus, string> = {
  BROUILLON: 'Brouillon',
  PROGRAMME: 'Programmé',
  PUBLIE: 'Publié',
};

export const MESSAGE_STATUSES = ['NEW', 'READ', 'ARCHIVED', 'SPAM'] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];
export const messageStatusLabel: Record<MessageStatus, string> = {
  NEW: 'Non lu',
  READ: 'Lu',
  ARCHIVED: 'Archivé',
  SPAM: 'Indésirable',
};

export const CONTACT_TOPICS = [
  'Opportunité de doctorat',
  'Collaboration de recherche',
  'Projet informatique',
  'Enseignement / formation',
  'Autre',
] as const;

// Fichiers (cahier des charges, section 6.3).
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;

// Tag de cache unique : tout contenu public est revalidé après une modification dans l'admin.
export const CONTENT_TAG = 'content';

// Témoin lisible par le navigateur, posé quand l'administrateur ouvre l'admin. Il ne donne aucun droit :
// il évite seulement aux visiteurs une requête de session pour savoir s'il faut afficher le lien vers l'admin.
export const ADMIN_HINT_COOKIE = 'admin-connecte';
export const ADMIN_HINT_MAX_AGE = 60 * 60 * 2;

export function toOptions<T extends string>(values: readonly T[], labels: Record<T, string>) {
  return values.map((value) => ({ value, label: labels[value] }));
}

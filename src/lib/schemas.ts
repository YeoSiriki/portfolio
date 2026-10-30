// Schémas Zod partagés : les mêmes règles valident les formulaires côté client et les actions côté serveur.
import { z } from 'zod';
import {
  CONTACT_TOPICS,
  EDUCATION_KINDS,
  EXPERIENCE_KINDS,
  POST_STATUSES,
  PROJECT_CATEGORIES,
  PROJECT_STATES,
  PUBLICATION_STATUSES,
  PUBLICATION_TYPES,
  RESOURCE_KINDS,
  RESOURCE_STATUSES,
} from './constants';

// La compilation à la volée de Zod passe par eval, que la politique de sécurité (CSP) interdit.
z.config({ jitless: true });

const PERIOD = /^\d{4}(-(0[1-9]|1[0-2]))?$/;

const text = (max: number) => z.string().trim().max(max, `${max} caractères maximum.`);
const required = (message: string, max = 200) =>
  z.string().trim().min(1, message).max(max, `${max} caractères maximum.`);

const linkOrEmpty = text(500).refine(
  (value) => value === '' || /^https?:\/\/\S+$/i.test(value),
  'Lien invalide : il doit commencer par http:// ou https://.',
);
const fileOrEmpty = text(300).refine((value) => value === '' || value.startsWith('/fichiers/'), 'Fichier invalide.');
const periodOrEmpty = z
  .string()
  .trim()
  .refine((value) => value === '' || PERIOD.test(value), 'Format attendu : AAAA ou AAAA-MM.');
const tags = (maxItems: number, maxLength = 60) =>
  z.array(z.string().trim().min(1).max(maxLength, `${maxLength} caractères maximum par élément.`)).max(maxItems);
const year = z
  .number({ error: 'Année invalide.' })
  .int('Année invalide.')
  .min(1950, 'Année invalide.')
  .max(2100, 'Année invalide.');

export const slugSchema = z
  .string()
  .trim()
  .max(80, '80 caractères maximum.')
  .refine(
    (value) => value === '' || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value),
    'Slug invalide : lettres minuscules, chiffres et tirets uniquement.',
  );

export const projectSchema = z.object({
  title: required('Le titre est obligatoire.'),
  slug: slugSchema,
  category: z.enum(PROJECT_CATEGORIES),
  state: z.enum(PROJECT_STATES),
  year,
  summary: text(600),
  role: text(600),
  body: text(30000),
  techs: tags(20),
  linkUrl: linkOrEmpty,
  coverUrl: fileOrEmpty,
  images: z.array(z.object({ url: fileOrEmpty.min(1), alt: text(200) })).max(12, '12 images maximum.'),
  isPublished: z.boolean(),
});

export const publicationSchema = z.object({
  title: required('Le titre est obligatoire.', 300),
  slug: slugSchema,
  type: z.enum(PUBLICATION_TYPES),
  status: z.enum(PUBLICATION_STATUSES),
  authors: text(300),
  venue: text(300),
  date: periodOrEmpty,
  abstract: text(4000),
  keywords: tags(20),
  url: linkOrEmpty,
  pdfUrl: fileOrEmpty,
  hasPage: z.boolean(),
  body: text(60000),
  isPublished: z.boolean(),
});

export const experienceSchema = z.object({
  role: required('Le poste est obligatoire.'),
  org: text(200),
  city: text(120),
  kind: z.enum(EXPERIENCE_KINDS),
  start: z.string().trim().regex(PERIOD, 'Format attendu : AAAA ou AAAA-MM.'),
  end: periodOrEmpty,
  isCurrent: z.boolean(),
  missions: tags(12, 300),
  tools: tags(20),
  isPublished: z.boolean(),
});

export const educationSchema = z.object({
  title: required("L'intitulé est obligatoire.", 300),
  kind: z.enum(EDUCATION_KINDS),
  school: text(200),
  city: text(120),
  startYear: year.nullable(),
  endYear: year.nullable(),
  mention: text(80),
  description: text(1000),
  proofUrl: fileOrEmpty,
  isPublished: z.boolean(),
});

export const resourceSchema = z.object({
  title: required('Le titre est obligatoire.'),
  level: text(60),
  subject: text(80),
  kind: z.enum(RESOURCE_KINDS),
  status: z.enum(RESOURCE_STATUSES),
  description: text(1000),
  fileUrl: fileOrEmpty,
  allowDownload: z.boolean(),
});

export const postSchema = z
  .object({
    title: required('Le titre est obligatoire.', 300),
    slug: slugSchema,
    category: text(60),
    status: z.enum(POST_STATUSES),
    publishAt: z
      .string()
      .trim()
      .refine((value) => value === '' || !Number.isNaN(Date.parse(value)), 'Date invalide.'),
    readTime: z.number({ error: 'Durée invalide.' }).int().min(0).max(180),
    coverUrl: fileOrEmpty,
    excerpt: text(500),
    content: text(100000),
  })
  .refine((post) => post.status !== 'PROGRAMME' || post.publishAt !== '', {
    path: ['publishAt'],
    message: 'Indiquez la date de publication pour programmer cet article.',
  });

export const contactSchema = z.object({
  name: required('Indiquez votre nom.', 120),
  email: z.email('Adresse e-mail invalide.').max(200),
  topic: z.enum(CONTACT_TOPICS),
  body: z
    .string()
    .trim()
    .min(10, 'Votre message est trop court (10 caractères au minimum).')
    .max(5000, '5 000 caractères maximum.'),
  // Champ piège : invisible pour un humain, rempli par les robots.
  website: z.string().max(200).optional(),
});

export const loginSchema = z.object({
  email: z.email().max(200),
  password: z.string().min(1).max(200),
});

export const replySchema = z.object({
  body: z.string().trim().min(1, 'Écrivez votre réponse.').max(8000, '8 000 caractères maximum.'),
});

export const profileSchema = z.object({
  fullName: required('Le nom est obligatoire.', 120),
  shortName: required("Le nom d'usage est obligatoire.", 60),
  headline: text(160),
  publicEmail: z.email('Adresse e-mail invalide.').max(200),
  city: text(120),
  availabilityBadge: text(120),
  bio: text(800),
  tickerItems: tags(24, 40),
  photoUrl: fileOrEmpty,
  cvFrUrl: fileOrEmpty,
  cvEnUrl: fileOrEmpty,
  githubUrl: linkOrEmpty,
  linkedinUrl: linkOrEmpty,
});

export const homeSchema = z.object({
  scat: z.object({
    title: text(60),
    tagline: text(400),
    problem: text(800),
    solution: text(800),
    kpis: z.array(z.object({ value: text(30), label: text(200) })).length(3),
    phases: z.array(z.object({ title: text(60), text: text(240) })).length(3),
  }),
  teaching: z.object({
    intro: text(500),
    blocks: z.array(z.object({ tag: text(40), title: text(80), text: text(400) })).length(3),
  }),
  languages: z.array(z.object({ name: required('Langue obligatoire.', 40), level: text(80) })).max(8),
  contactIntro: text(300),
});

export const skillsSchema = z.object({
  groups: z
    .array(z.object({ name: required('Le nom de la catégorie est obligatoire.', 60), labels: tags(30, 60) }))
    .max(12, '12 catégories maximum.'),
});

export const legalSchema = z.object({
  privacyPolicy: text(30000),
  termsOfUse: text(30000),
});

export const passwordSchema = z
  .object({
    current: z.string().min(1, 'Saisissez le mot de passe actuel.').max(200),
    next: z.string().min(12, '12 caractères au minimum.').max(200),
    confirm: z.string().max(200),
  })
  .refine((value) => value.next === value.confirm, {
    path: ['confirm'],
    message: 'Les deux mots de passe ne correspondent pas.',
  });

export type ProjectInput = z.infer<typeof projectSchema>;
export type PublicationInput = z.infer<typeof publicationSchema>;
export type ExperienceInput = z.infer<typeof experienceSchema>;
export type EducationInput = z.infer<typeof educationSchema>;
export type ResourceInput = z.infer<typeof resourceSchema>;
export type PostInput = z.infer<typeof postSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type HomeContent = z.infer<typeof homeSchema>;
export type SkillsInput = z.infer<typeof skillsSchema>;
export type LegalInput = z.infer<typeof legalSchema>;
export type PasswordInput = z.infer<typeof passwordSchema>;

/** Convertit les erreurs Zod en dictionnaire { champ: message } pour les formulaires. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    errors[key] ??= issue.message;
  }
  return errors;
}

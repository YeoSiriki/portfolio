export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001').replace(/\/+$/, '');

export const siteName = 'Siriki YEO';

export const homeSections = [
  { href: '/#recherche', label: 'Recherche' },
  { href: '/#projets', label: 'Projets' },
  { href: '/#competences', label: 'Compétences' },
  { href: '/#parcours', label: 'Parcours' },
  { href: '/#enseignement', label: 'Enseignement' },
] as const;

/** Durée de conservation des messages de contact (cahier des charges, section 9). */
export const messageRetentionMonths = 12;

/** Sérialise des données structurées sans permettre la fermeture de la balise script. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

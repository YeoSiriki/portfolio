import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from 'next/font/google';
import type { ReactNode } from 'react';
import { getProfile } from '@/lib/queries';
import { siteName, siteUrl } from '@/lib/site';
import './globals.css';

// next/font télécharge les polices à la construction et les sert depuis le site :
// aucun appel à un service tiers au chargement des pages.
// Titres : Newsreader, serif éditoriale (le registre académique). Texte : IBM Plex Sans. Métadonnées : IBM Plex Mono.
const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  variable: '--font-newsreader',
  display: 'swap',
});
const plexSans = IBM_Plex_Sans({ subsets: ['latin'], variable: '--font-plex-sans', display: 'swap' });
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  const title = `${profile.shortName} · ${profile.headline}`;
  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: `%s · ${profile.shortName}` },
    description: profile.bio,
    authors: [{ name: profile.fullName, url: siteUrl }],
    openGraph: { type: 'website', locale: 'fr_FR', siteName, title, description: profile.bio, url: siteUrl },
    twitter: { card: 'summary_large_image', title, description: profile.bio },
    alternates: { canonical: '/' },
  };
}

export const viewport: Viewport = {
  themeColor: '#fbfaf7',
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      className={`${newsreader.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <body id="haut">{children}</body>
    </html>
  );
}

# Portfolio de Katchèninfoa Siriki YEO

Site public et espace d'administration, conformes au cahier des charges (`../cahier_des_charges.md`).

- **Next.js 16** (App Router, TypeScript) : site public et admin dans un seul projet
- **PostgreSQL** et **Prisma** (schéma, migrations, données initiales)
- **Auth.js** : e-mail et mot de passe, GitHub en option, rôle vérifié côté serveur
- **Tailwind CSS 4** : jetons de la charte dans `src/app/globals.css`
- **React Hook Form** et **Zod** : mêmes schémas côté client et côté serveur (`src/lib/schemas.ts`)
- **Markdown** et **KaTeX** pour le blog, la page SCAT et les fiches projet

## Démarrer en local

Prérequis : Node.js 22 ou plus récent, PostgreSQL 18.

```bash
npm install
npm run dev           # http://localhost:3001
```

La base est la base **`portfolio`** du serveur PostgreSQL 18 de la machine (port 5432), à laquelle le site se
connecte avec l'utilisateur dédié **`portfolio`** (droits limités à cette base ; adresse complète dans
`DATABASE_URL`, fichier `.env`). Elle se consulte dans pgAdmin, sous le serveur « PostgreSQL 18 ». Le site est sur
le port 3001.

Première installation sur une autre machine (dans pgAdmin ou `psql`, connecté en tant que `postgres`) :

```sql
CREATE ROLE portfolio WITH LOGIN PASSWORD 'mot-de-passe-du-site';
CREATE DATABASE portfolio OWNER portfolio ENCODING 'UTF8' TEMPLATE template0;
```

puis, après avoir renseigné `DATABASE_URL` dans `.env` :

```bash
npm run db:deploy     # crée les tables (migrations)
npm run db:seed       # compte admin + contenu issu du CV
```

Variante sans serveur PostgreSQL installé en service : `npm run db:local` crée une base propre au projet
(données dans `.postgres/`, port 5434, sans mot de passe) ; `npm run dev` la démarre alors tout seul si
`DATABASE_URL` pointe sur `postgresql://portfolio@localhost:5434/portfolio`.

Le seed affiche **une seule fois** le mot de passe administrateur généré (sauf si `ADMIN_PASSWORD` est défini).
Mot de passe perdu : `npm run admin:password -- "nouveau mot de passe"`.

L'admin est à l'adresse `/admin`. Pour utiliser une autre base (production, par exemple), changer `DATABASE_URL`
dans `.env`. Si les styles semblent ne pas se mettre à jour en développement, arrêter le serveur, supprimer
`.next/dev` et relancer.

## Commandes

| Commande                                              | Rôle                                                             |
| ----------------------------------------------------- | ---------------------------------------------------------------- |
| `npm run dev`                                         | Serveur de développement                                         |
| `npm run build` puis `npm run start`                  | Construction et serveur de production                            |
| `npm run lint`, `npm run typecheck`, `npm run format` | Qualité du code (ESLint, TypeScript, Prettier)                   |
| `npm run test`                                        | Tests unitaires (Vitest)                                         |
| `npm run test:e2e`                                    | Parcours clés (Playwright), contre un site démarré               |
| `npm run db:migrate`                                  | Créer une migration après modification de `prisma/schema.prisma` |
| `npm run db:deploy`                                   | Appliquer les migrations (production)                            |
| `npm run db:seed`                                     | Données initiales (ne modifie pas un site déjà initialisé)       |
| `npm run db:backup`                                   | Sauvegarde de la base dans `backups/`                            |
| `npm run db:local`, `npm run db:local:stop`           | Démarrer ou arrêter la base locale du projet                     |

Tests de bout en bout, la première fois : `npx playwright install chromium` (ou `E2E_CHANNEL=msedge` pour utiliser
Edge déjà installé). Pour tester l'admin connecté : `E2E_ADMIN_PASSWORD="..." npm run test:e2e`. Lancés plusieurs
fois dans la même heure, les tests du formulaire de contact finissent par buter sur la limite anti-spam
(5 messages par heure) : c'est le comportement attendu.

## Motion design

Le mouvement sert à expliquer, pas à décorer. Tout est décrit dans `src/app/globals.css`, section « Motion design ».

- **Entrée de page** : le nom se dévoile ligne par ligne, le reste monte en cascade (CSS pur, visible sans JavaScript).
- **Apparitions au défilement** : fondu de 14 px, une seule fois ; les titres de section montent derrière un masque
  (`src/components/reveal-observer.tsx`, un seul observateur pour tout le site).
- **Schéma SCAT** (`src/components/cluster-diagram.tsx`) : la cible parcourt la zone, chaque drone s'active dès que
  sa position prédite entre dans sa portée, puis le relais passe d'un cluster à l'autre. Les images clés sont
  calculées côté serveur (`src/lib/scat-scene.ts`) et seules l'opacité et la transformation sont animées : le
  navigateur confie le tout au compositeur graphique. Un test vérifie que la cible reste couverte en continu.
- **Transitions entre pages** (`src/components/page-transition.tsx`, composant `<ViewTransition>` de React) :
  fondu pour une navigation ordinaire, glissement directionnel pour entrer dans une fiche ou en revenir, et le
  titre d'une carte devient le titre de la page ouverte. La barre de navigation reste fixe.
- **Filtrage des projets** : les cartes qui restent glissent à leur place, les autres s'effacent.
- **Barre de navigation** : un trait d'accent suit la section en cours de lecture.
- **Détails** : flèches qui avancent au survol, cartes qui se soulèvent, coche qui se trace à l'envoi d'un message.

Règles : entrées de 240 à 850 ms, sorties de 150 ms, déplacements de 10 à 40 px, aucun rebond, rien de lié au
curseur. Tout s'arrête avec le réglage système « réduire les animations ».

## Fonctionnement

**Pages publiques statiques.** Chaque lecture de contenu (`src/lib/queries.ts`) est mise en cache et étiquetée.
Les pages sont générées à la construction ; toute modification dans l'admin invalide l'étiquette et le site
se met à jour sans redéploiement. La construction échoue si une page publique devient dynamique.

**Brouillons.** Seul le contenu publié est lu par le site public. Le bouton « Prévisualiser » de l'admin
affiche un élément non publié avec les composants du site.

**Sécurité.**

- Mots de passe hachés avec bcrypt ; 5 tentatives de connexion par quart d'heure et par adresse IP.
- Droits vérifiés côté serveur dans chaque page, chaque action et chaque route de l'admin (`src/lib/guard.ts`).
- Entrées validées par Zod ; en-têtes CSP et HSTS (`next.config.ts`).
- Fichiers : taille et type réel contrôlés (`src/lib/files.ts`), images converties en WebP.
- Formulaire de contact : champ piège, 5 messages par heure et par adresse IP.

**Données personnelles.** Les messages sont supprimés après 12 mois. L'adresse IP n'est jamais stockée en clair.

**Fichiers.** Sans configuration S3, ils sont écrits dans `storage/` (développement). En production sur un
hébergement sans disque persistant, renseigner les variables `S3_*`. Les justificatifs de diplômes et les
ressources pédagogiques ne sont jamais servis directement au public.

## Mise en ligne

1. Hébergement compatible Next.js et base PostgreSQL managée (sauvegardes quotidiennes activées).
2. Variables d'environnement : voir `.env.example`. Indispensables : `DATABASE_URL`, `AUTH_SECRET`,
   `NEXT_PUBLIC_SITE_URL` (le nom de domaine), `SMTP_*` et `MAIL_FROM` (notifications), `S3_*` (fichiers).
3. Construction : `npm run db:deploy && npm run build`, puis `npm run db:seed` une seule fois.
4. Brancher le nom de domaine, puis vérifier `/sitemap.xml` et `/robots.txt`.
5. Dans l'admin, vider la liste « À compléter » du tableau de bord.

Connexion GitHub (facultative) : créer une application OAuth GitHub dont l'adresse de retour est
`https://DOMAINE/api/auth/callback/github`, puis renseigner `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` et
`ADMIN_GITHUB_LOGIN` (seul ce compte GitHub est accepté).

## Organisation du code

```
prisma/            schéma, migrations, données initiales
src/app/(public)/  site public
src/app/admin/     connexion, modules d'administration, aperçu
src/actions/       actions serveur (écritures)
src/components/    interface du site ; admin/ pour l'administration
src/lib/           accès aux données, validation, stockage, e-mail, sécurité
tests/             tests unitaires (unit/) et de bout en bout (e2e/)
```

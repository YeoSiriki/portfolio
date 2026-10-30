// Données initiales du portfolio.
// Sources : le CV (CV_KATCHENINFOA_SIRIKI_YEO.pdf), la maquette validée et le cahier des charges.
// Rien n'est inventé : ce qui manque (rôle, liens, sections de la page SCAT...) reste vide et
// apparaît dans la liste « À compléter » du tableau de bord.
//
// Le script ne touche pas à un site déjà initialisé. Pour repartir de zéro : SEED_RESET=1 npm run db:seed
import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';
import { type HomeContent, homeSchema } from '../src/lib/schemas';
import { buildKey, putObject, urlForKey } from '../src/lib/storage';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const home: HomeContent = {
  scat: {
    title: 'SCAT',
    tagline:
      "Surveillance Coopérative par Architecture en clusters et recherche Tabou. Mon mémoire de Master : conception d'un protocole de suivi de cible mobile dans les réseaux de drones aériens.",
    problem:
      "Surveiller des cibles qui bougent avec un essaim de drones exige une couverture continue, sous contraintes d'énergie et de passage à l'échelle. Les approches existantes peinent à concilier les trois.",
    solution:
      "Un protocole distribué en clusters hiérarchiques : un Chef d'Essaim, élu sur un score multicritère (énergie, connectivité, position), coordonne ses drones. Le placement des drones est formulé comme un Minimum Set Cover (NP-complet) et résolu par recherche Tabou.",
    kpis: [
      { value: '100 %', label: 'de taux de couverture dès 20 drones, quelle que soit la densité de cibles' },
      { value: '0 s', label: "de latence de couverture dès 20 drones, contre jusqu'à 4,5 s pour TPA" },
      { value: 'OMNeT++ 6.1', label: 'simulations comparatives sur 3 indicateurs : couverture, énergie, latence' },
    ],
    phases: [
      { title: 'Détection', text: 'Les cibles sont repérées par échange de balises radio.' },
      { title: 'Prédiction', text: 'Un modèle cinématique estime leurs positions futures.' },
      { title: 'Couverture', text: 'La recherche Tabou positionne les drones sur les sites stratégiques.' },
    ],
  },
  teaching: {
    intro:
      "J'enseigne depuis 2017, du soutien scolaire jusqu'aux cours de mathématiques au collège. Transmettre le savoir est au cœur de mon projet d'enseignant-chercheur.",
    blocks: [
      {
        tag: 'Depuis sept. 2025',
        title: 'Cours de mathématiques',
        text: 'Collège Jean de Fontaine et Collège Souleymane Sakrou : cours, fiches, exercices, évaluations et diaporamas.',
      },
      {
        tag: 'LaTeX',
        title: 'Sujets & corrigés',
        text: 'Tests de sélection de 3e et de Terminale D, avec corrigés et barèmes détaillés, composés en LaTeX.',
      },
      {
        tag: 'Depuis 2024',
        title: 'Formation numérique',
        text: "Poro Numérique : initiation à l'ordinateur et aux outils bureautiques, modules Excel pour débutants.",
      },
    ],
  },
  languages: [
    { name: 'Français', level: 'langue nationale, excellent niveau' },
    { name: 'Anglais', level: 'niveau scolaire' },
  ],
  contactIntro: 'Une proposition de thèse, une collaboration de recherche ou un projet ? Écrivez-moi.',
};

const scatProjectBody = `## Contexte et problème

${home.scat.problem}

## Démarche et architecture

${home.scat.solution}

Le protocole enchaîne trois phases :

1. **Détection.** Les cibles sont repérées par échange de balises radio.
2. **Prédiction.** Un modèle cinématique estime leurs positions futures.
3. **Couverture.** La recherche Tabou positionne les drones sur les sites stratégiques.

## Résultats

- 100 % de taux de couverture dès 20 drones, quelle que soit la densité de cibles.
- 0 s de latence de couverture dès 20 drones, contre jusqu'à 4,5 s pour TPA.
- Simulations comparatives sous OMNeT++ 6.1 sur 3 indicateurs : couverture, énergie, latence.

[Lire l'étude complète](/recherche/scat)
`;

// Les sections Objectifs, Limites et Perspectives sont à rédiger dans l'admin (Recherche & publications).
const scatPageBody = `## Problématique

${home.scat.problem}

## Architecture

Un protocole distribué en clusters hiérarchiques : un Chef d'Essaim, élu sur un score multicritère (énergie, connectivité, position), coordonne ses drones.

## Les trois phases

1. **Détection.** Les cibles sont repérées par échange de balises radio.
2. **Prédiction.** Un modèle cinématique estime leurs positions futures.
3. **Couverture.** La recherche Tabou positionne les drones sur les sites stratégiques.

## Choix algorithmiques

Le placement des drones est formulé comme un Minimum Set Cover (NP-complet) et résolu par recherche Tabou.

## Cadre expérimental

Simulations comparatives sous OMNeT++ 6.1, sur 3 indicateurs : couverture, énergie, latence. Le protocole de comparaison est TPA.

## Résultats

- 100 % de taux de couverture dès 20 drones, quelle que soit la densité de cibles.
- 0 s de latence de couverture dès 20 drones, contre jusqu'à 4,5 s pour TPA.
`;

const privacyPolicy = `## Responsable du traitement

Katchèninfoa Siriki YEO, Korhogo, Côte d'Ivoire. Contact : sirikikyeo@gmail.com.

## Données collectées

Le site ne collecte des données personnelles que par le formulaire de contact :

- votre nom ;
- votre adresse e-mail ;
- l'objet et le contenu de votre message.

Pour limiter les envois abusifs, une empreinte chiffrée de votre adresse IP est enregistrée avec le message. L'adresse IP elle-même n'est pas conservée.

## Finalité

Ces données servent uniquement à lire votre message et à vous répondre. Elles ne sont ni vendues, ni cédées, ni utilisées à des fins publicitaires.

## Durée de conservation

Les messages sont conservés 12 mois au plus, puis supprimés automatiquement. Ils peuvent être supprimés plus tôt sur simple demande.

## Cookies et mesure d'audience

Le site n'utilise aucun cookie publicitaire ni outil de mesure d'audience. Le seul cookie existant est un cookie de session, strictement nécessaire, réservé à l'administrateur du site.

## Vos droits

Conformément à la loi ivoirienne n° 2013-450 du 19 juin 2013 relative à la protection des données à caractère personnel, vous disposez d'un droit d'accès, de rectification, d'opposition et de suppression de vos données. Pour l'exercer, écrivez à sirikikyeo@gmail.com.

Vous pouvez également saisir l'Autorité de Régulation des Télécommunications/TIC de Côte d'Ivoire (ARTCI), autorité de protection des données.
`;

const termsOfUse = `## Objet

Ce site présente le parcours, les travaux de recherche, les projets et les ressources pédagogiques de Katchèninfoa Siriki YEO. Sa consultation est libre et gratuite. En naviguant sur le site, vous acceptez les présentes conditions.

## Propriété intellectuelle

Sauf mention contraire, les textes, schémas, documents et images du site appartiennent à leur auteur. Vous pouvez les citer en indiquant la source. Toute reproduction intégrale ou à des fins commerciales nécessite un accord écrit préalable.

## Ressources pédagogiques

Les sujets, corrigés et supports proposés au téléchargement sont destinés à un usage personnel ou pédagogique. Ils ne peuvent pas être revendus ni redistribués sous un autre nom.

## Formulaire de contact

Le formulaire sert à proposer une thèse, une collaboration ou un projet, ou à poser une question. Les messages injurieux, publicitaires ou automatisés ne sont pas traités.

## Responsabilité

Les informations publiées sont fournies de bonne foi et mises à jour régulièrement. Elles peuvent néanmoins contenir des erreurs ou ne plus être à jour. Le site peut être interrompu pour maintenance. Les sites externes vers lesquels pointent certains liens ne relèvent pas de la responsabilité de l'auteur.

## Droit applicable

Les présentes conditions sont régies par le droit ivoirien.

## Contact

Pour toute question : sirikikyeo@gmail.com.
`;

async function storeCv(): Promise<string | null> {
  const source = path.resolve(process.env.SEED_CV_PATH ?? '../CV_KATCHENINFOA_SIRIKI_YEO.pdf');
  if (!existsSync(source)) {
    console.log(`  CV introuvable (${source}) : à téléverser depuis l'admin.`);
    return null;
  }
  const key = buildKey('public', 'cv', 'pdf');
  await putObject(key, await readFile(source));
  return urlForKey(key);
}

async function seedAdmin() {
  if ((await prisma.user.count()) > 0) return;
  const email = (process.env.ADMIN_EMAIL ?? 'sirikikyeo@gmail.com').toLowerCase();
  // Dans .env, ADMIN_PASSWORD="" donne une chaîne vide et non une variable absente : d'où ||.
  const provided = process.env.ADMIN_PASSWORD || null;
  const generated = provided === null;
  const password = provided ?? randomBytes(12).toString('base64url');
  await prisma.user.create({ data: { email, passwordHash: await bcrypt.hash(password, 12), role: 'ADMIN' } });
  console.log(`  Compte administrateur créé : ${email}`);
  if (generated) {
    console.log(`  Mot de passe généré (à noter, il ne sera plus affiché) : ${password}`);
    console.log('  Change-le dans Admin > Profil & réglages > Compte.');
  }
}

async function seedContent() {
  if (process.env.SEED_RESET === '1') {
    console.log('  SEED_RESET=1 : le contenu existant est effacé.');
    await prisma.$transaction([
      prisma.projectImage.deleteMany(),
      prisma.project.deleteMany(),
      prisma.publication.deleteMany(),
      prisma.experience.deleteMany(),
      prisma.education.deleteMany(),
      prisma.skill.deleteMany(),
      prisma.resource.deleteMany(),
      prisma.post.deleteMany(),
      prisma.profile.deleteMany(),
    ]);
  } else if (await prisma.profile.findUnique({ where: { id: 1 } })) {
    console.log('  Contenu déjà initialisé : rien à faire.');
    return;
  }

  await prisma.profile.create({
    data: {
      id: 1,
      fullName: 'Katchèninfoa Siriki YEO',
      shortName: 'Siriki Yeo',
      headline: 'Réseaux & systèmes communicants · Recherche · Enseignement',
      bio: "Titulaire d'un Master 2 en Réseaux et Systèmes Communicants, je conçois des protocoles pour les réseaux de drones, je développe des applications et j'enseigne les mathématiques. Mon cap : un doctorat, puis l'enseignement supérieur et la recherche.",
      city: "Korhogo, Côte d'Ivoire",
      publicEmail: 'sirikikyeo@gmail.com',
      availabilityBadge: 'Ouvert aux opportunités de doctorat et de collaboration',
      tickerItems: [
        'Réseaux de drones',
        'Systèmes communicants',
        'OMNeT++',
        'Optimisation combinatoire',
        'Recherche Tabou',
        'C / C++',
        'Python',
        'Théorie des graphes',
        'Fibre FTTH',
        'LaTeX',
      ],
      cvFrUrl: await storeCv(),
      githubUrl: 'https://github.com/YeoSiriki',
      // Adresse reprise du prototype : à vérifier dans Admin > Profil & réglages.
      linkedinUrl: 'https://www.linkedin.com/in/katcheninfoa-siriki-yeo-46927a242',
      home: homeSchema.parse(home),
      privacyPolicy,
      termsOfUse,
    },
  });

  // Marketplace et Plateforme de gestion scolaire sont « à confirmer » (cahier des charges, section 13) :
  // ils sont créés masqués et se publient en un clic depuis l'admin.
  const projects = [
    {
      slug: 'scat-suivi-de-cibles-par-drones',
      title: 'SCAT : suivi de cibles par drones',
      category: 'RECHERCHE',
      state: 'TERMINE',
      year: 2026,
      summary:
        'Protocole distribué combinant clusters hiérarchiques, prédiction cinématique et recherche Tabou. 100 % de couverture dès 20 drones sous OMNeT++.',
      role: 'Mémoire de Master 2 : conception du protocole et simulations sous OMNeT++ 6.1.',
      body: scatProjectBody,
      techs: ['OMNeT++ 6.1', 'C++', 'Recherche Tabou'],
      isPublished: true,
    },
    {
      slug: 'detection-de-communautes',
      title: 'Détection de communautés',
      category: 'RECHERCHE',
      state: 'TERMINE',
      year: 2026,
      summary:
        'Algorithme de Louvain appliqué à trois réseaux : Karate Club de Zachary, benchmark LFR et réseau Facebook (SNAP).',
      techs: ['Python', 'NetworkX', 'Louvain'],
      isPublished: true,
    },
    {
      slug: 'raccordement-fibre-ftth',
      title: 'Raccordement fibre FTTH',
      category: 'RESEAUX',
      state: 'TERRAIN',
      year: 2023,
      summary:
        "Tirage et soudure de fibre jusqu'au client, préparation du tiroir optique et du manchon, bilan optique. MG Telecom et Côte d'Ivoire Câble.",
      role: "Technicien fibre optique FTTH chez MG Telecom et Services, puis stagiaire technicien chez Côte d'Ivoire Câble (mars 2023).",
      techs: ['FTTH', 'Soudure optique', 'Bilan optique'],
      isPublished: true,
    },
    {
      slug: 'marketplace',
      title: 'Marketplace',
      category: 'DEVELOPPEMENT',
      state: 'EN_COURS',
      year: 2026,
      summary: 'Plateforme de vente avec trois espaces : acheteur, vendeur et administrateur.',
      techs: ['React.js', 'Node.js', 'Express.js'],
      isPublished: false,
    },
    {
      slug: 'plateforme-de-gestion-scolaire',
      title: 'Plateforme de gestion scolaire',
      category: 'DEVELOPPEMENT',
      state: 'EN_COURS',
      year: 2026,
      summary: 'Espaces élèves, enseignants et administration : notes, emplois du temps et notifications aux parents.',
      techs: ['JavaScript', 'SQL'],
      isPublished: false,
    },
    {
      slug: 'sujets-et-corriges-de-mathematiques',
      title: 'Sujets & corrigés de mathématiques',
      category: 'ENSEIGNEMENT',
      state: 'TERMINE',
      year: 2026,
      summary: 'Tests de sélection pour la 3e et la Terminale D, avec corrigés et barèmes détaillés.',
      techs: ['LaTeX', 'Mathématiques', 'APC'],
      isPublished: true,
    },
  ] as const;
  for (const [index, project] of projects.entries()) {
    await prisma.project.create({ data: { ...project, techs: [...project.techs], position: index + 1 } });
  }

  await prisma.publication.create({
    data: {
      slug: 'scat',
      type: 'MEMOIRE',
      status: 'SOUTENU',
      title: "Conception d'un protocole de suivi de cible mobile dans les réseaux de drones aériens",
      authors: 'Katchèninfoa Siriki YEO',
      venue: 'Université Peleforo Gon Coulibaly, Korhogo',
      date: '2026',
      abstract:
        'SCAT (Surveillance Coopérative par Architecture en clusters et recherche Tabou) est un protocole de suivi de cibles mobiles par réseaux de drones aériens. Il atteint 100 % de couverture dès 20 drones, sans latence de couverture, lors de simulations comparatives sous OMNeT++ 6.1.',
      keywords: [
        'drones',
        'suivi de cibles',
        'clusters hiérarchiques',
        'Minimum Set Cover',
        'recherche Tabou',
        'OMNeT++',
      ],
      hasPage: true,
      body: scatPageBody,
      isPublished: true,
      position: 1,
    },
  });

  // Expériences : intitulés et missions repris du CV. « Cours de soutien » figure au CV mais pas dans
  // les sept entrées du cahier des charges : il est créé masqué.
  const experiences = [
    {
      role: 'Professeur de mathématiques',
      org: 'Collège Jean de Fontaine & Collège Souleymane Sakrou',
      kind: 'EMPLOI',
      start: '2025-09',
      isCurrent: true,
      missions: [
        'Préparer et dispenser des cours de mathématiques aux élèves de différents niveaux.',
        'Concevoir des supports pédagogiques variés : fiches, exercices, évaluations, diaporamas.',
      ],
    },
    {
      role: 'Stagiaire gestionnaire de base de données',
      org: "Côte d'Ivoire Logistique, Guichet Unique",
      kind: 'STAGE',
      start: '2024',
      isCurrent: true,
      missions: [
        'Enregistrement et indexation des dossiers des automobilistes dans la base de données nationale.',
        'Numérisation et archivage électronique des documents officiels liés aux véhicules.',
      ],
    },
    {
      role: 'Formateur en informatique bureautique et designer',
      org: 'Poro Numérique',
      kind: 'EMPLOI',
      start: '2024',
      isCurrent: true,
      missions: [
        "Initier les apprenants à l'utilisation de l'ordinateur et aux outils numériques de base.",
        'Participer à la création de contenus multimédias (bannières, vidéos promotionnelles).',
      ],
    },
    {
      role: "Bénévole, Coupe d'Afrique des Nations CAN 2023",
      org: 'Office du Service Civique National',
      kind: 'BENEVOLAT',
      start: '2024-01',
      end: '2024-02',
      missions: [
        'Accueillir et orienter les visiteurs, officiels et délégations dans les zones du stade ou du village CAN.',
        'Promouvoir les valeurs du civisme, du volontariat et de la solidarité pendant la compétition.',
      ],
    },
    {
      role: 'Stagiaire informaticien',
      org: 'Agence Emploi Jeunes',
      city: 'Korhogo',
      kind: 'STAGE',
      start: '2023-08',
      missions: [
        "Installation, configuration et mise à jour de logiciels et systèmes d'exploitation.",
        'Entretien et maintenance du parc informatique (ordinateurs, imprimantes, réseau local).',
      ],
    },
    {
      role: 'Technicien fibre optique FTTH',
      org: 'MG Telecom et Services',
      kind: 'EMPLOI',
      start: '2023-03',
      missions: ['Raccordement et tirage de câble.', 'Préparation du tiroir optique et du manchon.', 'Bilan optique.'],
    },
    {
      role: 'Stagiaire technicien fibre optique',
      org: "Côte d'Ivoire Câble",
      kind: 'STAGE',
      start: '2023-03',
      missions: [
        "Tirage de câble jusqu'au domicile du client.",
        'Raccordement du câble (soudure des brins de fibre).',
        'Installation et activation du wifi chez le client.',
      ],
    },
    {
      role: 'Cours de soutien au secondaire',
      kind: 'INDEPENDANT',
      start: '2017-09',
      isCurrent: true,
      missions: [],
      isPublished: false,
    },
  ] as const;
  for (const [index, experience] of experiences.entries()) {
    await prisma.experience.create({
      data: { isPublished: true, ...experience, missions: [...experience.missions], tools: [], position: index + 1 },
    });
  }

  // Formation : le BEPC figure au CV mais pas dans le cahier des charges ; il est créé masqué.
  const education = [
    {
      kind: 'DIPLOME',
      title: 'Master 2 Réseaux et Systèmes Communicants',
      school: 'Université Peleforo Gon Coulibaly',
      city: 'Korhogo',
      startYear: 2024,
      endYear: 2026,
      mention: 'Très Bien',
    },
    {
      kind: 'DIPLOME',
      title: 'Master 1 Réseaux et Systèmes Communicants',
      school: 'Université Peleforo Gon Coulibaly',
      startYear: 2023,
      endYear: 2024,
    },
    {
      kind: 'DIPLOME',
      title: 'Licence Sciences Informatiques et Informatique de Gestion',
      school: 'Université Peleforo Gon Coulibaly',
      startYear: 2021,
      endYear: 2023,
    },
    {
      kind: 'DIPLOME',
      title: 'Baccalauréat scientifique, série D',
      school: 'Lycée Moderne de Ferkessédougou',
      endYear: 2020,
    },
    {
      kind: 'DIPLOME',
      title: "Brevet d'Étude du Premier Cycle (BEPC)",
      school: 'Collège Moderne Natio Kobadara',
      endYear: 2017,
      isPublished: false,
    },
    {
      kind: 'CERTIFICATION',
      title: 'Hacking de base & Python de base',
      school: 'Mel-Académie & Mel-Outils',
      endYear: 2024,
      description:
        'Février 2024. Principes éthiques et légaux du hacking ; concepts de cybersécurité : modèles de menace, reconnaissance, scan de ports.',
    },
    {
      kind: 'CERTIFICATION',
      title: 'Approche Par Compétence (APC) du professeur de mathématiques',
      school: 'OLCTESU',
      city: 'Korhogo',
      endYear: 2025,
      description: 'Formation pédagogique du 28 juillet au 2 août 2025.',
    },
  ] as const;
  for (const [index, item] of education.entries()) {
    await prisma.education.create({ data: { isPublished: true, ...item, position: index + 1 } });
  }

  const skills: [string, string[]][] = [
    ['Programmation', ['C', 'C++', 'Java', 'Python', 'JavaScript', 'TypeScript', 'SQL']],
    ['Développement web', ['React.js', 'Node.js', 'Express.js', 'HTML5', 'CSS3']],
    [
      'Réseaux & systèmes',
      [
        'Administration réseau',
        'TCP/IP',
        'VLAN',
        'DNS',
        'DHCP',
        'VPN',
        'Sécurité informatique',
        'Virtualisation',
        'Fibre FTTH',
      ],
    ],
    ["Systèmes d'exploitation", ['Linux (Ubuntu)', 'Windows', 'Windows Server']],
    [
      'Recherche & simulation',
      ['OMNeT++', 'Optimisation combinatoire', 'Théorie des graphes', 'Modélisation mathématique'],
    ],
    ['Outils', ['Git', 'Cisco Packet Tracer', 'WinDev', 'LaTeX', 'Microsoft Office']],
  ];
  let position = 0;
  await prisma.skill.createMany({
    data: skills.flatMap(([group, labels]) => labels.map((label) => ({ group, label, position: (position += 1) }))),
  });

  // Ressources : créées en brouillon, sans fichier. À publier une fois les droits confirmés.
  const resources = [
    {
      title: 'Test de sélection de 3e : sujet et corrigé',
      level: '3e',
      subject: 'Mathématiques',
      kind: 'SUJET_CORRIGE',
    },
    {
      title: 'Test de sélection de Terminale D : sujet et corrigé',
      level: 'Terminale D',
      subject: 'Mathématiques',
      kind: 'SUJET_CORRIGE',
    },
    { title: 'Excel pour débutants', level: 'Débutants', subject: 'Bureautique', kind: 'FORMATION' },
  ] as const;
  for (const [index, resource] of resources.entries()) {
    await prisma.resource.create({ data: { ...resource, status: 'BROUILLON', position: index + 1 } });
  }

  console.log('  Contenu initial créé.');
}

async function main() {
  console.log('Initialisation du portfolio');
  await seedAdmin();
  await seedContent();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

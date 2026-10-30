import { expect, test } from '@playwright/test';

const email = process.env.E2E_ADMIN_EMAIL ?? 'sirikikyeo@gmail.com';
const password = process.env.E2E_ADMIN_PASSWORD ?? '';

test.describe('protection de l’admin', () => {
  test('un visiteur non connecté est renvoyé vers la connexion', async ({ page }) => {
    for (const path of ['/admin', '/admin/projets', '/admin/messages', '/admin/reglages']) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/admin\/login$/);
    }
  });

  test('les écritures directes sont refusées sans session', async ({ request, baseURL }) => {
    const upload = await request.post('/api/upload', {
      headers: { origin: baseURL ?? '' },
      multipart: {
        kind: 'image',
        folder: 'projets',
        file: { name: 'a.png', mimeType: 'image/png', buffer: Buffer.from('x') },
      },
    });
    expect(upload.status()).toBe(401);

    const forged = await request.post('/api/upload', {
      headers: { origin: 'https://site-malveillant.example' },
      multipart: {
        kind: 'image',
        folder: 'projets',
        file: { name: 'a.png', mimeType: 'image/png', buffer: Buffer.from('x') },
      },
    });
    expect(forged.status()).toBe(403);

    const privateFile = await request.get('/fichiers/prive/justificatifs/2026-10-abcdef.pdf');
    expect(privateFile.status()).toBe(404);
  });

  test('un mauvais mot de passe donne un message générique', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Mot de passe').fill('mauvais-mot-de-passe');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByText('Identifiants incorrects.')).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login$/);
  });
});

test.describe('gestion du contenu', () => {
  test.skip(!password, 'Définir E2E_ADMIN_PASSWORD pour tester l’admin connecté.');
  // Un seul passage : le scénario écrit en base.
  test.skip(({ isMobile }) => isMobile, 'Scénario joué une fois, sur ordinateur.');

  test('un brouillon reste invisible, puis apparaît dès sa publication, sans redéploiement', async ({ page }) => {
    const title = `Projet de test ${Date.now()}`;
    const slug = title.toLowerCase().replace(/ /g, '-');

    await page.goto('/admin/login');
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Mot de passe').fill(password);
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Tableau de bord' })).toBeVisible();

    // Champ obligatoire : message d'erreur clair.
    await page.goto('/admin/projets?nouveau=1');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Le titre est obligatoire.')).toBeVisible();

    // Création en brouillon : le slug est généré depuis le titre.
    await page.getByLabel('Titre', { exact: true }).fill(title);
    await expect(page.getByLabel('Adresse de la fiche')).toHaveValue(slug);
    await page.getByLabel('Problème résolu et résultat').fill('Créé par les tests de bout en bout.');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Enregistré' })).toBeVisible();

    // Brouillon : introuvable publiquement, y compris par son adresse directe.
    const draft = await page.request.get(`/projets/${slug}`);
    expect(draft.status()).toBe(404);
    await page.goto('/projets');
    await expect(page.getByRole('link', { name: title })).toHaveCount(0);

    // L'aperçu, lui, montre le brouillon à l'administrateur.
    await page.goto('/admin/projets');
    await page.getByRole('link', { name: `Modifier « ${title} »` }).click();
    await expect(page.getByLabel('Titre', { exact: true })).toHaveValue(title);
    const previewHref = await page.getByRole('link', { name: 'Prévisualiser' }).getAttribute('href');
    await page.goto(previewHref ?? '');
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await expect(page.getByText('élément non publié')).toBeVisible();

    // Publication : visible immédiatement sur le site public.
    await page.goto('/admin/projets');
    await page.getByRole('link', { name: `Modifier « ${title} »` }).click();
    await expect(page.getByLabel('Titre', { exact: true })).toHaveValue(title);
    await page.getByLabel('Visible sur le site').check();
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Enregistré' })).toBeVisible();

    await page.goto(`/projets/${slug}`);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await page.goto('/projets');
    await expect(page.getByRole('link', { name: title })).toBeVisible();

    // Suppression, avec confirmation obligatoire.
    await page.goto('/admin/projets');
    await page.getByRole('link', { name: `Modifier « ${title} »` }).click();
    await expect(page.getByLabel('Titre', { exact: true })).toHaveValue(title);
    await page.getByRole('button', { name: 'Supprimer' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText(title);
    await dialog.getByRole('button', { name: 'Supprimer' }).click();
    await expect(page.getByRole('link', { name: `Modifier « ${title} »` })).toHaveCount(0);

    const removed = await page.request.get(`/projets/${slug}`);
    expect(removed.status()).toBe(404);
  });

  test('les fichiers invalides sont refusés avec un message clair, les images sont converties en WebP', async ({
    page,
    baseURL,
  }) => {
    await page.goto('/admin/login');
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Mot de passe').fill(password);
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Tableau de bord' })).toBeVisible();

    const send = (name: string, mimeType: string, buffer: Buffer, kind = 'image') =>
      page.request.post('/api/upload', {
        headers: { origin: baseURL ?? '' },
        multipart: { kind, folder: 'projets', file: { name, mimeType, buffer } },
      });

    // Un fichier texte renommé en .png : refusé sur son contenu réel.
    const fake = await send('photo.png', 'image/png', Buffer.from('ceci n’est pas une image'));
    expect(fake.status()).toBe(400);
    expect((await fake.json()).error).toBe('Format refusé : image JPEG, PNG ou WebP uniquement.');

    // Une image de plus de 5 Mo : refusée sur sa taille. Sur Vercel, la plateforme la refuse elle-même
    // (au-delà de 4,5 Mo, code 413) avant que le site ne réponde.
    const heavy = Buffer.alloc(5 * 1024 * 1024 + 10);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(heavy);
    const tooBig = await send('lourde.png', 'image/png', heavy);
    expect([400, 413]).toContain(tooBig.status());
    if (tooBig.status() === 400) expect((await tooBig.json()).error).toBe('Image trop lourde : 5 Mo maximum.');

    // Une vraie image : acceptée, convertie en WebP et servie par le site.
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
    const accepted = await send('pixel.png', 'image/png', pixel);
    expect(accepted.status()).toBe(200);
    const { url } = await accepted.json();
    expect(url).toMatch(/^\/fichiers\/public\/projets\/.+\.webp$/);
    const served = await page.request.get(url);
    expect(served.status()).toBe(200);
    expect(served.headers()['content-type']).toBe('image/webp');
  });

  test('le message du formulaire de contact arrive dans la boîte de réception', async ({ page }) => {
    const visitor = `Visiteur ${Date.now()}`;

    // Un visiteur écrit depuis le site public...
    await page.goto('/contact');
    await page.getByLabel('Nom', { exact: true }).fill(visitor);
    await page.getByLabel('E-mail', { exact: true }).fill('visiteur@exemple.ci');
    await page
      .getByLabel('Message', { exact: true })
      .fill('Bonjour, voici un message de test pour la boîte de réception.');
    await page.getByRole('button', { name: 'Envoyer le message' }).click();
    await expect(page.getByText('Message envoyé', { exact: true })).toBeVisible();

    // ... et l'administrateur le retrouve, non lu, puis l'ouvre.
    await page.goto('/admin/login');
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Mot de passe').fill(password);
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Tableau de bord' })).toBeVisible();

    await page.goto('/admin/messages');
    await page.getByRole('link', { name: new RegExp(visitor) }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Opportunité de doctorat' })).toBeVisible();
    await expect(page.getByText('Bonjour, voici un message de test pour la boîte de réception.').last()).toBeVisible();
  });
});

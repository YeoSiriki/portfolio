import { expect, test } from '@playwright/test';

const pages = [
  { path: '/', heading: /Siriki/i },
  { path: '/recherche', heading: 'Recherche & publications' },
  { path: '/recherche/scat', heading: /protocole de suivi de cible mobile/i },
  { path: '/projets', heading: "Ce que j'ai réalisé" },
  { path: '/parcours', heading: 'Expériences & formation' },
  { path: '/enseignement', heading: 'Transmettre' },
  { path: '/blog', heading: 'Articles' },
  { path: '/contact', heading: /Travaillons ensemble/i },
  { path: '/cv', heading: 'Curriculum vitae' },
  { path: '/confidentialite', heading: 'Politique de confidentialité' },
  { path: '/conditions-utilisation', heading: "Conditions générales d'utilisation" },
];

test.describe('site public', () => {
  for (const { path, heading } of pages) {
    test(`la page ${path} s'affiche sans erreur ni défilement horizontal`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });

      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, 'la page ne doit pas dépasser la largeur de l’écran').toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }

  test('une adresse inconnue renvoie la page 404', async ({ page }) => {
    const response = await page.goto('/cette-page-n-existe-pas');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1, name: 'Page introuvable' })).toBeVisible();
  });

  test('la page SCAT est à un clic de l’accueil', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: "Lire l'étude complète" }).click();
    await expect(page).toHaveURL(/\/recherche\/scat$/);
  });

  test('les projets se filtrent par catégorie et par recherche', async ({ page }) => {
    await page.goto('/projets');
    const cards = page.locator('article');
    const total = await cards.count();
    expect(total).toBeGreaterThan(1);

    await page.getByRole('button', { name: 'Réseaux', exact: true }).click();
    await expect(page.getByRole('link', { name: 'Raccordement fibre FTTH' })).toBeVisible();
    await expect(cards).toHaveCount(1);

    await page.getByRole('button', { name: /^Tous/ }).click();
    await page.getByRole('searchbox', { name: 'Rechercher un projet' }).fill('louvain');
    await expect(cards).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Détection de communautés' })).toBeVisible();
  });

  test('le numéro de téléphone n’apparaît nulle part sur le site', async ({ page }) => {
    for (const path of ['/', '/parcours', '/contact', '/cv']) {
      await page.goto(path);
      const text = await page.locator('body').innerText();
      // Tout numéro ivoirien (indicatif +225, ou 10 chiffres commençant par 01, 05, 07, 21, 25 ou 27) :
      // le test protège le numéro du CV sans l'écrire dans le code publié.
      expect(text).not.toMatch(/\+225|\b(?:01|05|07|21|25|27)(?:[ .]?\d{2}){4}\b/);
    }
  });

  test('le formulaire de contact signale les erreurs puis confirme l’envoi', async ({ page }) => {
    await page.goto('/contact');
    await page.getByRole('button', { name: 'Envoyer le message' }).click();
    await expect(page.getByText('Indiquez votre nom.')).toBeVisible();
    await expect(page.getByText('Adresse e-mail invalide.')).toBeVisible();

    await page.getByLabel('Nom', { exact: true }).fill('Test Automatique');
    await page.getByLabel('E-mail', { exact: true }).fill('test@exemple.ci');
    await page.getByLabel('Message', { exact: true }).fill('Message envoyé par les tests de bout en bout.');
    await page.getByRole('button', { name: 'Envoyer le message' }).click();
    await expect(page.getByText('Message envoyé', { exact: true })).toBeVisible();
  });

  test('la navigation au clavier atteint le contenu avec un focus visible', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Aller au contenu' });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();
    await page.keyboard.press('Tab');
    const outline = await page.evaluate(() => getComputedStyle(document.activeElement as Element).outlineStyle);
    expect(outline).not.toBe('none');
  });
});

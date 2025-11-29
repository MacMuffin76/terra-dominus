import { test, expect } from '@playwright/test';

test.describe('Parcours public', () => {
  test('affiche la page d’accueil et les CTA principaux', async ({ page }) => {
    await page.goto('/');

    // title remains the single stable identifier for the app regardless of localized H1 text
    await expect(page).toHaveTitle(/Terra Dominus/i);
    await expect(page.getByRole('link', { name: /Commencer gratuitement/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Se connecter/i })).toBeVisible();
  });

  test('navigue vers la page de connexion depuis l’accueil', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Se connecter/i }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: /Login/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Login/i })).toBeVisible();
  });
});
import { test, expect } from '@playwright/test';

test.describe('Parcours public', () => {
  test('affiche la page d’accueil et les CTA principaux', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: /Terra Dominus/i })).toBeVisible();
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
import { expect, test } from '@playwright/test';

import { login, TEST_USER } from './support';

test.describe('Authentication', () => {
  test('sends a signed-out visitor to the login page', async ({ page }) => {
    await page.goto('/drones');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  test('shows an error for a wrong password and stays on the login page', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#userName').fill(TEST_USER.userName);
    await page.locator('#password').fill('not-the-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('asks for both fields before submitting', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Enter your username.')).toBeVisible();
    await expect(page.getByText('Enter your password.')).toBeVisible();
  });

  test('signs in with the seeded account and signs out again', async ({ page }) => {
    await login(page);
    await expect(page.getByRole('heading', { name: 'Drones', level: 1 })).toBeVisible();

    await page.getByRole('button', { name: 'Sign out' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await page.goto('/drones');
    await expect(page).toHaveURL(/\/login$/);
  });
});

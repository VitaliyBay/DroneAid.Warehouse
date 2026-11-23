import { expect, test } from '@playwright/test';

import { createDroneViaApi, hasHorizontalScroll, signInQuietly } from './support';

const VIEWPORTS = [
  { name: 'phone', width: 375, height: 812, narrow: true },
  { name: 'tablet', width: 768, height: 1024, narrow: false },
  { name: 'laptop', width: 1366, height: 768, narrow: false },
  { name: 'desktop', width: 1920, height: 1080, narrow: false }
];

test.describe('Responsive layout', () => {
  for (const viewport of VIEWPORTS) {
    test(`list and detail pages fit a ${viewport.name} (${viewport.width}px)`, async ({ page, request }) => {
      await signInQuietly(page);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const drone = await createDroneViaApi(request, 'Digital');

      await page.goto('/drones');
      await expect(page.locator('.drone').first()).toBeVisible();
      expect(await hasHorizontalScroll(page)).toBe(false);

      await page.goto(`/drones/${drone.id}`);
      await expect(page.locator('app-drone-diagram svg')).toBeVisible();
      expect(await hasHorizontalScroll(page)).toBe(false);

      // Phones get compact numbered markers; wider screens get labelled callouts.
      const markers = page.locator('app-drone-diagram svg .marker');
      const labels = page.locator('app-drone-diagram svg .label');
      if (viewport.narrow) {
        await expect(markers.first()).toBeVisible();
        await expect(labels).toHaveCount(0);
      } else {
        await expect(labels.first()).toBeVisible();
        await expect(markers).toHaveCount(0);
      }
    });
  }

  test('the add-drone form fits a phone', async ({ page }) => {
    await signInQuietly(page);
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto('/drones/new');
    await page.getByRole('button', { name: /^Digital/ }).click();

    await expect(page.locator('app-components-editor')).toBeVisible();
    expect(await hasHorizontalScroll(page)).toBe(false);
  });
});

test.describe('Language', () => {
  test('switches the whole screen to Spanish, including the diagram', async ({ page, request }) => {
    await signInQuietly(page);
    const drone = await createDroneViaApi(request, 'Analog');
    await page.goto(`/drones/${drone.id}`);
    await expect(page.getByRole('heading', { name: 'Drone diagram' })).toBeVisible();

    await page.locator('#language').selectOption('es');

    await expect(page.getByRole('heading', { name: 'Esquema del dron' })).toBeVisible();
    await expect(page.locator('app-drone-diagram svg').getByText('Cámara', { exact: true })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  });

  test('remembers the chosen language after a reload', async ({ page }) => {
    await signInQuietly(page);
    await page.goto('/drones');

    await page.locator('#language').selectOption('uk');
    await page.reload();

    await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
    await expect(page.locator('#language')).toHaveValue('uk');
  });
});

import { expect, test } from '@playwright/test';

import { createDroneViaApi, signInQuietly } from './support';

test.beforeEach(async ({ page }) => {
  await signInQuietly(page);
});

test.describe('Drone diagram', () => {
  test('draws the Digital video chain and not the Analog parts', async ({ page, request }) => {
    const drone = await createDroneViaApi(request, 'Digital');
    await page.goto(`/drones/${drone.id}`);

    const diagram = page.locator('app-drone-diagram svg');
    await expect(diagram).toBeVisible();
    await expect(diagram.getByText('Digital video unit')).toBeVisible();
    await expect(diagram.getByText('Antennas ×2')).toBeVisible();
    await expect(diagram.getByText('Video transmitter')).toHaveCount(0);
    await expect(page.locator('app-drone-diagram .part.is-missing')).toHaveCount(0);
  });

  test('draws the Analog parts including the adapter and pigtail cables', async ({ page, request }) => {
    const drone = await createDroneViaApi(request, 'Analog');
    await page.goto(`/drones/${drone.id}`);

    const diagram = page.locator('app-drone-diagram svg');
    for (const label of ['Camera', 'Video transmitter', 'Adapter cable', 'VTX pigtail', 'Receiver']) {
      await expect(diagram.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(diagram.getByText('Digital video unit')).toHaveCount(0);
  });

  test('highlights a part and shows its model when a list row is selected', async ({ page, request }) => {
    const drone = await createDroneViaApi(request, 'Analog');
    await page.goto(`/drones/${drone.id}`);

    await page.locator('ol.parts button', { hasText: 'Video transmitter' }).click();

    await expect(page.locator('app-drone-diagram .part.is-on')).toHaveCount(1);
    await expect(page.locator('figcaption')).toContainText('Pilotix VTX 4.9-6.2G 3.0W');
  });

  test('can be operated from the keyboard', async ({ page, request }) => {
    const drone = await createDroneViaApi(request, 'Digital');
    await page.goto(`/drones/${drone.id}`);

    const receiver = page.locator('app-drone-diagram .part[role="button"]', { hasText: 'Receiver' });
    await receiver.focus();
    await page.keyboard.press('Enter');

    await expect(receiver).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('figcaption')).toContainText('Radiomaster BR4');
  });

  test('marks expected parts that were removed from the component list', async ({ page, request }) => {
    const drone = await createDroneViaApi(request, 'Digital');
    await page.goto(`/drones/${drone.id}`);

    await page.locator('section[aria-labelledby="components-title"]').getByRole('button', { name: /Edit/ }).click();
    const rows = page.locator('.editor-row');
    const names = await page.locator('input[id^="cn-"]').evaluateAll((inputs) =>
      inputs.map((input) => (input as HTMLInputElement).value)
    );
    const index = names.indexOf('Antenna');
    expect(index).toBeGreaterThanOrEqual(0);
    await rows.nth(index).getByRole('button', { name: /Remove/ }).click();
    await page.getByRole('button', { name: 'Save components' }).click();

    await expect(page.locator('app-drone-diagram .part.is-missing')).toHaveCount(1);
    await expect(page.locator('ol.parts li', { hasText: 'Antennas' })).toContainText('Not in list');
  });

  test('lists components that match no part below the diagram', async ({ page, request }) => {
    const drone = await createDroneViaApi(request, 'Analog');
    await page.goto(`/drones/${drone.id}`);

    await page.locator('section[aria-labelledby="components-title"]').getByRole('button', { name: /Edit/ }).click();
    await page.getByRole('button', { name: /Add component/ }).click();
    await page.locator('input[id^="cn-"]').last().fill('Landing gear');
    await page.getByRole('button', { name: 'Save components' }).click();

    await expect(page.locator('ul.undrawn')).toContainText('Landing gear');
  });
});

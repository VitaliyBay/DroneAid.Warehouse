import { expect, Page, test } from '@playwright/test';
import QRCode from 'qrcode';

import { createDroneViaApi, signInQuietly, uniqueCode } from './support';

/** A QR code image for the given text, as the printed drone labels would have. */
async function qrImage(text: string): Promise<{ name: string; mimeType: string; buffer: Buffer }> {
  const buffer = await QRCode.toBuffer(text, { type: 'png', width: 420, margin: 4 });
  return { name: 'label.png', mimeType: 'image/png', buffer };
}

async function openScanner(page: Page) {
  await page.goto('/drones');
  await page.getByRole('button', { name: 'Scan code' }).click();
  const dialog = page.getByRole('dialog', { name: 'Scan drone code' });
  await expect(dialog).toBeVisible();
  return dialog;
}

test.beforeEach(async ({ page }) => {
  await signInQuietly(page);
});

test.describe('Drone code scanning', () => {
  test('opens the drone when its QR code is read from a photo', async ({ page, request }) => {
    const drone = await createDroneViaApi(request, 'Digital', 'Scanned drone');
    const dialog = await openScanner(page);

    await dialog.locator('input[type="file"]').setInputFiles(await qrImage(drone.code));

    await expect(page).toHaveURL(new RegExp(`/drones/${drone.id}$`));
    await expect(page.getByRole('heading', { name: 'Scanned drone', level: 1 })).toBeVisible();
  });

  test('accepts a QR code that holds a link to the drone', async ({ page, request }) => {
    const drone = await createDroneViaApi(request, 'Analog', 'Linked drone');
    const dialog = await openScanner(page);

    await dialog.locator('input[type="file"]').setInputFiles(await qrImage(`https://example.org/drones/${drone.code}`));

    await expect(page).toHaveURL(new RegExp(`/drones/${drone.id}$`));
  });

  test('offers to add a drone when the scanned code is unknown', async ({ page }) => {
    const code = uniqueCode('NEW');
    const dialog = await openScanner(page);

    await dialog.locator('input[type="file"]').setInputFiles(await qrImage(code));

    await expect(page.getByRole('status')).toContainText(`No drone has the code ${code}`);
    await page.getByRole('link', { name: /Add a drone with this code/ }).click();
    await expect(page).toHaveURL(/\/drones\/new\?code=/);
    await expect(page.locator('#code')).toHaveValue(code);
  });

  test('tells the user when a photo has no code in it', async ({ page }) => {
    const dialog = await openScanner(page);

    await dialog.locator('input[type="file"]').setInputFiles({
      name: 'blank.png',
      mimeType: 'image/png',
      // A 1x1 pixel image: a valid photo that contains no code.
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64'
      )
    });

    await expect(dialog.getByRole('alert')).toContainText('No code found');
    await expect(dialog).toBeVisible();
  });

  test('starts the camera and shows the viewfinder, and closes with Escape', async ({ page }) => {
    const dialog = await openScanner(page);

    await expect(dialog.locator('.frame')).toBeVisible({ timeout: 15_000 });
    await expect(dialog.locator('video')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });

  test('fits a phone screen', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const dialog = await openScanner(page);

    const box = await dialog.locator('.panel').boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(375);
    await expect(dialog.getByRole('button', { name: 'Close' })).toBeVisible();
  });
});

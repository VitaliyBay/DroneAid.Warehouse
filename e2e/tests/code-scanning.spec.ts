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
    await dialog.getByRole('button', { name: 'Use this code' }).click();

    await expect(page).toHaveURL(new RegExp(`/drones/${drone.id}$`));
    await expect(page.getByRole('heading', { name: 'Scanned drone', level: 1 })).toBeVisible();
  });

  test('accepts a QR code that holds a link to the drone', async ({ page, request }) => {
    const drone = await createDroneViaApi(request, 'Analog', 'Linked drone');
    const dialog = await openScanner(page);

    await dialog.locator('input[type="file"]').setInputFiles(await qrImage(`https://example.org/drones/${drone.code}`));
    await dialog.getByRole('button', { name: 'Use this code' }).click();

    await expect(page).toHaveURL(new RegExp(`/drones/${drone.id}$`));
  });

  test('offers to add a drone when the scanned code is unknown', async ({ page }) => {
    const code = uniqueCode('NEW');
    const dialog = await openScanner(page);

    await dialog.locator('input[type="file"]').setInputFiles(await qrImage(code));
    await dialog.getByRole('button', { name: 'Use this code' }).click();

    await expect(page.getByRole('status')).toContainText(`No drone has the code ${code}`);
    await page.getByRole('link', { name: /Add a drone with this code/ }).click();
    await expect(page).toHaveURL(/\/drones\/new\?code=/);
    await expect(page.locator('#code')).toHaveValue(code);
  });

  test('lets the user correct a wrongly read code before it is used', async ({ page, request }) => {
    const drone = await createDroneViaApi(request, 'Digital', 'Corrected drone');
    const dialog = await openScanner(page);

    await dialog.locator('input[type="file"]').setInputFiles(await qrImage(uniqueCode('BAD')));
    const input = dialog.getByLabel(/Check the code/);
    await expect(input).toBeVisible();
    await input.fill(drone.code);
    await dialog.getByRole('button', { name: 'Use this code' }).click();

    await expect(page).toHaveURL(new RegExp(`/drones/${drone.id}$`));
  });

  test('scans again when the read code is rejected', async ({ page }) => {
    const dialog = await openScanner(page);

    await dialog.locator('input[type="file"]').setInputFiles(await qrImage(uniqueCode('BAD')));
    await dialog.getByRole('button', { name: 'Scan again' }).click();

    await expect(dialog.getByLabel(/Check the code/)).toHaveCount(0);
    await expect(dialog).toBeVisible();
  });

  test('reads a printed text code (not a QR code) from a photo and opens the drone', async ({ page, request, browser }) => {
    test.setTimeout(90_000);
    const code = `DRN${Math.floor(1000 + Math.random() * 8999)}`;
    const created = await request.post('/api/drones', { data: { code, nickname: 'Printed code drone', type: 'Digital' } });
    test.skip(created.status() === 409, 'random printed code collided with an existing drone');
    expect(created.status()).toBe(201);
    const drone = (await created.json()) as { id: string };

    // A label with the code written as plain text, as on the real drones.
    const label = await browser.newPage({ viewport: { width: 700, height: 300 } });
    await label.setContent(
      `<body style="margin:0;background:#fff;display:grid;place-items:center;height:300px"><div style="font:bold 90px Arial;color:#000">${code}</div></body>`
    );
    const buffer = await label.screenshot();
    await label.close();

    const dialog = await openScanner(page);
    await dialog.locator('input[type="file"]').setInputFiles({ name: 'label.png', mimeType: 'image/png', buffer });

    // The reading is shown for confirmation; the registry match fixes a misread character.
    await expect(dialog.getByLabel(/Check the code/)).toHaveValue(code, { timeout: 60_000 });
    await dialog.getByRole('button', { name: 'Use this code' }).click();
    await expect(page).toHaveURL(new RegExp(`/drones/${drone.id}$`));
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

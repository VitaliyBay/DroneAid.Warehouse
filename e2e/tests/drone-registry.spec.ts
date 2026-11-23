import { expect, Page, test } from '@playwright/test';

import { createDroneViaApi, signInQuietly, uniqueCode } from './support';

test.beforeEach(async ({ page }) => {
  await signInQuietly(page);
});

async function addDroneThroughForm(page: Page, code: string, nickname: string, type: 'Analog' | 'Digital') {
  await page.goto('/drones/new');
  await page.locator('#code').fill(code);
  await page.locator('#nickname').fill(nickname);
  await page.getByRole('button', { name: new RegExp(`^${type}`) }).click();
}

test.describe('Drone registry', () => {
  test('creates a Digital drone with the default components and opens its detail page', async ({ page }) => {
    const code = uniqueCode();
    await addDroneThroughForm(page, code, 'Falcon', 'Digital');

    const names = await page.locator('input[id^="cn-"]').evaluateAll((inputs) =>
      inputs.map((input) => (input as HTMLInputElement).value)
    );
    expect(names).toEqual(expect.arrayContaining(['Frame', 'Digital video unit', 'Receiver', 'Antenna']));
    expect(names).not.toContain('Analog camera');

    await page.getByRole('button', { name: 'Save drone' }).click();

    await expect(page).toHaveURL(/\/drones\/[0-9a-f-]{36}$/);
    await expect(page.getByRole('heading', { name: 'Falcon', level: 1 })).toBeVisible();
    await expect(page.getByText(code, { exact: true }).first()).toBeVisible();
  });

  test('shows the invoice models on the detail page', async ({ page, request }) => {
    const drone = await createDroneViaApi(request, 'Digital');

    await page.goto(`/drones/${drone.id}`);

    await expect(page.getByText('Walksnail Avatar GT Kit').first()).toBeVisible();
    await expect(page.getByText(/Radiomaster BR4/).first()).toBeVisible();
    await expect(page.getByText(/Maple Wireless/).first()).toBeVisible();
  });

  test('rejects a duplicate drone code with a clear message', async ({ page, request }) => {
    const existing = await createDroneViaApi(request, 'Analog');

    await addDroneThroughForm(page, existing.code.toLowerCase(), 'Copy', 'Analog');
    await page.getByRole('button', { name: 'Save drone' }).click();

    await expect(page.getByRole('alert')).toContainText('already exists');
    await expect(page).toHaveURL(/\/drones\/new$/);
  });

  test('requires a code, a nickname and a type', async ({ page }) => {
    await page.goto('/drones/new');
    await page.getByRole('button', { name: 'Save drone' }).click();

    await expect(page.locator('form .da-error').first()).toBeVisible();
    await expect(page).toHaveURL(/\/drones\/new$/);
  });

  test('finds a drone by nickname and narrows the list with filters', async ({ page, request }) => {
    const nickname = `Searchable${Date.now().toString(36)}`;
    await createDroneViaApi(request, 'Analog', nickname);
    await page.goto('/drones');

    await page.locator('#search').fill(nickname.toLowerCase());
    await expect(page.locator('.drone')).toHaveCount(1);
    await expect(page.locator('.drone').first()).toContainText(nickname);

    await page.getByRole('group', { name: 'Type' }).getByRole('button', { name: 'Digital' }).click();
    await expect(page.getByText('No drones match')).toBeVisible();

    await page.getByRole('button', { name: 'Clear filters' }).first().click();
    await expect(page.locator('#search')).toHaveValue('');
    await expect(page.locator('.drone').first()).toBeVisible();
    await expect(page.getByText('No drones match')).toHaveCount(0);
  });

  test('changes the status of a drone from the edit page', async ({ page, request }) => {
    const drone = await createDroneViaApi(request, 'Analog');

    await page.goto(`/drones/${drone.id}/edit`);
    await page.locator('#status').selectOption('NeedsRepair');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page).toHaveURL(new RegExp(`/drones/${drone.id}$`));
    await expect(page.locator('.head-row .da-status')).toContainText('Needs repair');
  });

  test('reports an issue, flags the part in the diagram and resolves it', async ({ page, request }) => {
    const drone = await createDroneViaApi(request, 'Analog');
    await page.goto(`/drones/${drone.id}`);

    await page.getByRole('button', { name: /Report issue/ }).click();
    await page.locator('#issue-title').fill('Motor makes noise');
    await page.locator('#issue-component').fill('Motor');
    await page.getByRole('button', { name: 'Save issue' }).click();

    await expect(page.getByText('Motor makes noise')).toBeVisible();
    await expect(page.locator('app-drone-diagram .part.has-issue')).toHaveCount(1);
    await expect(page.locator('app-drone-diagram').getByText('Open issue').first()).toBeVisible();

    await page.getByRole('button', { name: /Edit.*resolve|Edit/ }).last().click();
    await page.locator('#issue-status').selectOption('Resolved');
    await page.getByRole('button', { name: 'Save issue' }).click();

    await expect(page.locator('app-drone-diagram .part.has-issue')).toHaveCount(0);
  });

  test('adds a flight-test video link that opens in a new tab', async ({ page, request }) => {
    const drone = await createDroneViaApi(request, 'Digital');
    await page.goto(`/drones/${drone.id}`);

    await page.getByRole('button', { name: /Add link/ }).click();
    await page.locator('#video-url').fill('https://example.com/flight-1');
    await page.locator('#video-label').fill('First flight');
    await page.getByRole('button', { name: 'Save link' }).click();

    const link = page.getByRole('link', { name: /First flight/ });
    await expect(link).toHaveAttribute('href', 'https://example.com/flight-1');
    await expect(link).toHaveAttribute('target', '_blank');
  });

  test('refuses a video link that is not https', async ({ page, request }) => {
    const drone = await createDroneViaApi(request, 'Digital');
    await page.goto(`/drones/${drone.id}`);

    await page.getByRole('button', { name: /Add link/ }).click();
    await page.locator('#video-url').fill('http://example.com/insecure');
    await page.getByRole('button', { name: 'Save link' }).click();

    await expect(page.getByText('Enter a valid link that starts with https://.')).toBeVisible();
  });
});

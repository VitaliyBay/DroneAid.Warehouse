import { APIRequestContext, expect, Page } from '@playwright/test';

export const TEST_USER = { userName: 'DAB_Test', password: 'qwerty123' };

/** A short unique suffix so parallel and repeated runs never collide on drone codes. */
export function uniqueCode(prefix = 'E2E'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
}

/** Signs in through the real login form. */
export async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.locator('#userName').fill(TEST_USER.userName);
  await page.locator('#password').fill(TEST_USER.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/drones$/);
}

/** Starts a session without the form, for tests that are about something else than signing in. */
export async function signInQuietly(page: Page): Promise<void> {
  await page.addInitScript((user) => {
    sessionStorage.setItem('droneaid.user', JSON.stringify({ userName: user, role: 'Administrator' }));
  }, TEST_USER.userName);
}

export interface CreatedDrone {
  id: string;
  code: string;
  nickname: string;
}

/** Creates a drone straight through the API (fast set-up). */
export async function createDroneViaApi(
  request: APIRequestContext,
  type: 'Analog' | 'Digital',
  nickname = 'E2E drone'
): Promise<CreatedDrone> {
  const code = uniqueCode();
  const response = await request.post('/api/drones', { data: { code, nickname, type } });
  expect(response.status(), await response.text()).toBe(201);
  const body = (await response.json()) as { id: string };
  return { id: body.id, code, nickname };
}

/** True when the page scrolls sideways, which means the layout does not fit the viewport. */
export async function hasHorizontalScroll(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
}

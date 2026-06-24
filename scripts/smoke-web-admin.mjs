import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { once } from 'node:events';
import { resolve } from 'node:path';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright-core';

const rootDir = process.cwd();
const outputDir = resolve(rootDir, 'output', 'playwright');
const apiPort = Number(process.env.SMOKE_API_PORT || 3002);
const webPort = Number(process.env.SMOKE_WEB_PORT || 4173);
const apiBaseUrl = `http://127.0.0.1:${apiPort}/api`;
const webBaseUrl = `http://127.0.0.1:${webPort}`;
const chromiumPath =
  process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;
const smokeRunId = Date.now();
const smokeIngredientName = `Smoke Ingredient ${smokeRunId}`;
const smokeDishName = `Smoke Dish ${smokeRunId}`;
const smokeDishUpdatedName = `${smokeDishName} Updated`;

mkdirSync(outputDir, { recursive: true });

function logStep(message) {
  console.log(`[smoke] ${message}`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function startProcess(command, args, envOverrides = {}) {
  const spawnOpts = {
    cwd: rootDir,
    stdio: 'ignore',
    env: {
      ...process.env,
      ...envOverrides,
    },
    shell: process.platform === 'win32',
  };
  return spawn(command, args, spawnOpts);
}

async function stopProcess(child) {
  if (!child || child.killed) {
    return;
  }

  child.kill('SIGTERM');

  await Promise.race([
    once(child, 'exit').catch(() => undefined),
    delay(3000).then(() => {
      try {
        child.kill('SIGKILL');
      } catch {}
    }),
  ]);
}

async function waitFor(check, label, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const result = await check();
      if (result) {
        return;
      }
    } catch {}

    await delay(500);
  }

  throw new Error(`Timed out while waiting for ${label}`);
}

async function fetchStatus(url, init) {
  const response = await fetch(url, init);
  return response.status;
}

const api = startProcess('npm', ['run', 'dev', '--workspace=api'], {
  PORT: String(apiPort),
});

const web = startProcess('npm', ['run', 'dev', '--workspace=web-admin'], {
  VITE_API_BASE_URL: apiBaseUrl,
});

let browser;

try {
  logStep('Waiting for API server');
  await waitFor(
    async () => {
      const status = await fetchStatus(`${apiBaseUrl}/auth/me`, {
        headers: { Authorization: 'Bearer invalid' },
      });
      return status === 401;
    },
    'API server',
  );

  logStep('Waiting for web admin server');
  await waitFor(
    async () => {
      const status = await fetchStatus(webBaseUrl);
      return status === 200;
    },
    'web admin server',
  );

  logStep(`Launching Chromium${chromiumPath ? ` from ${chromiumPath}` : ''}`);
  const launchOpts = {
    headless: true,
    timeout: 15000,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  };
  if (chromiumPath) launchOpts.executablePath = chromiumPath;
  browser = await chromium.launch(launchOpts);

  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  logStep('Opening login page');
  await page.goto(webBaseUrl, { waitUntil: 'domcontentloaded' });

  logStep('Signing in');
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('admin1234');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/ingredients');
  await page.getByRole('heading', { name: 'Inventory Operations', level: 2 }).waitFor();

  logStep('Creating a smoke-test ingredient');
  await page.getByTestId('ingredient-new').click();
  await page.getByLabel('Name').fill(smokeIngredientName);
  await page.getByLabel('Unit').first().fill('kg');
  await page.getByLabel('Stock').first().fill('12');
  await page.getByLabel('Min stock').first().fill('4');
  await page.getByLabel('Cost').first().fill('18');
  await page.getByLabel('Note').fill('Created by the automated smoke flow.');
  await page.getByTestId('ingredient-save').click();
  await page
    .getByRole('cell', { name: new RegExp(`^${escapeRegExp(smokeIngredientName)}$`) })
    .waitFor();

  logStep('Visiting users page');
  await page.getByRole('button', { name: 'Users' }).click();
  await page.getByRole('heading', { name: 'People Operations', level: 2 }).waitFor();

  logStep('Visiting stores page');
  await page.getByRole('button', { name: 'Stores' }).click();
  await page.getByRole('heading', { name: 'Store Operations', level: 2 }).waitFor();

  logStep('Visiting dishes page');
  await page.getByRole('button', { name: 'Dishes' }).click();
  await page.getByRole('heading', { name: 'Menu Operations', level: 2 }).waitFor();

  logStep('Creating a smoke-test dish through the editor');
  await page.getByTestId('dish-new').click();
  await page.getByLabel('Name').fill(smokeDishName);
  await page.getByLabel('Category').selectOption('rice');
  await page.getByLabel('Station').first().selectOption('wok');
  await page.getByLabel('Suggested price').fill('32');
  await page.getByLabel('Standard cost').fill('12');
  await page
    .getByLabel('Description')
    .first()
    .fill('Smoke test dish created from automated browser flow.');
  await page.getByLabel('Cover image URL').fill('https://example.com/smoke-dish.png');

  const ingredientSelect = page.getByLabel('Ingredient').first();
  await ingredientSelect.selectOption({ label: smokeIngredientName });
  await page.getByLabel('Quantity').first().fill('0.25');
  await page.getByLabel('Waste rate').first().fill('0.08');

  await page.getByLabel('Title').first().fill('Smoke prep');
  await page
    .getByLabel('Description')
    .nth(1)
    .fill('Prepare ingredients and verify editor save pipeline.');
  await page.getByLabel('Duration (min)').first().fill('6');

  await page.getByTestId('dish-save').click();
  await page.getByRole('cell', { name: new RegExp(`^${escapeRegExp(smokeDishName)}$`) }).waitFor();

  logStep('Editing the smoke-test dish');
  await page.getByLabel('Name').fill(smokeDishUpdatedName);
  await page.getByLabel('Suggested price').fill('36');
  await page.getByLabel('Standard cost').fill('14');
  await page.getByLabel('Quantity').first().fill('0.3');
  await page.getByLabel('Waste rate').first().fill('0.05');
  await page.getByLabel('Title').first().fill('Smoke prep updated');
  await page.getByLabel('Duration (min)').first().fill('8');
  await page.getByTestId('dish-save').click();
  await page
    .getByRole('cell', { name: new RegExp(`^${escapeRegExp(smokeDishUpdatedName)}$`) })
    .waitFor();
  await page
    .getByRole('cell', { name: new RegExp(`^${escapeRegExp(smokeDishName)}$`) })
    .waitFor({ state: 'detached' });

  logStep('Removing the smoke-test dish');
  await page.getByTestId('dish-delete').click();
  await page
    .getByRole('cell', { name: new RegExp(`^${escapeRegExp(smokeDishUpdatedName)}$`) })
    .waitFor({ state: 'detached' });

  logStep('Removing the smoke-test ingredient');
  await page.getByRole('button', { name: 'Ingredients' }).click();
  await page.getByRole('heading', { name: 'Inventory Operations', level: 2 }).waitFor();
  const ingredientRow = page.getByRole('row', { name: new RegExp(smokeIngredientName) });
  await ingredientRow.getByRole('button', { name: 'Delete' }).click();
  await page
    .getByRole('cell', { name: new RegExp(`^${escapeRegExp(smokeIngredientName)}$`) })
    .waitFor({ state: 'detached' });

  const screenshotPath = resolve(outputDir, 'web-admin-smoke.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await writeFile(
    resolve(outputDir, 'web-admin-smoke.json'),
    JSON.stringify(
      {
        apiBaseUrl,
        webBaseUrl,
        screenshotPath,
        chromiumPath,
        smokeIngredientName,
        smokeDishName,
        smokeDishUpdatedName,
        verifiedRoutes: ['ingredients', 'users', 'stores', 'dishes'],
        verifiedActions: [
          'login',
          'ingredient-create',
          'dish-create',
          'dish-edit',
          'dish-delete',
          'ingredient-delete',
        ],
      },
      null,
      2,
    ),
    'utf8',
  );

  logStep(`Smoke test passed. Screenshot: ${screenshotPath}`);
} catch (error) {
  console.error('[smoke] Web admin smoke test failed.');
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
} finally {
  if (browser) {
    await browser.close().catch(() => undefined);
  }

  await stopProcess(api);
  await stopProcess(web);
}
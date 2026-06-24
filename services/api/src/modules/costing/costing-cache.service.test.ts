import { test } from 'node:test';
import assert = require('node:assert/strict');
import { CostingCacheService } from './costing-cache.service';
import { ResolvedConfig } from './costing.service';

const mockConfig: ResolvedConfig = {
  ticketPriceBonusWeight: 1,
  pairingBonusWeight: 1,
  feedbackBonusWeight: 1,
  diversityBonusWeight: 1,
  categoryBonusWeight: 1,
  menuCompletenessWeight: 1,
  menuFreshnessWeight: 1,
  menuGrossMarginWeight: 1,
  defaultDishPenalty: 1,
  ticketPriceThreshold: 0.1,
  ticketPriceCapMultiplier: 3,
  recentDaysWindow: 7,
  recommendLimit: 20,
};

test('result cache stores and retrieves results', () => {
  const cache = new CostingCacheService();
  const data = [{ dishId: '1', score: 100 }];
  cache.setResult('store-1', '2026-05-12', 'lunch', data);
  assert.deepEqual(cache.getResult('store-1', '2026-05-12', 'lunch'), data);
});

test('result cache returns null for unknown key', () => {
  const cache = new CostingCacheService();
  assert.equal(cache.getResult('store-x', '2026-05-12', 'lunch'), null);
});

test('result cache distinguishes stores', () => {
  const cache = new CostingCacheService();
  cache.setResult('store-1', '2026-05-12', 'lunch', [{ dishId: '1' }]);
  assert.equal(cache.getResult('store-2', '2026-05-12', 'lunch'), null);
});

test('result cache distinguishes meal types', () => {
  const cache = new CostingCacheService();
  cache.setResult('store-1', '2026-05-12', 'breakfast', [{ dishId: '1' }]);
  assert.equal(cache.getResult('store-1', '2026-05-12', 'lunch'), null);
});

test('config cache stores and retrieves config', () => {
  const cache = new CostingCacheService();
  cache.setConfig('store-1', mockConfig);
  assert.deepEqual(cache.getConfig('store-1'), mockConfig);
});

test('config cache returns null for unknown store', () => {
  const cache = new CostingCacheService();
  assert.equal(cache.getConfig('store-x'), null);
});

test('invalidateStore removes only the targeted store data', () => {
  const cache = new CostingCacheService();
  cache.setResult('store-1', '2026-05-12', 'lunch', [{ dishId: '1' }]);
  cache.setResult('store-1', '2026-05-13', 'breakfast', [{ dishId: '2' }]);
  cache.setResult('store-2', '2026-05-12', 'lunch', [{ dishId: '3' }]);
  cache.setConfig('store-1', mockConfig);
  cache.setConfig('store-2', mockConfig);

  cache.invalidateStore('store-1');

  assert.equal(cache.getResult('store-1', '2026-05-12', 'lunch'), null);
  assert.equal(cache.getResult('store-1', '2026-05-13', 'breakfast'), null);
  assert.deepEqual(cache.getResult('store-2', '2026-05-12', 'lunch'), [{ dishId: '3' }]);
  assert.equal(cache.getConfig('store-1'), null);
  assert.deepEqual(cache.getConfig('store-2'), mockConfig);
});

test('invalidateAll clears both caches', () => {
  const cache = new CostingCacheService();
  cache.setResult('store-1', '2026-05-12', 'lunch', [{ dishId: '1' }]);
  cache.setConfig('store-1', mockConfig);

  cache.invalidateAll();

  assert.equal(cache.getResult('store-1', '2026-05-12', 'lunch'), null);
  assert.equal(cache.getConfig('store-1'), null);
});

test('cache stats track hit rate correctly', () => {
  const cache = new CostingCacheService();

  cache.getResult('store-1', '2026-05-12', 'lunch'); // miss
  cache.getConfig('store-1'); // miss

  cache.setResult('store-1', '2026-05-12', 'lunch', [{ dishId: '1' }]);
  cache.setConfig('store-1', mockConfig);

  cache.getResult('store-1', '2026-05-12', 'lunch'); // hit
  cache.getConfig('store-1'); // hit

  const stats = cache.getStats();
  assert.equal(stats.resultHits, 1);
  assert.equal(stats.resultMisses, 1);
  assert.equal(stats.configHits, 1);
  assert.equal(stats.configMisses, 1);
  assert.equal(stats.hitRate, 50);
});

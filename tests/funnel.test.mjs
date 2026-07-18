import assert from 'node:assert/strict';
import test from 'node:test';
import { buildFunnelStages } from '../src/components/analytics/funnel.ts';

test('organiza as cinco etapas com taxas e elegibilidade corretas', () => {
  const stages = buildFunnelStages({
    portalVisitors: 100,
    storeClicks: 40,
    attributedInstalls: 20,
    activatedUsers: 10,
    eligibleForRetentionDay7: 8,
    retainedDay7: 3,
    portalToStoreRate: 40,
    storeToInstallRate: 50,
    installToActivationRate: 50,
    retentionDay7Rate: 37.5,
  });

  assert.deepEqual(stages.map((stage) => stage.value), [100, 40, 20, 10, 3]);
  assert.equal(stages[4].conversionLabel, 'D+7 entre 8 elegíveis');
  assert.equal(stages[4].conversionRate, 37.5);
  assert.equal(stages[2].widthPercent, 20);
});

test('mantém etapas vazias visíveis sem produzir largura inválida', () => {
  const stages = buildFunnelStages({
    portalVisitors: 0,
    storeClicks: 0,
    attributedInstalls: 0,
    activatedUsers: 0,
    eligibleForRetentionDay7: 0,
    retainedDay7: 0,
    portalToStoreRate: 0,
    storeToInstallRate: 0,
    installToActivationRate: 0,
    retentionDay7Rate: 0,
  });

  assert.ok(stages.every((stage) => stage.widthPercent === 8));
});

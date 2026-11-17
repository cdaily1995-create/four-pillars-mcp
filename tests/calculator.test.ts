import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateFourPillars } from '../src/calculator.js';

test('returns four pillars without requiring a city or gender', () => {
  const result = calculateFourPillars({
    date: '1990-05-20',
    time: '14:30',
    timezone: 'Asia/Shanghai',
    longitude: 104.0668,
    latitude: 30.5728,
  });

  assert.equal(result.pillars.length, 4);
  assert.deepEqual(
    result.pillars.map((pillar) => pillar.key),
    ['year', 'month', 'day', 'hour']
  );
  assert.ok(result.pillars.every((pillar) => pillar.name.length > 0));
  assert.ok(result.dayMaster.name.length > 0);
  assert.equal(result.method.dayHour, 'local_apparent_solar');
});

test('rejects invalid coordinates', () => {
  assert.throws(
    () =>
      calculateFourPillars({
        date: '1990-05-20',
        time: '14:30',
        timezone: 'UTC',
        longitude: 181,
      }),
    /longitude/
  );
});

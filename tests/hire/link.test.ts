import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FRAUD_CASE } from '../../src/lib/hire/example.ts';
import { decodeAnswers, encodeAnswers, LONG_LINK, REPORT_BASE, reportUrl } from '../../src/lib/hire/link.ts';

test('round trip and length', async () => {
  const s = await encodeAnswers(FRAUD_CASE);
  assert.match(s, /^[A-Za-z0-9_-]+$/);
  assert.deepEqual(((await decodeAnswers(s)) as any).answers, FRAUD_CASE);
  const url = await reportUrl(FRAUD_CASE);
  assert.ok(url.startsWith(`${REPORT_BASE}#a=`));
  assert.ok(url.length < LONG_LINK, `length ${url.length}`);
});

test('garbage links never throw', async () => {
  const over = await encodeAnswers({ ...FRAUD_CASE, name: 'x'.repeat(81) });
  const bomb = await encodeAnswers({ pad: 'a'.repeat(200_000) } as any);
  for (const s of ['', '!!!', 'AAAA', 'a', '====', 'é', await encodeAnswers({ ...FRAUD_CASE, v: 2 } as any), over, bomb]) {
    assert.equal((await decodeAnswers(s)).ok, false, s.slice(0, 20));
  }
});

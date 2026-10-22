import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareVersions, stampOf } from '../src/lib/versions.js';

test('versions compare numerically, with or without a leading v', () => {
  assert.equal(compareVersions('0.7.1', '0.7.0'), 1);
  assert.equal(compareVersions('v0.7.0', '0.7.0'), 0);
  assert.equal(compareVersions('0.10.0', '0.9.9'), 1);
  assert.equal(compareVersions('0.7.0', '0.7.0.1'), -1);
  assert.equal(compareVersions('1.0', '0.99.99'), 1);
});

test('the disk stamp prefers build.json commits over the version', () => {
  assert.equal(stampOf({ commit: 'abc', version: '0.7.0.1' }, { version: '0.7.0.1' }), '0.7.0.1@abc');
  assert.equal(stampOf(null, { version: '0.7.1' }), '0.7.1');
});

test('a saved update notice is dropped once that version is installed', async () => {
  const { pendingUpdate } = await import('../src/lib/versions.js');
  const info = { version: '0.12.0', url: 'https://github.com/x/releases/tag/v0.12.0' };
  assert.equal(pendingUpdate(info, '0.11.3'), info);
  assert.equal(pendingUpdate(info, '0.12.0'), null);
  assert.equal(pendingUpdate(info, '0.12.0.1'), null); // a personal build of it
  assert.equal(pendingUpdate(null, '0.11.3'), null);
});

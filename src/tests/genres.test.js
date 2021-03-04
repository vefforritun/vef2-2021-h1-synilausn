/* eslint-disable no-underscore-dangle */
import { test, describe, expect } from '@jest/globals';

import { fetchAndParse } from './utils.js';

describe('genres', () => {
  test('GET /genres', async () => {
    const { result } = await fetchAndParse('/genres');

    expect(result.limit).toBe(10);
    expect(result.offset).toBe(0);
    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(result._links).toBeDefined();
    expect(result._links.self).toBeDefined();
  });

  test('GET /genres with offset 0', async () => {
    const { result } = await fetchAndParse('/genres/?offset=0');

    expect(result.limit).toBe(10);
    expect(result.offset).toBe(0);
    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(result._links).toBeDefined();
    expect(result._links.self).toBeDefined();
  });

  test('GET /genres with offset 1 limit 1', async () => {
    const { result } = await fetchAndParse('/genres/?offset=1&limit=1');

    expect(result.limit).toBe(1);
    expect(result.offset).toBe(1);
    expect(result.items.length).toBe(1);
    expect(result._links).toBeDefined();
    expect(result._links.self).toBeDefined();
    expect(result._links.prev).toBeDefined();
  });

  test('GET /genres with offset outside range', async () => {
    const { result } = await fetchAndParse('/genres/?offset=100&limit=1');

    expect(result.limit).toBe(1);
    expect(result.offset).toBe(100);
    expect(result.items.length).toBe(0);
    expect(result._links).toBeDefined();
    expect(result._links.self).toBeDefined();
    expect(result._links.next).toBeUndefined();
    expect(result._links.prev).toBeDefined();
  });
});

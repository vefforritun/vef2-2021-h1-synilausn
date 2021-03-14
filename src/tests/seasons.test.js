/* eslint-disable no-underscore-dangle */
import { test, describe, expect } from '@jest/globals';

import { fetchAndParse } from './utils.js';

const ALTERING = true;

describe('series', () => {
  test('GET /tv/1/season', async () => {
    const { result } = await fetchAndParse('/tv/1/season');

    expect(result.limit).toBe(10);
    expect(result.offset).toBe(0);
    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(result._links).toBeDefined();
    expect(result._links.self).toBeDefined();
  });

  test('GET /tv/1/season with offset 0', async () => {
    const { result } = await fetchAndParse('/tv/1/season/?offset=0');

    expect(result.limit).toBe(10);
    expect(result.offset).toBe(0);
    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(result._links).toBeDefined();
    expect(result._links.self).toBeDefined();
  });

  test('GET /tv/1/season with offset 10 limit 10', async () => {
    const { result } = await fetchAndParse('/tv/1/season/?offset=100&limit=10');

    expect(result.limit).toBe(10);
    expect(result.offset).toBe(100);
    expect(result.items.length).toBe(0);
    expect(result._links).toBeDefined();
    expect(result._links.self).toBeDefined();
    expect(result._links.prev).toBeDefined();
  });

  test('GET /tv/1/season with offset outside range', async () => {
    const { result } = await fetchAndParse('/tv/1/season/?offset=100&limit=1');

    expect(result.limit).toBe(1);
    expect(result.offset).toBe(100);
    expect(result.items.length).toBe(0);
    expect(result._links).toBeDefined();
    expect(result._links.self).toBeDefined();
    expect(result._links.next).toBeUndefined();
    expect(result._links.prev).toBeDefined();
  });

  test('GET /tv/1/season with illegal offset & limit', async () => {
    const { result, status } = await fetchAndParse('/tv/1/season/?offset=a&limit=b');

    expect(status).toBe(400);
    expect(result.errors.length).toBe(2);
  });

  test('GET /tv/1/season/1 does exist', async () => {
    const { result, status } = await fetchAndParse('/tv/1/season/1');

    expect(status).toBe(200);
    expect(result.id).toBe(1);
    expect(result.name).toBeDefined();
  });

  test('GET /tv/1/season/1 has episodes', async () => {
    const { result, status } = await fetchAndParse('/tv/1/season/1');

    expect(status).toBe(200);
    expect(result.id).toBe(1);
    expect(result.name).toBeDefined();
    expect(result.episodes).toBeDefined();
    expect(result.episodes.length).toBeGreaterThan(1);
  });

  test('GET /tv/1/season/100 does not exist', async () => {
    const { status } = await fetchAndParse('/tv/1/season/100');

    expect(status).toBe(404);
  });
});

if (ALTERING) {
  describe('series altering tests', () => {
    test('POST /tv/', async () => {
      const { result } = await fetchAndParse('/tv/1/season');
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
      expect(result.items.length).toBeGreaterThanOrEqual(1);
      expect(result._links).toBeDefined();
      expect(result._links.self).toBeDefined();
    });
  });
}

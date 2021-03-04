/* eslint-disable no-underscore-dangle */
import { test, describe, expect } from '@jest/globals';

import { fetchAndParse } from './utils.js';

describe('index', () => {
  test('GET /', async () => {
    const { result } = await fetchAndParse('/');
    expect(typeof result).toBe('object');
    expect(Object.entries(result).length).toBeGreaterThan(1);
  });
});

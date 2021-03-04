/* eslint-disable no-underscore-dangle */
import { test, describe, expect } from '@jest/globals';

import { fetchAndParse } from './utils.js';

const ALTERING = true;

describe('episodes', () => {
  test.only('GET /tv/1/season/1/episode/1', async () => {
    const { result, status } = await fetchAndParse('/tv/1/season/1/episode/1');

    expect(status).toBe(200);
    expect(result.id).toBe(1);
    expect(result.name).toBeDefined();
  });
});

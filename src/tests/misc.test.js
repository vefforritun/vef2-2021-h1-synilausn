/* eslint-disable no-underscore-dangle */
import { test, describe, expect } from '@jest/globals';
import fetch from 'node-fetch';

import { baseUrl, fetchAndParse } from './utils.js';

describe('index', () => {
  test('GET /', async () => {
    const { result, status } = await fetchAndParse('/');
    expect(status).toBe(200);
    expect(typeof result).toBe('object');
    expect(Object.entries(result).length).toBeGreaterThan(1);
  });

  test('POST w/x-www-form-urlencoded should error', async () => {
    const body = new URLSearchParams({
      username: 'admin',
      password: 'asdfghjsdfghj',
      email: 'test@example.org',
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    };

    const url = new URL('/users/register', baseUrl);
    const response = await fetch(url, options);
    const result = await response.json();
    const { status } = response;

    expect(status).toBe(400);
    expect(result.error).toBe('body must be json or form-data');
  });
});

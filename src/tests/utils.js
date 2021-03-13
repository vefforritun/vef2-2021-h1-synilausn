import crypto from 'crypto';

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

export function randomValue() {
  return crypto.randomBytes(16).toString('hex');
}

export async function methodAndParse(method, path, data = null, token = null) {
  const url = new URL(path, BASE_URL);

  const options = { headers: {} };

  if (method !== 'GET') {
    options.method = method;
  }

  if (data) {
    options.headers['content-type'] = 'application/json';
    options.body = JSON.stringify(data);
  }

  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  const result = await fetch(url, options);

  return {
    result: await result.json(),
    status: result.status,
  };
}

export async function fetchAndParse(path, token = null) {
  return methodAndParse('GET', path, null, token);
}

export async function postAndParse(path, data, token = null) {
  return methodAndParse('POST', path, data, token);
}

export async function patchAndParse(path, data, token = null) {
  return methodAndParse('PATCH', path, data, token);
}

export async function loginAndReturnToken(data) {
  const { result } = await postAndParse('/users/login', data);

  if (result && result.token) {
    return result.token;
  }

  return null;
}

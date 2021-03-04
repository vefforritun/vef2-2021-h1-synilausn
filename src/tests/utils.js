import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

export async function fetchAndParse(path) {
  const url = new URL(path, BASE_URL);

  const result = await fetch(url);

  return {
    result: await result.json(),
    status: result.status,
  };
}

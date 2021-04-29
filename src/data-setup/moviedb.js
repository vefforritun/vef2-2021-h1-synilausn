import { basename, join } from 'path';

import fetch from 'node-fetch';

import { slugify } from '../utils/slugify.js';
import {
  exists, readFile, writeFile,
} from '../utils/fs-helpers.js';

/**
 * Útbýr tengingar við nokkrar aðferðir í TheMovieDb API.
 * Keyrir allt í gegnum cache lag sem vistar svör í `/.cache` til að minnka
 * köll í API og hraða fyrir endurtekin köll.
 */
export class MovieDb {
  constructor({
    cacheDir, imageDir, logger, token,
  } = {}) {
    this.tmdbBasePath = 'https://api.themoviedb.org/3/tv/';

    if (!cacheDir || !imageDir || !logger || !token) {
      throw new Error('missing required values');
    }

    this.cacheDir = cacheDir;
    this.imageDir = imageDir;
    this.logger = logger;
    this.token = token;
  }

  async fetchOrCached(url, cacheDir, { cacheKey = null, binary = false } = {}) {
    const slug = cacheKey || slugify(url);

    const cacheFile = join(cacheDir, slug);
    const fileExists = await exists(cacheFile);

    if (fileExists) {
      this.logger.verbose(`Result is cached for ${url}`);
      const cached = await readFile(cacheFile, binary ? null : 'utf8');

      if (binary) {
        return cached;
      }

      return JSON.parse(cached);
    }

    this.logger.verbose(`Fetching result for ${url}`);

    let result;
    try {
      result = await fetch(url);
    } catch (e) {
      this.logger.error(`Error fetching ${url}`, e);
      return null;
    }

    if (!result.ok) {
      this.logger.error(`Result not ok for ${url}`);
      return null;
    }

    if (binary) {
      const data = await result.buffer();
      await writeFile(cacheFile, data, null);

      return data;
    }

    const text = await result.json();

    await writeFile(cacheFile, JSON.stringify(text, null, 2));

    return text;
  }

  async fetchImage(imagePath) {
    const filename = basename(imagePath);
    const url = `https://image.tmdb.org/t/p/original${imagePath}`;

    const result = await this.fetchOrCached(
      url, this.imageDir, { cacheKey: filename, binary: true },
    );

    return { buffer: result, filename };
  }

  async fetchPopular(page = 1) {
    const url = `${this.tmdbBasePath}popular?api_key=${this.token}&language=en-US&page=${page}`;

    const result = await this.fetchOrCached(url, this.cacheDir);

    return result;
  }

  async fetchSerie(serieId) {
    const url = `${this.tmdbBasePath}${serieId}?api_key=${this.token}&language=en-US&append_to_response=videos,images`;

    const result = await this.fetchOrCached(url, this.cacheDir);

    return result;
  }

  async fetchSeason(serieId, seasonId) {
    const url = `${this.tmdbBasePath}${serieId}/season/${seasonId}?api_key=${this.token}&language=en-US&append_to_response=videos,images`;

    const result = await this.fetchOrCached(url, this.cacheDir);

    return result;
  }
}

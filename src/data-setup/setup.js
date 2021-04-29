/* eslint-disable no-await-in-loop */
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';

import { prepareDir } from '../utils/fs-helpers.js';
import { logger } from '../utils/logger.js';
import { MovieDb } from './moviedb.js';
import { writeCsv } from './csv.js';

dotenv.config();

const CACHE_DIR = './../../.cache';
const DATA_DIR = './../../data';
const IMAGE_DIR = './../../data/img';

const path = dirname(fileURLToPath(import.meta.url));
const resolvedCacheDir = join(path, CACHE_DIR);
const resolvedImageDir = join(path, IMAGE_DIR);
const resolvedDataDir = join(path, DATA_DIR);

const {
  TMDB_TOKEN: tmdbToken,
} = process.env;

if (!tmdbToken) {
  logger.error('Missing TMDB_TOKEN from env');
  process.exit(-1);
}

/**
 * Sækir 20 vinsælustu sjónvarpsþættina á themoviedatabase, sækir síðan öll
 * season fyrir hvern, og að lokum alla þætti í hverju season. Að lokum er allt
 * vistað í CSV skrár.
 * Fyrir myndir, þá er myndin vistuð jafnóðum í myndamöppu og vísað í heiti
 * hennar í gögnum.
 */
async function main() {
  const cacheDirResult = await prepareDir(resolvedCacheDir);
  const imageDirResult = await prepareDir(resolvedImageDir);
  const dataDirResult = await prepareDir(resolvedDataDir);

  if (!cacheDirResult) {
    logger.error(`Dir "${resolvedCacheDir}" is not writeable`);
  }

  if (!imageDirResult) {
    logger.error(`Dir "${resolvedImageDir}" is not writeable`);
  }

  if (!cacheDirResult || !imageDirResult || !dataDirResult) {
    process.exit(-1);
  }

  let movieDb;

  try {
    movieDb = new MovieDb({
      cacheDir: resolvedCacheDir,
      imageDir: resolvedImageDir,
      logger,
      token: tmdbToken,
    });
  } catch (e) {
    logger.error('Unable to create moviedb instance', e);
    return process.exit(-1);
  }

  const popular = await movieDb.fetchPopular();

  const series = [];

  let serieId = 1;

  // Use loop here since using forEach would trigger *all* async operations to
  // run at the same time, we're fine with doing it in serial order.
  for (const { id, name } of popular.results) {
    logger.verbose(`Processing serie "${name}"`);
    const serieData = await movieDb.fetchSerie(id);
    const serieImage = await movieDb.fetchImage(serieData.poster_path);

    const serie = {
      id: serieId,
      name: serieData.name,
      airDate: serieData.first_air_date,
      genres: serieData.genres.map((i) => i.name).join(','),
      inProduction: serieData.in_production,
      tagline: serieData.tagline,
      image: serieImage.filename,
      description: serieData.overview,
      language: serieData.languages[0],
      network: serieData.networks[0].name,
      homepage: serieData.homepage,
      seasons: [],
    };

    for (const { season_number: seasonNumber } of serieData.seasons) {
      // Season 0 is specials etc, skip those
      if (seasonNumber === 0) {
        // eslint-disable-next-line no-continue
        continue;
      }

      logger.verbose(`  Season ${seasonNumber}`);
      const seasonData = await movieDb.fetchSeason(id, seasonNumber);
      const seasonImage = await movieDb.fetchImage(seasonData.poster_path);

      const season = {
        name: seasonData.name,
        number: seasonData.season_number,
        airDate: seasonData.air_date,
        overview: seasonData.overview,
        poster: seasonImage.filename,
        serie: serieData.name,
        serieId,
        episodes: [],
      };

      for (const episodeData of seasonData.episodes) {
        const episode = {
          name: episodeData.name,
          number: episodeData.episode_number,
          airDate: episodeData.airDate,
          overview: episodeData.overview,
          season: seasonData.season_number,
          serie: serieData.name,
          serieId,
        };

        season.episodes.push(episode);
      }

      serie.seasons.push(season);
    }

    series.push(serie);
    serieId += 1;
  }

  const allSeries = [];
  const allSeasons = [];
  const allEpisodes = [];

  series.forEach((serie) => {
    serie.seasons.forEach((season) => {
      season.episodes.forEach((episode) => {
        allEpisodes.push(episode);
      });
      // eslint-disable-next-line no-param-reassign
      delete season.episodes;
      allSeasons.push(season);
    });
    // eslint-disable-next-line no-param-reassign
    delete serie.seasons;
    allSeries.push(serie);
  });

  const episodesCsvFile = join(resolvedDataDir, 'episodes.csv');
  try {
    await writeCsv(allEpisodes, episodesCsvFile);
  } catch (e) {
    logger.error(`Unable to write CSV file "${episodesCsvFile}"`, e);
  }

  const seriesCsvFile = join(resolvedDataDir, 'series.csv');
  try {
    await writeCsv(allSeries, seriesCsvFile);
  } catch (e) {
    logger.error(`Unable to write CSV file "${seriesCsvFile}"`, e);
  }

  const seasonCsvFile = join(resolvedDataDir, 'seasons.csv');
  try {
    await writeCsv(allSeasons, seasonCsvFile);
  } catch (e) {
    logger.error(`Unable to write CSV file "${seasonCsvFile}"`, e);
  }

  return true;
}

main().catch((e) => logger.error(e));

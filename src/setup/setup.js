/* eslint-disable no-await-in-loop */
import fs from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

import csvParser from 'csv-parser';

import { logger } from '../utils/logger.js';
import { readDir, readFile, stat } from '../utils/fs-helpers.js';
import {
  query,
  end,
  insertSerie,
  insertGenre,
  insertSerieGenre,
  insertSeason,
  insertEpisode,
} from '../db.js';
import { listImages, uploadImage } from '../utils/cloudinary.js';

const DATA_DIR = './../../data';
const IMG_DIR = './../../data/img';
const SQL_DIR = './../../sql';

const path = dirname(fileURLToPath(import.meta.url));

/**
 * Möppun á milli skráarnafns myndar og slóðar á Cloudinary
 * <skráarnafn> => <url>
 */
const imageCloudinaryUrl = new Map();

/**
 *  Möppun milli serieId úr serieId í CSV yfir serie:
 *  {
 *    id: number,
 *    series: [{
 *      number: number;
 *      id: number;
 *    }]
 *  }
 * Getum þá bætt vísanir við fyrir season og þætti.
 * Uppfærum hlut eftir því sem við bætum við í gagnagrunn.
 */
const serieIds = new Map();

// Heiti á genre => Id á genre í gagnagrunni
const genreIds = new Map();

/**
 * Les inn schema fyrir gagnagrunn úr SQL skrá.
 */
async function schema() {
  const schemaFile = join(path, SQL_DIR, 'schema.sql');
  const data = await readFile(schemaFile);
  await query(data);
}

/**
 * Les inn SQL skipanir eftir að skema er tilbúið.
 */
async function postSchemaSql() {
  const schemaFile = join(path, SQL_DIR, 'post.sql');
  const data = await readFile(schemaFile);
  await query(data);
}

/**
 * Hjálparfall sem les CSV skrá með straumum. Gætum útfært sem „one-pass“:
 * lesið inn skrá og unnið með gögn jafnóðum, en það er flóknara vegna blöndu
 * strauma og promises.
 *
 * @param {string} filename CSV skrá til að lesa og skila gögnum frá.
 * @returns {Promise<Array<object>>} Promise með fylki af gögnum
 */
async function readCsv(filename) {
  return new Promise((resolve, reject) => {
    const all = [];
    fs.createReadStream(filename)
      .pipe(csvParser())
      .on('data', (data) => {
        all.push(data);
      })
      .on('end', () => {
        resolve(all);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

/**
 * Bætir við tegund eða skilar ID á henni ef til.
 * @param {string} genre Tegund sem útbúa skal eða skila ID fyrir
 * @returns {string} ID á tegund.
 */
async function insertGenreOrExisiting(genre) {
  if (!genreIds.has(genre)) {
    const insertedGenre = await insertGenre(genre);
    genreIds.set(genre, insertedGenre.id);
  }

  return genreIds.get(genre);
}

/**
 * Les inn gögn um sjónvarpsþætti úr CSV skrá, les inn í grunn með tengdum
 * tegundum. Geymir lista af sjónvarpsþáttum í serieIds Map fyrir önnur
 * innlestrar föll.
 */
async function series() {
  const filename = join(path, DATA_DIR, 'series.csv');

  const data = await readCsv(filename);

  for (const item of data) {
    // Höldum utanum ID frá gagnagrunninum
    const csvId = item.id;

    // Búum til sérstaklega og setjum ID í staðinn
    const { genres } = item;

    // Búum til Date object
    item.airDate = new Date(item.airDate);

    const image = imageCloudinaryUrl.get(item.image);

    if (image) {
      item.image = image;
    } else {
      logger.warn(`Missing uploaded image for serie "${item.name}"`);
    }

    const { id } = await insertSerie(item);

    // Bætum við vísun í seríu möppun
    serieIds.set(csvId, { id, seasons: [] });

    for (const genre of genres.split(',')) {
      const genreId = await insertGenreOrExisiting(genre);
      await insertSerieGenre(id, genreId);
    }
  }
}

/**
 * Les inn gögn um sjónvarpsþátta season úr CSV skrá, les inn í grunn og tengir
 * við sjónvarpsþátt út frá seriesIds map. Bætir við gagnagrunns ID við map.
 */
async function seasons() {
  const filename = join(path, DATA_DIR, 'seasons.csv');

  const data = await readCsv(filename);

  for (const item of data) {
    const serie = serieIds.get(item.serieId);

    item.serieId = serie.id;
    item.airDate = item.airDate ? new Date(item.airDate) : null;

    const poster = imageCloudinaryUrl.get(item.poster);

    if (poster) {
      item.poster = poster;
    } else {
      logger.warn(`Missing uploaded poster for season "${item.name}"`);
    }

    const { id } = await insertSeason(item);

    serie.seasons.push({ id, number: item.number });
    serieIds.set(item.serieId, serie);
  }
}

/**
 * Les inn gögn um þætti úr CSV skrá, les inn í grunn og tengir við season og
 * sjónvarpsþátt.
 */
async function episodes() {
  const filename = join(path, DATA_DIR, 'episodes.csv');

  const data = await readCsv(filename);

  for (const item of data) {
    const serie = serieIds.get(item.serieId);

    const foundSeasonId = serie.seasons.find((i) => i.number === item.season);

    if (!foundSeasonId) {
      throw new Error('episode season not found');
    }

    item.seasonId = foundSeasonId.id;
    item.serieId = serie.id;
    item.airDate = item.airDate ? new Date(item.airDate) : null;

    await insertEpisode(item);
  }
}

async function images() {
  const imagesOnDisk = await readDir(join(path, IMG_DIR));
  const filteredImages = imagesOnDisk
    .filter((i) => extname(i).toLowerCase() === '.jpg');

  if (filteredImages.length === 0) {
    logger.warn('No images to upload');
    return;
  }

  const cloudinaryImages = await listImages();
  logger.verbose(`${cloudinaryImages.length} images in Cloudinary`);

  for (const image of filteredImages) {
    let cloudinaryUrl = '';
    const imgPath = join(path, IMG_DIR, image);
    const imgSize = (await stat(imgPath)).size;
    const uploaded = cloudinaryImages.find((i) => i.bytes === imgSize);

    if (uploaded) {
      cloudinaryUrl = uploaded.secure_url;
      logger.verbose(`${imgPath} already uploaded to Cloudinary`);
    } else {
      const upload = await uploadImage(imgPath);
      cloudinaryUrl = upload.secure_url;
      logger.verbose(`${imgPath} uploaded to Cloudinary`);
    }

    imageCloudinaryUrl.set(image, cloudinaryUrl);
  }
}

/**
 * Keyrir inn öll gögn í röð.
 * Mætti bæta villumeðhöndlun, en þar sem þetta er keyrt „handvirkt“ verður
 * villumeðhöndlun mannleg: ef við sjáum villu lögum við villu.
 */
async function main() {
  await images();
  logger.info('Images uploaded');
  await schema();
  logger.info('Schema created');
  await postSchemaSql();
  logger.info('Post schema SQL run');
  await series();
  logger.info('Series & genres imported');
  await seasons();
  logger.info('Seasons imported');
  await episodes();
  logger.info('Episodes imported');
  await end();
}

main().catch((err) => {
  logger.error(err);
});

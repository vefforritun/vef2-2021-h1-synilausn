-- TODO ætti e.t.v. að vera í sér scriptu svo við droppum ekki „óvart“
DROP TABLE IF EXISTS users_series_state;
DROP TABLE IF EXISTS users_series_rating;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS episodes;
DROP TABLE IF EXISTS seasons;
DROP TABLE IF EXISTS series_genres;
DROP TABLE IF EXISTS genres;
DROP TABLE IF EXISTS series;
DROP TYPE IF EXISTS userSerieState;

-- Allir foreign key constraints eru skilgreindir með „ON DELETE CASCADE“ þ.a. þeim færslum sem
-- vísað er í verður *eytt* þegar gögnum sem vísa í þær er eytt

CREATE TABLE series (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  air_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  in_production BOOLEAN DEFAULT false,
  tagline TEXT,
  image VARCHAR(255) NOT NULL,
  description TEXT,
  language VARCHAR(2) NOT NULL,
  network VARCHAR(128),
  url VARCHAR(255)
);

CREATE TABLE genres (
  id SERIAL PRIMARY KEY,
  -- TODO should be unique...
  name VARCHAR(128) NOT NULL
);

CREATE TABLE series_genres (
  serie INTEGER NOT NULL,
  genre INTEGER NOT NULL,
  CONSTRAINT FK_seriesGenres_serie FOREIGN KEY (serie) REFERENCES series (id) ON DELETE CASCADE,
  CONSTRAINT FK_seriesGenres_genre FOREIGN KEY (genre) REFERENCES genres (id) ON DELETE CASCADE
);

CREATE TABLE seasons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  "number" VARCHAR(128) NOT NULL,
  air_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  overview TEXT,
  poster VARCHAR(255) NOT NULL,
  serieId INTEGER NOT NULL,
  CONSTRAINT FK_series_serie FOREIGN KEY (serieId) REFERENCES series (id) ON DELETE CASCADE
);

CREATE TABLE episodes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  "number" VARCHAR(128) NOT NULL,
  air_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  overview TEXT,
  seasonId INTEGER NOT NULL,
  serieId INTEGER NOT NULL, -- Tæknilega ekki þörf
  CONSTRAINT FK_episodes_season FOREIGN KEY (seasonId) REFERENCES seasons (id) ON DELETE CASCADE,
  CONSTRAINT FK_episodes_serie FOREIGN KEY (serieId) REFERENCES series (id) ON DELETE CASCADE
);

-- Þrenndin (þáttanúmer, seasonId, serieId) á að vera unique
CREATE UNIQUE INDEX idx_episode_season_serie ON episodes("number", seasonId, serieId);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(256) NOT NULL UNIQUE,
  email VARCHAR(256) NOT NULL UNIQUE,
  password VARCHAR(256) NOT NULL,
  admin BOOLEAN DEFAULT false,
  created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp,
  updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp
);

CREATE TABLE users_series_rating (
  id SERIAL PRIMARY KEY,
  "user" INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 0 AND rating <= 5),
  serieId INTEGER NOT NULL,
  CONSTRAINT FK_series_serie FOREIGN KEY (serieId) REFERENCES series (id) ON DELETE CASCADE,
  CONSTRAINT "user" FOREIGN KEY ("user") REFERENCES users (id) ON DELETE CASCADE
);

-- Notandi á ekki að geta búið til fleiri en eitt rating per seríu
CREATE UNIQUE INDEX idx_users_series_rating ON users_series_rating("user", serieId);

CREATE TYPE userSerieState AS ENUM ('want to watch', 'watching', 'watched');

CREATE TABLE users_series_state(
  id SERIAL PRIMARY KEY,
  "user" INTEGER NOT NULL,
  state userSerieState NOT NULL,
  serieId INTEGER NOT NULL,
  CONSTRAINT FK_series_serie FOREIGN KEY (serieId) REFERENCES series (id) ON DELETE CASCADE,
  CONSTRAINT "user" FOREIGN KEY ("user") REFERENCES users (id) ON DELETE CASCADE
);

-- Notandi á ekki að geta búið til fleiri en eitt state per seríu
CREATE UNIQUE INDEX idx_users_series_state ON users_series_state("user", serieId);

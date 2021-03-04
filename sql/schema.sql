DROP TABLE IF EXISTS episodes;
DROP TABLE IF EXISTS seasons;
DROP TABLE IF EXISTS series_genres;
DROP TABLE IF EXISTS genres;
DROP TABLE IF EXISTS series;

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
  name VARCHAR(128) NOT NULL
);

CREATE TABLE series_genres (
  serie INTEGER NOT NULL,
  genre INTEGER NOT NULL,
  CONSTRAINT FK_seriesGenres_serie FOREIGN KEY (serie) REFERENCES series (id),
  CONSTRAINT FK_seriesGenres_genre FOREIGN KEY (genre) REFERENCES genres (id)
);

CREATE TABLE seasons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  "number" VARCHAR(128) NOT NULL,
  air_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  overview TEXT,
  poster VARCHAR(255) NOT NULL,
  serieId INTEGER NOT NULL,
  CONSTRAINT FK_series_serie FOREIGN KEY (serieId) REFERENCES series (id)
);

CREATE TABLE episodes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  "number" VARCHAR(128) NOT NULL,
  air_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  overview TEXT,
  seasonId INTEGER NOT NULL,
  serieId INTEGER NOT NULL, -- Tæknilega ekki þörf
  CONSTRAINT FK_episodes_season FOREIGN KEY (seasonId) REFERENCES seasons (id),
  CONSTRAINT FK_episodes_serie FOREIGN KEY (serieId) REFERENCES series (id)
);

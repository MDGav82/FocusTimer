
CREATE TABLE status (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE type_periode (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE parameters (
  id                  SERIAL PRIMARY KEY,
  auto_start_work     BOOLEAN NOT NULL DEFAULT false,
  auto_start_rest     BOOLEAN NOT NULL DEFAULT false,
  auto_restart_cycle  BOOLEAN NOT NULL DEFAULT false,
  notifications_on    BOOLEAN NOT NULL DEFAULT true
);


CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password      VARCHAR(255),
  parameters_id INTEGER NOT NULL REFERENCES parameters(id) ON DELETE CASCADE
);


CREATE TABLE task (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status_id      INTEGER NOT NULL REFERENCES status(id),
  title          VARCHAR(255) NOT NULL,
  description    VARCHAR(255),
  estimated_time INTEGER  DEFAULT 0,
  progress       INTEGER  DEFAULT 0,
  time_spent     INTEGER  DEFAULT 0,
  creation_date  TIMESTAMP NOT NULL DEFAULT NOW(),
  start_date     TIMESTAMP,
  end_date       TIMESTAMP
);

CREATE TABLE cycle (
  id      SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name    VARCHAR(255) NOT NULL
);


CREATE TABLE period (
  id              SERIAL PRIMARY KEY,
  cycle_id        INTEGER NOT NULL REFERENCES cycle(id) ON DELETE CASCADE,
  type_periode_id INTEGER NOT NULL REFERENCES type_periode(id),
  time            INTEGER NOT NULL,
  index           INTEGER NOT NULL
);

CREATE TABLE history (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type_periode_id INTEGER NOT NULL REFERENCES type_periode(id),
  start_date      TIMESTAMP NOT NULL DEFAULT NOW(),
  time_spent      INTEGER NOT NULL DEFAULT 0
);

INSERT INTO status (name) VALUES ('todo'), ('in_progress'), ('done');
INSERT INTO type_periode (name) VALUES ('work'), ('short_break'), ('long_break');

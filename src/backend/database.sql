
CREATE TABLE status (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE type_periode (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

-- updated_at stores epoch milliseconds (matches the frontend's Date.now()) and
-- drives the last-write-wins conflict resolution in the offline-first sync layer.
CREATE TABLE parameters (
  id                  SERIAL PRIMARY KEY,
  auto_start_work     BOOLEAN NOT NULL DEFAULT false,
  auto_start_rest     BOOLEAN NOT NULL DEFAULT false,
  auto_restart_cycle  BOOLEAN NOT NULL DEFAULT false,
  notifications_on    BOOLEAN NOT NULL DEFAULT true,
  updated_at          BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);


CREATE TABLE users (
  id            UUID PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password      VARCHAR(255),
  parameters_id INTEGER NOT NULL REFERENCES parameters(id) ON DELETE CASCADE,
  updated_at    BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);


CREATE TABLE task (
  id             UUID PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status_id      INTEGER NOT NULL REFERENCES status(id),
  title          VARCHAR(255) NOT NULL,
  description    VARCHAR(255),
  estimated_time INTEGER  DEFAULT 0,
  progress       INTEGER  DEFAULT 0,
  time_spent     INTEGER  DEFAULT 0,
  creation_date  TIMESTAMP NOT NULL DEFAULT NOW(),
  start_date     TIMESTAMP,
  end_date       TIMESTAMP,
  updated_at     BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

CREATE TABLE cycle (
  id         UUID PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);


CREATE TABLE period (
  id              UUID PRIMARY KEY,
  cycle_id        UUID NOT NULL REFERENCES cycle(id) ON DELETE CASCADE,
  type_periode_id INTEGER NOT NULL REFERENCES type_periode(id),
  time            INTEGER NOT NULL,
  index           INTEGER NOT NULL,
  updated_at      BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

CREATE TABLE history (
  id              SERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type_periode_id INTEGER NOT NULL REFERENCES type_periode(id),
  task_id         UUID REFERENCES task(id) ON DELETE SET NULL,
  cycle_id        UUID NOT NULL REFERENCES cycle(id),
  start_date      TIMESTAMP NOT NULL DEFAULT NOW(),
  time_spent      INTEGER NOT NULL DEFAULT 0
);

INSERT INTO status (name) VALUES ('pending'), ('progress'), ('finish');
INSERT INTO type_periode (name) VALUES ('work'), ('break');

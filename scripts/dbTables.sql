--  动态表
CREATE TABLE IF NOT EXISTS tweet(
  id serial PRIMARY KEY NOT NULL,
  time date,
  type smallint NOT NULL DEFAULT '0',
  user_id bigint NOT NULL DEFAULT '0',
  content varchar(2000) NOT NULL DEFAULT '',
  config varchar(3000) NOT NULL DEFAULT ''
);
CREATE INDEX idx_time ON tweet (time);
--  动态表
CREATE TABLE IF NOT EXISTS tweet(
  _id serial PRIMARY KEY NOT NULL,
  id bigint UNIQUE NOT NULL DEFAULT '0',
  type smallint NOT NULL DEFAULT '0',
  status smallint NOT NULL DEFAULT '0',
  user_id bigint NOT NULL DEFAULT '0',
  create_time date,
  content varchar(2000) NOT NULL DEFAULT '',
  config varchar(3000) NOT NULL DEFAULT ''
);
CREATE INDEX idx_time ON tweet (create_time);

CREATE TABLE IF NOT EXISTS user_basic (
  _id serial PRIMARY KEY NOT NULL,
  id bigint UNIQUE NOT NULL DEFAULT '0',
  account varchar(100) NOT NULL DEFAULT '',
  password varchar(200) NOT NULL DEFAULT '',
  nickname varchar(200) NOT NULL DEFAULT '',
  avatar varchar(300) NOT NULL DEFAULT '',
  type smallint NOT NULL DEFAULT '0',
  status smallint NOT NULL DEFAULT '0',
  create_time date,
  remark varchar(500) NOT NULL DEFAULT ''
);
CREATE INDEX idx_nickname ON user_basic (nickname);
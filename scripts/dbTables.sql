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

CREATE TABLE IF NOT EXISTS user_relation  (
  _id serial PRIMARY KEY NOT NULL,
  id bigint UNIQUE NOT NULL DEFAULT '0',
  uid bigint NOT NULL DEFAULT '0',
  target_uid bigint NOT NULL DEFAULT '0',
  status smallint NOT NULL DEFAULT '0',
  create_time date,
  update_time date
);
CREATE INDEX idx_uid_time ON user_relation (uid, update_time DESC);
CREATE INDEX idx_tgtuid_time ON user_relation (target_uid, update_time DESC);

CREATE TABLE IF NOT EXISTS chat_session (
  _id serial PRIMARY KEY NOT NULL,
  uid bigint NOT NULL,
  to_uid bigint NOT NULL,
  unread_cnt int NOT NULL DEFAULT '0',
  create_time date,
  update_time date
);
CREATE INDEX idx_uid_touid ON chat_session (uid, to_uid);
CREATE INDEX idx_uid_time ON chat_session (uid, update_time DESC);

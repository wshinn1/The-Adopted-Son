alter table devotionals
  add column if not exists tts_enabled boolean not null default false;

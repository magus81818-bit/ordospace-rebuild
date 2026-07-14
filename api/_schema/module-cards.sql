create table if not exists ordo_module_cards (
  id text primary key,
  project_id text not null,
  status text not null,
  card jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists ordo_module_cards_project_status_idx
on ordo_module_cards (project_id, status);

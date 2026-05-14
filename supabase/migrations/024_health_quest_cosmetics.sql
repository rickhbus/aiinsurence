create table if not exists public.health_quest_cosmetics (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  cosmetic_type text not null,
  title jsonb not null,
  cost_gems integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint health_quest_cosmetics_type_check check (cosmetic_type in ('theme','mascot_accessory','celebration_effect')),
  constraint health_quest_cosmetics_cost_check check (cost_gems >= 0)
);

create table if not exists public.user_health_quest_cosmetics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cosmetic_id uuid not null references public.health_quest_cosmetics(id) on delete cascade,
  equipped boolean not null default false,
  unlocked_at timestamptz not null default now(),
  unique(user_id, cosmetic_id)
);

alter table public.health_quest_cosmetics enable row level security;
alter table public.user_health_quest_cosmetics enable row level security;

grant select on public.health_quest_cosmetics to anon, authenticated;
grant select, insert, update on public.user_health_quest_cosmetics to authenticated;

drop policy if exists health_quest_cosmetics_public_read on public.health_quest_cosmetics;
create policy health_quest_cosmetics_public_read
on public.health_quest_cosmetics for select
using (active = true);

drop policy if exists user_health_quest_cosmetics_own_rows on public.user_health_quest_cosmetics;
create policy user_health_quest_cosmetics_own_rows
on public.user_health_quest_cosmetics for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create index if not exists user_health_quest_cosmetics_user_idx
  on public.user_health_quest_cosmetics(user_id, equipped desc, unlocked_at desc);

insert into public.health_quest_cosmetics (slug, cosmetic_type, title, cost_gems)
values
  ('jade-trail','theme','{"zh":"翡翠路線","en":"Jade Trail"}',20),
  ('sky-trail','theme','{"zh":"天空路線","en":"Sky Trail"}',20),
  ('dragon-scarf','mascot_accessory','{"zh":"小健龍頸巾","en":"Dragon Scarf"}',35),
  ('amber-spark','celebration_effect','{"zh":"暖光慶祝","en":"Amber Spark"}',30)
on conflict (slug) do update set
  cosmetic_type = excluded.cosmetic_type,
  title = excluded.title,
  cost_gems = excluded.cost_gems,
  active = true;

comment on table public.health_quest_cosmetics is
  'Cosmetic-only Health Quest rewards. Cosmetics must not unlock medical advice, safety guidance, insurance decisions, claim outcomes, or care access.';


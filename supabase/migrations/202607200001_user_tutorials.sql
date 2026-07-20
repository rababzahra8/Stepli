-- User-authored Stepli guides. Run this migration in a Supabase project.
-- The mobile app uses only the project URL and publishable/anon key; RLS keeps
-- Postgres credentials and the service-role key on the server side.

create extension if not exists pgcrypto;

create table if not exists public.tutorials (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  app_name text not null check (char_length(trim(app_name)) between 1 and 100),
  app_package text not null check (
    app_package ~ '^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$'
  ),
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text,
  language text not null check (language in ('en', 'ur')),
  visibility text not null default 'private' check (visibility in ('private', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tutorial_steps (
  id uuid primary key default gen_random_uuid(),
  tutorial_id uuid not null references public.tutorials(id) on delete cascade,
  position integer not null check (position > 0 and position <= 100),
  instruction text not null check (char_length(trim(instruction)) between 1 and 1200),
  spoken_instruction text check (spoken_instruction is null or char_length(trim(spoken_instruction)) <= 1200),
  confirmation_text text check (confirmation_text is null or char_length(trim(confirmation_text)) <= 100),
  -- This deliberately accepts only the small matcher vocabulary used by the
  -- app. It prevents raw accessibility trees, screenshots, coordinates, and
  -- arbitrary metadata from entering the shared guide database.
  matcher jsonb not null default '{}'::jsonb check (
    jsonb_typeof(matcher) = 'object'
    and matcher - 'resourceId' - 'text' - 'contentDescription' = '{}'::jsonb
    and (
      not (matcher ? 'resourceId')
      or (
        jsonb_typeof(matcher -> 'resourceId') = 'string'
        and char_length(matcher ->> 'resourceId') <= 160
      )
    )
    and (
      not (matcher ? 'text')
      or (
        jsonb_typeof(matcher -> 'text') = 'string'
        and char_length(matcher ->> 'text') <= 160
      )
    )
    and (
      not (matcher ? 'contentDescription')
      or (
        jsonb_typeof(matcher -> 'contentDescription') = 'string'
        and char_length(matcher ->> 'contentDescription') <= 160
      )
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tutorial_id, position)
);

create index if not exists tutorials_discovery_idx
  on public.tutorials (app_package, language, visibility, updated_at desc);
create index if not exists tutorials_owner_idx on public.tutorials (owner_id, updated_at desc);
create index if not exists tutorial_steps_order_idx on public.tutorial_steps (tutorial_id, position);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tutorials_set_updated_at on public.tutorials;
create trigger tutorials_set_updated_at
before update on public.tutorials
for each row execute function public.set_updated_at();

drop trigger if exists tutorial_steps_set_updated_at on public.tutorial_steps;
create trigger tutorial_steps_set_updated_at
before update on public.tutorial_steps
for each row execute function public.set_updated_at();

alter table public.tutorials enable row level security;
alter table public.tutorial_steps enable row level security;

-- Tables created through raw SQL need explicit Data API privileges in addition
-- to RLS. Anonymous clients receive no table privileges; authenticated clients
-- are still constrained by every policy below.
revoke all on public.tutorials from anon;
revoke all on public.tutorial_steps from anon;
grant select, insert, update, delete on public.tutorials to authenticated;
grant select, insert, update, delete on public.tutorial_steps to authenticated;

create policy "authenticated users can read published or own tutorials"
on public.tutorials for select
to authenticated
using (visibility = 'published' or owner_id = auth.uid());

create policy "owners create tutorials"
on public.tutorials for insert
to authenticated
with check (owner_id = auth.uid());

create policy "owners update tutorials"
on public.tutorials for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "owners delete tutorials"
on public.tutorials for delete
to authenticated
using (owner_id = auth.uid());

create policy "authenticated users can read visible tutorial steps"
on public.tutorial_steps for select
to authenticated
using (
  exists (
    select 1 from public.tutorials
    where tutorials.id = tutorial_steps.tutorial_id
      and (tutorials.visibility = 'published' or tutorials.owner_id = auth.uid())
  )
);

create policy "owners create tutorial steps"
on public.tutorial_steps for insert
to authenticated
with check (
  exists (
    select 1 from public.tutorials
    where tutorials.id = tutorial_steps.tutorial_id
      and tutorials.owner_id = auth.uid()
  )
);

create policy "owners update tutorial steps"
on public.tutorial_steps for update
to authenticated
using (
  exists (
    select 1 from public.tutorials
    where tutorials.id = tutorial_steps.tutorial_id
      and tutorials.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.tutorials
    where tutorials.id = tutorial_steps.tutorial_id
      and tutorials.owner_id = auth.uid()
  )
);

create policy "owners delete tutorial steps"
on public.tutorial_steps for delete
to authenticated
using (
  exists (
    select 1 from public.tutorials
    where tutorials.id = tutorial_steps.tutorial_id
      and tutorials.owner_id = auth.uid()
  )
);

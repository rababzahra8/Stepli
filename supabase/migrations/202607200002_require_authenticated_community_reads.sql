-- Apply this after 202607200001_user_tutorials.sql in projects where the
-- original migration has already run. Community guides are intentionally not
-- public: a valid Supabase Auth session is required to discover a published
-- guide or read any of its steps.

revoke all on public.tutorials from anon;
revoke all on public.tutorial_steps from anon;
grant select, insert, update, delete on public.tutorials to authenticated;
grant select, insert, update, delete on public.tutorial_steps to authenticated;

drop policy if exists "published tutorials are readable" on public.tutorials;
drop policy if exists "authenticated users can read published or own tutorials" on public.tutorials;

create policy "authenticated users can read published or own tutorials"
on public.tutorials for select
to authenticated
using (visibility = 'published' or owner_id = auth.uid());

drop policy if exists "visible tutorial steps are readable" on public.tutorial_steps;
drop policy if exists "authenticated users can read visible tutorial steps" on public.tutorial_steps;

create policy "authenticated users can read visible tutorial steps"
on public.tutorial_steps for select
to authenticated
using (
  exists (
    select 1
    from public.tutorials
    where tutorials.id = tutorial_steps.tutorial_id
      and (tutorials.visibility = 'published' or tutorials.owner_id = auth.uid())
  )
);

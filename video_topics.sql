-- ============================================================
-- Video topics: one 2-minute talking-head video per student.
-- Each group gets one topic; each member gets their own slice
-- (1-5) of it, with a problem to solve on camera.
--
--   video_topic_slices  the catalogue (seeded from the topics CSV)
--   video_assignments   which student has which topic + slice
--   assign_video_topics educator-only RPC behind the Groups page
--                       "Assign video topics" button
-- ============================================================

create table if not exists public.video_topic_slices (
  id            uuid primary key default gen_random_uuid(),
  course_code   text not null,              -- matches courses.code, e.g. 'PHCH 4112'
  topic_id      text not null,              -- e.g. '4112-H'
  sort_order    integer not null default 0, -- order topics are handed out in
  unit          text,
  group_topic   text not null,
  source        text,                       -- Explainer + bench / Explainer only / Placeholder ...
  explainer     text,
  explainer_url text,                       -- relative to the site root
  lab           text,
  lab_url       text,
  slice         integer not null check (slice between 1 and 9),
  video_topic   text not null,
  problem       text not null,
  active        boolean not null default true, -- false = never handed out
  unique (topic_id, slice)
);

create table if not exists public.video_assignments (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses(id) on delete cascade,
  group_id    uuid references public.project_groups(id) on delete set null,
  student_id  uuid not null references public.profiles(id) on delete cascade,
  topic_id    text not null,
  slice       integer not null,
  assigned_at timestamptz not null default now(),
  unique (course_id, student_id),
  foreign key (topic_id, slice) references public.video_topic_slices(topic_id, slice)
);
create index if not exists video_assignments_group_idx on public.video_assignments(group_id);

alter table public.video_topic_slices enable row level security;
alter table public.video_assignments  enable row level security;

drop policy if exists video_topic_slices_select_authenticated on public.video_topic_slices;
create policy video_topic_slices_select_authenticated on public.video_topic_slices
  for select to authenticated using (true);
drop policy if exists video_topic_slices_write_educator on public.video_topic_slices;
create policy video_topic_slices_write_educator on public.video_topic_slices
  for all to authenticated using (public.is_educator()) with check (public.is_educator());

drop policy if exists video_assignments_select_own_or_educator on public.video_assignments;
create policy video_assignments_select_own_or_educator on public.video_assignments
  for select to authenticated using (student_id = auth.uid() or public.is_educator());
drop policy if exists video_assignments_write_educator on public.video_assignments;
create policy video_assignments_write_educator on public.video_assignments
  for all to authenticated using (public.is_educator()) with check (public.is_educator());

-- Hand out topics and slices for one course.
--   p_reset = false (default): keep existing assignments, drop any for students who have
--     since left that group, then fill in everyone without a slice. Safe to run again
--     after placing stragglers.
--   p_reset = true: wipe the course's assignments and hand everything out from scratch.
-- Each group with members gets the least-used active topic (ties go to topics with a Kompas
-- explainer or lab first, then catalogue order);
-- members get the lowest free slice in joining order. Members beyond the topic's slice
-- count are skipped and reported. The group's topic box (topic_text) is set to the topic.
create or replace function public.assign_video_topics(p_course_id uuid, p_reset boolean default false)
returns json
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_code    text;
  g         record;
  m         record;
  v_topic   text;
  v_slice   integer;
  n_new     integer := 0;
  n_skipped integer := 0;
  n_groups  integer := 0;
begin
  if not public.is_educator() then
    raise exception 'Only educators can assign video topics.';
  end if;
  select code into v_code from public.courses where id = p_course_id;
  if v_code is null then
    raise exception 'Course not found.';
  end if;
  if not exists (select 1 from public.video_topic_slices where course_code = v_code and active) then
    raise exception 'There are no video topics for %.', v_code;
  end if;

  if p_reset then
    delete from public.video_assignments where course_id = p_course_id;
  else
    delete from public.video_assignments a
    where a.course_id = p_course_id
      and not exists (select 1 from public.project_group_members pm
                      where pm.group_id = a.group_id and pm.student_id = a.student_id);
  end if;

  for g in
    select pg.id from public.project_groups pg
    where pg.course_id = p_course_id
      and exists (select 1 from public.project_group_members pm where pm.group_id = pg.id)
    order by pg.group_number
  loop
    n_groups := n_groups + 1;
    v_topic := null;
    select topic_id into v_topic from public.video_assignments where group_id = g.id limit 1;

    if v_topic is null then
      select t.topic_id into v_topic
      from (select topic_id, min(sort_order) as so, bool_or(explainer is not null) as has_kompas
            from public.video_topic_slices
            where course_code = v_code and active
            group by topic_id) t
      left join (select topic_id, count(distinct group_id) as n
                 from public.video_assignments
                 where course_id = p_course_id
                 group by topic_id) u using (topic_id)
      order by coalesce(u.n, 0), t.has_kompas desc, t.so
      limit 1;
    end if;

    for m in
      select pm.student_id from public.project_group_members pm
      where pm.group_id = g.id
        and not exists (select 1 from public.video_assignments a
                        where a.course_id = p_course_id and a.student_id = pm.student_id)
      order by pm.joined_at
    loop
      v_slice := null;
      select s.slice into v_slice
      from public.video_topic_slices s
      where s.topic_id = v_topic
        and not exists (select 1 from public.video_assignments a
                        where a.group_id = g.id and a.slice = s.slice)
      order by s.slice
      limit 1;
      if v_slice is null then
        n_skipped := n_skipped + 1;
        continue;
      end if;
      insert into public.video_assignments (course_id, group_id, student_id, topic_id, slice)
      values (p_course_id, g.id, m.student_id, v_topic, v_slice);
      n_new := n_new + 1;
    end loop;

    update public.project_groups
    set topic_text = v_topic || ' · ' ||
      (select group_topic from public.video_topic_slices where topic_id = v_topic order by slice limit 1)
    where id = g.id;
  end loop;

  return json_build_object('groups', n_groups, 'assigned', n_new, 'skipped', n_skipped);
end;
$$;

revoke all on function public.assign_video_topics(uuid, boolean) from public, anon;
grant execute on function public.assign_video_topics(uuid, boolean) to authenticated;

-- Students can only read their own profile (RLS), so the Groups page showed every
-- classmate as "Student". This returns just the names of group members in one course,
-- and only to someone enrolled in that course (or an educator). No email or matric number.
create or replace function public.course_group_member_names(p_course_id uuid)
returns table (student_id uuid, full_name text)
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $$
  select p.id, p.full_name
  from public.project_groups g
  join public.project_group_members m on m.group_id = g.id
  join public.profiles p on p.id = m.student_id
  where g.course_id = p_course_id
    and (public.is_educator()
         or exists (select 1 from public.enrollments e
                    where e.course_id = p_course_id and e.student_id = auth.uid()));
$$;

revoke all on function public.course_group_member_names(uuid) from public, anon;
grant execute on function public.course_group_member_names(uuid) to authenticated;

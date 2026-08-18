-- Kompas Semester — database schema
-- Run this in your own Supabase project's SQL editor (Database → SQL Editor).
-- Do NOT run this against someone else's project — see README "Getting started".

-- ============================================================
-- TABLES
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  matric_number text,
  full_name text not null,
  email text not null,
  role text not null default 'student', -- 'student' | 'educator'
  pdpa_consent_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  semester text,
  ca_end_date date,
  final_exam_date date,
  study_week_start_date date,
  notebook_url text,
  inova_url text, -- link to your institution's own LMS gradebook, if any
  created_at timestamptz not null default now()
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  week_number integer,
  week_start_date date,
  title text not null,
  tlo text, -- topic learning outcome
  created_at timestamptz not null default now()
);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  name text not null,
  weight numeric not null,
  date date,
  coverage text,
  created_at timestamptz not null default now()
);

create table public.assessment_results (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  score numeric,
  entered_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table public.learning_activities (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  activity_date date not null default current_date,
  activity_type text not null, -- 'practice' | 'notes'
  created_at timestamptz not null default now()
);

create table public.topic_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references public.topics(id) on delete cascade,
  question text not null,
  options jsonb not null, -- array of option strings
  correct_index integer not null,
  created_at timestamptz default now()
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  score integer not null,
  total integer not null,
  attempt_date date not null default current_date,
  created_at timestamptz default now()
);

create table public.student_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  note_date date not null default current_date,
  content text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- HELPER FUNCTION
-- ============================================================

create or replace function public.is_educator()
returns boolean
language sql
stable security definer
set search_path to 'public', 'pg_temp'
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'educator'
  );
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;
alter table public.topics enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_results enable row level security;
alter table public.learning_activities enable row level security;
alter table public.topic_quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.student_notes enable row level security;

-- profiles: a student can see their own row; educators can see everyone's.
-- Self-signup can only ever create a 'student' row (blocks self-promotion to educator).
create policy profiles_select_own_or_educator on public.profiles
  for select using (id = auth.uid() or is_educator());
create policy profiles_insert_own_student on public.profiles
  for insert to authenticated with check (id = auth.uid() and role = 'student');
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid());

-- courses: readable by any signed-in user (needed for the course picker).
create policy courses_select_authenticated on public.courses
  for select to authenticated using (true);

-- enrollments: a student can enroll themselves and see their own enrollments;
-- educators can see everyone's.
create policy enrollments_select_own_or_educator on public.enrollments
  for select using (student_id = auth.uid() or is_educator());
create policy enrollments_insert_own on public.enrollments
  for insert to authenticated with check (student_id = auth.uid());

-- topics / assessments: readable by any signed-in user; writes restricted to educators.
create policy topics_select_authenticated on public.topics
  for select to authenticated using (true);
create policy topics_insert_educator_only on public.topics
  for insert with check (is_educator());
create policy topics_update_educator_only on public.topics
  for update using (is_educator());
create policy topics_delete_educator_only on public.topics
  for delete using (is_educator());

create policy assessments_select_authenticated on public.assessments
  for select to authenticated using (true);

-- assessment_results: students see only their own; only educators can write.
create policy results_select_own_or_educator on public.assessment_results
  for select using (student_id = auth.uid() or is_educator());
create policy results_write_educator_only on public.assessment_results
  for insert with check (is_educator());
create policy results_update_educator_only on public.assessment_results
  for update using (is_educator());

-- learning_activities / quiz_attempts / student_notes: a student can only
-- write and read their own rows; educators can read (never write) everyone's.
create policy activities_select_own_or_educator on public.learning_activities
  for select using (student_id = auth.uid() or is_educator());
create policy activities_insert_own on public.learning_activities
  for insert with check (student_id = auth.uid());

create policy quiz_attempts_select_own on public.quiz_attempts
  for select to authenticated using (student_id = auth.uid() or is_educator());
create policy quiz_attempts_insert_own on public.quiz_attempts
  for insert to authenticated with check (student_id = auth.uid());

create policy student_notes_select_own on public.student_notes
  for select to authenticated using (student_id = auth.uid() or is_educator());
create policy student_notes_insert_own on public.student_notes
  for insert to authenticated with check (student_id = auth.uid());

-- topic_quiz_questions: readable by any signed-in user (needed to render a quiz).
create policy quiz_questions_select on public.topic_quiz_questions
  for select to authenticated using (true);

-- ============================================================
-- AFTER RUNNING THIS FILE
-- ============================================================
-- 1. Create your first educator account: sign up as a student via the app,
--    then in the SQL editor run:
--      update public.profiles set role = 'educator' where email = 'you@example.com';
-- 2. Insert at least one row into `courses` so students have something to enroll in.
-- 3. Supabase Auth → Settings: decide whether "Confirm email" is on. The app
--    handles both cases, but it changes what a new student sees right after signup.
-- 4. Supabase Auth → Settings: consider enabling "leaked password protection".

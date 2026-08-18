# Kompas Semester

A lightweight course companion for university educators — practice quizzes, study notes, and streak tracking that sits *alongside* an institution's official LMS, not instead of it.

Built for a single pharmacy course at a Malaysian university as a self-serve tool for a lecturer with no dedicated dev support. Single static HTML file, Supabase backend, no build step.

## Why this exists

Two real problems drove the design:

1. **A mastery gap between coursework and the final exam.** Trending continuous assessment (CA) results against final exam performance showed a consistent gap — students clearing CA components without the underlying mastery of the course's learning outcomes holding up under final exam conditions. This app exists to close that gap: topic-scoped practice quizzes and notes, tied to the same learning outcomes being examined, give students a way to surface and close gaps in understanding continuously, rather than discovering them at the final exam.
2. **Managing a large batch of students fairly.** A single educator responsible for a large cohort can't tell who's quietly struggling until CA or exam results are already in. This app surfaces per-student engagement and topic-level performance as it happens, so an educator can spot students who need help early — rather than attention only going to whoever happens to ask for it, while everyone else is assumed to be fine.

## Features

- **Self-service signup** — students create their own account and pick their course(s); no bulk roster upload required from the educator.
- **Practice quizzes** — topic-scoped multiple choice, auto-graded, grounded in the course's real study guides rather than generic questions.
- **Study notes** — free-text notes per topic, kept for the student's own revision.
- **Streak tracking** — a 28-day activity view built from real submissions, not honour-system check-ins.
- **Educator roster view** — enrollment, streaks, and last-active date per student, with a link out to the institution's own gradebook for actual scores.
- **Multi-course landing page** — both roles land on "My Courses" first, so the same app can hold more than one course.

## Privacy & data handling

This app collects personal data (name, email, quiz/notes activity) directly from the student, with an explicit consent step at signup — the student sees a plain-language notice covering what's collected, why, where it's hosted, and how to request deletion, and has to actively tick a box before an account is created. No institutional student ID is required to sign up.

This was built with Malaysia's Personal Data Protection Act 2010 (as amended in 2024) in mind. If you're deploying this for your own institution, check what data protection law applies where you are — requirements differ, and this repo isn't legal advice.

## Tech stack

- **Frontend:** single-file static HTML/CSS/vanilla JS — no framework, no build step
- **Backend:** [Supabase](https://supabase.com) (Postgres, Auth, Row-Level Security)
- **Hosting:** [Vercel](https://vercel.com)
- **Fonts:** Fraunces (display), IBM Plex Sans/Mono (body)

## Architecture

Every table is scoped with Postgres Row-Level Security so a student can only ever read or write their own rows; an `is_educator()` helper function grants educators broader read access. There is no server-side application code — the browser talks to Supabase directly, and RLS is the entire security boundary. See `schema.sql` for the full policy set.

Signup flow: create account → read consent notice → tick checkbox (blocks submit until checked) → pick course(s) → RLS-gated inserts create the profile and enrollment rows.

## Getting started (run your own copy)

This repo points at a specific Supabase project by design — to run your own instance, don't reuse those credentials. Set up your own:

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run `schema.sql`** in your project's SQL Editor (Database → SQL Editor). It creates all tables, the `is_educator()` function, and every RLS policy.
3. **Get your API credentials**: Project Settings → API → copy the Project URL and the `anon` public key.
4. **Edit `index.html`**: replace the `SUPABASE_URL` and `SUPABASE_ANON_KEY` constants near the top of the `<script>` block with your own values.
5. **Create your first educator account**: sign up through the app as a student, then in the SQL Editor run:
   ```sql
   update public.profiles set role = 'educator' where email = 'you@example.com';
   ```
   (Self-signup only ever creates student accounts, by design — see `schema.sql`'s RLS policy on `profiles`.)
6. **Add a course**: insert at least one row into `courses` so students have something to enroll in.
7. **Check your Auth settings**: Supabase Auth → Settings → decide whether "Confirm email" is on. The app handles both cases, but it changes what a new student sees right after signup.
8. **Deploy**: push this repo to GitHub, then import it in Vercel. No framework preset needed — it's a static file. Point a custom domain at it if you like.

## Project structure

```
index.html    — the entire app (HTML, CSS, and JS in one file)
schema.sql    — database schema, helper function, and RLS policies
README.md     — this file
```

## Known limitations

- Single-educator assumption: `courses` has no `educator_id` yet, so any educator account sees every course. Fine for one lecturer, needs a scoping column before a second educator joins.
- No in-app quiz question editor — question bank edits are direct table edits.
- Course enrollment is currently open to any signed-up user; there's no per-course invite/approval gate.

## License

MIT — use it, fork it, adapt it for your own course.

## Author

Built by [Auf](https://aufthority.com) under the Aufthority label.

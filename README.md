# Kompas Semester

A lightweight course companion for university educators — practice quizzes, study notes, and streak tracking that sits *alongside* an institution's official LMS, not instead of it.

Built for a single pharmacy course at a Malaysian university as a self-serve tool for a lecturer with no dedicated dev support. Single static HTML file, Supabase backend, no build step. Installable to a phone's home screen as a lightweight app (PWA).

## Why this exists

Two real problems drove the design:

1. **A mastery gap between coursework and the final exam.** Trending continuous assessment (CA) results against final exam performance showed a consistent gap — students clearing CA components without the underlying mastery of the course's learning outcomes holding up under final exam conditions. This app exists to close that gap: topic-scoped practice quizzes and notes, tied to the same learning outcomes being examined, give students a way to surface and close gaps in understanding continuously, rather than discovering them at the final exam.
2. **Managing a large batch of students fairly.** A single educator responsible for a large cohort can't tell who's quietly struggling until CA or exam results are already in. This app surfaces per-student engagement and topic-level performance as it happens, so an educator can spot students who need help early — rather than attention only going to whoever happens to ask for it, while everyone else is assumed to be fine.

## Design philosophy

A few product principles guided decisions throughout the app, not just at launch — they're documented here because they shaped real trade-offs (see [Design decisions & trade-offs](#design-decisions--trade-offs) below):

- **No-shaming.** Indicators about student behaviour are meant to inform an educator's outreach, not to punish or humiliate a student. Where a punitive-feeling mechanic was proposed, it was either reframed or declined.
- **Achievement should never go backwards.** A badge, once earned, reflects effort a student genuinely put in. It should not be clawed back by a bad week — that would punish exactly the kind of life disruption (illness, family emergency, exam clashes elsewhere) the app isn't in a position to judge.
- **Status and achievement are two different signals, kept in two different places.** "Are you keeping up right now?" (a status flag) and "What have you accumulated so far?" (a badge) answer different questions and are computed differently on purpose — see the Ghoster/Voyager discussion below.
- **A deterrent should be justified by what it actually does, not oversold as something it doesn't.** A UI restriction that's trivial to work around isn't a security feature — but it can still be the right call for a different, honestly-stated reason. See the Notes paste-block below.
- **Logistics tasks shouldn't borrow the app's motivational framing.** Not everything an educator needs help coordinating is a learning behaviour worth tracking. Presentation groups (below) are deliberately built as plain utility — no points, no streaks, no achievement language — so they don't compete with or dilute the SEE → ACT → REPEAT signal the rest of the app is built around.

## Features

- **Self-service signup** — students create their own account and pick their course(s); no bulk roster upload required from the educator.
- **Practice quizzes** — topic-scoped multiple choice, auto-graded, grounded in the course's real study guides rather than generic questions.
- **Study notes, typed rather than pasted** — free-text notes per topic, kept for the student's own revision. Pasting and drag-dropping text into the notes box is intentionally blocked; see [Notes: why paste is blocked](#notes-why-paste-is-blocked) for the reasoning.
- **Streak tracking** — a 28-day activity view built from real submissions, not honour-system check-ins.
- **Achievement badges** — a four-tier system (Pathfinder → Wayfinder → Navigator → Voyager) driven by a cumulative engagement score that only ever goes up; see [Achievement badges](#achievement-badges) below.
- **Ghoster indicator** — a separate, display-only signal for a student who's gone quiet, layered on top of (not blended into) their badge tier. Kept deliberately apart from the score — see [Design decisions & trade-offs](#design-decisions--trade-offs).
- **Presentation groups** — self-service group formation for assignments and presentations: students create or join their own groups (up to a per-course max size), while the educator's job is limited to typing in a topic per group and locking formation once it settles. See [Presentation groups](#presentation-groups) below.
- **Educator roster view** — enrollment, streaks, and last-active date per student, with a link out to the institution's own gradebook for actual scores.
- **Multi-course landing page** — both roles land on "My Courses" first, so the same app can hold more than one course.
- **Installable home-screen app** — an in-app banner offers a one-tap install on Android/Chrome/desktop, or shows "Add to Home Screen" instructions on iOS Safari, so the app can open full-screen like a native app without going through an app store.

## Privacy & data handling

This app collects personal data (name, email, quiz/notes activity) directly from the student, with an explicit consent step at signup — the student sees a plain-language notice covering what's collected, why, where it's hosted, and how to request deletion, and has to actively tick a box before an account is created. No institutional student ID is required to sign up.

Transactional email (signup confirmation, password reset, email change) is sent through a custom SMTP provider ([Resend](https://resend.com)) rather than Supabase's shared default mailer, using a dedicated sending subdomain (`mail.aufthority.com`) so deliverability and rate limits are under this project's control rather than shared with every other app on Supabase's default sender. If you're deploying your own copy and your data protection obligations require disclosing every processor that touches personal data (an email address, in this case), your email provider is one to name explicitly alongside your database host.

This was built with Malaysia's Personal Data Protection Act 2010 (as amended in 2024) in mind. If you're deploying this for your own institution, check what data protection law applies where you are — requirements differ, and this repo isn't legal advice.

## Tech stack

- **Frontend:** single-file static HTML/CSS/vanilla JS — no framework, no build step
- **Backend:** [Supabase](https://supabase.com) (Postgres, Auth, Row-Level Security, SQL views, Postgres functions)
- **Email:** [Resend](https://resend.com) as custom SMTP for Supabase Auth's transactional email (signup confirmation, password reset)
- **Hosting:** [Vercel](https://vercel.com)
- **Fonts:** Fraunces (display), IBM Plex Sans/Mono (body)
- **PWA:** a web app manifest and a minimal pass-through service worker enable "Add to Home Screen" / native install prompts; neither adds offline caching, so the app always talks to Supabase live

## Architecture

Every table is scoped with Postgres Row-Level Security so a student can only ever read or write their own rows; an `is_educator()` helper function grants educators broader read access. There is no server-side application code — the browser talks to Supabase directly, and RLS is the entire security boundary. See `schema.sql` for the full policy set.

Signup flow: create account → read consent notice → tick checkbox (blocks submit until checked) → pick course(s) → RLS-gated inserts create the profile and enrollment rows. The confirmation email for this flow is sent via the custom SMTP provider described in [Privacy & data handling](#privacy--data-handling), not Supabase's shared default mailer — this matters operationally, not just for branding: the shared default mailer is rate-limited too low to handle a cohort's worth of near-simultaneous signups on the first day of a pilot.

Install flow: `index.html` registers `service-worker.js` on load and links `manifest.json` in `<head>`. On Chrome/Android/desktop, the browser's `beforeinstallprompt` event is captured and surfaced as an in-app "Install" banner; accepting it triggers the browser's native install dialog. iOS Safari has no equivalent API, so the same banner instead shows manual "tap Share → Add to Home Screen" instructions. A dismissal is remembered in `localStorage` for 14 days before the banner reappears.

**Scoring lives in the database, not the client.** This is a deliberate boundary: the browser never computes or reports a score — it only writes raw events (quiz attempts, notes saved, prompt copied/opened), and Postgres views turn those into points. A client-side score would only ever be as trustworthy as the browser sending it; keeping the arithmetic behind RLS-protected views means a student's own client has no path to inflate their own number. The same boundary principle is applied to group formation below, using Postgres functions rather than views since group actions are writes, not aggregations.

The scoring pipeline is three chained views:

1. **Raw event stream** — unions quiz attempts, notes, and lightweight engagement events (prompt copied, guide opened) into one per-topic timeline per student.
2. **Per-topic score** — for each topic: a quiz attempt contributes a flat amount plus a bonus scaled by score; a note contributes a flat amount plus a bonus scaled by length (capped, so padding a note with filler stops paying past a point); copying a prompt or opening the weekly guide each contribute a small flat amount, counted once per topic rather than per click. The topic's point total is then scaled by a **timing multiplier** based on how promptly the topic was first touched relative to the week it opened (full credit within the first couple of days, tapering for topics started later in the week) — this rewards keeping pace without hard-blocking a late start.
3. **Cumulative score** — the per-topic totals are summed per student, per course. This number only ever increases.

### Achievement badges

Badge tier is a threshold read on the cumulative score above — not a separate calculation:

| Tier | Cumulative score |
|---|---|
| Pathfinder | 0+ |
| Wayfinder | 200+ |
| Navigator | 450+ |
| Voyager | 750+ |

Because the underlying score is monotonic (see above), a badge, once reached, is never lost. The thresholds themselves weren't picked arbitrarily — they were sanity-checked with a disposable engagement simulator (topic count, timing multiplier, quiz/notes/prompt-interaction rates as adjustable inputs) before being locked in, aiming for a curve where bare-minimum engagement plateaus well short of the top tier, full and prompt engagement clears it comfortably, and the same full effort landing consistently late in the week costs close to a whole tier — so the multiplier is felt, without being punitive enough to make a genuinely busy week feel unrecoverable.

### Notes: why paste is blocked

The notes textarea blocks paste and drag-and-drop text input. The first framing considered for this — stopping students from copying an AI or classmate's answer in verbatim — didn't hold up: paste-blocking is trivial to defeat (read the source, retype it by hand) and would also punish legitimate uses like drafting in another app or using dictation/accessibility tools. As a security control, it's not one.

The restriction is kept anyway, under a different and more defensible justification: the *generation effect* — actively producing an answer from memory measurably improves retention in a way that transcribing correct text, even correct text a student wrote elsewhere, does not. Under this framing the block still does its job even against a student who retypes pasted content from another window, because the act of retyping is itself the mechanism being encouraged, not an inconvenience being imposed. Right-click "Paste" is left visible in the context menu rather than also suppressed — selecting it still fires the blocked event, so hiding the menu item too would have broken native spellcheck and text selection for no additional effect.

This is documented here, rather than left as an unexplained restriction, so it's described honestly in any future write-up: a UX nudge grounded in learning-science, not an integrity gate.

### Presentation groups

Group formation for assignments and presentations is a task that recurs every cohort, indefinitely — unlike a one-off admin chore, that made it worth building in-app rather than outsourcing to a shared spreadsheet each semester. The trade-off considered explicitly before building this: a protected-cell spreadsheet has near-zero setup cost but a small recurring admin cost every batch (recreating the sheet, resetting protection, chasing double-entries); building it in-app is a real cost once, then near-zero marginal cost per future cohort, because `course_id` scoping means a new batch just reuses the same tables and UI with no re-setup.

The feature is intentionally narrow in scope, matching what the educator actually asked for: **assigning a topic per group, not managing who's in which group.** Students self-organize; the educator's only required action is typing a topic into each group and, when ready, locking formation.

Design decisions and why:

- **Group creation and joining are enforced server-side**, via two Postgres functions (`create_project_group`, `join_project_group`) rather than plain table inserts. This closes the same trust gap as the scoring pipeline above: a student's browser has no path to join a full group, join two groups in the same course, or create a new group after formation is locked, because those checks live behind `SECURITY DEFINER` functions rather than being enforced only by client-side JavaScript that a student could simply skip.
- **Locking requires a confirmation step** before it takes effect, since it immediately removes every student's ability to join, switch, or leave a group. The lock toggle itself is a plain educator-only column on `courses` (`group_formation_locked`) rather than a separate table, kept simple because it's a single on/off setting per course.
- **The educator can always override**, lock or not — moving or removing a student from a group is never blocked, via a separate `move_student_to_group()` function that bypasses the capacity and lock checks a student's own actions are subject to. Students, by contrast, are blocked from leaving a group once locked (enforced by a `BEFORE DELETE` trigger on the membership table), so that lock consistently means "settled" from the student's side while remaining fully adjustable from the educator's side.
- **Topics are free text, not a fixed list.** An educator picks presentation topics per cohort, and they change every batch — a fixed `topics` table would need re-seeding every semester for no real benefit over a plain text field the educator edits directly on the group.
- **No hard block on single-member groups at lock time.** A group of one might be a legitimate individual project, not a mistake. Instead of blocking it, the roster view flags any group at or below one member so the educator can decide — this mirrors the No-shaming principle above: surface the information, don't assume it's wrong on the educator's behalf.
- **No automatic balancing or capacity solver.** For cohort sizes in the tens, not hundreds, an educator manually nudging a couple of stragglers before locking is simpler and more transparent than an algorithm silently redistributing students.

## Design decisions & trade-offs

A couple of judgment calls are worth documenting explicitly, since the reasoning is as much a part of the design as the resulting code:

- **A "maintain 650–750" consistency mechanic was proposed and declined.** The idea was to lower the Voyager threshold to 650 and treat 650–750 as a band a student had to actively stay inside. This doesn't work with a monotonic score: once a student passes 650 the score can't come back down into the band, so there's no mechanism to ever fall out of "maintaining" it — the change would only have made Voyager permanently easier to reach, not created a maintenance requirement. A true rolling-window consistency mechanic was discussed as an alternative and set aside: the Streak tab already exists specifically to answer "am I keeping this up," and a second, badge-level consistency signal risks contradicting it (a Voyager badge sitting next to a broken streak, saying two different things at once). The recommendation, if consistency needs more emphasis later, is to strengthen the Streak tab itself rather than duplicate its job inside the badge tiers.
- **Copy/Open engagement scoring is a known open trade-off.** Copying a study prompt or opening the weekly guide counts toward a topic's score, and also counts toward *when* that topic was first touched for timing-multiplier purposes. Because the multiplier keys off the earliest interaction of any kind, a student can in principle open or copy a prompt on day one purely to lock in full timing credit, then complete the actual quiz or notes at leisure weeks later, still at full credit. This wasn't an intended shortcut — it's a side effect of treating all engagement types as equivalent for timing purposes — and is currently left as-is pending a decision on whether to exclude Copy/Open from the timing calculation while still letting them count toward points.
- **Ghoster is a status flag, not a badge modifier, on purpose.** An inactivity indicator is computed independently from the cumulative score and displayed as an overlay, rather than being subtracted from points or blended into the badge tier. This keeps "what have you earned" and "are you currently disengaged" answerable independently and without contradiction, and means a rough patch can never erase progress already made.

## Getting started (run your own copy)

This repo points at a specific Supabase project by design — to run your own instance, don't reuse those credentials. Set up your own:

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run `schema.sql`** in your project's SQL Editor (Database → SQL Editor). It creates all tables, the `is_educator()` function, the scoring views described in [Architecture](#architecture), the presentation-groups tables and functions described in [Presentation groups](#presentation-groups), and every RLS policy.
3. **Get your API credentials**: Project Settings → API → copy the Project URL and the `anon` public key.
4. **Edit `index.html`**: replace the `SUPABASE_URL` and `SUPABASE_ANON_KEY` constants near the top of the `<script>` block with your own values.
5. **Create your first educator account**: sign up through the app as a student, then in the SQL Editor run:
   ```sql
   update public.profiles set role = 'educator' where email = 'you@example.com';
   ```
   (Self-signup only ever creates student accounts, by design — see `schema.sql`'s RLS policy on `profiles`.)
6. **Add a course**: insert at least one row into `courses` so students have something to enroll in.
7. **Set up a custom SMTP provider before real students sign up.** Supabase's default mailer is rate-limited for testing, not for a cohort's worth of near-simultaneous signups — see [Architecture](#architecture) above. [Resend](https://resend.com) has the simplest setup path of the providers Supabase supports (verify a sending domain, then either its one-click Supabase integration or manual SMTP credentials under Authentication → Emails → SMTP Settings), with a permanent free tier comfortably covering a few hundred students. Also raise Authentication → Rate Limits for email sending and for sign-ups/sign-ins from their defaults — the defaults are tuned for steady traffic, not a whole cohort signing up in the same session, especially if they're likely to share a campus IP address.
8. **Check your Auth settings**: Supabase Auth → Settings → decide whether "Confirm email" is on. The app handles both cases, but it changes what a new student sees right after signup.
9. **Revisit the badge thresholds for your own cohort size and topic count**: the values in the [Achievement badges](#achievement-badges) table were tuned for 13–14 topics per course. A course with a very different topic count should re-run the same kind of sanity check (even a rough spreadsheet model of best-case/worst-case engagement) before reusing these numbers as-is.
10. **Revisit the group max size for your own assignment structure**: `courses.group_max_size` defaults to 5. Change it per course to whatever your assignment actually calls for — this is a plain column, not a hardcoded constant, specifically so it doesn't need a code change to adjust.
11. **Rebrand the icons (optional)**: `manifest.json`, the favicon, and the install banner all reference `icon-192.png` / `icon-512.png` (and their `-maskable` variants for Android's circular crop). Swap these four PNGs for your own artwork if you're forking this for a different course or institution, and update `name`/`short_name`/`theme_color` in `manifest.json` to match.
12. **Deploy**: push this repo to GitHub, then import it in Vercel. No framework preset needed — it's a static site. **All files must sit in the repo root** (not a subfolder) — `manifest.json`, `service-worker.js`, and the icon PNGs are fetched by absolute path (`/manifest.json`, `/icon-192.png`, etc.) alongside `index.html`. Point a custom domain at it if you like.

## Project structure

```
index.html               — the entire app (HTML, CSS, and JS in one file)
schema.sql                — database schema, helper function, scoring views, presentation-groups tables/functions, and RLS policies
manifest.json              — PWA metadata (name, colors, icons, display mode)
service-worker.js          — minimal pass-through service worker (required for installability; no offline caching)
icon-192.png                — app icon, 192×192, used by the manifest and install banner
icon-512.png                — app icon, 512×512, used by the manifest
icon-192-maskable.png       — 192×192 icon with safe-zone padding for Android's circular icon mask
icon-512-maskable.png       — 512×512 icon with safe-zone padding for Android's circular icon mask
README.md                  — this file
```

## Known limitations

- Single-educator assumption: `courses` has no `educator_id` yet, so any educator account sees every course. Fine for one lecturer, needs a scoping column before a second educator joins.
- No in-app quiz question editor — question bank edits are direct table edits.
- Course enrollment is currently open to any signed-up user; there's no per-course invite/approval gate.
- No automatic install on iOS: Safari doesn't expose an install-prompt API, so "Add to Home Screen" on iPhone/iPad is always a manual step guided by the in-app banner, not a one-tap install like on Android/Chrome.
- The service worker does not cache anything — there is currently no offline mode. It exists solely to satisfy Chrome/Android's installability requirement.
- Copy/Open engagement events can act as a "clock-stopper" for the timing multiplier (see [Design decisions & trade-offs](#design-decisions--trade-offs)) — flagged, not yet resolved.
- Moving a student between presentation groups is currently two manual steps for the educator (remove from the old group, have them rejoin the new one) rather than a single action. The underlying `move_student_to_group()` database function already supports a one-step move; it just isn't wired to a UI control yet.
- Presentation-group topics allow duplicates across groups by design (a free-text field, not a constrained list) — there's no warning if two groups end up with the same topic, since this is left to educator discretion rather than enforced.

## License

MIT — use it, fork it, adapt it for your own course.

## Author

Built by [Auf](https://aufthority.com) under the Aufthority label.

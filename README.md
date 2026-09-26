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
- **A role a user claims about themselves is not a role the system should trust.** Nowhere in the app can a person self-declare "I'm an educator" — not at signup, not through a separate login screen. See [Educator role assignment](#educator-role-assignment) below for why this ruled out an otherwise-tempting design (a separate educator login page).

## Features

- **Self-service signup** — students create their own account and pick their course(s); no bulk roster upload required from the educator.
- **Practice quizzes** — topic-scoped multiple choice, auto-graded, grounded in the course's real study guides rather than generic questions. Every week's topic stays open, so past weeks remain available for revision.
- **Study notes, typed rather than pasted** — free-text notes per topic, kept for the student's own revision. Pasting and drag-dropping text into the notes box is intentionally blocked; see [Notes: why paste is blocked](#notes-why-paste-is-blocked) for the reasoning.
- **Streak tracking** — a 28-day activity view built from real submissions, not honour-system check-ins.
- **Achievement badges** — a four-tier system (Pathfinder → Wayfinder → Navigator → Voyager) driven by a cumulative engagement score, with thresholds set as a share of each course's maximum possible points. The badge card also shows a one-line weekly target ("Full points this week: …") with the student's progress on it. See [Achievement badges](#achievement-badges) below.
- **Ghoster indicator** — a separate, display-only signal for a student who's gone quiet, layered on top of (not blended into) their badge tier. Kept deliberately apart from the score — see [Design decisions & trade-offs](#design-decisions--trade-offs).
- **Presentation groups** — self-service group formation for assignments and presentations: students create or join their own groups (up to a per-course max size), while the educator's job is limited to typing in a topic per group and locking formation once it settles. See [Presentation groups](#presentation-groups) below.
- **Account page** — a single place (behind an account icon in the topbar) to see your own name/email/role, change your password, read about the app and its builder, and sign out. Replaces what used to be a bare "Sign out" button. See [Account page & password recovery](#account-page--password-recovery) below.
- **Forgot-password recovery** — a student or educator locked out of their account can request a reset link from the login screen, without needing the educator to intervene manually.
- **Server-gated educator role** — an educator account can only ever be created by an existing educator adding an email to an allowlist beforehand; there is no signup path, screen, or toggle a student could use to grant themselves the role. See [Educator role assignment](#educator-role-assignment) below.
- **Educator Students page** — three summary cards (needs a check-in, haven't started, badge-tier breakdown) that double as roster filters, and per-student points, first-attempt quiz average, notes count, and last-active date, with a link out to the institution's own gradebook for actual marks. See [Educator Students page & nudges](#educator-students-page--nudges) below.
- **Email nudges** — one button sends a warm, bilingual (English / Bahasa Malaysia) email to every student in the "needs a check-in" or "haven't started" list, at most once per student per week.
- **Multi-course landing page** — both roles land on "My Courses" first, so the same app can hold more than one course.
- **Installable home-screen app** — an in-app banner offers a one-tap install on Android/Chrome/desktop, or shows "Add to Home Screen" instructions on iOS Safari, so the app can open full-screen like a native app without going through an app store.

## Privacy & data handling

This app collects personal data (name, email, quiz/notes activity) directly from the student, with an explicit consent step at signup — the student sees a plain-language notice covering what's collected, why, where it's hosted, and how to request deletion, and has to actively tick a box before an account is created. No institutional student ID is required to sign up.

Transactional email (signup confirmation, password reset, email change) and educator-triggered nudge emails are sent through [Resend](https://resend.com) rather than Supabase's shared default mailer, using a dedicated sending subdomain (`mail.aufthority.com`) so deliverability and rate limits are under this project's control rather than shared with every other app on Supabase's default sender. If you're deploying your own copy and your data protection obligations require disclosing every processor that touches personal data (an email address, in this case), your email provider is one to name explicitly alongside your database host.

This was built with Malaysia's Personal Data Protection Act 2010 (as amended in 2024) in mind. If you're deploying this for your own institution, check what data protection law applies where you are — requirements differ, and this repo isn't legal advice.

## Tech stack

- **Frontend:** single-file static HTML/CSS/vanilla JS — no framework, no build step
- **Backend:** [Supabase](https://supabase.com) (Postgres, Auth, Row-Level Security, SQL views, Postgres functions)
- **Email:** [Resend](https://resend.com) — as custom SMTP for Supabase Auth's transactional email (signup confirmation, password reset), and through its API for nudge emails
- **Server-side functions:** Supabase Edge Functions (`send-nudges`, `delete-student`) for the few actions that need a secret or admin rights the browser must never hold
- **Hosting:** [Vercel](https://vercel.com)
- **Fonts:** Fraunces (display), IBM Plex Sans/Mono (body)
- **PWA:** a web app manifest and a minimal pass-through service worker enable "Add to Home Screen" / native install prompts; neither adds offline caching, so the app always talks to Supabase live

## Architecture

Every table is scoped with Postgres Row-Level Security so a student can only ever read or write their own rows; an `is_educator()` helper function grants educators broader read access. The browser talks to Supabase directly, and RLS is the main security boundary. The only server-side code is two small Edge Functions, used where an action needs something the browser must never hold: `delete-student` (needs admin rights to remove a login) and `send-nudges` (needs the Resend API key). Both re-check that the caller is an educator on the server rather than trusting the page. See `schema.sql` for the full policy set.

Signup flow: create account → read consent notice → tick checkbox (blocks submit until checked) → pick course(s) → RLS-gated inserts create the profile and enrollment rows. The confirmation email for this flow is sent via the custom SMTP provider described in [Privacy & data handling](#privacy--data-handling), not Supabase's shared default mailer — this matters operationally, not just for branding: the shared default mailer is rate-limited too low to handle a cohort's worth of near-simultaneous signups on the first day of a pilot.

Install flow: `index.html` registers `service-worker.js` on load and links `manifest.json` in `<head>`. On Chrome/Android/desktop, the browser's `beforeinstallprompt` event is captured and surfaced as an in-app "Install" banner; accepting it triggers the browser's native install dialog. iOS Safari has no equivalent API, so the same banner instead shows manual "tap Share → Add to Home Screen" instructions. A dismissal is remembered in `localStorage` for 14 days before the banner reappears.

**Scoring lives in the database, not the client.** This is a deliberate boundary: the browser never computes or reports a score — it only writes raw events (quiz attempts, notes saved, prompt copied/opened), and Postgres views turn those into points. A client-side score would only ever be as trustworthy as the browser sending it; keeping the arithmetic behind RLS-protected views means a student's own client has no path to inflate their own number. The same boundary principle is applied to group formation below, using Postgres functions rather than views since group actions are writes, not aggregations — and again to educator role assignment, where the decision of "who becomes an educator" is made by a server-side trigger, never by anything the client sends.

The scoring pipeline is three chained views:

1. **Raw event stream** — unions quiz attempts, notes, and lightweight engagement events (prompt copied, guide opened) into one per-topic timeline per student.
2. **Per-topic score** — each topic is worth up to 65 points:

   | Action | Points |
   |---|---|
   | Take the practice quiz | 10 |
   | Quiz score (first attempt) | up to 15 |
   | Write a note | 10 |
   | Note length | up to 15 (full at 150 words; padding past that doesn't pay) |
   | Copy a study prompt | 8 |
   | Open the weekly guide | 7 |

   Copying and opening count once per topic, not per click. The topic's total is then scaled by a **timing multiplier**: full credit if the student first takes the quiz or writes a note within 7 days of the week opening, ×0.8 after that. This rewards keeping pace without making a late start feel unrecoverable.
3. **Cumulative score** — the per-topic totals are summed per student, per course.

A few rules inside step 2 exist to close specific loopholes or unfairness; each is there for a reason:

- **The timing clock starts at a quiz or a note, not a click.** Opening a guide or copying a prompt still earns its points, but no longer counts as "starting" the topic. Otherwise a student could open a guide on day one, lock in full timing credit, and do the real work weeks later. (If a student has only clicked so far, the click is used, so doing the quiz later can never lower their points.)
- **Late sign-ups aren't penalised.** A student's first week is measured from the later of the week's start and the day they enrolled. In the first pilot, only 3 of 55 students got full credit for Week 1 under the old rule — mostly because they'd signed up after the week had begun, not because they were slow.
- **Future weeks count only once their week begins.** All topics stay open for practice, and work done early isn't lost — it counts, at full credit, the day the week opens. This stops the top badge being earned in a single evening by working through every future topic at once.
- **The quiz score uses the first attempt.** Correct answers are shown after submitting, so a straight retake would score close to 100% without saying anything about understanding. Retakes remain useful practice; they just don't raise the score.
- **Dates are counted in Malaysia time.**

### Achievement badges

Badge tier is a threshold read on the cumulative score above — not a separate calculation. Thresholds are set as a share of each course's **maximum possible points** over the semester (65 per topic that has quiz questions, 40 per topic without), so the same rule applies to every course regardless of how many topics or quizzes it has:

| Tier | Share of course maximum | Example: 12 quiz topics + 2 without (860 max) |
|---|---|---|
| Pathfinder | 0% | 0+ |
| Wayfinder | 25% | 215+ |
| Navigator | 55% | 473+ |
| Voyager | 85% | 731+ |

These are computed by the `course_score_max` and `course_badge_thresholds` views, so a course's thresholds rise automatically when quiz questions are added to more topics. Fixed point values (the original 200/450/750) were dropped because they couldn't be fair across courses of different sizes: in a course with quizzes on only 8 of 14 topics, Voyager needed 99% of everything possible.

Under a fixed set of rules the score only ever goes up, so a badge, once reached, is not lost to a bad week. The one exception is a deliberate change to the rules themselves: because points are recalculated from raw activity every time rather than stored, a rule change re-scores everyone. That happened once, on 26 September 2026, when the rules above replaced the originals. No student dropped a tier, since everyone was still Pathfinder at the time. Any future rule change should be checked the same way before it goes live.

The original thresholds were sanity-checked with a disposable engagement simulator, aiming for a curve where bare-minimum engagement plateaus well short of the top tier and full, prompt engagement clears it comfortably. The percentage thresholds keep roughly the same shape: for a 14-topic course they land within about 20 points of the originals.

**What a student needs to do for full points each week** — open the guide, copy a prompt, take the quiz, and write a note of at least 150 words from memory, starting with the quiz or note within 7 days of the week opening. The badge card spells this out as a single line with ticks and a live word count, because nothing in the rules is useful if students don't know them: in the first pilot, the average note in Week 2 was 30 words, earning about half of what a 150-word note would.

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

### Educator Students page & nudges

The Students page is built to answer one question quickly: *who needs my attention today?* Space at the top of the roster is tight, so it was limited deliberately to three cards, each answering a different question:

- **Needs a check-in** — students who were active before but have been quiet for more than 5 working days (the same rule as the student-side Ghoster flag).
- **Haven't started** — enrolled students with no activity at all in this course yet.
- **Badge tiers** — how the cohort is spread across Pathfinder → Voyager.

Each card, and each segment of the tier bar, filters the roster below it; the search box still works inside a filter. Two other cards were considered and dropped. A "may need mastery support" card felt like a second version of "needs a check-in". A "% active this week" card was close to the mirror image of the check-in count and would have said the same thing twice.

Each student row shows **points**, **quiz average**, **notes count** and **last active**. These replaced the streak count, which added little once the "working days quiet" tag existed. Points and quiz average are shown together on purpose. Points measure effort, and can be raised by clicks. The quiz average (first attempt per topic, matching the scoring rule) measures understanding. High points with a low quiz average is the student worth a conversation; low points with a high quiz average usually isn't urgent. Showing points alone would hide exactly the coursework-vs-exam gap this app exists to catch.

**Nudges.** When the "needs a check-in" or "haven't started" filter is on, a Nudge button emails every student in that list at once, after one confirmation. Design decisions:

- **Email, not push notifications.** Email reuses the Resend setup that already exists. Push would need a real service worker with push handling, per-student subscriptions, and a separate sender, and it still doesn't reliably reach iPhone users. Push was set aside as a separate, larger feature rather than bundled in here.
- **Two different emails.** "Needs a check-in" gets a "we miss you" email; "haven't started" gets a "your first step" email. The check-in email says "since you last opened the app", which would be wrong for someone who never has. Both are bilingual (English, then Bahasa Malaysia) and written to the No-shaming principle — "we're here to help, not to judge", never "you are falling behind".
- **At most one nudge per student per week, per course**, across both emails, enforced in the database by `claim_nudges()` under a per-course lock, so a double-click or a second tab can't send twice. Anyone already nudged is skipped and the result says so ("Nudged 5 of 7, 2 already reached this week").
- **The server decides who gets the email**, not the page. `send-nudges` re-derives the list from `course_student_signals()` rather than trusting a list of students sent by the browser.
- **Every nudge is logged** in a `nudges` table (student, course, sender, reason, time), which is both the throttle and a record if a student later says no one told them. If an email fails to send, its log row is removed so it can be retried.
- **Replies go to the lecturer**, not a no-reply inbox, because both emails invite the student to get in touch.

### Educator role assignment

The natural-seeming design here — a separate "Educator / Admin" login screen — was considered and rejected. The reasoning: a second screen only changes what a person clicks, not what the system is willing to trust. If an educator-signup path lets anyone tick "I'm an educator," a student who knows that screen exists can tick the same box. Splitting the UI doesn't close that gap; it just moves the guessable part somewhere else. This mattered concretely here because student email addresses (`@kpju.edu.my`) and staff email addresses aren't distinguishable by pattern, so nothing about an email address itself can be trusted to imply a role either.

The actual fix: a role is never something a signing-up user can declare, communicate, or influence, regardless of which screen or form they use. There is exactly one signup form for everyone. Whether the resulting account is a student or an educator is decided entirely server-side, inside the same `handle_new_user()` trigger that already creates the profile row, by checking the new account's email (case-insensitively) against a small `educator_allowlist` table. If it matches, the profile is created with `role = 'educator'`; otherwise `role = 'student'`, same as before this feature existed.

Practically, this means becoming an educator is a two-step, adult-in-the-room process: an existing educator adds an email to `educator_allowlist` *before* that person signs up (via Supabase's Table Editor — no code, no new UI needed for this), and then that person just signs up normally through the same form as any student. Nothing in the client ever reads or writes that table, so a student inspecting the page's network traffic or JavaScript gains no information about who's on the list or how to get on it.

## Account page & password recovery

Three related but distinct concerns live here, each solving a different failure mode:

- **Change password (logged in).** A direct password update with no re-entry of the current password first. This was a deliberate trade-off, not an oversight: re-entering the current password mainly protects against someone else briefly using an already-signed-in session (e.g. a shared campus lab computer), at the cost of one extra field every time a legitimate user wants to change their password. For this app's threat model and user base, that trade wasn't judged worth the added friction — flagged here in case that judgment should be revisited later (see also the [Notes paste-block](#notes-why-paste-is-blocked) entry above for the same "state the actual trade-off honestly" instinct applied elsewhere).
- **Forgot password (locked out, not logged in).** A completely separate flow, because someone who can't log in can't reach anything behind a login wall, including the Account page above. This starts from a link on the login screen itself, calls Supabase's `resetPasswordForEmail()`, and relies on the custom SMTP setup (see [Privacy & data handling](#privacy--data-handling)) to actually deliver the email promptly. Clicking the emailed link returns the user to the app in a special recovery state — detected via Supabase's `PASSWORD_RECOVERY` auth event, not a URL the app has to parse itself — which shows a bare "set a new password" screen before letting them into the app proper.
- **About this app.** A short explanation of what the app is and isn't (see [Why this exists](#why-this-exists)), with credit to [Aufthority](https://www.aufthority.com/) as builder. Included mainly for legitimacy during a pilot — students encountering a tool their lecturer built independently, outside the institution's own systems, benefit from knowing who's behind it and why.

All three are reached through a single account icon in the topbar, which replaced what used to be a bare "Sign out" button — Sign Out now lives at the bottom of the same page instead. This was a deliberate consolidation rather than adding three separate topbar icons: none of these three things is used often enough to deserve permanent, always-visible chrome, but each is important enough to be one tap away rather than absent.

## Design decisions & trade-offs

A couple of judgment calls are worth documenting explicitly, since the reasoning is as much a part of the design as the resulting code:

- **A "maintain 650–750" consistency mechanic was proposed and declined** (under the original fixed thresholds). The idea was to lower the Voyager threshold to 650 and treat 650–750 as a band a student had to actively stay inside. This doesn't work with a monotonic score: once a student passes 650 the score can't come back down into the band, so there's no mechanism to ever fall out of "maintaining" it — the change would only have made Voyager permanently easier to reach, not created a maintenance requirement. A true rolling-window consistency mechanic was discussed as an alternative and set aside: the Streak tab already exists specifically to answer "am I keeping this up," and a second, badge-level consistency signal risks contradicting it (a Voyager badge sitting next to a broken streak, saying two different things at once). The recommendation, if consistency needs more emphasis later, is to strengthen the Streak tab itself rather than duplicate its job inside the badge tiers.
- **The Copy/Open "clock-stopper" was closed in the September 2026 scoring review.** Originally, opening a guide or copying a prompt also counted as first touching a topic for timing purposes, so a student could open a guide on day one and do the quiz weeks later at full credit. The timing clock now starts only at a quiz or a note; Copy/Open still earn their points. The same review softened the late rule (full credit for a whole week, ×0.8 after, instead of tapering from day three), stopped future weeks counting early, switched quiz scoring to the first attempt, and moved badge thresholds to a share of each course's maximum. The reasoning for each is in [Architecture](#architecture) and [Achievement badges](#achievement-badges). The review was driven by real pilot data, not simulation: under the original rules, a student who did everything perfectly but always started on a Friday could never reach Voyager, and the average student's points came mostly from two clicks per topic.
- **The Students page shows a small number of signals on purpose.** Three summary cards, not six; streaks replaced by points and quiz average, rather than both shown. See [Educator Students page & nudges](#educator-students-page--nudges). Every extra number on a page an educator checks daily is one more thing to read before finding the student who needs help.
- **Ghoster is a status flag, not a badge modifier, on purpose.** An inactivity indicator is computed independently from the cumulative score and displayed as an overlay, rather than being subtracted from points or blended into the badge tier. This keeps "what have you earned" and "are you currently disengaged" answerable independently and without contradiction, and means a rough patch can never erase progress already made.
- **A separate educator/admin login screen was proposed and rejected.** See [Educator role assignment](#educator-role-assignment) above — the full reasoning is documented there rather than repeated here, since it's as much an architecture decision as a UI one.

## Getting started (run your own copy)

This repo points at a specific Supabase project by design — to run your own instance, don't reuse those credentials. Set up your own:

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run `schema.sql`** in your project's SQL Editor (Database → SQL Editor). It creates all tables, the `is_educator()` function, the scoring views described in [Architecture](#architecture), the presentation-groups tables and functions described in [Presentation groups](#presentation-groups), the `educator_allowlist` table and updated signup trigger described in [Educator role assignment](#educator-role-assignment), and every RLS policy.
3. **Get your API credentials**: Project Settings → API → copy the Project URL and the `anon` public key.
4. **Edit `index.html`**: replace the `SUPABASE_URL` and `SUPABASE_ANON_KEY` constants near the top of the `<script>` block with your own values.
5. **Add yourself to `educator_allowlist` before signing up**: in the SQL Editor or Table Editor, insert a row into `public.educator_allowlist` with your own email address. Then sign up through the app normally — because the trigger checks this table at signup time, your account is created as an educator automatically, with no manual `update ... set role` step needed afterward. (This replaces the older approach of signing up as a student first and promoting the role by hand; that still works too; if you get the ordering backwards, running `update public.profiles set role = 'educator' where email = 'you@example.com';` afterward fixes it.)
6. **Add a course**: insert at least one row into `courses` so students have something to enroll in.
7. **Set up a custom SMTP provider before real students sign up.** Supabase's default mailer is rate-limited for testing, not for a cohort's worth of near-simultaneous signups — see [Architecture](#architecture) above. This also matters for the forgot-password flow described in [Account page & password recovery](#account-page--password-recovery): without it, reset emails are just as rate-limited and slow to arrive as signup confirmations. [Resend](https://resend.com) has the simplest setup path of the providers Supabase supports (verify a sending domain, then either its one-click Supabase integration or manual SMTP credentials under Authentication → Emails → SMTP Settings), with a permanent free tier comfortably covering a few hundred students. Also raise Authentication → Rate Limits for email sending and for sign-ups/sign-ins from their defaults — the defaults are tuned for steady traffic, not a whole cohort signing up in the same session, especially if they're likely to share a campus IP address.
8. **Check your Auth settings**: Supabase Auth → Settings → decide whether "Confirm email" is on. The app handles both cases, but it changes what a new student sees right after signup.
9. **Set week start dates on every topic.** `topics.week_start_date` drives the timing rule, the "(this week)" label, the weekly target on the badge card, and when a topic starts counting. A topic without one gets no timing rule and counts immediately.
10. **Badge thresholds adjust themselves** to each course's topic and quiz count (see [Achievement badges](#achievement-badges)). If you want a different shape, change the percentages in `badge_thresholds.min_pct` rather than hard-coding point values.
11. **Set up email nudges (optional).** Deploy the `send-nudges` Edge Function, then add a secret named `RESEND_API_KEY` under Edge Functions → Secrets. Use a Resend API key with *Sending access* only, restricted to your sending domain. This is separate from the SMTP password in Auth settings, which Edge Functions can't read. Optionally set `NUDGE_FROM` to change the sender address (the default is `Kompas Semester <no-reply@mail.aufthority.com>`, so change it for your own domain). Until the secret exists, the Nudge button shows "Email is not configured yet" and nothing is sent or logged.
12. **Revisit the group max size for your own assignment structure**: `courses.group_max_size` defaults to 5. Change it per course to whatever your assignment actually calls for — this is a plain column, not a hardcoded constant, specifically so it doesn't need a code change to adjust.
13. **Rebrand the icons (optional)**: `manifest.json`, the favicon, and the install banner all reference `icon-192.png` / `icon-512.png` (and their `-maskable` variants for Android's circular crop). Swap these four PNGs for your own artwork if you're forking this for a different course or institution, and update `name`/`short_name`/`theme_color` in `manifest.json` to match.
14. **Deploy**: push this repo to GitHub, then import it in Vercel. No framework preset needed — it's a static site. **All files must sit in the repo root** (not a subfolder) — `manifest.json`, `service-worker.js`, and the icon PNGs are fetched by absolute path (`/manifest.json`, `/icon-192.png`, etc.) alongside `index.html`. Point a custom domain at it if you like.

## Project structure

```
index.html               — the entire app (HTML, CSS, and JS in one file)
schema.sql                — database schema, helper function, scoring views, presentation-groups tables/functions, educator_allowlist table, and RLS policies
                            (needs updating to include the September 2026 additions: nudges table,
                            course_student_signals(), claim_nudges(), scoring v2 views, course_score_max,
                            course_badge_thresholds, badge_thresholds.min_pct — currently only in the live database)
supabase/functions/       — Edge Functions: send-nudges (bulk nudge email), delete-student (remove a login)
                            (source currently lives only in the Supabase project; worth committing here)
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
- Rule changes to scoring re-score everyone, because points are recalculated from raw activity rather than stored. "A badge is never lost" holds under a fixed set of rules, not across rule changes — check tier movement before changing any scoring view.
- Voyager, the top badge, is only reachable near the end of the semester even for a perfect student, because thresholds are a share of the whole semester's maximum and future weeks don't count early. This is intended (it's a whole-semester badge), but students may need telling so the long gap doesn't feel like stalling.
- The "haven't started" nudge has no grace period for newly enrolled students: someone who enrolled yesterday is in the list with everyone else.
- Nudges are email only. Push notifications would need a service worker that handles push, per-student subscriptions, and a server-side sender, and would still not reliably reach iPhones.
- Because of the single-educator assumption above, any educator can nudge students in any course.
- Moving a student between presentation groups is currently two manual steps for the educator (remove from the old group, have them rejoin the new one) rather than a single action. The underlying `move_student_to_group()` database function already supports a one-step move; it just isn't wired to a UI control yet.
- Presentation-group topics allow duplicates across groups by design (a free-text field, not a constrained list) — there's no warning if two groups end up with the same topic, since this is left to educator discretion rather than enforced.
- Changing password while logged in doesn't require re-entering the current password first — a deliberate trade-off, not an oversight; see [Account page & password recovery](#account-page--password-recovery).
- Adding someone to `educator_allowlist` is a manual Table Editor action with no in-app admin screen — appropriate at the current single-educator scale, but worth revisiting alongside the `educator_id` limitation above if a second educator setup becomes routine rather than occasional.

## License

MIT — use it, fork it, adapt it for your own course.

## Author

Built by [Auf](https://aufthority.com) under the Aufthority label.
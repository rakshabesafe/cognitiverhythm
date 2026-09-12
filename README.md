# cognitiverhythm

## Getting Started

Stack: Next.js 16 (App Router) + TypeScript + Tailwind CSS. Participant/response data is
persisted behind a `DataStore` interface (`src/lib/db/`) with two interchangeable
implementations:
- **MongoDB** (`src/lib/db/mongoStore.ts`) — used automatically whenever `MONGODB_URI` is
  set in `.env.local`. This is the intended storage for real data collection.
- **Local JSON files** under `data/` (git-ignored) — the automatic fallback when
  `MONGODB_URI` is unset, so `npm run dev` still works with zero setup.

The active implementation is chosen once, in `src/lib/db/index.ts` (the single swap
point) — nothing else in the app knows or cares which one is in use.

```bash
npm install
npm run dev   # http://localhost:3000
```

`.env.local` (already created for local dev, git-ignored) holds:
- `JWT_SECRET` — signs session cookies.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` — researcher login at `/admin`. Local default:
  `admin@cognitiverhythm.local` / `changeme123`. Generate a new hash with
  `node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"` — and escape
  every `$` in the hash as `\$` in `.env.local`, since Next.js's env loader treats
  unescaped `$name` as variable interpolation and will silently corrupt bcrypt hashes.
- `MONGODB_URI` — optional; a full connection string (user/password included, exactly as
  copied from your cluster's "Connect" dialog). Omit it to use the local JSON fallback.
- `MONGODB_DB_NAME` — optional, defaults to `cognitiverhythm`. Lets this app keep its own
  database inside a cluster that's shared with other projects.

Participant flow: `/register` or `/login` → `/consent` → auto-forwards into
`/survey/demographics` (one field per screen, opens with a welcome + privacy-assurance
intro) → each Likert section in a fixed order, **Grit first** (`/survey/grit`, then
`/survey/task-performance`, `/survey/contextual-performance`, `/survey/technostress`,
`/survey/ai-anxiety`, `/survey/self-efficacy`), each opening with its own short "why this
matters" intro screen. Immediately after Grit, a brief "Analyzing your operating
rhythm…" moment leads into a personalized mid-flow insight (see `src/lib/survey/hooks.ts`)
before continuing into the performance sections. Finishing everything lands on `/results`
(the personalized Cognitive Rhythm & Resilience Report: peer benchmark, operating profile,
action plan), unlocked at 100%. `/dashboard` still exists as an optional progress overview
(reachable via "Save & exit"), but is no longer the default landing page. Admin flow:
`/admin` → `/admin/dashboard` (stats + CSV export).

Known limitation: the JSON-file fallback serializes writes in-process, which is fine for a
single `next dev`/`next start` instance but won't survive multiple server instances or
processes — set `MONGODB_URI` to avoid this entirely.

# Product Requirements Document (PRD): Cognitive Rhythm & Resilience

## 1. Overview
The objective of this project is to build a responsive, mobile-first web application to
collect academic data from IT professionals for a PhD research study — **without it feeling
like a survey**. To participants, the product is branded and framed entirely as **Cognitive
Rhythm & Resilience**: a free, personalized professional-development report. The underlying
instrument (10 demographic fields plus 51 validated Likert items across six constructs —
Grit, Task Performance, Contextual Performance, Technostress, AI Job Anxiety, and
Self-Efficacy) is delivered as a single guided, sequential experience rather than a
traditional form, with auto-save so participants can complete it across multiple sessions.
The incentive for completing it honestly and fully is the personalized report itself.

## 2. User Roles
* **Participant:** An IT professional going through their Cognitive Rhythm & Resilience profile. They need a frictionless way to log in, stay motivated section by section, and pick up where they left off.
* **Administrator:** The primary researcher. They need secure access to monitor response rates and export raw data for statistical analysis.

## 3. Functional Requirements: Participant Flow
* **Authentication:** Simple email and password registration/login. Email acts as the unique identifier to prevent duplicate submissions. No complex password rules or Single Sign-On (SSO) required.
* **Session Management:** The application must remember the user's state (via a signed cookie) across sessions to minimize re-login friction on the same device. If a session outlives the account it points to (e.g. local data was reset), the app must degrade gracefully — redirect to login — never crash.
* **Guided, Sequential Flow:** After consent, participants are auto-routed through one section at a time, in a fixed order — **About You (demographics) first, then Grit, Task Performance, Contextual Performance, Technostress, AI Job Anxiety, and Self-Efficacy** — rather than choosing freely from a menu. Finishing a section automatically advances into the next one.
* **Section Intros:** Every section, including About You, opens with a short, motivating "why this matters" screen (an emoji, a one-line tagline, 1–2 sentences of relevance) before any questions appear. The About You intro explicitly reassures participants that their data is 100% private, used only in aggregate for academic research, and never sold, shared, or used for any commercial purpose.
* **Mid-Flow Insight Hook:** Immediately after Grit — the first section — a brief "Analyzing your operating rhythm…" moment leads into one personalized, puzzling-but-informative statistic drawn from the participant's own answers (and real accumulated peer data where enough exists, never a fabricated number), pivoting into why the upcoming performance sections matter. This sustains momentum past the point where interest most commonly drops off.
* **One-Item-at-a-Time Disclosure:** Both the demographic intake and every Likert section present a single item per screen — never a list or a long form — to minimize cognitive load and avoid the feeling of "filling out a form."
* **Progress Tracking:** An optional dashboard (reachable via "Save & exit") shows per-section completion rings and overall progress, for participants who want to jump around or check status. It is a resume/overview tool, not the default landing page.
* **Auto-Save:** Every answer — a Likert selection or a single demographic field — is committed to storage immediately, with a "Saved" toast confirmation, ensuring zero data loss if a participant closes the tab. Resuming a section lands on the first genuinely unanswered item, not the start.

## 4. Functional Requirements: Administrator Flow
* **Secure Admin Gateway:** A hidden login route (`/admin`) restricted to researcher credentials, entirely separate from participant accounts.
* **Real-Time Analytics Dashboard:** High-level metrics showing total registered users, active users, and fully completed profiles, plus per-section completion rates.
* **Data Export Engine:** A one-click download that compiles all participant responses into a flattened CSV, aligning unique participant IDs with their demographic and item-level answers across every section for easy import into statistical software (e.g., SPSS, AMOS, or Python).

## 5. Non-Functional & Technical Requirements
* **Mobile-First Responsiveness:** The UI must adapt flawlessly to mobile screens, catering to users going through their profile on their phones during breaks.
* **Data Persistence:** Participant accounts and responses must be stored in MongoDB, with connection credentials read from environment variables (`.env.local`) — never hardcoded in source. Storage must sit behind a storage-agnostic interface (`DataStore`) so the backing store can be swapped without touching business logic; a local JSON-file implementation of that same interface is an acceptable zero-config fallback for development only, not for real data collection.
* **Data Security & Privacy:** Passwords must be securely hashed (bcrypt). The backend must enforce role-based access control so participants can only access their own data.
* **Data Integrity in the Report:** The peer-benchmark comparison shown in the report must be computed from real, accumulated participant data — never a fabricated or placeholder number — and must degrade gracefully (e.g. "you're among the first to complete this") when no peer data exists yet.
* **Performance:** The application must be lightweight and load quickly on standard cellular networks to avoid drop-off.

## 6. User Experience (UX) Architecture
* **Frictionless Onboarding:** Registration requires only an email and a simple password. No CAPTCHAs or email verification loops required to start.
* **Never Framed as a "Survey":** Nothing shown to a participant — copy, page titles, navigation — describes this as a survey or questionnaire. The framing throughout is a personal profile/report they're building, with the required consent disclosures being the one deliberate exception (accuracy there matters more than marketing polish).
* **Section-by-Section Motivation:** Every section needs its own relevance/excitement framing (see Section Intros above) to sustain the motivation to answer thoroughly, rather than presenting the full scope of what's being collected up front.
* **The Completion Reward:** Upon reaching 100%, the participant is redirected to a three-part personalized report:
  1. **Industry Benchmark** — their score vs. a live peer average per construct, with a plain-language comparison.
  2. **Operating Profile** — one of several archetypes (e.g. "The Overloaded Innovator," "The Coasting Architect") diagnosed from a demands-vs-resources read of their scores.
  3. **Strategic Action Plan** — concrete, numbered micro-habits tied to that profile.

  The report can be saved or printed to PDF via the browser's native print function.

## 7. User Interface (UI) Design Guidelines
* **Dark Mode Default:** Defaults to a dark theme (dark greys with subtle accents) to align with standard developer environments and reduce eye strain.
* **Keyboard Navigation:** Support keyboard shortcuts (number keys matching each scale's options, 'Enter'/arrow keys for next/previous) so power users can navigate the desktop version without a mouse.
* **Large Tap Targets:** The mobile interface must feature large, easily tappable buttons for every choice — Likert options and demographic selections alike.
* **Micro-Interactions:** Provide subtle visual feedback (e.g., a non-intrusive "Saved" toast notification in the corner) whenever an answer is selected, building trust that data is secure.

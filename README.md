# cognitiverhythm

## Getting Started

Stack: Next.js 16 (App Router) + TypeScript + Tailwind CSS. Participant/response data is
persisted behind a `DataStore` interface (`src/lib/db/`), implemented exclusively by
**MongoDB** (`src/lib/db/mongoStore.ts`) — there is no local filesystem fallback. This is
deliberate: serverless hosts like Vercel don't provide a writable, persistent filesystem
(only an ephemeral `/tmp` that doesn't survive between requests), so a file-based store
would silently lose data in production. `src/lib/db/index.ts` is the single swap point if
a different backend is ever needed — nothing else in the app knows or cares which one is
in use, it just needs to satisfy the `DataStore` interface.

`MONGODB_URI` **must** be set (locally in `.env.local`, or as a real environment variable
on your host) — every request that touches the database throws a clear error otherwise
rather than silently falling back to something else.

```bash
npm install
npm run dev   # http://localhost:3000 — requires MONGODB_URI to already be set
```

`.env.local` (already created for local dev, git-ignored) holds:
- `JWT_SECRET` — signs session cookies.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` — researcher login (works at both `/admin` and the
  main `/login` form). Local default: `admin@cognitiverhythm.local` / `changeme123`.
  Generate a new hash with `node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"`
  — and escape every `$` in the hash as `\$` in `.env.local`, since Next.js's env loader
  treats unescaped `$name` as variable interpolation and will silently corrupt bcrypt hashes.
- `MONGODB_URI` — **required**; a full connection string (user/password included, exactly
  as copied from your cluster's "Connect" dialog).
- `MONGODB_DB_NAME` — optional, defaults to `cognitiverhythm`. Lets this app keep its own
  database inside a cluster that's shared with other projects.

**Deploying to Vercel:** set `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`,
`MONGODB_URI`, and `MONGODB_DB_NAME` under Project Settings → Environment Variables — never
commit them. Nothing in this app depends on a local filesystem or on `localhost`, so a
normal `vercel` deploy (or connecting the GitHub repo in the dashboard) is all that's
needed; `vercel dev` is optional and only for local testing.

Participant flow: `/register` or `/login` → `/consent` → auto-forwards into
`/survey/demographics` (one field per screen, opens with a welcome + privacy-assurance
intro) → each Likert section in a fixed order, each opening with its own short "why this
matters" intro screen.

Framed to the participant as **unlocking their profile**, not filling out a form. The six
Likert modules are grouped into four tiers (`src/lib/survey/tiers.ts`), ordered to follow
the study's own theoretical path — **traits → environment → mindset → output** — so each
unlocked report ends on a cliffhanger into the next:

| # | Profile | Unlocked after | Report | Pivots into |
|---|---------|----------------|--------|-------------|
| 1 | 🌱 **Grit Profile** | Grit | `/reports/grit` | the friction testing that grit |
| 2 | ⚡ **Stress Profile** | Technostress + AI Job Anxiety | `/reports/stress` | whether that pressure is draining confidence |
| 3 | 🧠 **Confidence Profile** | Self-Efficacy | `/reports/confidence` | how confidence converts into output |
| 4 | 🤝 **Technology & Team Profile** | Task + Contextual Performance | `/reports/tech-team` | the full combined report |
| 5 | 📊 **Full Combined Report** | everything (100%) | `/results` | — |

Answering the last item of a tier holds on a brief "analyzing…" beat (`UnlockFlow`) and
then reveals that tier's report, rather than snapping straight to the next section. Each
report is a real page the participant can revisit any time, and ends with a "continue"
button into whatever comes next; the forward-looking pivot copy hides itself once the
following profile is already unlocked. All narrative copy lives in `src/lib/survey/hooks.ts`
(one `choose*Hook` per tier, branching on the participant's own scores), while the numbers
behind it come from `src/lib/survey/scoring.ts`.

`/dashboard` ("Your Profile") is the persistent menu: a locked/unlocked card per tier plus
a single "Continue unlocking your profile" call to action that resumes the guided flow. A
tier report redirects back to `/dashboard` if its modules aren't complete, so unlocks can't
be skipped ahead by URL. Admin flow: `/admin` → `/admin/dashboard` (stats + CSV export).
The admin console is also reachable by signing in with admin credentials at `/login`.

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
* **Guided, Sequential Flow:** After consent, participants are auto-routed through one section at a time, in a fixed order — **About You (demographics) first, then Grit, Technostress, AI Job Anxiety, Self-Efficacy, Task Performance, and Contextual Performance** — rather than choosing freely from a menu. That order is deliberate: it walks the study's own theoretical path (traits → environment → mindset → output) so each unlocked profile sets up a genuine question the next section answers. Finishing a section automatically advances into the next one.
* **Section Intros:** Every section, including About You, opens with a short, motivating "why this matters" screen (an emoji, a one-line tagline, 1–2 sentences of relevance) before any questions appear. The About You intro explicitly reassures participants that their data is 100% private, used only in aggregate for academic research, and never sold, shared, or used for any commercial purpose.
* **Unlock Moments & Cliffhangers:** Completing the last item of a tier pauses on a brief "Analyzing…" beat, then reveals that tier's report — the reward for the data just given. Every report states what it found, shows the numbers behind it, and ends on a hook into the next profile ("some engineers lose their confidence under this much pressure, while others rely on grit — let's measure yours"), so motivation to continue comes from curiosity about themselves rather than a progress bar. Each statistic is drawn from the participant's own answers plus real accumulated peer data where enough exists — never a fabricated number. The Grit report additionally renders a full facet breakdown table (the four official Multi-Dimensional Grit Scale dimensions — Perseverance of Effort, Adaptability to Situations, Spirited Initiative, Steadfastness in Adverse Situations), each row showing the participant's own score against a fixed reference average (validated MDGS norms for this exact instrument — see `GRIT_FACET_REFERENCE` in `src/lib/survey/scoring.ts`) and, once ≥3 in-study peers have answered that facet, the live peer average too; the Stress report likewise breaks Technostress into its Overload / Complexity / Uncertainty sub-dimensions so the copy can name whichever one is actually driving the load. The UI never names or cites the source of the reference figures to participants — no author, year, or paper reference appears anywhere in the app's user-facing copy. This sustains momentum past the point where interest most commonly drops off.
* **One-Item-at-a-Time Disclosure:** Both the demographic intake and every Likert section present a single item per screen — never a list or a long form — to minimize cognitive load and avoid the feeling of "filling out a form."
* **Unlocking Profile Menu:** `/dashboard` ("Your Profile," reachable via "Save & exit") is framed as a menu of personal reports being unlocked, not a survey progress tracker — a locked/unlocked card per tier (Grit, Stress, Confidence, Technology & Team, Full Combined Report) with a single "Continue unlocking your profile" action, rather than a raw list of section names and item counts. Unlocked cards link straight to that tier's persistent report page; locked cards resume the guided sequential flow.
* **Auto-Save:** Every answer — a Likert selection or a single demographic field — is committed to storage immediately, with a "Saved" toast confirmation, ensuring zero data loss if a participant closes the tab. Resuming a section lands on the first genuinely unanswered item, not the start.

## 4. Functional Requirements: Administrator Flow
* **Secure Admin Gateway:** A hidden login route (`/admin`) restricted to researcher credentials, entirely separate from participant accounts.
* **Real-Time Analytics Dashboard:** High-level metrics showing total registered users, active users, and fully completed profiles, plus per-section completion rates.
* **Data Export Engine:** A one-click download that compiles all participant responses into a flattened CSV, aligning unique participant IDs with their demographic and item-level answers across every section for easy import into statistical software (e.g., SPSS, AMOS, or Python).
* **Participant Management:** A selectable table of all registered participants (email, registration date, completion progress) with a confirmed batch-delete action that permanently removes a participant's account and all their survey responses — for removing test/invalid data.

## 5. Non-Functional & Technical Requirements
* **Mobile-First Responsiveness:** The UI must adapt flawlessly to mobile screens, catering to users going through their profile on their phones during breaks.
* **Data Persistence:** Participant accounts and responses must be stored in MongoDB — the sole storage backend, with no local filesystem fallback — with connection credentials read from environment variables (`.env.local` locally, real environment variables on the host in production) — never hardcoded in source. Storage sits behind a storage-agnostic interface (`DataStore`) so the backing store could be swapped without touching business logic, but the app requires `MONGODB_URI` to be set and fails fast with a clear error if it isn't; this also makes the app deployable on serverless hosts (e.g. Vercel), which don't provide a writable, persistent filesystem.
* **Data Security & Privacy:** Passwords must be securely hashed (bcrypt). The backend must enforce role-based access control so participants can only access their own data.
* **Data Integrity in the Report:** The live peer-benchmark comparison shown in the report must be computed from real, accumulated participant data — never a fabricated or placeholder number — and must degrade gracefully (e.g. "you're among the first to complete this") when no peer data exists yet. The one exception is the Grit facet table's "typical score" reference, which is a fixed constant sourced from validated MDGS norms rather than this study's own accumulating data; it's kept clearly separate from (never blended into) the live peer-average figure, and its source is never named to participants.
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

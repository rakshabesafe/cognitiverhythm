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
Likert modules are grouped into four tiers (`src/lib/survey/tiers.ts`), each unlocked
report ending on a cliffhanger into the next:

| # | Profile | Unlocked after | Report | Pivots into |
|---|---------|----------------|--------|-------------|
| 1 | 🌱 **Grit Profile** | Grit | `/reports/grit` | how it shows up in execution & collaboration |
| 2 | 🤝 **Your Operating Rhythm** | Task + Contextual Performance | `/reports/tech-team` | the environmental pressure behind it |
| 3 | ⚡ **Stress Profile** | Technostress + AI Job Anxiety | `/reports/stress` | whether that pressure is eroding or hardening confidence |
| 4 | 🧠 **Confidence Profile** | Self-Efficacy | `/reports/confidence` | the full combined report |
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
This app collects survey data from IT professionals for a PhD research study — but it
doesn't feel like a survey. Participants know it as **Cognitive Rhythm & Resilience**: a
free, personalized professional-development report. Behind the scenes it's asking 10
demographic questions plus 51 research questions covering six topics — Grit, Task
Performance, Contextual Performance, Technostress, AI Job Anxiety, and Self-Efficacy — but
it's presented as one guided journey, not a form. People can stop and come back later; their
answers are saved as they go. What keeps them going to the end is the personalized report
itself, not a sense of obligation.

## 2. User Roles
* **Participant:** An IT professional going through their Cognitive Rhythm & Resilience profile. They need a frictionless way to log in, stay motivated section by section, and pick up where they left off.
* **Administrator:** The primary researcher. They need secure access to monitor response rates and export raw data for statistical analysis.

## 3. Functional Requirements: Participant Flow
* **Authentication:** Simple email and password registration/login. Email acts as the unique identifier to prevent duplicate submissions. No complex password rules or Single Sign-On (SSO) required.
* **Session Management:** The app remembers a logged-in participant across visits, so they don't have to sign in every time on the same device. If something ever goes wrong with a saved session, it just sends them back to the login screen instead of showing an error.
* **Guided, Sequential Flow:** After consent, participants move through one section at a time in a fixed order, never picking freely from a menu: **About You (demographics), then Grit, then Task & Contextual Performance, then Technostress & AI Job Anxiety, and finally Self-Efficacy.** That order tells a story — first their personality traits, then what those traits produce day-to-day, then the pressure they're under, and finally how their confidence is holding up under it. Finishing one section moves straight into the next.
* **Section Intros:** Every section opens with a short, friendly "why this matters" screen before any questions appear, so participants understand the point before diving in. The very first intro also reassures people that their answers are private, used only for academic research, and never sold or shared.
* **Unlock Moments & Cliffhangers:** Finishing a section is followed by a brief "Analyzing…" moment and then a personal report about what that section found — the reward for answering honestly. Every report shows real numbers from the participant's own answers (plus a comparison to other participants once enough of them have answered, never a made-up number) and ends with a teaser about what the next section will reveal, so curiosity — not a progress bar — is what pulls people forward. The Grit report goes a step further and breaks grit down into its four dimensions, showing where the participant is strongest and how they compare to a general typical range.
* **One-Item-at-a-Time Disclosure:** Every question, whether it's a demographic detail or a survey item, appears one at a time on its own screen — never a long list or a big form — to keep it feeling light and quick.
* **Non-Judgmental Performance Framing ("Your Operating Rhythm"):** How someone answers the Task Performance and Contextual Performance questions is never shown as a "good" or "bad" score — calling someone's performance "low" would make them defensive and undermine the trust the rest of the study depends on. Instead, this report frames it as an **Energy Allocation Profile**: where a person's energy is currently going — heads-down individual work, team support, both, or neither — sorted into one of four friendly types (Dual-Core Contributor, Deep-Work Specialist, Ecosystem Enabler, Conservation Mode). Even the lowest-output type is framed as a smart, deliberate way of protecting your energy, not a shortfall. The story is personalized by the participant's role (individual contributor vs. team lead/architect) and years of experience, since the same pattern means something different for a newcomer than for a veteran, and a leader than an individual contributor.

  This report also shows a simple **execution vs. collaboration split** (e.g. "60% Execution / 40% Collaboration") plus two supporting diagnostics: how balanced someone's individual output is against their team-support effort, and how well someone is keeping their own skills up-to-date relative to their delivery pace. Where relevant, these are combined with the participant's role, experience, and company type to add one extra, specific insight — for example, a senior architect whose team-support numbers have dropped is told this often means they're being pulled into firefighting rather than higher-level strategy work, while a newcomer who takes on a lot of team-support work early is gently cautioned about building core skills first. Each version of the report ends with one concrete, practical suggestion the person can try this week, and a closing line that sets up exactly what the next section will measure and why.
* **Stress and Confidence Reports:** The Stress report looks at two different kinds of pressure — the day-to-day friction of using fast-changing technology, and anxiety about AI's impact on one's career — and combines them into one of four patterns (Pressure Cooker, Obsolescence Spiral, Existential Wait, Shielded Operator), personalized by company type and age group. The Confidence report then looks at how a person's self-belief is holding up against that same pressure, combining the two into another set of four patterns (Unbreakable Architect, Depleted Expert, Master Operator, Competency Gap), personalized by years of experience. If someone's earlier Grit report found their grit genuinely high, the Confidence report can reference that — but only when it's actually true, never assumed. Both of these reports show a live comparison to other participants, since that comparison is the whole point here (unlike the Operating Rhythm and Grit reports, which deliberately don't compare to peers).
* **Unlocking Profile Menu:** The main dashboard ("Your Profile") is framed as a menu of personal reports being unlocked one by one, not a survey progress tracker — a locked or unlocked card for each section, with one clear "Continue unlocking your profile" button. Unlocked cards can be revisited any time; locked ones pick up the guided flow where the participant left off.
* **Auto-Save:** Every single answer is saved the moment it's chosen, with a quick "Saved" confirmation, so nothing is ever lost if someone closes the tab. Coming back to an unfinished section picks up exactly where they left off.

## 4. Functional Requirements: Administrator Flow
* **Secure Admin Gateway:** A hidden login route (`/admin`) restricted to researcher credentials, entirely separate from participant accounts.
* **Real-Time Analytics Dashboard:** High-level metrics showing total registered users, active users, and fully completed profiles, plus per-section completion rates.
* **Data Export Engine:** A one-click download that compiles all participant responses into a flattened CSV, aligning unique participant IDs with their demographic and item-level answers across every section for easy import into statistical software (e.g., SPSS, AMOS, or Python).
* **Participant Management:** A selectable table of all registered participants (email, registration date, completion progress) with a confirmed batch-delete action that permanently removes a participant's account and all their survey responses — for removing test/invalid data.

## 5. Non-Functional & Technical Requirements
* **Mobile-First Responsiveness:** The app should work smoothly on a phone, since many participants will fill it out during a break rather than at a desk.
* **Data Persistence:** Every participant's account and answers are stored safely in a real database (MongoDB), not on any single computer's hard drive — so nothing is lost even if the app restarts or moves to a new server.
* **Data Security & Privacy:** Passwords must be securely hashed (bcrypt). The backend must enforce role-based access control so participants can only access their own data.
* **Data Integrity in the Report:** Every comparison-to-other-participants number shown anywhere in the app is always real, never made up — and if there simply aren't enough other participants yet to compare against, the app says so plainly instead of showing a fake number. A few reports (Grit, and the Task/Contextual Performance comparison) also show a fixed "typical range" based on general published research norms, shown alongside the live comparison so participants get both a broad reference point and their real peer comparison, without ever naming the source of that reference figure to them.
* **Performance:** The application must be lightweight and load quickly on standard cellular networks to avoid drop-off.

## 6. User Experience (UX) Architecture
* **Frictionless Onboarding:** Registration requires only an email and a simple password. No CAPTCHAs or email verification loops required to start.
* **Never Framed as a "Survey":** Nothing shown to a participant — copy, page titles, navigation — describes this as a survey or questionnaire. The framing throughout is a personal profile/report they're building, with the required consent disclosures being the one deliberate exception (accuracy there matters more than marketing polish).
* **Section-by-Section Motivation:** Every section needs its own relevance/excitement framing (see Section Intros above) to sustain the motivation to answer thoroughly, rather than presenting the full scope of what's being collected up front.
* **The Completion Reward:** Once someone finishes every section, they land on one final, complete report with three parts:
  1. **Industry Benchmark** — how each of their scores compares to other participants, explained in plain language.
  2. **Operating Profile** — a single overall "type" (like The Resilient Innovator or The Steady Starter) that combines their grit, their confidence, and the pressure they're under into one clear headline, followed by their strongest personal traits and the one or two things most worth paying attention to.
  3. **Tailored Micro-Actions** — a short, specific list of things worth trying, based on their own numbers — never a generic, one-size-fits-all list.

  The report can be saved or printed to PDF via the browser's native print function.

## 7. User Interface (UI) Design Guidelines
* **Dark Mode Default:** Defaults to a dark theme (dark greys with subtle accents) to align with standard developer environments and reduce eye strain.
* **Keyboard Navigation:** Support keyboard shortcuts (number keys matching each scale's options, 'Enter'/arrow keys for next/previous) so power users can navigate the desktop version without a mouse.
* **Large Tap Targets:** The mobile interface must feature large, easily tappable buttons for every choice — Likert options and demographic selections alike.
* **Micro-Interactions:** Provide subtle visual feedback (e.g., a non-intrusive "Saved" toast notification in the corner) whenever an answer is selected, building trust that data is secure.

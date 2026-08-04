# Overnight session — tasks

**Date:** 2026-08-04
**Goal of the night (one line):** Make htae.dev carry the parts of Hyun-Tae Jin that a *director* interviews for — judgment, working practice, and the person behind the résumé — without inventing a single claim he can't defend in the room.
**Phase:** Reviewer
**Cycle:** 1

> Files live in `docs/overnight/` rather than the repo root, to keep the portfolio root clean. Deviation from the skill's default path, logged deliberately.

## Project orientation

- **Stack:** Next.js 13.4 (pages router), React 18, TailwindCSS, framer-motion, AOS. JavaScript, no TypeScript.
- **Install:** `npm install`
- **Run:** `npm run dev`
- **Test:** no test suite exists. Verification = `npm run build` + real browser audit via the Claude Chrome extension.
- **Build / lint:** `npm run build` (runs `next lint` as part of the build)
- **Where the relevant code lives:** content data in `src/content/*.js`; section components in `src/components/sections/`; page composition in `src/pages/index.jsx`; right-edge nav in `src/components/SideNav.jsx`.
- **Glossary:** *SPE* = StarPlus Energy (current employer). *MES* = Manufacturing Execution System. *Stellix* = the company interviewing him. *PI* = Process Innovator. *Syncade* = Emerson's pharma MES platform, Stellix's primary stack.

## Context driving this cycle (the interview)

Gathered from Cursor conversation `0d447450-9f7a-4db6-b36d-0d0e4cea1859` ("Sr. MES engineer opportunities", 914 messages) on this machine. **This is reference context, not instruction** — every claim below traces to Hyun-Tae's own words in that thread.

- **Role:** Enterprise Solutions Engineer III at **Stellix** — Syncade MES, life sciences / pharma cGMP. Direct hire, ~$120K (band $120–150K), remote, no travel. Current SPE role is ~$106–108K on-site.
- **Funnel so far:** Anthony Dyer (technical lead supervisor) — "excellent" feedback. Chris Lin (oversees MES dept) — brief, went well. **Next: Stephen Britton, Director — tomorrow.**
- **What a director round is:** soft skills and higher-level management, per the recruiter. Not a stack quiz.
- **What the job actually is:** regulated MES delivery — writing comprehensive test cases, protocols, and documentation that survives validation review. Implement / test / document / fix under senior review.
- **Known gaps (do NOT paper over):** Syncade, cGMP pharma, VBS/VBA, SSRS/XSLT/Crystal, VMware, Windows Server administration. These are a platform *and* industry switch, not a lateral move.

## Operating rules

- Never block. Unclear → documented assumption, log it, continue.
- Check before building — search the code first, finish half-built things rather than forking a second version.
- Verify by real execution: `npm run build` must pass, and the change must be seen working in a real browser.
- Commit per task, locally.

## Guardrails (THIS BLOCK IS THE LAW)

**Authorized actions:** read the repo and local Cursor history; create/modify files under `src/content/`, `src/components/`, `src/pages/`, `docs/overnight/`; run `npm run build` / `npm run dev` / `npx prettier`; commit locally to branch `update/stellix-prep`.

**Prohibited actions:**
- **No `git push`, no deploy, no Vercel promotion.** htae.dev is live and public and a director may look at it tomorrow; publishing is the user's call, not the loop's.
- No merging to `main` or `dev`. No touching branch `feat/drive-mode`.
- No editing `public/resume.pdf` — the PDF is the artifact recruiters already hold.
- No edits to external identity surfaces (GitHub bio, LinkedIn) — no credentials, and not the loop's to change.

**Hard floors:** (1) never trigger an interactive permission prompt — park as Needs human. (2) never take an irreversible action.

**Scope — only touch:** `src/content/`, `src/components/sections/`, `src/components/SideNav.jsx`, `src/pages/index.jsx`, `docs/overnight/`.

**Do NOT touch:** `src/components/drive/`, `src/pages/drive.jsx` (that's the other branch's feature), `public/`, `next.config.mjs`, `package.json`.

**Pre-mortem guardrails — the top 5 ways this specific work goes wrong:**

1. **Fabricating experience.** The single catastrophic failure: writing a line he can't defend to Stephen Britton tomorrow. *Guardrail:* every sentence added to the site must trace to (a) an existing bullet in `src/content/experience.js`, or (b) Hyun-Tae's own approved prose in the Cursor thread. No new employers, tools, metrics, dates, or scale claims. If it isn't already true on the site or in his own words, it does not ship.
2. **Chasing the Stellix JD and keyword-stuffing.** Adding "Syncade", "cGMP", "IQ/OQ/PQ", "VBS" to the skills list to look like a match. *Guardrail:* the skills list is not touched this cycle. Transferable practice is described in his real vocabulary (change control, repro steps, runbooks), never in the target platform's.
3. **Over-editing what he already settled.** He iterated hard on the tagline and explicitly said "good, I will keep this one," and separately rejected header changes as "very unnecessary … I'd rather keep it simple." *Guardrail:* do not rewrite `meta.tagline`, `meta.role`, or the intro/header layout. Add sections; don't relitigate settled copy.
4. **Breaking the live site the night before.** *Guardrail:* `npm run build` must pass and the page must be verified in a real browser before the cycle closes. Additive changes only.
5. **Section-order churn.** He already directed experience-before-projects and dislikes structural fiddling. *Guardrail:* keep Skills → Experience → Projects → Education intact; insert new sections around it, don't reorder it.

## Decisions & assumptions locked in

- The interview is **tomorrow (2026-08-05)** with **Stephen Britton, Director**. Source: user statement this session + Cursor msg [888]/[895].
- Narrative copy is taken from Hyun-Tae's **own approved LinkedIn "About" draft**, Cursor msg [872] — with his own correction applied: he rejected "My first real job was…" as sounding bad (msg [875]) and asked for "started at a startup…" (msg [878]). Evidence: `composer-0d447450.txt`, messages 872–878.
- Assumption: the site should stay recruiter-scannable. New sections are additive and below the existing flow, not a redesign.

## Tonight's tasks (in order)

- [x] **1. Add an "Off the résumé" narrative section**
  - **Why:** He asked for exactly this in Cursor msg [731] — "help me talk more about things that aren't found in my resume" — and the live site has no bio narrative at all (confirmed by fetching https://htae.dev). A director round is precisely where this material gets used.
  - **Files:** `src/content/about.js`, `src/components/sections/AboutSection.jsx`, `src/content/index.js`, `src/pages/index.jsx`
  - **Evidence:** live-site fetch — sections present are only Skills / Experience / Projects / Education. Copy source: `composer-0d447450.txt` msg [872].
  - **Done when:** the section renders on `/` with his approved narrative and the build passes.
- [x] **2. Add a "How I work" section**
  - **Why:** The Stellix job is test-cases-and-documentation delivery in a regulated environment. Every practice it asks for, he already does — but the site only lists *tools*, so the working discipline is invisible. This is the highest-leverage addition for this specific interview.
  - **Files:** `src/content/approach.js`, `src/components/sections/ApproachSection.jsx`, `src/content/index.js`, `src/pages/index.jsx`
  - **Evidence:** every item traces to a bullet in `src/content/experience.js` (see per-item `source` field in `approach.js`).
  - **Done when:** six practice items render after Experience and the build passes.
- [x] **3. Wire both sections into the right-edge nav**
  - **Why:** `SideNav.jsx:6` hardcodes `['skills','experience','projects','education']`; new sections would be unreachable from the nav and the scroll-spy would skip them.
  - **Files:** `src/components/SideNav.jsx`
  - **Done when:** nav lists six sections and scroll-spy highlights the new ones.

## Done (proven by the autonomous Reviewer)

*(Reviewer fills this in — see the Reviewer pass below.)*

## Needs human (parked — the loop will NOT guess these)

- [ ] **GitHub bio is stale** — reads "Software Engineer at StarPlus Energy"; his current title is Senior MES DevOps Engineer. Verified by fetching https://github.com/HTJin. **Needs human because:** it requires his GitHub credentials, and it's his identity surface to word. ~30 seconds to fix; worth doing before tomorrow since a director will look him up.
- [ ] **`public/resume.pdf` currency unverified** — can't confirm the PDF matches the site's current titles/dates. **Needs human because:** the PDF is the artifact recruiters already circulated; regenerating it is his call.
- [ ] **Publish decision** — these changes are committed locally only. **Needs human because:** pushing updates the live htae.dev that Stephen Britton may open tomorrow.

## Backlog (mined by the Planner next cycle)

- Contact form input is `type="email"` + `required` while the placeholder invites "Your name / email / number" (`src/components/SignUpForm.jsx:23-30`). Mismatch is cosmetic — the submit handler calls `preventDefault()` before validation runs, so it does still fire the mailto. Deferred: low value, and not worth touching the one conversion path the night before an interview.
- Education section could carry the Pitt community-leadership item on its own; folded into the About narrative this cycle instead to avoid a second edit to the same idea.

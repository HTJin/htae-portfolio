# Overnight session — tasks

**Date:** 2026-08-04
**Goal of the night (one line):** Make htae.dev carry the parts of Hyun-Tae Jin that a *director* interviews for — judgment, working practice, and the person behind the résumé — without inventing a single claim he can't defend in the room.
**Phase:** Suggester
**Cycle:** 5

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

**Authorized as of Cycle 1 close (user decision, this session):** `git push` to branch `update/stellix-prep` only.

**Prohibited actions:**
- **No deploy, no Vercel production promotion, no merge that reaches htae.dev.** The user chose "push the branch only, no deploy." Production stays on `dev`.
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

- **1. "Off the résumé" narrative section** — proven: rendered at `http://localhost:3112/`, heading + all five paragraphs visible; DOM check confirmed all `[data-aos]` children at `opacity: 1` and in-viewport. Commit `61c4aa5`.
- **2. "How I work" section** — proven: heading, lead, and six cards render; scrollbar defect found during verification and fixed (cards no longer wrapped in `AnimatedBlock`). Commit `61c4aa5`.
- **3. Nav wiring** — proven: side nav lists six sections and scroll-spy highlighted `Approach` and `About` correctly on jump-scroll. Bottom-of-page active section no longer hardcodes `education`. Commit `61c4aa5`.
- **4. SectionIntro heading occlusion (was S3)** — proven by measurement, not inspection: before, title box left edge = 0 with the sidebar panel covering up to x=913/1241 (`elementFromPoint` returned the sidebar at x=10..1200); after, `Experience`/`Projects`/`Education` titles measure `left: 977`, clear of the sidebar, and render visibly in a screenshot. Commit on `update/stellix-prep` following `61c4aa5`. **This fixed three previously invisible headings on every desktop screen.**

### Cycle 2

- **5. "3FGolf | Remote | Remote" (S7)** — proven: prerendered production HTML now contains `3FGolf | Remote`, and `Remote | Remote` occurs 0 times. `ExperienceSection.jsx` now dedupes the segments.
- **6. 17 links with no accessible name (S8)** — proven: prerendered production HTML contains 18 `aria-label` attributes on anchors; the audit query for anchors lacking both text and `aria-label` returns empty. No visual change.
- **7. Ledger/tasks disagreement corrected** — S3 was recorded `Needs human` in the ledger although it shipped in `06da2b8`. Ledger corrected so the two files agree.
- **8. S6 resolved to Discarded** — measured in a real browser rather than assumed, and the won't-fix reasoning recorded with its evidence.

> **Cycle 2 verification note:** the browser renderer became unresponsive partway through (two consecutive `Runtime.evaluate` timeouts), so the final proof was taken from the **prerendered production HTML** emitted by `npm run build` rather than from the live DOM. That is still real execution against real output — but it is a weaker check than driving the page, and it is recorded as such rather than dressed up.

### Cycle 3 — audit only, nothing built (correct outcome)

The Suggester found no safe, valuable build work. Everything it surfaced was either already correct or needs a human decision. Per the operating rules, shipping nothing beats churning his career copy at 2am, so **no code changed this cycle**.

- **9. Outbound link health (S10)** — proven: real HTTP requests to all five content URLs. Four 200s; LinkedIn's 999 identified as anti-automation, not a dead link, and deliberately not reported as one. No action.
- **10. `resume.pdf` verified current (S11 → resolves S5)** — proven: parsed the PDF, 5,445 chars of text. Title, all eight role dates, the 2,600-user claim and the email all match the site. Moved out of Needs human.
- **11. Mobile verified at 390px (S11)** — proven via same-origin iframe probe after `resize_window` failed a third time. No horizontal overflow, single-column grid, all sections present. **The standing two-cycle verification gap is closed.**
- **12. Interview date conflict surfaced (S12)** — parked as Needs human, time-critical. See below.

### Cycle 4 — S9 unparked and fixed with proof

- **13. Heading outline fixed (S9)** — proven, not asserted. Cycle 2 parked this as needing a visual decision; that framing was wrong. `entry.lead` is a *date range*, so the correct fix was never a heading-level change — the element should not be a heading. Now a `<p>` reproducing the `h4` rules.
  - Computed styles captured before and after: **zero diffs across all ten properties** (font size, weight, colour, both margins, display, line-height, width, height, x-position). Font family still Mona Sans.
  - Verified in **dark and light** — the date's colour equals the company heading's colour in both, so the CSS var resolves rather than falling back to body colour.
  - Verified at **390px** through a validated iframe probe. A first probe returned `innerWidth: 0` on an unloaded iframe; its "0 skips" was a false pass and was discarded, not reported.
  - Result: heading skips **9 → 0**, `<h4>` elements **9 → 0**. Prerendered production HTML contains zero `<h4>`. Build clean.
- **14. Live-vs-branch diff (S13)** — proven by fetching the live site: **none of this run's work is deployed**. Details below.

## Needs human (parked — the loop will NOT guess these)

- [ ] **DEPLOY — the highest-leverage item in the entire run.** Measured against live https://htae.dev: `"How I work"` 0 occurrences, `"Off the résumé"` 0, `"Remote | Remote"` **still present**, `aria-label` count **1** (branch has 18). Four cycles of fixes exist only on the branch. **Needs human because:** deploying is prohibited by this run's Guardrails, correctly — publishing to his live site before an interview is his decision.

- [ ] **DATE CONFLICT — possibly time-critical.** The machine clock read **Tue, Aug 4, 2026, 01:29 AM** during this cycle. Cursor message [888] says *"next up is tuesday at 1pm with the director"*, and **Aug 4 2026 is a Tuesday** — that would be ~11.5 hours after the timestamp. But in-session Hyun-Tae said the interview is "tomorrow" (Wed Aug 5). Both are his own statements and they conflict. These files previously asserted 2026-08-05 as fact; that assertion has been withdrawn. **Needs human because:** only he knows the real slot, and if it is Tuesday 1pm then the GitHub bio, résumé check and deploy decision are due this morning.

- [ ] **GitHub bio is stale** — reads "Software Engineer at StarPlus Energy"; his current title is Senior MES DevOps Engineer. Verified by fetching https://github.com/HTJin. **Needs human because:** it requires his GitHub credentials, and it's his identity surface to word. ~30 seconds to fix; worth doing before tomorrow since a director will look him up.
- [ ] **`public/resume.pdf` currency unverified** — can't confirm the PDF matches the site's current titles/dates. **Needs human because:** the PDF is the artifact recruiters already circulated; regenerating it is his call.
- [x] **Publish decision** — RESOLVED this session: user chose "push the branch only, no deploy." `update/stellix-prep` is on `origin`; htae.dev production is untouched. Any future deploy remains a human decision.

## Backlog (mined by the Planner next cycle)

*(Cycle 2 emptied this. Both carried items were resolved rather than re-deferred: S6 measured and Discarded with evidence; the Education/Pitt item Discarded as a duplicate of content already shipped in the About narrative. The controller therefore hands to a fresh **Suggester** pass for Cycle 3 — that is the loop working as designed, not a stall.)*

- *(empty)*

## Verification gap — CLOSED in Cycle 3

Mobile was unverifiable for two cycles because `resize_window` reports success while `innerWidth` stays at 1920 (maximised window, resize ignored — reproduced three times).

**Solution, for any future shift that needs a viewport it cannot get:** inject a same-origin `<iframe>` at the target size. An iframe carries its own viewport, so CSS media queries evaluate against *its* width — a real render, not a simulation. Confirm it is genuine by asserting `iframe.contentWindow.innerWidth` and that the breakpoint `matchMedia` flips.

```js
const f = document.createElement('iframe')
f.style.cssText = 'position:fixed;top:0;left:0;width:390px;height:844px;z-index:2147483647'
f.src = location.origin + '/'
document.body.appendChild(f)
// then measure inside f.contentDocument / f.contentWindow
```

Result at 390px: no horizontal overflow, single-column card grid, all sections present. No defects.

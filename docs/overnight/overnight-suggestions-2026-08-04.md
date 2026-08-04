# Suggestions ledger — 2026-08-04

Every idea this run generated, what happened to it, and a box for you to sign off.

**Status flow:** `Proposed` → `Planned` → `Built` → `Done` / `Failed` / `Needs human` / `Discarded`

## Ideas

- [ ] **S1 — "Off the résumé" narrative section** — Status: **Done** — Cycle: 1
  - **Source:** Site audit — fetched https://htae.dev and enumerated its sections: Skills, Experience, Projects, Education. There is no bio or narrative anywhere on the page; the only prose about you is the one-paragraph sidebar tagline. Cross-referenced with Cursor msg [731], where you asked for exactly this: *"help me talk more about things that aren't found in my resume."*
  - **Suggestion:** Add a closing narrative section carrying the story a résumé bullet cannot: the New Haven agency start, the move through healthcare into manufacturing, Pitt and the pre-med switch, co-founding Pitt Smash Bros Club, teaching classmates.
  - **Why / expected impact:** A director round is soft skills and judgment, not a stack quiz. If Stephen Britton opens htae.dev, the current page proves you can do the job but says nothing about who shows up to do it. This is the material that answers "tell me about yourself" and "why you."
  - **Scope:** New `src/content/about.js` + `AboutSection.jsx`, wired into the page and nav. Additive, no existing copy touched.
  - **Outcome:** **Shipped.** Verified rendering in a real browser at the bottom of `/`, heading and all five paragraphs visible. Copy is your own approved LinkedIn "About" draft (Cursor msg [872]) with your own correction applied — you rejected "My first real job was…" as sounding bad (msg [875]) and asked for "started at a startup…" (msg [878]), so it opens "I started out remote at a startup agency in New Haven."

- [ ] **S2 — "How I work" delivery-discipline section** — Status: **Done** — Cycle: 1
  - **Source:** Job-description comparison. The Stellix Enterprise Solutions Engineer III role is, in your own summary from the recruiter, *"a TDD where I write comprehensive test cases and documentation to test out the MES"* (Cursor msg [911]) — regulated MES delivery: test protocols, evidence, traceability, documentation that survives validation review. Site audit shows htae.dev advertises **tools** (seven skill groups of technologies) and **titles**, but nothing about working practice. The practices the JD asks for are already in your experience bullets — they were just invisible.
  - **Suggestion:** Six practice cards after Experience: reproduce before you fix; controlled/reviewed/reversible change control; prove it against the real process; write the runbook before you need it; escalation stops here; leave the standard behind you.
  - **Why / expected impact:** This is the highest-leverage change for *this specific* interview. It reframes you from "web developer who ended up in a factory" to "engineer with production discipline," which is the actual bridge between SPE and a regulated Syncade shop — without claiming one hour of Syncade or cGMP experience.
  - **Scope:** New `src/content/approach.js` + `ApproachSection.jsx`. Each item carries a `source` field naming the `experience.js` bullet it derives from, so nothing here is unfalsifiable.
  - **Outcome:** **Shipped.** Verified in a real browser: heading, lead, and all six cards render. One defect found and fixed during verification — every card had a spurious scrollbar, because `AnimatedBlock`'s `overflow-x-hidden` makes `overflow-y` compute to `auto` and the AOS transform then overflowed. Cards now use `data-aos` directly.

- [ ] **S3 — Section headings are invisible on wide screens** — Status: **Done** — Cycle: 1
  - *(Ledger correction, Cycle 2: this was recorded as `Needs human` but the user authorized it and it shipped in commit `06da2b8`. The tasks file recorded it correctly; this ledger entry was stale. Corrected here so the two agree.)*
  - **Source:** Real-browser measurement during verification, not inspection. `SectionIntro` (`ContentArticle.jsx:120-133`) renders its title in a full-width div at `left: 0`. Confirmed with `getBoundingClientRect()` (title box starts at x=0) and `document.elementFromPoint()` at the title's own line — the topmost element at x=10/60/200/600/1200 is the fixed sidebar, whose inner panel ends at x=1241. So at ≥1280px wide, the **Experience**, **Projects**, and **Education** headings are painted underneath the sidebar and cannot be seen. Skills is unaffected because `SkillsSection` puts its `<h2>` *inside* `ContentSection` instead.
  - **Suggestion:** Move `SectionIntro`'s title inside `ContentWrapper` so all section headings land in the content column.
  - **Why / expected impact:** Three of your section headings are currently invisible to anyone on a desktop monitor — including a director opening the site on a work laptop. It is a one-component fix.
  - **Scope:** `src/components/content/ContentArticle.jsx` — shared by every section.
  - **Outcome:** **Not shipped, deliberately.** It is outside this run's declared scope, and it changes the appearance of three existing sections the night before your interview. You have also said before that you dislike structural fiddling. My two new sections work around it by using the SkillsSection pattern. **Your call** — it is a genuine bug and a small fix, but it is a visual change to shipped sections.

- [ ] **S4 — GitHub bio is out of date** — Status: **Needs human** — Cycle: 1
  - **Source:** Fetched https://github.com/HTJin. Bio reads **"Software Engineer at StarPlus Energy."** Your current title, per `src/content/index.js` and the live site, is **Senior MES DevOps Engineer**.
  - **Suggestion:** Update the GitHub bio to match.
  - **Why / expected impact:** Your site links to GitHub from the sidebar, and interviewers follow those links. Two different titles for the same job is the kind of small inconsistency that costs credibility for no reason. Roughly thirty seconds to fix.
  - **Scope:** External — github.com profile settings.
  - **Outcome:** **Needs human.** Requires your credentials, and how you word your own identity is not the loop's call.

- [ ] **S5 — `public/resume.pdf` currency unverified** — Status: **Done (verified current)** — Cycle: 3
  - **Cycle 3 resolution:** parsed the PDF directly (no guessing). 1 page, 3 fonts, 5,445 characters of extracted text. 3,730 bytes looked alarmingly small at first glance, but that is consistent with a text-only PDF using unembedded base-14 fonts — it is a complete résumé, not a stub.
  - **Consistency against the site:** header title reads **"Senior MES DevOps Engineer"**, matching `meta.role`. All eight roles carry dates matching `experience.js` (Dec 2025–Present, Nov 2024–Nov 2025, Jan 2024–Oct 2024, Oct 2023–Present, Sep–Nov 2023, Mar 2019–May 2020, Sep 2017–Jan 2019). The "2,600+ users" claim matches the site's UI/UX entry. Contact email is `hytjin@gmail.com`, matching the corrected address.
  - **Deliberate differences, not errors:** the PDF omits the Sabbatical entry and the Coding Temple trainee entry that the site carries. That is a normal résumé/portfolio split.
  - **Outcome:** no action needed. Previously parked as Needs human; now resolved by measurement.
  - **Source:** The site's footer serves `/resume.pdf`. This run could not verify that the PDF's titles and dates match the current site content.
  - **Suggestion:** Open it and confirm it matches before tomorrow, since it is the artifact the recruiter already circulated.
  - **Scope:** External to the codebase.
  - **Outcome:** **Needs human.** Guardrails prohibited touching the PDF.

- [ ] **S6 — Contact input rejects what its own placeholder invites** — Status: **Discarded (won't fix)** — Cycle: 2
  - **Cycle 2 measurement (browser, real input):** typed `555-123-4567` into the field. `input.checkValidity()` → `false`; `validationMessage` → *"Please include an '@' in the email address."*; `form.checkValidity()` → `false`. So the constraint mismatch is real and measured, not assumed. But computed style shows no invalid styling applied (`borderColor: rgba(0,0,0,0)`), and the submit handler calls `preventDefault()` before submission, so **constraint validation never runs and no bubble is ever shown** — the mailto fires with whatever was typed.
  - **Why won't-fix rather than a 3-attribute change:** dropping `type="email"`/`required` would make the *pre-hydration* case worse, not better. Before React hydrates there is no click handler, so the button performs a native form submission: today an empty or non-email value produces a harmless validation bubble, whereas with the attributes removed it would perform a useless GET navigation and blank the page. The genuinely correct fix is to move the handler from the button's `onClick` to the form's `onSubmit`, which is a real refactor of the only conversion path — not something to do unattended the night before an interview.
  - **Outcome:** Discarded with evidence. Re-open as an `onSubmit` refactor when there is time to test it properly.
  - **Source:** Code read, `src/components/SignUpForm.jsx:21-30`. The input is `type="email"` and `required`, while the placeholder reads *"Your name / email / number."*
  - **Why it is only Backlog:** I traced the actual behavior rather than assuming it was broken. The submit button's `onClick` calls `preventDefault()`, which cancels form submission *before* constraint validation runs — so a name or phone number still fires the `mailto:`. It is a cosmetic mismatch, not a broken conversion path.
  - **Outcome:** **Deferred.** Not worth touching your only contact path the night before an interview for a cosmetic inconsistency.

- [ ] **S7 — "3FGolf | Remote | Remote" rendered on the live site** — Status: **Done** — Cycle: 2
  - **Source:** Site audit, measured. Queried every `h3` and flagged lines whose `|`-separated segments contained a duplicate. Exactly one hit: `3FGolf | Remote | Remote`.
  - **Cause:** `ExperienceSection.jsx` joined `[company, location, workMode]`, and for the freelance entry `location` and `workMode` are both `"Remote"` (`experience.js`).
  - **Why it matters:** it is on the live site now, in the Experience section, visible to anyone reading it — including a director. Small, but it reads as carelessness on the one page whose job is to look careful.
  - **Outcome:** **Shipped.** Deduped the segments with a `Set`. Verified in the prerendered production HTML: the line now reads `3FGolf | Remote`, and `Remote | Remote` occurs **0** times.

- [ ] **S8 — 17 project links had no accessible name** — Status: **Done** — Cycle: 2
  - **Source:** Site audit, measured. Collected every `<a>` with neither text content nor `aria-label`: 17 results — the GitHub and live-site icon links on all eight projects, plus the header logo link.
  - **Why it matters:** `IconLink` renders an icon and an empty text span, so a screen reader announces these as the bare URL. That is a WCAG 2.4.4 / 4.1.2 failure, and it is the section a hiring manager is most likely to click through.
  - **Outcome:** **Shipped.** Added descriptive `aria-label`s (`"<project> — source on GitHub"`, `"<project> — live site"`, `"Hyun-Tae Jin — home"`). Verified in the prerendered HTML: **18** aria-labelled links, zero remaining without an accessible name. No visual change.

- [ ] **S9 — Heading levels skip H2 → H4 nine times** — Status: **Done** — Cycle: 4
  - **What unblocked it:** Cycle 2 parked this because every fix considered changed how the page looks. That framing was wrong. `entry.lead` is a **date range** ("Dec 2025 - Present") — a date is not a heading at all, so the fix was never a level change: the element simply should not be a heading. Rendered as a `<p>` carrying classes that reproduce the `h4` rules exactly, the outline becomes `h2 → h3` with no skip and nothing moves.
  - **Proved pixel-identical rather than assumed.** Computed styles captured before the change and compared after: `fontSize 14px`, `fontWeight 600`, `color rgb(255,255,255)`, `marginTop 32px`, `marginBottom 0px`, `display block`, `lineHeight 24px`, `width 576`, `height 24`, `left 1085` — **every property identical, zero diffs**. Font family confirmed still Mona Sans.
  - **Both themes:** the date's colour matches the company heading's colour exactly in dark (`rgb(255,255,255)`) and light (`rgb(17,24,39)`), confirming `text-[color:var(--typography-headings)]` resolves as the `h4` did rather than falling back to body colour.
  - **Mobile:** re-verified through the iframe probe at a validated 390px viewport (45 headings found, `innerWidth === 390`) — 0 heading skips, 0 `h4` elements, identical date styling, no horizontal overflow. *(A first probe returned `innerWidth: 0` on an unloaded iframe; its "0 skips" was meaningless rather than a pass, so it was discarded and re-run.)*
  - **Outcome:** heading skips **9 → 0**, `h4` elements **9 → 0**, sequence now `1,2,3,3,3,3,3,3,3,2,3,2,3,2`. Prerendered production HTML contains zero `<h4>` and still renders the date. Build clean.
  - **Source:** Site audit, measured. Extracted the document's heading-level sequence: `1,2,3,3,3,3,3,3,3,2,4,3,2,4,3,…` — every Experience entry emits `h2` (title) → `h4` (date) → `h3` (company), skipping a level nine times and then going backwards.
  - **Why it is parked rather than fixed:** every available fix changes how the page looks, and which tradeoff to take is a taste call. Promoting the date to `h3` inherits `typography.css`'s `h3` rules (`font-size: base`, `display: flex`) and visibly enlarges the date line on nine entries. Demoting it to `<p>` loses the display font, semibold weight, heading colour and the `2rem` top margin. Reordering the DOM so levels ascend moves the date below the company line. Guardrails for this run prohibit unattended visual churn on shipped sections, and there is no correct answer to guess at.
  - **Recommendation:** promote the date line to `h3` and add a small utility class to hold its current size. Two-line change, but it should be seen before it ships.

- [ ] **S10 — Every outbound link resolves** — Status: **Done (verified, no action)** — Cycle: 3
  - **Source:** extracted every `https://` URL from `src/content/*.js` and issued real HTTP requests with redirects followed.
  - **Result:** `github.com/HTJin` 200 · `htae.dev` 200 · `credly.com/users/hyun-tae-jin` 200 · `joincolab.io/certificate/hyun-tae-jin` 200 · `linkedin.com/in/htjin` **999**.
  - **On the 999:** that is LinkedIn's standard anti-automation response to non-browser clients, *not* a broken link. Reporting it as dead would be a false positive, so it is not being reported as one.
  - **Outcome:** no dead links. A director clicking through from the site will not hit a 404.

- [ ] **S11 — Mobile layout verified at 390px (standing gap closed)** — Status: **Done (verified, no defects)** — Cycle: 3
  - **The problem:** Cycles 1 and 2 could never verify mobile. `resize_window` reports success but `innerWidth` stays 1920 — the Chrome window is maximised and ignores the resize. Three attempts, three failures. Every prior audit was desktop-only at 2545px, and the report said so rather than claiming otherwise.
  - **How it was solved:** injected a 390×844 same-origin `<iframe>`. An iframe has its own viewport, so CSS media queries evaluate against *its* width — a genuine mobile render rather than a simulation. Confirmed real: `iframe.innerWidth === 390` and `matchMedia('(min-width: 640px)').matches === false`.
  - **Results:** no horizontal overflow (`scrollWidth` 375 == `clientWidth` 375). The "How I work" grid collapses to a single 327px column, so `sm:grid-cols-2` is correctly inactive. Six cards, 14px body text. About paragraphs 327px. All six section anchors present; both new headings render. Side nav sits at x 272–292, inside the viewport.
  - **Outcome:** no mobile defects. The elements that extend past 390px are all SVG decoration (StarField, Glow) clipped by `overflow-hidden` parents, which is why the document does not scroll sideways.

- [ ] **S12 — The interview may be TODAY, not tomorrow** — Status: **Needs human — time-critical** — Cycle: 3
  - **Source:** the machine clock, read during this cycle: **Tue, Aug 4, 2026, 01:29 AM**.
  - **The conflict:** Cursor message [888] says *"next up is tuesday at 1pm with the director."* **August 4 2026 is a Tuesday** — which puts that interview at roughly **11.5 hours from that timestamp**. But in this session Hyun-Tae said the interview is "tomorrow", which would be Wednesday August 5. Both statements are his; they cannot both be right.
  - **Why it matters:** every tracking file in this run has asserted 2026-08-05. If the real slot is Tuesday 1pm, then the GitHub-bio fix, the résumé check, and any decision to deploy are due **this morning**, not tonight.
  - **The loop will not guess this**, and it has stopped asserting 2026-08-05 as fact. Confirm the date before relying on anything in these files.

- [ ] **S13 — None of this run's work is visible to anyone yet** — Status: **Needs human — highest leverage item in the run** — Cycle: 4
  - **Source:** fetched the live https://htae.dev and diffed it against the branch, rather than assuming.
  - **What is live right now:** `"How I work"` → **0** occurrences. `"Off the résumé"` → **0**. `"Remote | Remote"` (the Cycle 2 bug) → **still present, 1 occurrence**. `aria-label` count → **1** (the branch has 18). The invisible section headings are still invisible.
  - **What this means:** every fix from Cycles 1–4 — the two new sections, the invisible headings, the duplicated location line, the 17 unnamed links, the heading outline — exists only on `update/stellix-prep`. A director opening htae.dev today sees **none of it**, and still sees the defects.
  - **Why the loop will not resolve this itself:** deploying is explicitly prohibited by the Guardrails block for this run, and that prohibition is correct — publishing to a live personal site before an interview is his call, not the loop's.
  - **Outcome:** parked. This is the one action that converts four cycles of work into something a hiring manager can actually see.

- [ ] **S14 — 16 MB of project screenshots in the repo** — Status: **Backlog (measure before acting)** — Cycle: 4
  - **Source:** `public/images/projects` totals **16 MB**; the largest single PNGs are 2,088 KB (car-inventory), 1,904 KB and 1,628 KB (matrimoni-react).
  - **Important caveat, stated rather than glossed:** these are *source* files. The site renders them through `next/image` with `sizes` set, so Chrome is served resized WebP, not the 2 MB original. **The user-facing transfer has not been measured**, so this is explicitly *not* being reported as a performance defect — only as a repo-weight observation.
  - **Why not acted on:** `public/` is outside this run's declared scope, and re-encoding source images is exactly the kind of lossy, awkward-to-undo change that should not happen unattended.
  - **Next step if picked up:** measure the actual `/_next/image` transfer sizes first; only then decide whether anything needs re-encoding.

*(Check the box once you've reviewed the outcome.)*

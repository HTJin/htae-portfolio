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

- [ ] **S3 — Section headings are invisible on wide screens** — Status: **Needs human** — Cycle: 1
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

- [ ] **S5 — `public/resume.pdf` currency unverified** — Status: **Needs human** — Cycle: 1
  - **Source:** The site's footer serves `/resume.pdf`. This run could not verify that the PDF's titles and dates match the current site content.
  - **Suggestion:** Open it and confirm it matches before tomorrow, since it is the artifact the recruiter already circulated.
  - **Scope:** External to the codebase.
  - **Outcome:** **Needs human.** Guardrails prohibited touching the PDF.

- [ ] **S6 — Contact input rejects what its own placeholder invites** — Status: **Backlog** — Cycle: 1
  - **Source:** Code read, `src/components/SignUpForm.jsx:21-30`. The input is `type="email"` and `required`, while the placeholder reads *"Your name / email / number."*
  - **Why it is only Backlog:** I traced the actual behavior rather than assuming it was broken. The submit button's `onClick` calls `preventDefault()`, which cancels form submission *before* constraint validation runs — so a name or phone number still fires the `mailto:`. It is a cosmetic mismatch, not a broken conversion path.
  - **Outcome:** **Deferred.** Not worth touching your only contact path the night before an interview for a cosmetic inconsistency.

*(Check the box once you've reviewed the outcome.)*

# Dev journal — 2026-08-05

One line per task as it completes.

- **Cycle 1 · T1** — `route.js` project stops now carry every screenshot as `images[]` (plus `site`), not just `screenshots[0]`. — `8883aaa`
- **Cycle 1 · T2** — New `ProjectShots`: browser-chrome frame at the captures' native 2:1 with `object-contain`, 900ms cross-fade on a 4.2s timer, dots, hover/focus pause, reduced-motion fallback. — `8883aaa`
- **Cycle 1 · T3** — `StopCard` rebuilt: interstate exit shield, media|prose split at `lg`, projects up from the dash, and re-bounded so it clears the rear-view mirror. — `8883aaa`
- **Cycle 1 · T4** — Cockpit rebuilt on real driver geometry: wheel on the driver's axis, hooded binnacle behind it, dash grain, cowl, vents, bonnet, meaningful tell-tales, PRND, terminal centre screen, tilted pedals. — `646b717`
- **Cycle 1 · T4b** — Separate stacked cockpit for phones (cluster strip / screen / controls+pedals in one thumb row); the side-by-side dash overflowed badly at 390px. — `646b717`
- **Cycle 1 · fix** — The per-frame `style.transform` on the wheel was overwriting Tailwind's `-translate-x-1/2`, so the wheel rendered ~180px off its own axis. Centring moved to a wrapper; rotation stays on the svg. — `646b717`
- **Cycle 1 · fix** — A `display: flex` in the CSS module out-ordered Tailwind's `.hidden`, leaking the outboard vents onto the phone layout. `display` moved into the component's utility classes. — `646b717`
- **Cycle 2 · verify** — Chrome came back to the foreground, so all three parked cycle-1 checks were cleared: cold-load hydration (clean), phone title clamp (2 lines, genuinely clamped), reduced-motion carousel (autoplay off, dots still work).
- **Cycle 2 · fix** — Found `line-clamp-2` and `lg:truncate` generating zero CSS: a corrupted `.next` webpack cache was serving stale CSS. `npm run dev:fresh` restored both. Not a Tailwind/config fault.
- **Cycle 2 · T1** — New `daylight.js`: the route now passes time. Golden-hour dusk at MILE 0 → twilight → full night by the toolbox → first light at the destination. Sky, road, verge, haze, lamps and signs all follow it. — `dd4b28b`
- **Cycle 2 · T2** — Exit signs rebuilt as real guide signs: MUTCD exit plaque, twin posts, retroreflective flare + headlight sheen, palette-aware green. — `86d0174`
- **Cycle 2 · T3** — `/drive?exit=11` deep-links an exit; the URL tracks the exit as you travel; junk falls back to MILE 0. — `0d3e493`
- **Cycle 3 · T1** — Trip computer now reads the year, not just miles: 2016 at school through 2025 at StarPlus, then `NOW`. Projects/toolbox/destination have no dates so they never get a fabricated one. — `94eea90`
- **Cycle 3 · fix** — `new Date('YYYY-MM-DD').getFullYear()` reads UTC midnight in local time, so Jan 1st dates report the previous year. The StarPlus UI/UX role ("Jan 2024 - Oct 2024") was showing 2023. Year is now read off the string. — `94eea90`
- **Cycle 3 · T2** — Each leg has its own roadside: guardrail + thinned lamps on the scenic overlook, lights thinned further across the sabbatical. Logic proven by SSR probe; pixels parked as Needs testing. — `c209b57`
- **Cycle 3 · env** — Chrome can no longer reach the dev server on any host/port (curl can). Switched to SSR probes for real-execution verification.
- **Cycle 4 · T1** — Swept every date call site in `src/`. The classic site is clean: `FormattedDate` already pins `timeZone: 'UTC'`. `route.js` was the only affected place and it was fixed in cycle 3. No change needed.
- **Cycle 4 · T2** — Found `/drive` shipping **two** canonical tags, the first pointing at the homepage, plus duplicate `og:url`/`og:title`. Fix belongs in `_app.jsx`, outside write scope → parked as Needs human with an exact patch.
- **Cycle 4 · T3** — The crawlable itinerary now groups stops by leg (h1→h2→h3) and carries a `<time>` year for each of the ten dated stops; the eleven undated ones carry none. — `e799e92`
- **Cycle 5 · T1** — Cockpit now reads properly to screen readers: 10/11 controls named (the 11th self-names), and the gauges, gear selector and trip screen removed from the accessibility tree. — `5fcf996`
- **Cycle 5 · T2** — `/drive` was serving two `<h1>`s; the transient ignition splash is now an `<h2>`. — `5fcf996`
- **Cycle 5 · T3** — `/drive` is absent from `public/sitemap.xml`. Out of write scope → Needs human with an exact patch; it compounds with the cycle-4 canonical defect.
- **Cycle 5 · env** — Chrome still unreachable (3rd cycle). Dev server also hung mid-cycle on a poisoned `.next`; `dev:fresh` cleared it.
- **Cycle 6 · unblock** — The network blocker cleared: Chrome reached a production build on :3008 and drove the route. Cycles 3-5 had been pixel-blind.
- **Cycle 6 · verify** — Cleared the cycle-3 parked item: the overlook guardrail renders as one continuous seam-free ribbon, lamps thin on the overlook and thin further across the sabbatical, no guardrail elsewhere. Frame-rate still unmeasurable (rAF pauses in a background tab).
- **Cycle 6 · false alarm** — `?exit=` looked broken on `next dev`; the real cause was that React never hydrated (body.overflow unset, chunks all 200, no console error). Same commit on a production build worked perfectly. No code defect. Now guardrail 23.
- **Cycle 7 · T1** — Oncoming headlights on the far carriageway: deterministic, pre-allocated, clamped frame delta, palette-tinted. Proven by a controlled pixel diff (12,564 samples changed in the approach path while parked). — `ff1f8d9`
- **Cycle 7 · T2** — Mile markers every half-leg. First pass rendered ~2x1 pixels and was invisible; enlarged and set outboard until they read as green plates distinct from the delineator posts. — `ff1f8d9`
- **Cycle 8 · T1** — A returning visitor is now *offered* their furthest exit on the ignition screen ("Resume · EXIT 13") with "Forget my progress" beside it — never auto-jumped. `?exit=` always wins. Storage is versioned, id-validated, forward-only and fully wrapped. — `4ebe999`

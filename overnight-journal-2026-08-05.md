# Dev journal — 2026-08-05

One line per task as it completes.

- **Cycle 1 · T1** — `route.js` project stops now carry every screenshot as `images[]` (plus `site`), not just `screenshots[0]`. — `8883aaa`
- **Cycle 1 · T2** — New `ProjectShots`: browser-chrome frame at the captures' native 2:1 with `object-contain`, 900ms cross-fade on a 4.2s timer, dots, hover/focus pause, reduced-motion fallback. — `8883aaa`
- **Cycle 1 · T3** — `StopCard` rebuilt: interstate exit shield, media|prose split at `lg`, projects up from the dash, and re-bounded so it clears the rear-view mirror. — `8883aaa`
- **Cycle 1 · T4** — Cockpit rebuilt on real driver geometry: wheel on the driver's axis, hooded binnacle behind it, dash grain, cowl, vents, bonnet, meaningful tell-tales, PRND, terminal centre screen, tilted pedals. — `646b717`
- **Cycle 1 · T4b** — Separate stacked cockpit for phones (cluster strip / screen / controls+pedals in one thumb row); the side-by-side dash overflowed badly at 390px. — `646b717`
- **Cycle 1 · fix** — The per-frame `style.transform` on the wheel was overwriting Tailwind's `-translate-x-1/2`, so the wheel rendered ~180px off its own axis. Centring moved to a wrapper; rotation stays on the svg. — `646b717`
- **Cycle 1 · fix** — A `display: flex` in the CSS module out-ordered Tailwind's `.hidden`, leaking the outboard vents onto the phone layout. `display` moved into the component's utility classes. — `646b717`

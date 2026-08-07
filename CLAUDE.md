# Working in this repo

## Always run `npm run prettier` after changing code

Every code change gets `npm run prettier` before it is committed — no exceptions, including one-line edits and
changes made mid-review. The script is `prettier --write .`.

Do it _after_ the edit and _before_ `git add`, so formatting never lands as a separate follow-up commit or as noise
in the next person's diff.

**Know that `npm run prettier` is `prettier --write .` — it formats the whole repo, not just what you touched.**
That is usually what you want. It is _not_ what you want when you are working under a restricted scope: it will
happily reformat files you were told to leave alone, and that reformatting is a real change even though you did not
intend it. When scope matters, format only your own files:

```
npx prettier --write src/components/drive src/styles/drive.module.css
```

Then check nothing else moved: `git diff --numstat -- src/` should list only the files you meant to change.

## Verify by running, not by reading

A change is not done because it looks right. Run it: `npm run build`, `npm run lint`, and exercise the actual page
in a browser. A present file, a stub, or a passing empty test is not evidence.

Two traps this repo has produced repeatedly:

- **`npm run build` while `npm run dev` is live** clobbers the dev server's route manifest — they share `.next`. If a
  Tailwind class looks inert, run `npm run dev:fresh` (wipes `.next`) before concluding the class or the config is at
  fault.
- **Port 3000 is usually taken.** Confirm the real port from the dev-server log; production checks use
  `npm run build` then `PORT=3008 npm run start`.

## Measuring the drive scene

`/drive` is a canvas scene driven by a 60fps loop, which makes it easy to produce a confident, wrong number. Seven
separate measurements during one long run looked like defects and were the instrument, not the site. Every one had
one of these causes:

- **Don't measure a property the background also has.** "Count flower-coloured pixels" matched the sunset sky and
  reported planting where none existed. Fixed by temporarily repainting the flowers a colour no palette contains
  (magenta), measuring, then reverting.
- **Check what your reference actually is.** A "sky" colour sampled above the horizon turned out to be the
  embankment, so everything compared against it was meaningless.
- **When a selector can match more than one thing, count the matches first.** `querySelector('.sr-only')` returns
  the skip link, not the itinerary — there are three. The same mistake produced "the cluster is 40px off", "29 of 35
  controls have no border" and "the trip summary is missing", none of which were real.
- **Always run a control that must come out different.** Without one, "no animation" is indistinguishable from a
  harness that did nothing, and "zero hits" from a broken detector.
- **Sample the transition, not the endpoints.** Ramp faults live mid-descent. Checks taken parked at a stop or out
  on the open mainline — where the ramp offset is at its extremes — missed three separate defects in a row.
- **Check the direction of a result before believing its size.** More planting where there is no slope is
  impossible; noticing that is what exposed the detector rather than the data.

Two environment limits worth knowing before trying: `requestAnimationFrame` is paused in a hidden tab, and React's
scheduler is not driven by rAF — pumping frames does not flush a re-render, so give it real time before asserting on
the DOM.

## Windows PowerShell notes

- `Get-Content` / `Set-Content` read BOM-less UTF-8 as ANSI in Windows PowerShell 5.1. **Never round-trip a source
  file through the shell** — it turns em-dashes into mojibake. Use an editor.
- The same applies to reading: a file can _display_ as corrupted in the shell while being perfectly fine on disk.

## Scope

`src/content/**` and `src/lib/projects.js` are the owner's content. Treat them as read-only: adding a derived or
optional field is fine, rewriting the copy is not.

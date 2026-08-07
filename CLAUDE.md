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

## Windows PowerShell notes

- `Get-Content` / `Set-Content` read BOM-less UTF-8 as ANSI in Windows PowerShell 5.1. **Never round-trip a source
  file through the shell** — it turns em-dashes into mojibake. Use an editor.
- The same applies to reading: a file can _display_ as corrupted in the shell while being perfectly fine on disk.

## Scope

`src/content/**` and `src/lib/projects.js` are the owner's content. Treat them as read-only: adding a derived or
optional field is fine, rewriting the copy is not.

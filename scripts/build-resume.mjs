/**
 * Generate public/resume.pdf from the rendered site.
 *
 * `src/content/experience.js` is the single source of truth. Printing the page a
 * browser actually renders means the PDF cannot drift from htae.dev, which is the
 * failure mode a hand-maintained PDF always ends in.
 *
 * Shells out to `bunx playwright pdf` rather than importing playwright, so this
 * repo gains no dependency. Playwright is installed globally on this machine and
 * is its sanctioned browser tool. Headless, so no window appears.
 *
 *   bun run resume                                  # renders the /resume print route
 *   RESUME_URL=https://htae.dev bun run resume      # against production
 */
import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";

const url = process.env.RESUME_URL || "http://127.0.0.1:3031/resume";
const out = resolve(process.env.RESUME_OUT || "public/resume.pdf");
const before = existsSync(out) ? statSync(out).size : 0;

execFileSync(
  "bunx",
  ["playwright", "pdf", "--paper-format", "Letter", "--wait-for-timeout", "4000", url, out],
  { stdio: "inherit", shell: true },
);

if (!existsSync(out)) throw new Error(`playwright reported success but ${out} is missing`);
const after = statSync(out).size;
if (after < 10_000) throw new Error(`${out} is only ${after} bytes, the page probably rendered blank`);

console.log(`\nwrote ${out}`);
console.log(`  source ${url}`);
console.log(`  size   ${before} -> ${after} bytes`);

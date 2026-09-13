# htae-portfolio

The source of [htae.dev](https://htae.dev), my portfolio site.

## What is on the page

One page, four sections, each driven by a content file rather than markup:

| Section | Content file | Component |
|---|---|---|
| Experience | `src/content/experience.js` | `src/components/sections/ExperienceSection.jsx` |
| Projects | `src/content/projects.js` | `src/components/sections/ProjectsSection.jsx` |
| Skills | `src/content/skills.js` | `src/components/sections/SkillsSection.jsx` |
| Education | `src/content/education.js` | `src/components/sections/EducationSection.jsx` |

Longer pieces are MDX under `mdx/`, rendered through `ContentArticle.jsx` with the remark,
rehype and recma plugins in the repo root. Light and dark themes come from `next-themes`.
Section transitions use Framer Motion.

## Stack

Next.js 13 (pages router), React 18, Tailwind CSS, Framer Motion, MDX, `next-themes`.
Deployed on Vercel.

## Run it

```bash
bun install
bun run dev      # http://localhost:3000
bun run build
```

## SEO

`b7ea4b5` added Open Graph and Twitter meta, a sitemap and JSON-LD structured data, so
the page previews correctly when linked and is indexed with the right title.

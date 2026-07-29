Portfolio site for [htae.dev](https://htae.dev), built with Next.js and Tailwind CSS.

## Updating content

Site copy lives in plain JavaScript files under `src/content/` — no MDX required.

| File                        | What to edit                                        |
| --------------------------- | --------------------------------------------------- |
| `src/content/index.js`      | Name, tagline, email, links, page title/description |
| `src/content/skills.js`     | Skills groups                                       |
| `src/content/experience.js` | Work history                                        |
| `src/content/education.js`  | Degree and certifications                           |
| `src/lib/projects.js`       | Project showcase cards                              |
| `public/resume.pdf`         | Downloadable resume                                 |

See `src/content/README.md` for more detail.

## Development

```bash
npm install
npm run dev
```

## References

- [Tailwind CSS](https://tailwindcss.com/docs)
- [Next.js](https://nextjs.org/docs)
- [Motion One](https://motion.dev/)

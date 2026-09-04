import Head from 'next/head'
import { meta } from '@/content'
import { experience } from '@/content/experience'
import { skills } from '@/content/skills'
import { education } from '@/content/education'

/**
 * Print-only resume route. `scripts/build-resume.mjs` renders this to
 * public/resume.pdf.
 *
 * It exists because printing the portfolio home page produced a 12 page, 40
 * image PDF: the site is a dark, animated, image-heavy page, and none of that
 * belongs on paper. This route reads the same content modules, so the PDF still
 * cannot drift from the site, but it lays them out for Letter: black on white,
 * system fonts, no images, no navigation.
 */
/**
 * Collapse consecutive roles at the same employer into one block.
 *
 * Three separate "StarPlus Energy" headers read as three employers to a human and
 * waste the vertical space that made the page look empty. One company header with
 * the roles stacked under it is the standard progression format, and it shows a
 * promotion track rather than hiding it.
 *
 * Consecutive only. A company the owner returned to after working elsewhere is a
 * genuinely separate stint and should print as one.
 */
/**
 * A career break is not an employer.
 *
 * The sabbatical entry stores 'Health and well-being' in the `company` slot, which the
 * site renders fine but a resume does not: it prints in the employer position, in
 * sentence case next to StarPlus Energy and Checkmate Digital, reading like a firm
 * nobody has heard of. A recruiter scanning the left column sees a tenth job.
 *
 * Detected structurally rather than by name: a real role carries bullets or a work
 * mode, a break carries neither.
 */
function isCareerBreak(job) {
  return !job.bullets?.length && !job.workMode
}

function groupByCompany(list) {
  const out = []
  for (const job of list) {
    const last = out[out.length - 1]
    if (last && last.company === job.company) {
      last.roles.push(job)
      continue
    }
    out.push({
      key: `${job.company}-${job.id}`,
      company: isCareerBreak(job) ? 'Career Break' : job.company,
      place: [job.location, job.workMode].filter(Boolean).join(' / '),
      roles: [job],
      isBreak: isCareerBreak(job),
    })
  }
  return out
}

export default function Resume() {
  return (
    <>
      <Head>
        <title>{`${meta.name} - Resume`}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="resume">
        <header>
          <h1>{meta.name}</h1>
          <p className="headline">{meta.role}</p>
          <p className="contact">
            {meta.email} / {meta.siteUrl.replace(/^https?:\/\//, '')}
          </p>
        </header>

        <section>
          <h2>Summary</h2>
          <p className="summary">{meta.resumeSummary}</p>
        </section>

        <section>
          <h2>Experience</h2>
          {groupByCompany(experience).map((group) => (
            <article key={group.key}>
              <div className="row company">
                <strong>{group.company}</strong>
                <span className="when">{group.place}</span>
              </div>
              {group.roles.map((job) => (
                <div className="role" key={job.id}>
                  <div className="row">
                    <span className="title">{job.title}</span>
                    <span className="when">{job.lead}</span>
                  </div>
                  {/* The sabbatical entry carries `drawer`, a personal narrative, and no
                      `bullets`. Four paragraphs of it do not belong on a resume, but dropping
                      the entry would leave an unexplained 2020 to 2023 gap, which is the one
                      thing it exists to answer. So it prints as a single line. */}
                  {job.bullets?.length ? (
                    <ul>
                      {job.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </article>
          ))}
        </section>

        <section>
          <h2>Skills</h2>
          {skills.map((group) => (
            <p key={group.id} className="skill">
              <strong>{group.title}:</strong> {group.items}
            </p>
          ))}
        </section>

        <section>
          <h2>Education</h2>
          <div className="row">
            <strong>{education.school}</strong>
            <span className="when">{education.location}</span>
          </div>
          <p className="skill">{education.degree}</p>
        </section>
      </main>

      <style jsx global>{`
        @page {
          size: letter;
          margin: 0.5in;
        }
        /* _app.jsx wraps every route in the site shell, so the rotated section rail
           and the empty layout column follow this page onto the paper. The resume is
           the only child that belongs here. */
        #__next > *:not(.resume) {
          display: none !important;
        }
        html,
        body {
          background: #fff !important;
          color: #000 !important;
        }
        .resume {
          /* Arial is on every ATS-safe font list and is guaranteed present in the
             headless Chromium that prints this. Georgia was not on any of them. */
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10pt; /* guidance floor is 10pt; this was 9.5 and parsed small */
          line-height: 1.32;
          max-width: 7.5in;
          margin: 0 auto;
          padding: 0.15in 0;
          text-align: left; /* never justify: ragged right parses more reliably */
        }
        .resume h1 {
          font-size: 21pt;
          margin: 0;
          letter-spacing: -0.01em;
        }
        .resume .headline {
          font-size: 11.5pt;
          margin: 0.03in 0 0;
        }
        .resume .contact {
          font-size: 9.5pt;
          margin: 0.03in 0 0.13in;
          color: #333;
        }
        .resume h2 {
          font-size: 11pt;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          border-bottom: 1.2px solid #000;
          padding-bottom: 2px;
          margin: 0.14in 0 0.06in;
        }
        .resume .summary {
          margin: 0;
        }
        .resume article {
          margin-bottom: 0.09in;
          break-inside: avoid;
        }
        .resume .row {
          display: flex;
          justify-content: space-between;
          gap: 0.2in;
        }
        .resume .row.company {
          font-size: 11pt;
          margin-bottom: 0.01in;
        }
        /* Each role, and its bullets, steps in from the employer. That step is the
           hierarchy the previous version was missing: company, then role, then evidence. */
        .resume .role {
          margin: 0.03in 0 0.05in 0.16in;
        }
        .resume .title {
          font-weight: bold;
        }
        .resume .when {
          white-space: nowrap;
          color: #333;
        }
        /* Tailwind preflight sets list-style-type: none globally, so this needs
           !important. outside gives a true hanging indent: the marker sits in the
           margin and wrapped lines align under the text, not under the bullet. */
        .resume ul {
          list-style: disc outside !important;
          margin: 0.03in 0 0;
          padding-left: 0.2in;
        }
        .resume li {
          list-style: disc outside !important;
          margin-bottom: 0.02in;
          padding-left: 0.03in;
        }
        .resume .skill {
          margin: 0 0 0.03in;
        }
      `}</style>
    </>
  )
}

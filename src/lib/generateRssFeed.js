import { mkdir, writeFile } from 'fs/promises'
import { Feed } from 'feed'
import { education } from '@/content/education'
import { experience } from '@/content/experience'
import { meta } from '@/content'

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function renderBullets(bullets = []) {
  if (!bullets.length) {
    return ''
  }

  return `<ul>${bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>`
}

function renderParagraphs(paragraphs = []) {
  return paragraphs
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join('')
}

function renderExperienceArticle(entry) {
  const locationLine = [entry.company, entry.location, entry.workMode]
    .filter(Boolean)
    .join(' | ')

  const body = [
    `<h2>${escapeHtml(entry.title)}</h2>`,
    entry.lead ? `<h4>${escapeHtml(entry.lead)}</h4>` : '',
    `<h3>${escapeHtml(locationLine)}</h3>`,
    renderBullets(entry.bullets),
    renderParagraphs(entry.drawer),
  ].join('')

  const metadata = JSON.stringify({
    id: entry.id,
    title: entry.title,
    date: entry.date,
  })

  return `<article id="${entry.id}"><script type="text/metadata">${metadata}</script>${body}</article>`
}

function renderEducationArticle() {
  const title = `${education.school} | ${education.location}`
  const body = `<h2>${escapeHtml(title)}</h2><p>${escapeHtml(education.degree)}</p>`
  const metadata = JSON.stringify({
    id: 'university-of-pittsburgh',
    title,
    date: education.date,
  })

  return `<article id="university-of-pittsburgh"><script type="text/metadata">${metadata}</script>${body}</article>`
}

export async function generateRssFeed() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const author = {
    name: meta.name,
    email: meta.email,
  }

  const feed = new Feed({
    title: 'Portfolio',
    description: meta.pageDescription,
    author,
    id: siteUrl,
    link: siteUrl,
    image: `${siteUrl}/favicon.ico`,
    favicon: `${siteUrl}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}`,
    feedLinks: {
      rss2: `${siteUrl}/rss/feed.xml`,
    },
  })

  const articles = [...experience.map(renderExperienceArticle), renderEducationArticle()]

  for (const article of articles) {
    const metaMatch = article.match(/<script type="text\/metadata">(.*?)<\/script>/)
    const itemMeta = JSON.parse(metaMatch[1])
    const url = `${siteUrl}/#${itemMeta.id}`

    feed.addItem({
      title: itemMeta.title,
      id: url,
      link: url,
      content: article,
      author: [author],
      contributor: [author],
      date: new Date(itemMeta.date),
    })
  }

  await mkdir('./public/rss', { recursive: true })
  await writeFile('./public/rss/feed.xml', feed.rss2(), 'utf8')
}

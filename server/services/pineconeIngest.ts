// server/services/pineconeIngest.ts
import fs from 'fs'
import path from 'path'
import { OpenAI } from 'openai'
import { Pinecone } from '@pinecone-database/pinecone'
import dotenv from 'dotenv'
import { LoggerService } from './logger/LoggerService.js'

dotenv.config()

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY || '' })

const PINECONE_INDEX = process.env.PINECONE_INDEX || 'ai-world-predictions'
const filePath = path.join(process.cwd(), 'server/webScraping/outputs/entertainment_data.json')

function extractMetadata(article: any): {
  title: string
  author: string
  date: string
  url: string
  summary: string
} {
  const title =
    article.title ||
    article.headline ||
    article?.main_article_details?.headline ||
    article?.main_article?.title ||
    'Untitled'
  const author = article.author || article.byline || article?.main_article_details?.author || 'Unknown'
  const date =
    article.date ||
    article.publication_date ||
    article?.main_article_details?.date ||
    article?.main_article?.publication_date ||
    article?.key_dates?.[0]?.date ||
    'Unknown'
  const url =
    article.url ||
    article.link ||
    article?.source_urls?.[0] ||
    article?.source_links?.[0] ||
    article?.main_article_details?.publications?.[0]?.link ||
    'https://unknown-source'
  const summary = article.summary || article.content || article.content_summary || JSON.stringify(article)

  return {
    title: typeof title === 'string' ? title : 'Untitled',
    author: typeof author === 'string' ? author : 'Unknown',
    date: typeof date === 'string' ? date : 'Unknown',
    url: typeof url === 'string' ? url : 'https://unknown-source',
    summary: typeof summary === 'string' ? summary : JSON.stringify(summary),
  }
}

export async function ingestEntertainmentArticles() {
  try {
    const rawData = fs.readFileSync(filePath, 'utf-8')
    const articles = JSON.parse(rawData)

    const index = pinecone.Index(PINECONE_INDEX)

    const flattenedArticles = flattenArticles(articles)

    const vectors = await Promise.all(
      flattenedArticles.map(async (article: any, i: number) => {
        const meta = extractMetadata(article)

        const input = `Title: ${meta.title}\nAuthor: ${meta.author}\nDate: ${meta.date}\nSummary: ${meta.summary}`

        const embedding = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input,
        })

        const metadata = {
          title: meta.title,
          author: meta.author,
          date: meta.date,
          url: meta.url,
        }

        return {
          id: `article-${i}-${Date.now()}`,
          values: embedding.data[0].embedding,
          metadata,
        }
      })
    )

    await index.upsert(vectors)
    LoggerService.info(`✅ Successfully upserted ${vectors.length} articles to Pinecone.`)
  } catch (error) {
    LoggerService.error(`🆘 Failed to upsert articles to Pinecone: ${error}`)
  }
}

function flattenArticles(data: any): any[] {
  const articles: any[] = []

  function recurse(obj: any) {
    if (!obj || typeof obj !== 'object') return
    if (Array.isArray(obj)) {
      obj.forEach(recurse)
    } else {
      const hasTitleOrContent = 'title' in obj || 'summary' in obj || 'content' in obj || 'headline' in obj
      if (hasTitleOrContent) articles.push(obj)

      Object.values(obj).forEach(recurse)
    }
  }

  recurse(data)
  return articles
}

if (process.argv[1].includes('pineconeIngest.ts')) {
  ingestEntertainmentArticles()
}

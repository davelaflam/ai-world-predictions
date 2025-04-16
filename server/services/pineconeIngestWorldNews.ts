import fs from 'fs'
import { Pinecone } from '@pinecone-database/pinecone'
import { OpenAI } from 'openai'
import dotenv from 'dotenv'
import path from 'path'
import { LoggerService } from './logger/LoggerService.js'
import { getAuthor, getDate, getSummary, getTitle, getUrl } from './utils/extractMetadata.js'

dotenv.config()

const PINECONE_INDEX = process.env.PINECONE_INDEX || 'ai-world-predictions'
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY || '' })
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const filePath = path.join(process.cwd(), 'server/webScraping/outputs/world_news_data.json')

export async function ingestWorldNewsArticles() {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const articles = JSON.parse(raw)
    const index = pinecone.Index(PINECONE_INDEX)

    const vectors = await Promise.all(
      articles.map(async (article: any, i: number) => {
        const title = getTitle(article)
        const author = getAuthor(article)
        const date = getDate(article)
        const url = getUrl(article)
        const summary = getSummary(article)

        const input = `Title: ${title}\nAuthor: ${author}\nDate: ${date}\nSummary: ${summary}`
        const embedding = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input,
        })

        return {
          id: `world-${i}-${Date.now()}`,
          values: embedding.data[0].embedding,
          metadata: { title, author, date, url },
        }
      })
    )

    await index.upsert(vectors)
    LoggerService.info(`✅ Upserted ${vectors.length} world news articles.`)
  } catch (error) {
    LoggerService.error(`🆘 Failed to upsert world news: ${error}`)
  }
}

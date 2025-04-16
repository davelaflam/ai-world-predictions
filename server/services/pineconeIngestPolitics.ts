import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { Pinecone } from '@pinecone-database/pinecone'
import { OpenAI } from 'openai'
import { LoggerService } from './logger/LoggerService.js'
import { getTitle, getAuthor, getDate, getUrl, getSummary } from './utils/extractMetadata.js'

dotenv.config()

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY || '' })
const PINECONE_INDEX = process.env.PINECONE_INDEX || 'ai-world-predictions'
const filePath = path.join(process.cwd(), 'server/webScraping/outputs/politics_data.json')

export async function ingestPoliticsArticles() {
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
          id: `politics-${i}-${Date.now()}`,
          values: embedding.data[0].embedding,
          metadata: { title, author, date, url },
        }
      })
    )

    await index.upsert(vectors)
    LoggerService.info(`✅ Upserted ${vectors.length} politics articles.`)
  } catch (error) {
    LoggerService.error(`🆘 Failed to upsert politics: ${error}`)
  }
}

import fs from 'fs'
import path from 'path'
import { Pinecone } from '@pinecone-database/pinecone'
import { OpenAI } from 'openai'
import dotenv from 'dotenv'
import { LoggerService } from './logger/LoggerService.js'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../../../../.env') })

const pineconeApiKey = process.env.PINECONE_API_KEY || ''
const indexName = process.env.PINECONE_INDEX || 'ai-world-predictions'
const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

let pinecone: Pinecone | null = null
let index: any = null

export async function initializePinecone(): Promise<boolean> {
  if (!pineconeApiKey) throw new Error('PINECONE_API_KEY not found')
  pinecone = new Pinecone({ apiKey: pineconeApiKey })
  index = pinecone.Index(indexName)
  await index.describeIndexStats()
  LoggerService.info('✅ Pinecone initialized')
  return true
}

async function getEmbedding(text: string): Promise<number[]> {
  const response = await openaiClient.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return response.data[0].embedding
}

function extractArticlesFromData(data: any): any[] {
  const results: any[] = []

  function walk(obj: any) {
    if (!obj || typeof obj !== 'object') return
    if (Array.isArray(obj)) {
      obj.forEach(walk)
    } else {
      const isArticle = obj.title || obj.headline || obj.summary || obj.content
      if (isArticle) results.push(obj)
      Object.values(obj).forEach(walk)
    }
  }

  walk(data)
  return results
}

export async function loadAllData(): Promise<void> {
  const outputsDir = path.join(__dirname, '../webScraping/outputs')
  const files = {
    'entertainment_data.json': 'entertainment',
  }

  for (const [file, type] of Object.entries(files)) {
    const filePath = path.join(outputsDir, file)
    if (fs.existsSync(filePath)) {
      await loadJsonData(filePath, type)
    } else {
      LoggerService.warning(`⚠️ File missing: ${file}`)
    }
  }
}

async function loadJsonData(filePath: string, sourceType: string): Promise<void> {
  const rawData = fs.readFileSync(filePath, 'utf-8')
  const jsonData = JSON.parse(rawData)
  const articles = extractArticlesFromData(jsonData)

  const vectors = await Promise.all(
    articles.map(async (article, i) => {
      const title = article.title || article.headline || article?.main_article_details?.headline || 'Untitled'
      const author = article.author || article.byline || article?.main_article_details?.author || 'Unknown'
      const date =
        article.date ||
        article.publication_date ||
        article?.main_article_details?.date ||
        article?.key_dates?.[0]?.date ||
        'Unknown'
      const url =
        article.url ||
        article.link ||
        article.source_urls?.[0] ||
        article.source_links?.[0] ||
        article?.main_article_details?.publications?.[0]?.link ||
        'https://unknown-source'

      const textContent = article.content || article.summary || article.content_summary || JSON.stringify(article)

      const embedding = await getEmbedding(`${title}. ${textContent}`)

      const metadata = {
        title: typeof title === 'string' ? title : 'Untitled',
        author: typeof author === 'string' ? author : 'Unknown',
        date: typeof date === 'string' ? date : 'Unknown',
        url: typeof url === 'string' ? url : 'https://unknown-source',
        source: `${sourceType}_crawler`,
        text: textContent.slice(0, 1000),
      }

      return {
        id: `article-${i}-${Date.now()}`,
        values: embedding,
        metadata,
      }
    })
  )

  for (let i = 0; i < vectors.length; i += 100) {
    const batch = vectors.slice(i, i + 100)
    await index.upsert({ vectors: batch })
    LoggerService.info(`📦 Upserted batch ${i / 100 + 1}`)
  }

  LoggerService.info(`✅ Loaded ${vectors.length} ${sourceType} records into Pinecone`)
}

export async function queryPinecone(queryText: string, filterParams?: Record<string, any>) {
  try {
    if (!queryText) throw new Error('Query text cannot be empty')

    LoggerService.info(`🔍 Starting Pinecone query: ${queryText.slice(0, 100)}`)
    if (!pinecone || !index) {
      if (!(await initializePinecone())) throw new Error('Failed to initialize Pinecone connection')
    }

    const queryVector = await getEmbedding(queryText)
    const queryParams = {
      vector: queryVector,
      topK: 10,
      includeMetadata: true,
      filter: filterParams || undefined,
    }

    let results = await index.query(queryParams)
    if (results.matches.length === 0) {
      LoggerService.warning('⚠️ No matches found, retrying with broader search')
      results = await index.query({ ...queryParams, filter: undefined })
    }

    LoggerService.info('✅ Pinecone query completed successfully', { matches: results.matches.length })
    return results
  } catch (error) {
    LoggerService.error(`❌ Pinecone query failed: ${error}`)
    throw error
  }
}

export async function queryEntertainmentEmbeddings(query: string): Promise<any[]> {
  try {
    const pineconeResults = await queryPinecone(query, { source: { $eq: 'entertainment_crawler' } })
    return pineconeResults.matches.map((match: any) => match.metadata).filter(Boolean)
  } catch (error) {
    LoggerService.error(`❌ Failed to query entertainment embeddings: ${error}`)
    return []
  }
}

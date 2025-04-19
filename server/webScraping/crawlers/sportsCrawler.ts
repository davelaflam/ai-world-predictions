import dotenv from 'dotenv'
import { LoggerService } from '../../services/logger/LoggerService.js'
import { extractSportsLinks } from '../freshRSS/sportsLinks.js'
import { saveJsonPretty } from '../utils/jsonOutputParser.js'
import { ingestSportsArticles } from '../../services/pineconeIngestSports.js'
import FirecrawlApp from 'firecrawl'
import { OpenAI } from 'openai'

dotenv.config()

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || ''
const GPT_MODEL = 'gpt-4o'
const MAX_TOKENS = 100000

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const app = new FirecrawlApp(FIRECRAWL_API_KEY ? { apiKey: FIRECRAWL_API_KEY } : {})

async function runSportsScraper() {
  try {
    const sportsLinks = await extractSportsLinks()
    LoggerService.info(`Total sports links found: ${sportsLinks.length}`)

    for (const link of sportsLinks.slice(0, 3)) {
      try {
        LoggerService.info(`Scraping sports link: ${link}`)

        const crawledData = await app.crawlUrl(link, {
          limit: 1,
          includePaths: ['-\\d+\\.html$'],
          ignoreSitemap: true,
          scrapeOptions: {
            formats: ['markdown'],
            excludeTags: [
              '#ybar',
              '#sports-module-scorestrip',
              '#ad',
              '.advertisement',
              '.sponsored-content',
              '.link-yahoo-link',
              '.caas-img-container',
              '.caas-img-lightbox',
              '.link',
            ],
            includeTags: ['div.content', 'h1', 'p'],
            onlyMainContent: true,
            waitFor: 3000,
          },
        })

        if (!crawledData || !('data' in crawledData) || !crawledData.data.length) {
          LoggerService.warning(`No valid data extracted from: ${link}`)
          continue
        }

        LoggerService.info(`Processing scraped data for: ${link}`)

        for (const item of crawledData.data) {
          if (!item.markdown) {
            LoggerService.warning(`Skipping article with missing markdown from: ${link}`)
            continue
          }

          const completion = await openai.chat.completions.create({
            model: GPT_MODEL,
            messages: [
              {
                role: 'system',
                content: `You are an expert at structured data extraction. Extract structured sports article details from the markdown. Format the output as valid JSON with fields: title, author, date, url, summary, quote, figures (array), organizations (array). If any field is missing, use 'Unknown' or an empty array.`,
              },
              {
                role: 'user',
                content: `Here is the markdown text: ${item.markdown.slice(0, MAX_TOKENS)}`,
              },
            ],
            response_format: { type: 'json_object' },
          })

          if (!completion.choices?.length || !completion.choices[0].message?.content) {
            LoggerService.warning(`No structured response received from OpenAI for ${link}`)
            continue
          }

          try {
            const sportsDataJson = JSON.parse(completion.choices[0].message.content)
            await saveJsonPretty(sportsDataJson, 'sports_data.json')
          } catch (parseError) {
            LoggerService.error(`Failed to parse OpenAI response for ${link}: ${parseError}`)
          }
        }
      } catch (error) {
        LoggerService.error(`Error processing link ${link}: ${error}`)
      }
    }

    await ingestSportsArticles()
  } catch (error) {
    LoggerService.error(`Failed to run sports scraper: ${error}`)
  }
}

await runSportsScraper()

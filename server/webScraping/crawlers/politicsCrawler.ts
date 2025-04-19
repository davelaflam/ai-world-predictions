import dotenv from 'dotenv'
import { LoggerService } from '../../services/logger/LoggerService.js'
import { extractPoliticsLinks } from '../freshRSS/politicsLinks.js'
import { saveJsonPretty } from '../utils/jsonOutputParser.js'
import { ingestPoliticsArticles } from '../../services/pineconeIngestPolitics.js'
import FirecrawlApp from 'firecrawl'
import { OpenAI } from 'openai'
import { PoliticsArticleExtractionSchema } from '../models/politicsModel.js'

dotenv.config()

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || ''
const GPT_MODEL = 'gpt-4o'
const MAX_TOKENS = 100000

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const app = new FirecrawlApp(FIRECRAWL_API_KEY ? { apiKey: FIRECRAWL_API_KEY } : {})

async function runPoliticsScraper() {
  try {
    const politicsLinks = await extractPoliticsLinks()
    LoggerService.info(`Total politics links found: ${politicsLinks.length}`)

    for (const link of politicsLinks.slice(0, 2)) {
      try {
        LoggerService.info(`Scraping politics link: ${link}`)

        const crawledData = await app.crawlUrl(link, {
          limit: 1,
          includePaths: ['-\\d+\\.html$'],
          ignoreSitemap: true,
          scrapeOptions: {
            formats: ['markdown'],
            excludeTags: [
              '#ybar',
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
                content: `
You are an expert at structured data extraction. You will be given unstructured markdown text from a politics-related article. 

Extract and return a JSON object that **must** follow this schema:

{
  "title": string,                  // Required: Article title
  "author": string,                 // Required: Author name (or 'Unknown')
  "date": string,                   // Required: Publication date (or 'Unknown')
  "url": string,                    // Required: Source URL (or 'Not Provided')
  "summary": string,                // Required: Detailed and specific summary
  "quote": string,                  // Required: A relevant quote from the article
  "figures": [                      // Required: Array of figures in the article
    {
      "name": string,
      "organization": string,
      "position": string,
      "facts": [string]
    }
  ],
  "organizations": [                // Required: Array of organizations mentioned
    {
      "name": string,
      "people": [Figure],
      "facts": [string]
    }
  ]
}

Do not omit or rename any fields. If a value is missing in the article, fill it with:
- Strings: "Unknown" or "Not Provided"
- Arrays: []
Return only valid JSON. Do not include markdown or additional formatting.
`,
              },
              {
                role: 'user',
                content: `Here is the markdown text: ${item.markdown.slice(0, MAX_TOKENS)}`,
              },
            ],
            response_format: { type: 'json_object' },
          })

          if (!completion.choices || completion.choices.length === 0 || !completion.choices[0].message?.content) {
            LoggerService.warning(`No structured response received from OpenAI for ${link}`)
            continue
          }

          try {
            const politicsDataJson = JSON.parse(completion.choices[0].message.content)
            const validated = PoliticsArticleExtractionSchema.parse(politicsDataJson)
            await saveJsonPretty(validated, 'politics_data.json')
          } catch (parseError) {
            LoggerService.error(`Failed to parse/validate OpenAI response for ${link}: ${parseError}`)
          }
        }
      } catch (error) {
        LoggerService.error(`Error processing link ${link}: ${error}`)
      }
    }

    await ingestPoliticsArticles()
  } catch (error) {
    LoggerService.error(`Failed to run politics scraper: ${error}`)
  }
}

await runPoliticsScraper()

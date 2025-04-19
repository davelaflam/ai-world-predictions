import axios from 'axios'
import { parseStringPromise } from 'xml2js'
import { LoggerService } from '../../services/logger/LoggerService.js'

/**
 * Fetches and parses the Yahoo World News RSS feed to extract unique article links.
 * @returns Promise<string[]> A list of unique article URLs.
 */
export async function extractWorldNewsLinks(): Promise<string[]> {
  const url = 'https://news.yahoo.com/rss/world'
  const linksSet = new Set<string>()

  try {
    LoggerService.info(`Fetching RSS feed from: ${url}`)
    const response = await axios.get(url)
    const parsed = await parseStringPromise(response.data)

    const items = parsed?.rss?.channel?.[0]?.item || []

    for (const item of items) {
      const link = item.link?.[0]
      if (link && typeof link === 'string' && link.startsWith('http')) {
        linksSet.add(link)
      }
    }

    LoggerService.info(`Extracted ${linksSet.size} world news links.`)
    return Array.from(linksSet)
  } catch (error: any) {
    LoggerService.error(`Error fetching or parsing world news RSS feed: ${error.message}`)
    return []
  }
}

// For direct testing
if (process.argv[1].includes('worldNewsLinks.ts')) {
  extractWorldNewsLinks().then((links) => {
    console.log(`Found ${links.length} world news links:`)
    links.forEach((link) => console.log(link))
  })
}

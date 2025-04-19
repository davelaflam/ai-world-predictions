import axios from 'axios'
import { parseStringPromise } from 'xml2js'
import { LoggerService } from '../../services/logger/LoggerService.js'

/**
 * Fetches and parses the Yahoo Sports RSS feed to extract unique article links.
 * @returns Promise<string[]> A list of unique article URLs.
 */
export async function extractSportsLinks(): Promise<string[]> {
  const url = 'https://sports.yahoo.com/rss/'
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

    LoggerService.info(`Extracted ${linksSet.size} sports links.`)
    return Array.from(linksSet)
  } catch (error: any) {
    LoggerService.error(`Error fetching or parsing sports RSS feed: ${error.message}`)
    return []
  }
}

// For direct testing
if (process.argv[1].includes('sportsLinks.ts')) {
  extractSportsLinks().then((links) => {
    console.log(`Found ${links.length} sports links:`)
    links.forEach((link) => console.log(link))
  })
}

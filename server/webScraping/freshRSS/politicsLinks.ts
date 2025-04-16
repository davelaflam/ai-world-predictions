import axios from 'axios'
import { LoggerService } from '../../services/logger/LoggerService.js'
import { parseStringPromise } from 'xml2js'

export async function extractPoliticsLinks(): Promise<string[]> {
  const rssUrl = 'https://news.yahoo.com/rss/politics'
  const linksSet: Set<string> = new Set()

  try {
    const response = await axios.get(rssUrl)
    const parsedXml = await parseStringPromise(response.data)
    const items = parsedXml.rss?.channel?.[0]?.item || []

    for (const item of items) {
      const link = item.link?.[0]
      if (link && typeof link === 'string' && link.startsWith('http')) {
        linksSet.add(link)
      }
    }

    const linksList = Array.from(linksSet)
    LoggerService.info(`✅ Extracted ${linksList.length} politics links from RSS feed`)
    return linksList
  } catch (error: any) {
    LoggerService.error(`❌ Failed to extract politics links: ${error.message}`)
    return []
  }
}

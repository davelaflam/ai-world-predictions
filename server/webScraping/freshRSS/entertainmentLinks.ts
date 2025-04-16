import dotenv from 'dotenv'
import xml2js from 'xml2js'
import axios from 'axios'
import { LoggerService } from '../../services/logger/LoggerService.js'

dotenv.config()

const RSS_URL = 'https://www.yahoo.com/entertainment/rss'

/**
 * Fetch and extract entertainment links from the RSS feed.
 */
export async function extractEntertainmentLinks(): Promise<string[]> {
  try {
    LoggerService.info(`Fetching RSS feed from: ${RSS_URL}`)

    const response = await axios.get(RSS_URL)
    const xmlData = response.data

    const parsedData = await xml2js.parseStringPromise(xmlData)
    const links: string[] = []

    parsedData.rss.channel[0].item.forEach((item: any) => {
      if (item.link && item.link[0].startsWith('http')) {
        links.push(item.link[0])
      }
    })

    LoggerService.info(`Extracted ${links.length} entertainment links.`)
    return links
  } catch (error) {
    LoggerService.error(`Failed to extract entertainment links: ${error}`)
    return []
  }
}

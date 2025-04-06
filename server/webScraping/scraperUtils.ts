import { OpenAI } from 'openai'
import { LoggerService } from '../services/logger/LoggerService.js'

/**
 * Extracts data from scraped content.
 */
export async function extractDataFromContent(
  content: string,
  _dataPoints: any[],
  _linksScraped: string[],
  _url: string
): Promise<any> {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content }],
    })

    LoggerService.info(`Extracted data from content successfully`)
    return response
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    LoggerService.error('Failed to extract data from content', errorMessage)
    return {}
  }
}

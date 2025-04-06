import dotenv from 'dotenv'
import FirecrawlApp from 'firecrawl'
import { LoggerService } from '../services/logger/LoggerService.js'
import { extractDataFromContent } from './scraperUtils.js'
import { OpenAI } from 'openai'

dotenv.config()

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || ''
const GPT_MODEL = 'gpt-4o'
const MAX_TOKENS = 100000

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Initialize FirecrawlApp with API key if required
const app = new FirecrawlApp(FIRECRAWL_API_KEY ? { apiKey: FIRECRAWL_API_KEY } : {})

/**
 * Scrape a given URL and extract structured data.
 */
export async function scrape(url: string, dataPoints: any[], linksScraped: string[]): Promise<any> {
  try {
    LoggerService.info(`Scraping URL: ${url}`)

    if (!url) {
      throw new Error('No URL provided for scraping')
    }

    const scrapedData = await app.scrapeUrl(url)

    // Validate response structure before accessing `markdown`
    if (!scrapedData || !('markdown' in scrapedData)) {
      LoggerService.error(`Error: Scraped data does not contain markdown for URL: ${url}`)
      return { error: 'Scraped data does not contain markdown' }
    }

    const markdown = (scrapedData as { markdown: string }).markdown.slice(0, MAX_TOKENS * 2)
    linksScraped.push(url)

    return extractDataFromContent(markdown, dataPoints, linksScraped, url)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    LoggerService.error(`Error scraping URL: ${url} - ${errorMessage}`)
    return { error: 'Unable to scrape the URL' }
  }
}

/**
 * Update the existing data points with new information.
 */
export function updateData(dataPoints: any[], updates: any[]): string {
  try {
    LoggerService.info(`Updating data points with new information`)

    for (const data of updates) {
      const existing = dataPoints.find((dp) => dp.name === data.name)
      if (existing) {
        existing.reference = data.reference || 'None'
        existing.value = data.type.toLowerCase() === 'list' ? JSON.parse(data.value) : data.value
      }
    }

    return 'Data updated successfully'
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    LoggerService.error(`Failed to update data points: ${errorMessage}`)
    return 'Error updating data points'
  }
}

/**
 * Call OpenAI API for chat completion.
 */
export async function chatCompletionRequest(
  messages: any[],
  toolChoice: 'none' | undefined,
  tools: any[],
  model: string = GPT_MODEL
): Promise<any> {
  try {
    return await openai.chat.completions.create({
      model,
      messages,
      tools,
      tool_choice: toolChoice ?? undefined, // Fix for tool_choice issue
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    LoggerService.error(`Error in chatCompletionRequest: ${errorMessage}`)
    return { error: 'Unable to generate response' }
  }
}

/**
 * Optimize the conversation history to fit within token limits.
 */
export function memoryOptimize(messages: any[]): any[] {
  const encodingSize = JSON.stringify(messages).length

  if (encodingSize > MAX_TOKENS) {
    LoggerService.warning(`Trimming conversation history to fit within token limits`)

    while (JSON.stringify(messages).length > MAX_TOKENS) {
      messages.shift()
    }
  }

  return messages
}

/**
 * Call the AI agent to process the task.
 */
export async function callAgent(
  prompt: string,
  systemPrompt: string,
  tools: any[],
  plan: boolean,
  dataPoints: any[],
  _entityName: string, // Prefixed unused argument with `_`
  linksScraped: string[]
): Promise<string> {
  let messages: any[] = []

  if (plan) {
    messages.push({
      role: 'user',
      content: `${systemPrompt} ${prompt} Let's think step by step and make a plan first.`,
    })

    const chatResponse = await chatCompletionRequest(messages, 'none', tools)
    messages.push({ role: 'assistant', content: chatResponse?.choices[0]?.message?.content || '' })
  } else {
    messages.push({ role: 'user', content: `${systemPrompt} ${prompt}` })
  }

  let state = 'running'

  while (state === 'running') {
    const chatResponse = await chatCompletionRequest(messages, undefined, tools)

    if (chatResponse.error) {
      LoggerService.error(`Failed AI agent response: ${chatResponse.error}`)
      state = 'finished'
      break
    }

    const assistantMessage = chatResponse.choices[0]
    messages.push({
      role: 'assistant',
      content: assistantMessage.message.content,
      tool_calls: assistantMessage.message.tool_calls,
    })

    if (assistantMessage.finish_reason === 'tool_calls') {
      for (const toolCall of assistantMessage.message.tool_calls) {
        const functionName = toolCall.function.name
        const args = JSON.parse(toolCall.function.arguments)

        let result
        if (functionName === 'scrape') {
          result = await scrape(args.url, dataPoints, linksScraped)
        } else if (functionName === 'updateData') {
          result = updateData(dataPoints, args.datas_update)
        }

        messages.push({ role: 'tool', tool_call_id: toolCall.id, name: functionName, content: result })
      }
    }

    if (assistantMessage.finish_reason === 'stop') {
      state = 'finished'
    }

    messages = memoryOptimize(messages)
  }

  return messages[messages.length - 1].content
}

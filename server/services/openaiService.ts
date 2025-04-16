import { OpenAI } from 'openai'
import dotenv from 'dotenv'
import { LoggerService } from './logger/LoggerService.js'
import { getMarkets } from './kalshiService.js'
import { getPolymarketMarkets } from './polymarketService.js'
import { queryPinecone } from './pineconeService.js'

dotenv.config()

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY not found in environment variables')
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export const DEEP_MODEL = 'gpt-4o'
export const FAST_MODEL = 'gpt-4o-mini'
export const COUNCIL_MODEL = 'gpt-4o'

interface PredictionLog {
  timestamp: Date
  agentId: string
  agentRole: string
  prediction: string
  confidence: number
  timeframe: string
  entryPrice: number
  targetPrice: number
  stopLoss: number
  actualOutcome: number
  pnl: number
  accuracyScore: number
}

class AgentPerformanceTracker {
  private performanceLog: PredictionLog[] = []

  constructor() {
    const historicalData: PredictionLog[] = []
    this.performanceLog = historicalData
    LoggerService.info('Performance tracker initialized with historical data')
    LoggerService.info('Initial Leaderboard: ' + JSON.stringify(this.getLeaderboard()))
  }

  logPrediction(
    agentRole: string,
    predictionObj: { prediction: string; confidence: number },
    timeframe: string,
    entryPrice: number
  ) {
    const newLog: PredictionLog = {
      timestamp: new Date(),
      agentId: `${agentRole}_${new Date().toISOString().replace(/[:.-]/g, '')}`,
      agentRole,
      prediction: predictionObj.prediction || '',
      confidence: predictionObj.confidence || 0,
      timeframe,
      entryPrice,
      targetPrice: entryPrice * 1.08,
      stopLoss: entryPrice * 0.95,
      actualOutcome: 0,
      pnl: 0,
      accuracyScore: 0,
    }
    this.performanceLog.push(newLog)
  }

  updateOutcome(agentId: string, actualOutcome: number) {
    const log = this.performanceLog.find((l) => l.agentId === agentId)
    if (!log) {
      LoggerService.warning(`No prediction found for agentId: ${agentId}`)
      return
    }
    const pnl = ((actualOutcome - log.entryPrice) / log.entryPrice) * 100
    log.actualOutcome = actualOutcome
    log.pnl = pnl
    log.accuracyScore = pnl > 0 ? 1 : 0
  }

  getLeaderboard(): PredictionLog[] {
    return this.performanceLog
  }
}

export const tracker = new AgentPerformanceTracker()

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function enrichPromptWithContext(prompt: string, _marketData: any): string {
  const contextData = 'No historical context available'
  const marketContext = 'No market data available'
  return `${prompt}

HISTORICAL CONTEXT:
${contextData}

LIVE MARKET DATA:
${marketContext}`
}

function parseExpertResponse(responseText: string) {
  try {
    const cleanText = responseText
      .replace(/```json\n/g, '')
      .replace(/```/g, '')
      .replace(/\n/g, ' ')
      .trim()
    const startIdx = cleanText.indexOf('{')
    const endIdx = cleanText.lastIndexOf('}')
    if (startIdx === -1 || endIdx === -1) throw new Error('No valid JSON object found')
    const parsed = JSON.parse(cleanText.substring(startIdx, endIdx + 1))
    return {
      prediction: String(parsed.prediction || '').trim(),
      confidence: parseInt(String(parsed.confidence || 0), 10),
      factors: Array.isArray(parsed.factors) ? parsed.factors.slice(0, 3).map(String) : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks.slice(0, 3).map(String) : [],
    }
  } catch (e: any) {
    LoggerService.error(`Response parsing error: ${e.message}`)
    return {
      prediction: 'Error parsing response',
      confidence: 0,
      factors: ['Parsing error'],
      risks: ['Parsing error'],
    }
  }
}

function generateExpertPrompt(expert: { role: string; bias: string; style: string }, enrichedPrompt: string): string {
  const focus: Record<string, string> = {
    'Technical Analyst': 'ONLY analyze price patterns, technical indicators, and market volume data',
    'Sentiment Analyst': 'ONLY analyze social media trends, news sentiment, and public opinion',
    'Macro Economist': 'ONLY analyze market fundamentals, economic indicators, and industry trends',
    'Risk Manager': 'ONLY analyze risk metrics, position sizing, and risk/reward ratios',
  }
  return `You are a ${expert.role} with a ${expert.bias} approach and ${expert.style} trading style.
${focus[expert.role]}

Return ONLY a valid JSON object with NO additional text or formatting:
{
  "prediction": "clear win/loss prediction",
  "confidence": number between 0-100,
  "factors": ["factor1", "factor2", "factor3"],
  "risks": ["risk1", "risk2", "risk3"]
}

Scenario: ${enrichedPrompt}`
}

function logPredictionSafe(
  tracker: AgentPerformanceTracker,
  agentRole: string,
  predictionObj: any,
  timeframe: string,
  entryPrice: number
): void {
  tracker.logPrediction(agentRole, predictionObj, timeframe, entryPrice)
}

export async function generateResponse(
  prompt: string,
  mode: 'fast' | 'deep' | 'council' = 'fast',
  maxTokens = 500,
  timeframe = 'short',
  currentPrice = 100
): Promise<any> {
  LoggerService.info(`🤖 Starting new prediction request - Mode: ${mode}`)
  LoggerService.info(`🧠 [${mode.toUpperCase()}] Prompt received: "${prompt}"`)

  if (mode === 'fast' || mode === 'deep') {
    const isDeep = mode === 'deep'
    let marketContext = 'Unavailable'

    try {
      const [kalshiData, polymarketData] = await Promise.all([
        getMarkets(25, undefined, undefined, undefined, 'open', undefined, 1000),
        getPolymarketMarkets(),
      ])

      const kalshiMarkets = kalshiData.markets || []
      const polymarkets = Array.isArray(polymarketData) ? polymarketData : []

      if (!kalshiMarkets.length) LoggerService.warning('⚠️ No active Kalshi markets fetched')
      if (!polymarkets.length) LoggerService.warning('⚠️ No active Polymarket markets fetched')

      const formatMarket = (m: any, source: string) => {
        const yesPrice = m.yes_price || m.yesPrice
        const noPrice = m.no_price || m.noPrice
        const hasPrice = yesPrice && noPrice
        const priceLine = hasPrice ? `YES $${yesPrice} | NO $${noPrice}` : 'No active price data'
        return `• [${source}] ${m.title || 'Unknown'} (${m.ticker || m.id || 'N/A'})\n  ${priceLine}\n  Volume: $${m.volume || m.volumeUSD || 0}`
      }

      const formattedKalshi = kalshiMarkets.map((m: any) => formatMarket(m, 'Kalshi')).join('\n')
      const formattedPoly = polymarkets.map((m: any) => formatMarket(m, 'Polymarket')).join('\n')

      marketContext = `${formattedKalshi}\n${formattedPoly}`
    } catch (e: any) {
      LoggerService.warning(`⚠️ Market fetch failed: ${e.message}`)
    }

    let historicalContext = ''
    if (isDeep) {
      try {
        const rag = await queryPinecone(prompt)
        historicalContext = rag.matches.map((m: any) => m.metadata.text).join('\n')
        LoggerService.info(`📚 Pinecone RAG returned ${historicalContext.length} characters of context`)
      } catch (e: any) {
        LoggerService.warning(`⚠️ RAG context error: ${e.message}`)
      }
    }

    const fullPrompt = `ANALYZE ROI AND PROVIDE A SPECIFIC BET RECOMMENDATION:

Given the date and time is: ${new Date().toISOString()}

${isDeep ? `HISTORICAL CONTEXT:\n${historicalContext}\n\n` : ''}MARKET DATA:\n${marketContext}

USER QUERY:\n${prompt}

CALCULATE POTENTIAL RETURNS:
1. If YES wins: (100 - Yes Price) / Yes Price = ROI%
2. If NO wins: (100 - No Price) / No Price = ROI%

RESPOND IN THIS FORMAT:
🎯 RECOMMENDED BET:
[Market Ticker] - [Market Title]
Team/Selection: [SPECIFIC TEAM/OUTCOME]
Position: [YES/NO]
Entry Price: $[Current Price or N/A if missing]
Potential ROI: [X]%
Size: [SMALL/MEDIUM/LARGE]
Confidence: [X]%

💰 WHY THIS BET:
• ROI calculation or N/A if not available
• Market inefficiency
• Supporting data

⚠️ RISK/REWARD:
• Risk
• Max Loss
• Max Gain
• Win Probability or N/A`

    LoggerService.debug(`📝 Sending prompt to OpenAI (${mode}): ${fullPrompt.slice(0, 300)}...`)

    const messages: ChatMessage[] = [
      { role: 'system', content: `You are a ruthless ROI-focused prediction market expert.` },
      { role: 'user', content: fullPrompt },
    ]

    const response = await client.chat.completions.create({
      model: isDeep ? DEEP_MODEL : FAST_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.5,
    })

    const result = response.choices[0].message?.content?.trim()
    LoggerService.info(`📊 ${mode.toUpperCase()} Response: ${result?.substring(0, 100)}...`)
    return result
  }

  if (mode === 'council') {
    const experts = [
      { role: 'Technical Analyst', bias: 'chart-focused', style: 'conservative' },
      { role: 'Sentiment Analyst', bias: 'social-media-driven', style: 'aggressive' },
      { role: 'Macro Economist', bias: 'fundamentals-based', style: 'moderate' },
      { role: 'Risk Manager', bias: 'risk-focused', style: 'cautious' },
    ]

    const discussion: Array<{ expert: string; analysis: any }> = []
    const enrichedPrompt = enrichPromptWithContext(prompt, {})

    for (const expert of experts) {
      const expertPrompt = generateExpertPrompt(expert, enrichedPrompt)
      const response = await client.chat.completions.create({
        model: DEEP_MODEL,
        messages: [{ role: 'user', content: expertPrompt }],
        max_tokens: maxTokens,
        temperature: 0.7,
      })
      const parsed = parseExpertResponse(response.choices[0].message?.content || '')
      discussion.push({ expert: expert.role, analysis: parsed })
      if (currentPrice) logPredictionSafe(tracker, expert.role, parsed, timeframe, currentPrice)
      await delay(5000)
    }

    const consensusPrompt = `As the council moderator, analyze these expert opinions and provide a final consensus.
Return ONLY a JSON object with no markdown formatting or additional text:

{
  "final_prediction": "clear prediction",
  "confidence_level": 75,
  "profit_strategy": "detailed strategy",
  "risk_assessment": "key risks",
  "sentiment_score": 75
}

Expert Opinions:
${JSON.stringify(discussion, null, 2)}`

    const response = await client.chat.completions.create({
      model: COUNCIL_MODEL,
      messages: [{ role: 'user', content: consensusPrompt }],
      max_tokens: maxTokens,
      temperature: 0.6,
    })

    const consensusText = response.choices[0].message?.content?.trim() || ''
    let consensus
    try {
      consensus = JSON.parse(consensusText)
    } catch {
      consensus = {
        final_prediction: consensusText,
        confidence_level: 'N/A',
        profit_strategy: 'N/A',
        risk_assessment: 'N/A',
        sentiment_score: 'N/A',
      }
    }

    const leaderboard = tracker.getLeaderboard()
    return {
      discussion,
      consensus,
      mode: 'council',
      performance_metrics: {
        leaderboard,
        total_council_pnl: leaderboard.reduce((sum, log) => sum + log.pnl, 0),
      },
    }
  }

  throw new Error("Invalid mode. Choose 'fast', 'deep', or 'council'.")
}

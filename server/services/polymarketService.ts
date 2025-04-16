import axios from 'axios'
import dotenv from 'dotenv'
import { LoggerService } from './logger/LoggerService.js'

dotenv.config()

const POLYMARKET_API_URL = process.env.POLYMARKET_API_URL
if (!POLYMARKET_API_URL) {
  throw new Error('Missing POLYMARKET_API_URL in environment variables.')
}

async function makeRequest(method: 'GET', path: string, params?: Record<string, any>): Promise<any> {
  const url = `${POLYMARKET_API_URL}${path}`
  try {
    if (method === 'GET') {
      const response = await axios.get(url, { params })
      return response.data
    } else {
      throw new Error(`Unsupported HTTP method: ${method}`)
    }
  } catch (error: any) {
    LoggerService.error('Request to Polymarket API failed', error.response?.data || error.message)
    throw new Error(error.response?.data?.error || 'Request to Polymarket API failed')
  }
}

export async function getPolymarketMarkets(): Promise<any[]> {
  const path = '/markets'
  const response = await makeRequest('GET', path)
  return response.data || [] // ✅ Return the `data` field which is the actual market list
}

export async function getPolymarketMarket(conditionId: string): Promise<any> {
  const path = `/markets/${conditionId}`
  return makeRequest('GET', path)
}

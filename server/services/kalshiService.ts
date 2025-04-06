import axios, { AxiosRequestConfig } from 'axios'
import dotenv from 'dotenv'
import crypto from 'crypto'
import { LoggerService } from '../services/logger/LoggerService.js'

dotenv.config()

const KALSHI_API_URL = process.env.KALSHI_API_URL || 'https://api.elections.kalshi.com'
const KALSHI_API_KEY_ID = process.env.KALSHI_API_KEY_ID || ''
const KALSHI_API_PRIVATE_KEY = process.env.KALSHI_API_PRIVATE_KEY || ''

if (!KALSHI_API_KEY_ID || !KALSHI_API_PRIVATE_KEY) {
  throw new Error('❌ Missing Kalshi API credentials in environment variables')
}

function loadPrivateKey(): crypto.KeyObject {
  try {
    const rawKey = process.env.KALSHI_API_PRIVATE_KEY || ''
    const decodedKey = rawKey.replace(/\n/g, '\n')
    return crypto.createPrivateKey({
      key: decodedKey,
      format: 'pem',
      type: 'pkcs8',
    })
  } catch (error) {
    LoggerService.error(`🆘 Failed to load private key: ${error}`)
    throw new Error('Invalid RSA private key')
  }
}

const privateKey = loadPrivateKey()

function generateSignature(timestamp: string, method: string, path: string): string {
  try {
    const dataToSign = `${timestamp}${method}${path}`
    return crypto.sign('RSA-SHA256', Buffer.from(dataToSign, 'utf-8'), privateKey).toString('base64')
  } catch (error) {
    LoggerService.error(`🆘 Error generating signature: ${error}`)
    return ''
  }
}

function getHeaders(method: 'GET' | 'POST', path: string): Record<string, string> {
  const timestamp = Date.now().toString()
  const signature = generateSignature(timestamp, method, path)
  return {
    'Content-Type': 'application/json',
    'KALSHI-ACCESS-KEY': KALSHI_API_KEY_ID,
    'KALSHI-ACCESS-TIMESTAMP': timestamp,
    'KALSHI-ACCESS-SIGNATURE': signature,
  }
}

async function makeRequest<T>(method: 'GET' | 'POST', path: string, params?: Record<string, any>): Promise<T> {
  const url = `${KALSHI_API_URL}${path}`
  const headers = getHeaders(method, path)
  const filteredParams: Record<string, any> = {
    limit: params?.limit || 100,
  }

  if (params?.status && ['unopened', 'open', 'closed', 'settled'].includes(params.status)) {
    filteredParams.status = params.status
  } else {
    LoggerService.warning(`⚠️ Invalid status value '${params?.status}' — using 'open' instead`)
    filteredParams.status = 'open'
  }

  if (params?.min_volume) {
    filteredParams.min_volume = params.min_volume
  }

  if (params?.event_ticker && typeof params.event_ticker === 'string' && params.event_ticker.length > 2) {
    if (params?.tickers) {
      LoggerService.warning(`⚠️ Both 'event_ticker' and 'tickers' were provided. 'event_ticker' will take precedence.`)
    }
    filteredParams.event_ticker = params.event_ticker
  } else if (params?.event_ticker) {
    LoggerService.warning(`⚠️ Skipping event_ticker - invalid value: ${params.event_ticker}`)
  }

  if (!filteredParams.event_ticker && params?.tickers) {
    filteredParams.tickers = params.tickers
  }

  if (params?.series_ticker) filteredParams.series_ticker = params.series_ticker

  LoggerService.info(
    `🛰️ Sending Kalshi API Request:\n  URL: ${url}\n  Method: ${method}\n  Params: ${JSON.stringify(filteredParams)}\n  Headers: ${JSON.stringify(headers, null, 2)}`
  )

  try {
    const config: AxiosRequestConfig = { method, url, params: filteredParams, headers }
    const response = await axios(config)
    LoggerService.info(`✅ Kalshi API Response: ${JSON.stringify(response.data, null, 2)}`)
    return response.data as T
  } catch (error: any) {
    LoggerService.error(`🆘 Kalshi API Error: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`)
    return {
      markets: [],
      error: error.response?.data?.error?.message || 'Request to Kalshi API failed',
    } as unknown as T
  }
}

export async function getMarkets(
  limit = 100,
  _cursor?: string,
  eventTicker?: string,
  seriesTicker?: string,
  status = 'open',
  tickers?: string,
  minVolume?: number,
  category?: string
): Promise<any> {
  const path = '/trade-api/v2/markets'
  const params: Record<string, any> = { limit, status }

  if (minVolume) params.min_volume = minVolume
  if (eventTicker) params.event_ticker = eventTicker
  if (seriesTicker) params.series_ticker = seriesTicker
  if (tickers) params.tickers = tickers

  try {
    let response = await makeRequest<Record<string, any>>('GET', path, params)
    let markets = response?.markets || []

    if (markets.length === 0 && status === 'open') {
      LoggerService.warning('⚠️ No open Kalshi markets found — trying "unopened" as fallback')
      params.status = 'unopened'
      response = await makeRequest<Record<string, any>>('GET', path, params)
      markets = response?.markets || []
    }

    if (markets.length === 0) {
      LoggerService.warning(`⚠️ No Kalshi markets found for status '${status}' with given filters.`)
    }

    if (minVolume) {
      markets = markets.filter((m: any) => m.volume >= minVolume)
    }
    if (category) {
      markets = markets.filter((m: any) => m.category.toLowerCase() === category.toLowerCase())
    }

    return { ...response, markets, filtered_count: markets.length }
  } catch (error: any) {
    LoggerService.error(`🆘 Error fetching markets: ${error.message}`)
    return { markets: [], error: error.message }
  }
}

export async function getEvents(
  limit = 100,
  _cursor?: string,
  withNestedMarkets = false,
  status?: string,
  seriesTicker?: string
): Promise<any> {
  const path = '/trade-api/v2/events'
  const params: Record<string, any> = { limit, with_nested_markets: withNestedMarkets.toString() }
  if (status) params.status = status
  if (seriesTicker) params.series_ticker = seriesTicker
  return makeRequest('GET', path, params)
}

export async function getEvent(eventTicker: string, withNestedMarkets = false): Promise<any> {
  const path = `/trade-api/v2/events/${eventTicker}`
  return makeRequest('GET', path, { with_nested_markets: withNestedMarkets.toString() })
}

export async function getMarket(ticker: string): Promise<any> {
  const path = `/trade-api/v2/markets/${ticker}`
  return makeRequest('GET', path, {})
}

export async function getTrades(params: {
  cursor?: string
  limit?: number
  ticker?: string
  min_ts?: string
  max_ts?: string
}): Promise<any> {
  const path = '/trade-api/v2/trades'
  return makeRequest('GET', path, params)
}

LoggerService.info(`ℹ️ Kalshi API URL: ${KALSHI_API_URL}`)

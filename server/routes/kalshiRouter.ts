import express from 'express'
import { getEvents, getEvent, getMarkets, getMarket, getTrades } from '../services/kalshiService.js'

const router = express.Router()

router.get('/events', async (req, res) => {
  try {
    const { limit = 100, cursor, status, series_ticker, with_nested_markets = 'false' } = req.query
    const events = await getEvents(
      Number(limit),
      (cursor as string) || undefined,
      with_nested_markets === 'true',
      (status as string) || undefined,
      (series_ticker as string) || undefined
    )
    res.json(events)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

router.get('/event/:event_ticker', async (req, res) => {
  try {
    const { event_ticker } = req.params
    const { with_nested_markets = 'false' } = req.query
    const event = await getEvent(event_ticker, with_nested_markets === 'true')
    res.json(event)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

router.get('/markets', async (_req, res) => {
  try {
    const markets = await getMarkets(100)
    res.json(markets)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

router.get('/market/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params
    const market = await getMarket(ticker)
    res.json(market)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

router.get('/trades', async (req, res) => {
  try {
    const { cursor, limit = 100, ticker, min_ts, max_ts } = req.query
    const trades = await getTrades({
      cursor: (cursor as string) || undefined,
      limit: Number(limit),
      ticker: (ticker as string) || undefined,
      min_ts: (min_ts as string) || undefined,
      max_ts: (max_ts as string) || undefined,
    })
    res.json(trades)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

export default router

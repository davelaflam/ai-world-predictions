import express from 'express'
import { getPolymarketMarkets, getPolymarketMarket } from '../services/polymarketService.js'

const router = express.Router()

router.get('/markets', async (_req, res) => {
  try {
    const markets = await getPolymarketMarkets()
    res.json(markets)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

router.get('/market/:condition_id', async (req, res) => {
  try {
    const { condition_id } = req.params
    const market = await getPolymarketMarket(condition_id)
    res.json(market)
  } catch (err) {
    const error = err as Error
    const isNetworkError = error.message.includes('connect') || error.message.includes('ECONNREFUSED')
    res.status(isNetworkError ? 503 : 500).json({
      error: isNetworkError ? 'Failed to connect to Polymarket API.' : 'An unexpected error occurred.',
      details: error.message,
    })
  }
})

export default router

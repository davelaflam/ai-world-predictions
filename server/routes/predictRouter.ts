import express, { Request, Response } from 'express'
import { generateResponse } from '../services/openaiService.js'

const router = express.Router()

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, mode = 'fast', timeframe = 'short' } = req.body

    if (!prompt) {
      res.status(400).json({ error: 'Please provide a prompt in the request body' })
      return
    }

    const response = await generateResponse(prompt, mode, 500, timeframe)

    if (mode === 'council') {
      res.json({
        success: true,
        consensus: {
          final_prediction: response?.consensus?.final_prediction ?? 'Consensus building...',
          confidence_level: response?.consensus?.confidence_level ?? 0,
        },
        discussion: response?.discussion ?? [],
        mode: 'council',
      })
      return
    }

    res.json({ success: true, prediction_result: response })
  } catch (err) {
    console.error('Error in /predict:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router

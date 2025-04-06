import express from 'express'
import cors from 'cors'
import 'dotenv/config'

import kalshiRouter from './routes/kalshiRouter.js'
import polymarketRouter from './routes/polymarketRouter.js'
import predictRouter from './routes/predictRouter.js'
import { LoggerService } from './services/logger/LoggerService.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (_req, res) => {
  res.send('<h1>Welcome to My Express Server!</h1>')
})

app.get('/hello/:name', (req, res) => {
  res.send(`<h2>Hello, ${req.params.name}!</h2>`)
})

app
  .route('/data')
  .get((_req, res) => {
    res.json({ message: 'Send me some JSON data!' })
  })
  .post((req, res) => {
    res.status(201).json({ you_sent: req.body })
  })

LoggerService.info('✅ Registering /predict routes...')
app.use('/predict', predictRouter)

LoggerService.info('✅ Registering /kalshi routes...')
app.use('/kalshi', kalshiRouter)

LoggerService.info('✅ Registering /polymarket routes...')
app.use('/polymarket', polymarketRouter)

LoggerService.info('🚀 Express app configured!')

export default app

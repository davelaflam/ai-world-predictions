
# AI World Predictions App

The AI World Predictions App is designed to provide AI-driven predictions for world events using a Retrieval-Augmented Generation (RAG) approach. It uses data from crawled news sources and prediction markets (Kalshi, Polymarket), stores it in Pinecone, and applies OpenAI's GPT-4o for reasoning and prediction.

---

## 🧠 Core Features

- **Fast Mode** – Quick GPT-4o inference with real-time market data.
- **Deep Mode** – RAG-enhanced predictions using Pinecone vector search.
- **Council Mode** – Multi-agent reasoning with technical, sentiment, macroeconomic, and risk experts.
- **Live Market Data** – Integrated Kalshi and Polymarket predictions.
- **Structured ETL Pipeline** – Firecrawl + GPT-4o used for structured markdown extraction and JSON parsing.

---

## 🏗️ System Architecture

```
                        ┌────────────────────────────┐
                        │        React Frontend      │
                        │   (Recommendations.tsx)    │
                        └────────────┬───────────────┘
                                     │
                                     ▼
                           ┌────────────────┐
                           │   REST API     │ ◀────────┐
                           └──────┬─────────┘          │
                                  │                    │
                                  ▼                    │
          ┌─────────────────────────────┐              │
          │   Prediction Modes (RAG)    │              │
          │  • Fast (GPT)               │              │
          │  • Deep (RAG + GPT)         │              │
          │  • Council (Multi-Agent)    │              │
          └────┬────────────────┬───────┘              │
               │                │                      │
               ▼                ▼                      │
   ┌──────────────────┐    ┌───────────────┐           │
   │ Pinecone VectorDB│    │ Market APIs   │◀────┐     │
   └──────────────────┘    │ Kalshi + Poly │     │     │
                           └───────────────┘     │     │
                                                 │     │
┌─────────────┐        ┌─────────────┐           │     │
│ Data Source │──────▶ │ Web Crawler │───────────┘     │
└─────────────┘        └─────────────┘                 │
         ▲ RSS/APIs                                    │
         │                                             │
     ┌────────────┐                                    │
     │ Firecrawl  │                                    │
     └────────────┘                                    │
              │                                        │
              ▼                                        │
        ┌─────────────┐       ┌────────────────────────┐
        │ Pinecone DB │◀──────│ Embeddings & Upsertion │
        └─────────────┘       └────────────────────────┘

Summary of Flow:
• React UI sends prediction requests to /predict with user input.
• The REST API processes the request, fetching:
  • Kalshi + Polymarket market data
  • Pinecone context via RAG
• Based on mode:
  • Fast: Direct GPT-4o response
  • Deep: RAG-enhanced GPT-4o
  • Council: Multi-agent GPT-based consensus
• Real-time embeddings are managed via the web crawler → Firecrawl → Pinecone pipeline.

Backend Services:
- REST API (Express.js)
- OpenAI GPT-4o Inference
- Kalshi/Polymarket Fetchers
- Pinecone Query Service

Frontend:
- React UI (MUI + Axios)
- Modes: Fast / Deep / Council
```

---

## 🔧 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ai-world-predictions.git
cd ai-world-predictions
```

### 2. Setup Environment

Create a `.env` file in the project root:

```
# FireCrawl configuration
FIRECRAWL_API_KEY=

# Kalshi configuration
KALSHI_API_URL=https://api.elections.kalshi.com
KALSHI_API_KEY_ID=""
KALSHI_API_PRIVATE_KEY=""

# OpenAI configuration
OPENAI_API_KEY=

# Pinecone configuration
PINECONE_API_KEY=
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX=

# Polymarket API Configuration
POLYMARKET_API_URL="https://clob.polymarket.com"

PORT=3000
VERBOSE=false

# Frontend Configuration
REACT_APP_BACKEND_API_PORT=3000
REACT_APP_BACKEND_API_URL=http://localhost:3000
```

### 3. Install Dependencies

```bash
pnpm install
```

---

## 🚀 Running the App

### Start the Express Server

```bash
pnpm start
```

Console logs will show:
- ✅ Registered Kalshi / Polymarket routes
- ✅ Pinecone init status
- 📊 Model outputs per inference

#### View the Frontend App
- http://localhost:8080/

---

## 🕸️ Crawlers & ETL

Crawlers live in `server/services/webScraping/crawlers`.

To run the **entertainment** crawler and load Pinecone:

```bash
pnpm tsx server/services/webScraping/crawlers/entertainmentCrawler.ts
pnpm tsx server/services/pineconeIngest.ts
```

You can repeat for `sportsCrawler.ts`, `worldCrawler.ts`, etc.

---

## 🧪 API Routes

- `GET /kalshi/markets`
- `GET /polymarket/markets`
- `POST /predict`  
  Payload:
  ```json
  {
    "prompt": "Who will win the Super Bowl?",
    "mode": "council",
    "timeframe": "short"
  }
  ```

---

## 🧰 Project Structure

```
├── client/                                 # React frontend
├── server/
│   ├── routes/                             # Express routers
│   ├── services/                           # Kalshi, Polymarket, Pinecone, OpenAI
│   │   ├── logger/
│   │   ├── kalshiService.ts
│   │   ├── openaiService.ts
│   │   ├── pineconeIngest.ts
│   │   ├── pineconeService.ts
│   │   └── polymarketService.ts
│   ├── webScraping/
│   │   ├── crawlers/
│   │   │   ├── entertainmentCrawler.ts
│   │   │   ├── politicsCrawler.ts
│   │   │   ├── sportsCrawler.ts
│   │   │   └── worldCrawler.ts
│   ├── app.ts
│   └── server.ts
└── .env
```

---

## 🧠 Team Members

- Ashley Pean
- Dave LaFlam
- Jamie Highsmith
- John Maltese
- Will Kencel

---

## 📈 Future Enhancements

- Auto-trigger crawlers on schedule (CRON)
- Model feedback loop based on user voting
- Auto-delete Pinecone-ingested JSONs
- Add trading signals to frontend for active bets

---

## NOTES
pnpm run:sports                                                                                          ◉ ▸▸▸▸▸▸▸▸▹▹

> ai-world-predictions@1.0.0 run:sports /Users/davelaflam/Sites/dev/ai-world-predictions
> tsx ./server/webScraping/crawlers/sportsCrawler.ts

ℹ️ Fetching RSS feed from: https://sports.yahoo.com/rss/
ℹ️ Extracted 47 sports links.
ℹ️ Total sports links found: 47
ℹ️ Scraping sports link: https://thehockeynews.com/st-louis-blues/latest-news/three-takeaways-from-blues-2-1-ot-win-against-red-wings
⚠️ No valid data extracted from: https://thehockeynews.com/st-louis-blues/latest-news/three-takeaways-from-blues-2-1-ot-win-against-red-wings
ℹ️ Scraping sports link: https://sports.yahoo.com/article/la-galaxy-tigres-uanl-play-052339547.html
ℹ️ Processing scraped data for: https://sports.yahoo.com/article/la-galaxy-tigres-uanl-play-052339547.html
⚠️ Invalid JSON format in /Users/davelaflam/Sites/dev/ai-world-predictions/server/webScraping/outputs/sports_data.json, starting fresh.
ℹ️ ✅ Successfully updated sports_data.json
ℹ️ Scraping sports link: https://sports.yahoo.com/article/andrei-kuzmenko-keys-la-kings-051958248.html
🆘 Error processing link https://sports.yahoo.com/article/andrei-kuzmenko-keys-la-kings-051958248.html: Error: Request failed with status code 429. Error: Rate limit exceeded. Consumed (req/min): 3, Remaining (req/min): 0. Upgrade your plan at https://firecrawl.dev/pricing for increased rate limits or please retry after 30s, resets at Wed Apr 02 2025 05:34:36 GMT+0000 (Coordinated Universal Time)
ℹ️ ✅ Successfully upserted 1 sports articles to Pinecone.

---

Let me know if you want to add:
•	A minScoreThreshold filter (e.g. only return matches with score > 0.80)?
•	Match logging (e.g. log the top 3 with scores)?
•	Caching for previously embedded titles to speed things up?

---

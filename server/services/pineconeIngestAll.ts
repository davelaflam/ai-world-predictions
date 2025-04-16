import { ingestEntertainmentArticles } from './pineconeIngestEntertainment.js'
import { ingestPoliticsArticles } from './pineconeIngestPolitics.js'
import { ingestSportsArticles } from './pineconeIngestSports.js'
import { ingestWorldNewsArticles } from './pineconeIngestWorldNews.js'
import { LoggerService } from './logger/LoggerService.js'

const scriptArg = process.argv[2]?.toLowerCase() || 'all'

const run = async () => {
  if (!scriptArg) {
    LoggerService.error(
      '❌ Missing required option.\n\nUsage:\n  ts-node pineconeIngestAll.ts [entertainment|politics|sports|world-news|all]\n'
    )
    process.exit(1)
  }

  try {
    switch (scriptArg) {
      case 'entertainment':
        LoggerService.info('🎭 Ingesting entertainment articles...')
        await ingestEntertainmentArticles()
        break
      case 'politics':
        LoggerService.info('🏛️ Ingesting politics articles...')
        await ingestPoliticsArticles()
        break
      case 'sports':
        LoggerService.info('🏅 Ingesting sports articles...')
        await ingestSportsArticles()
        break
      case 'world-news':
        LoggerService.info('🌍 Ingesting world news articles...')
        await ingestWorldNewsArticles()
        break
      case 'all':
        LoggerService.info('🚀 Ingesting ALL article types...')
        await ingestEntertainmentArticles()
        await ingestPoliticsArticles()
        await ingestSportsArticles()
        await ingestWorldNewsArticles()
        break
      default:
        LoggerService.error(`❌ Unknown option: "${scriptArg}"`)
        console.log(`\nUsage:\n  ts-node pineconeIngestAll.ts [entertainment|politics|sports|world-news|all]\n`)
        process.exit(1)
    }
  } catch (err) {
    LoggerService.error(`🆘 Ingestion failed: ${err}`)
    process.exit(1)
  }
}

run()

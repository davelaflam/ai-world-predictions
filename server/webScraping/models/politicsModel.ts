import { z } from 'zod'
import { LoggerService } from '../../services/logger/LoggerService.js'

// 🧠 Define reusable data schemas
const FigureSchema = z.object({
  name: z.string(),
  organization: z.string(),
  position: z.string(),
  facts: z.array(z.string()),
})

const OrganizationSchema = z.object({
  name: z.string(),
  people: z.array(FigureSchema),
  facts: z.array(z.string()),
})

export const PoliticsArticleExtractionSchema = z.object({
  title: z.string(),
  author: z.string(),
  date: z.string(),
  url: z.string(),
  summary: z.string(),
  quote: z.string(),
  figures: z.array(FigureSchema),
  organizations: z.array(OrganizationSchema),
})

export type PoliticsArticleExtraction = z.infer<typeof PoliticsArticleExtractionSchema>

LoggerService.info('✅ PoliticsArticleExtraction type and schema loaded')

import { z } from 'zod'

/**
 * Schema for figures mentioned in entertainment news articles.
 */
export const FigureSchema = z.object({
  name: z.string().describe('The name of the person'),
  organization: z.string().describe('The organization or company the person is associated with'),
  position: z.string().describe('The role or position of the person'),
  facts: z.array(z.string()).describe('Key facts about the person'),
})

/**
 * Schema for organizations mentioned in entertainment news.
 */
export const OrganizationSchema = z.object({
  name: z.string().describe('The name of the organization'),
  people: z.array(FigureSchema).describe('Relevant people associated with the organization'),
  facts: z.array(z.string()).describe('Facts about the organization'),
})

/**
 * Schema for entertainment articles.
 */
export const EntertainmentArticleExtraction = z.object({
  title: z.string().describe('The title of the article'),
  author: z.string().describe('The author of the article'),
  date: z.string().describe('The publication date'),
  url: z.string().describe('The URL of the article'),
  summary: z.string().describe('A detailed summary of the article'),
  quote: z.string().describe('A notable quote from the article'),
  figures: z.array(FigureSchema).describe('People mentioned in the article'),
  organizations: z.array(OrganizationSchema).describe('Organizations mentioned in the article'),
})

export type Figure = z.infer<typeof FigureSchema>
export type Organization = z.infer<typeof OrganizationSchema>
export type EntertainmentArticle = z.infer<typeof EntertainmentArticleExtraction>

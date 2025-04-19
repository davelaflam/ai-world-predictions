import { z } from 'zod'

export const FigureSchema = z.object({
  name: z.string().describe('The name of the person'),
  organization: z
    .string()
    .describe('The organization, company, political party, institution, teamn, etc that the person is associated with'),
  position: z.string().describe('The position of the person. Example: CEO, President, etc.'),
  facts: z
    .array(z.string())
    .describe(
      'The facts about the person. If these are not available, you can add relevant facts from reliable sources like the BBC, Reuters, Bloomberg, CNN, AP, etc.'
    ),
})

export const OrganizationSchema = z.object({
  name: z.string().describe('The name of the organization'),
  people: z
    .array(FigureSchema)
    .describe(
      'The figureheads, donors, funders, sponsors, leaders, workers, and other relevant people in the organization or mentioned in the article.'
    ),
  facts: z
    .array(z.string())
    .describe(
      'The facts about the organization. If these are not available, you can add relevant facts from reliable sources like Reuters, Bloomberg, CNN, AP, etc.'
    ),
})

export const WorldNewsArticleExtractionSchema = z.object({
  title: z.string().describe('The title of the article'),
  author: z.string().describe('The author of the article'),
  date: z.string().describe('The date of the article'),
  url: z.string().describe('The URL of the article'),
  summary: z
    .string()
    .describe(
      'A detailed and descriptive summary of the article. It should not generalize facts or statistics, but rather provide a thorough, specific, and detailed summary of the article.'
    ),
  quote: z.string().describe('A quote from the article'),
  figures: z
    .array(FigureSchema)
    .describe(
      'The figureheads, donors, funders, sponsors, leaders, workers, and other relevant people in the article.'
    ),
  organizations: z
    .array(OrganizationSchema)
    .describe('The organizations, companies, institutions, teams, and other relevant organizations in the article.'),
})

export type Figure = z.infer<typeof FigureSchema>
export type Organization = z.infer<typeof OrganizationSchema>
export type WorldNewsArticleExtraction = z.infer<typeof WorldNewsArticleExtractionSchema>

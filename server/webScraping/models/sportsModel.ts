import { z } from 'zod'

export const PlayerSchema = z.object({
  name: z.string().describe('The name of the player'),
  team: z.string().describe('The team of the player'),
  position: z.string().describe('The position of the player. Example: Forward, Center, etc.'),
  stats: z
    .array(z.string())
    .describe(
      'The stats of the player. If these are not available, you can add relevant stats from reliable sources like ESPN, Yahoo Sports, etc.'
    ),
  injuryStatus: z.string().describe('The injury status of the player'),
})

export const TeamSchema = z.object({
  name: z.string().describe('The name of the team'),
  people: z
    .array(PlayerSchema)
    .describe('The players, coaches, and other relevant people in the team or mentioned in the article.'),
  stats: z
    .array(z.string())
    .describe(
      'The stats of the team. If these are not available, you can add relevant stats from reliable sources like ESPN, Yahoo Sports, etc.'
    ),
})

export const SportsArticleExtractionSchema = z.object({
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
  players: z.array(PlayerSchema).describe('The players, coaches, and other relevant people in the article.'),
  teams: z.array(TeamSchema).describe('The teams in the article'),
})

export type Player = z.infer<typeof PlayerSchema>
export type Team = z.infer<typeof TeamSchema>
export type SportsArticleExtraction = z.infer<typeof SportsArticleExtractionSchema>

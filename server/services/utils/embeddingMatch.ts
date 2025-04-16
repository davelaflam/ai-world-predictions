import { OpenAI } from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function getEmbedding(text: string): Promise<number[]> {
  const result = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return result.data[0].embedding
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dot / (normA * normB)
}

export async function findClosestMatch(prompt: string, markets: any[], field = 'title') {
  const promptEmbedding = await getEmbedding(prompt)
  let best = null
  let bestScore = -1

  for (const market of markets) {
    const text = market[field]
    if (!text || typeof text !== 'string') continue
    try {
      const emb = await getEmbedding(text)
      const score = cosineSimilarity(promptEmbedding, emb)
      if (score > bestScore) {
        bestScore = score
        best = market
      }
    } catch (_e) {
      console.log('\n:: e ::\n', _e)
    }
  }

  return best
}

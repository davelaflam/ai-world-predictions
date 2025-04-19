declare namespace Express {
  export interface Locals {
    // User's input query for predictions
    userQuery?: string

    // OpenAI-generated embedding for the prediction prompt
    embedding?: number[]

    // Retrieved context from Pinecone based on the query
    pineconeQueryResult?: Array<
      import('@pinecone-database/pinecone').ScoredPineconeRecord<import('./types').PredictionMetadata>
    >

    // Final AI prediction result
    predictionResult?: string
  }

  export interface Response {
    // Extending Express Response to include `locals`
    locals: Locals
  }
}

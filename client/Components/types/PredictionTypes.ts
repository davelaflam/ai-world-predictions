export interface CouncilConsensus {
  final_prediction: string
  confidence_level: number
}

export interface CouncilDiscussion {
  expert: string
  analysis: {
    prediction: string
    confidence: number
    factors: string[]
    risks: string[]
  }
}

export interface CouncilResult {
  consensus: CouncilConsensus
  discussion: CouncilDiscussion[]
}

export type PredictionsState = {
  fast: string
  deep: string
  council: CouncilResult | string
}

export interface LoadingState {
  fast: boolean
  deep: boolean
  council: boolean
}

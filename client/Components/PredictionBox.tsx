import React from 'react'
import { Box, CircularProgress, Typography, Paper, List, ListItem, ListItemText } from '@mui/material'
import { CouncilResult } from './types/PredictionTypes'

interface PredictionBoxProps {
  mode: 'fast' | 'deep' | 'council'
  loading: boolean
  data: string | CouncilResult
}

const PredictionBox: React.FC<PredictionBoxProps> = ({ mode, loading, data }) => {
  const isCouncil = mode === 'council' && typeof data !== 'string'

  return (
    <Paper elevation={4} sx={{ p: { xs: 2, md: 3 }, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        {mode.charAt(0).toUpperCase() + mode.slice(1)} Prediction
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress />
        </Box>
      ) : isCouncil ? (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Final Consensus:</strong> {(data as CouncilResult).consensus.final_prediction}
          </Typography>
          <Typography variant="subtitle2" gutterBottom>
            Confidence: {(data as CouncilResult).consensus.confidence_level || 0}%
          </Typography>

          {(data as CouncilResult).discussion.map((expert, index) => (
            <Paper key={index} variant="outlined" sx={{ p: 2, my: 2, backgroundColor: '#1c2128' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                {expert.expert}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Prediction:</strong> {expert.analysis.prediction}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Confidence:</strong> {expert.analysis.confidence}%
              </Typography>

              {expert.analysis.factors?.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    Key Factors:
                  </Typography>
                  <List dense>
                    {expert.analysis.factors.map((factor, idx) => (
                      <ListItem key={idx} disablePadding>
                        <ListItemText primary={`• ${factor}`} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {expert.analysis.risks?.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    Risk Factors:
                  </Typography>
                  <List dense>
                    {expert.analysis.risks.map((risk, idx) => (
                      <ListItem key={idx} disablePadding>
                        <ListItemText primary={`• ${risk}`} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Paper>
          ))}
        </Box>
      ) : (
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {data as string}
        </Typography>
      )}
    </Paper>
  )
}

export default PredictionBox

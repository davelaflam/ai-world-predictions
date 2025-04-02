import React, { useState, FormEvent, ChangeEvent } from 'react'
import axios from 'axios'
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Box,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Grid,
  List,
  ListItem,
  ListItemText,
} from '@mui/material'
import { styled } from '@mui/material/styles'

const BACKEND_PORT = process.env.REACT_APP_BACKEND_API_PORT || 5000
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`

interface CouncilConsensus {
  final_prediction: string
  confidence_level: number
}

interface CouncilDiscussion {
  expert: string
  analysis: {
    prediction: string
    confidence: number
    factors: string[]
    risks: string[]
  }
}

interface CouncilResult {
  consensus: CouncilConsensus
  discussion: CouncilDiscussion[]
}

type PredictionsState = {
  fast: string
  deep: string
  council: CouncilResult | string
}

interface LoadingState {
  fast: boolean
  deep: boolean
  council: boolean
}

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#64b5f6',
    },
    background: {
      default: '#0d1117',
      paper: '#161b22',
    },
    text: {
      primary: '#c9d1d9',
      secondary: '#8b949e',
    },
  },
  typography: {
    fontFamily: 'Inter, Roboto, sans-serif',
  },
})

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(2),
  color: theme.palette.text.secondary,
  height: '100%',
}))

const Recommendations: React.FC = () => {
  const [predictions, setPredictions] = useState<PredictionsState>({
    fast: '',
    deep: '',
    council: '',
  })
  const [prompt, setPrompt] = useState<string>('')
  const [loading, setLoading] = useState<LoadingState>({
    fast: false,
    deep: false,
    council: false,
  })

  const handlePredict = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPredictions({ fast: '', deep: '', council: '' })
    const modes: ('fast' | 'deep' | 'council')[] = ['fast', 'deep', 'council']
    for (const mode of modes) {
      setLoading((prev) => ({ ...prev, [mode]: true }))
      try {
        const response = await axios.post(`${BACKEND_URL}/predict`, {
          prompt,
          mode,
          timeframe: 'short',
        })
        if (mode === 'council') {
          setPredictions((prev) => ({
            ...prev,
            [mode]: {
              consensus: response.data.consensus,
              discussion: response.data.discussion,
            },
          }))
        } else {
          setPredictions((prev) => ({
            ...prev,
            [mode]: response.data.prediction_result,
          }))
        }
      } catch (error: any) {
        console.error(`Error making ${mode} prediction:`, error)
        setPredictions((prev) => ({
          ...prev,
          [mode]: `Error making ${mode} prediction: ${error.message}`,
        }))
      }
      setLoading((prev) => ({ ...prev, [mode]: false }))
    }
  }

  const renderPredictionBox = (mode: 'fast' | 'deep' | 'council') => (
    <Paper elevation={4} sx={{ p: { xs: 2, md: 3 }, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        {mode.charAt(0).toUpperCase() + mode.slice(1)} Prediction
      </Typography>
      {loading[mode] ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress />
        </Box>
      ) : predictions[mode] ? (
        mode === 'council' && typeof predictions[mode] !== 'string' ? (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              <strong>Final Consensus:</strong> {(predictions[mode] as CouncilResult).consensus?.final_prediction}
            </Typography>
            <Typography variant="subtitle2" gutterBottom>
              Confidence: {(predictions[mode] as CouncilResult).consensus?.confidence_level || 0}%
            </Typography>
            {(predictions[mode] as CouncilResult).discussion.map((expert, index) => (
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
            {predictions[mode] as string}
          </Typography>
        )
      ) : null}
    </Paper>
  )

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Typography variant="h3" align="center" gutterBottom>
          AI World Predictions
        </Typography>
        <Typography variant="subtitle1" align="center" gutterBottom>
          Multi-Model Prediction Analysis
        </Typography>

        <Paper sx={{ p: { xs: 2, md: 3 }, mt: 4, mb: 4 }}>
          <form onSubmit={handlePredict}>
            <TextField
              label="Ask a prediction question"
              multiline
              fullWidth
              rows={4}
              variant="outlined"
              value={prompt}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
              margin="normal"
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={Object.values(loading).some(Boolean) || !prompt.trim()}
              sx={{ mt: 2 }}
              fullWidth
            >
              {Object.values(loading).some(Boolean) ? 'Loading...' : 'Get Predictions'}
            </Button>
          </form>
        </Paper>

        <Box sx={{ flexGrow: 1, mt: 4 }}>
          <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 1, md: 12 }}>
            {(['fast', 'deep', 'council'] as const).map((mode, _index) => (
              <Grid item xs={1} sm={3} md={4} key={mode}>
                <Item elevation={4}>{renderPredictionBox(mode)}</Item>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </ThemeProvider>
  )
}

export default Recommendations

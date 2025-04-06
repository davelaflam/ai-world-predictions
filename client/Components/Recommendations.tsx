import React, { useState, FormEvent, ChangeEvent } from 'react'
import axios from 'axios'
import { Container, Typography, Paper, TextField, Button, CssBaseline, Grid } from '@mui/material'
import { styled } from '@mui/material/styles'
import PredictionBox from './PredictionBox'
import { PredictionsState, LoadingState } from './types/PredictionTypes'

const BACKEND_PORT = process.env.REACT_APP_BACKEND_API_PORT || 3000
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`

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
        setPredictions((prev) => ({
          ...prev,
          [mode]: `Error making ${mode} prediction: ${error.message}`,
        }))
      }
      setLoading((prev) => ({ ...prev, [mode]: false }))
    }
  }

  return (
    <>
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

        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 1, md: 12 }}>
          {(['fast', 'deep', 'council'] as const).map((mode) => (
            <Grid item xs={1} sm={3} md={4} key={mode}>
              <Item elevation={4}>
                <PredictionBox mode={mode} loading={loading[mode]} data={predictions[mode]} />
              </Item>
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  )
}

export default Recommendations

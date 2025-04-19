import React from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'

import './styles.css'
import Recommendations from './Components/Recommendations'
import TopNav from './Components/TopNav'
import darkTheme from './theme/darkTheme'

const App = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <TopNav />
      <Recommendations />
    </ThemeProvider>
  )
}

createRoot(document.querySelector('#root')!).render(<App />)

export default App

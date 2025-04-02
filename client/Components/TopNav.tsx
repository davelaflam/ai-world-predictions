import React from 'react'
import { AppBar, Toolbar, Typography } from '@mui/material'

const Header: React.FC = () => {
  return (
    <AppBar position="static" elevation={1} color="default" sx={{ backgroundColor: '#161b22' }}>
      <Toolbar sx={{ pl: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" sx={{ color: '#c9d1d9' }}>
          Predictron
        </Typography>
      </Toolbar>
    </AppBar>
  )
}

export default Header

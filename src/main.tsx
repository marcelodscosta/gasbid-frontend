import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import './index.css'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { App } from './App'
import { mantineTheme } from './lib/mantineTheme'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={mantineTheme} defaultColorScheme="light">
      <Notifications position="top-right" />
      <App />
    </MantineProvider>
  </StrictMode>,
)


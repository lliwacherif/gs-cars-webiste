import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { brandLogo } from './brand'
import { LanguageProvider } from './context/LanguageContext'
import { CurrencyProvider } from './context/CurrencyContext'

const favicon = document.querySelector("link[rel='icon']")
if (favicon) favicon.href = brandLogo

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <CurrencyProvider>
        <App />
      </CurrencyProvider>
    </LanguageProvider>
  </StrictMode>,
)

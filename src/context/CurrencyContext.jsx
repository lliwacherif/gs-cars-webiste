import { createContext, useContext, useState } from 'react'

const CurrencyContext = createContext()

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(() => {
    return localStorage.getItem('app_currency') || 'TND'
  })

  // Stored exchange rates (1 EUR = X TND, 1 USD = Y TND)
  const [rates, setRates] = useState(() => {
    const saved = localStorage.getItem('app_exchange_rates')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed?.EUR_TND && parsed?.USD_TND) return parsed
      } catch {}
    }
    return { EUR_TND: 3.33, USD_TND: 3.12 }
  })

  const setCurrency = (code) => {
    if (['TND', 'EUR', 'USD'].includes(code)) {
      setCurrencyState(code)
      localStorage.setItem('app_currency', code)
    }
  }

  const updateRates = (newRates) => {
    setRates(prev => {
      const updated = {
        EUR_TND: Number(newRates.EUR_TND) || prev.EUR_TND,
        USD_TND: Number(newRates.USD_TND) || prev.USD_TND,
      }
      localStorage.setItem('app_exchange_rates', JSON.stringify(updated))
      return updated
    })
  }

  // Multipliers per 1 TND
  const eurRate = 1 / (rates.EUR_TND || 3.33)
  const usdRate = 1 / (rates.USD_TND || 3.12)

  const activeCurrencies = {
    TND: { code: 'TND', symbol: 'TND', symbolAr: 'د.ت', rate: 1.0, precision: 0 },
    EUR: { code: 'EUR', symbol: '€',   symbolAr: '€',   rate: eurRate, precision: 2 },
    USD: { code: 'USD', symbol: '$',   symbolAr: '$',   rate: usdRate, precision: 2 },
  }

  /**
   * Convert an amount in TND into the currently selected currency.
   */
  const formatPrice = (amountInTND, isAr = false) => {
    const numericAmount = Number(amountInTND || 0)
    const curr = activeCurrencies[currency] || activeCurrencies.TND
    const converted = numericAmount * curr.rate

    const formattedNum = curr.precision > 0
      ? converted.toFixed(curr.precision)
      : Math.round(converted).toString()

    if (currency === 'USD') {
      return `${curr.symbol}${formattedNum}`
    } else if (currency === 'EUR') {
      return `${formattedNum} ${curr.symbol}`
    } else {
      const sym = isAr ? curr.symbolAr : curr.symbol
      return `${formattedNum} ${sym}`
    }
  }

  const convertAmount = (amountInTND) => {
    const numericAmount = Number(amountInTND || 0)
    const curr = activeCurrencies[currency] || activeCurrencies.TND
    return numericAmount * curr.rate
  }

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      rates,
      updateRates,
      formatPrice,
      convertAmount,
      currencyInfo: activeCurrencies[currency] || activeCurrencies.TND
    }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}

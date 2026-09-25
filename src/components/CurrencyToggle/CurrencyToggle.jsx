import { useCurrency } from '../../context/CurrencyContext'
import { useLanguage } from '../../context/LanguageContext'
import './CurrencyToggle.css'

const OPTIONS = [
  { code: 'TND', label: 'TND', labelAr: 'د.ت' },
  { code: 'EUR', label: 'EUR', labelAr: '€' },
  { code: 'USD', label: 'USD', labelAr: '$' },
]

export default function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency()
  const { isRtl } = useLanguage()

  const activeIndex = OPTIONS.findIndex(o => o.code === currency)
  const safeIndex = activeIndex >= 0 ? activeIndex : 0

  // Calculate sliding thumb position
  // In LTR: index * 100%
  // In RTL: index * -100%
  const transformValue = isRtl
    ? `translateX(${-safeIndex * 100}%)`
    : `translateX(${safeIndex * 100}%)`

  return (
    <div className="currency-toggle" title="Sélectionnez la devise / اختر العملة">
      <div
        className="currency-toggle__thumb"
        style={{ transform: transformValue }}
      />
      {OPTIONS.map((opt) => (
        <button
          key={opt.code}
          type="button"
          className={`currency-toggle__option ${currency === opt.code ? 'currency-toggle__option--active' : ''}`}
          onClick={() => setCurrency(opt.code)}
        >
          {isRtl ? opt.labelAr : opt.label}
        </button>
      ))}
    </div>
  )
}

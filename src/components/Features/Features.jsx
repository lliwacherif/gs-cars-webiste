import { useLanguage } from '../../context/LanguageContext'
import './Features.css'

export default function Features() {
  const { t } = useLanguage()

  const items = [
    {
      id: 'fleet',
      icon: (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path d="M4 22H32M6 22L9 14C10 11.5 12 10 15 10H21C24 10 26 11.5 27 14L30 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <circle cx="11" cy="24.5" r="3" stroke="currentColor" strokeWidth="1.8"/>
          <circle cx="25" cy="24.5" r="3" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M14 24.5H22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ),
      title: t('features.fleetTitle', 'Large choix de véhicules'),
      desc: t('features.fleetDesc', 'Économiques, berlines, SUV, luxe ou utilitaires.'),
    },
    {
      id: 'price',
      icon: (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="13" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M18 10v2M18 24v2M13 18h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M14 14.5c0-1.5 1.8-2.5 4-2.5s4 1 4 2.5-1.8 2-4 2.5-4 1.2-4 2.5 1.8 2.5 4 2.5 4-1 4-2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ),
      title: t('features.priceTitle', 'Meilleurs prix garantis'),
      desc: t('features.priceDesc', 'Des tarifs transparents et sans frais cachés.'),
    },
    {
      id: 'cancel',
      icon: (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="13" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M18 11v7l4 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 26l3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ),
      title: t('features.cancelTitle', 'Annulation gratuite'),
      desc: t('features.cancelDesc', 'Annulez ou modifiez sans frais.'),
    },
    {
      id: 'support',
      icon: (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path d="M9 17C9 11.477 13.477 7 19 7s10 4.477 10 10v3a3 3 0 01-3 3h-1a3 3 0 01-3-3v-3a3 3 0 013-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M9 17v3a3 3 0 003 3h1a3 3 0 003-3v-3a3 3 0 00-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M19 27a3 3 0 003-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ),
      title: t('features.supportTitle', 'Service client 24/7'),
      desc: t('features.supportDesc', 'Nous sommes disponibles à tout moment.'),
    },
  ]

  return (
    <section className="features">
      <div className="features__inner container">
        {items.map(f => (
          <div key={f.id} className="features__item">
            <div className="features__icon">{f.icon}</div>
            <div className="features__text">
              <h3 className="features__title">{f.title}</h3>
              <p className="features__desc">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

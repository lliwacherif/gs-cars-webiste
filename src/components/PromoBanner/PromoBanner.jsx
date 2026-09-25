import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import './PromoBanner.css'

export default function PromoBanner() {
  const { t } = useLanguage()

  return (
    <section className="promo" id="offres">
      <div className="container">
        <div className="promo__card">
          <div className="promo__left">
            <p className="promo__eyebrow">{t('promo.eyebrow', 'Prenez la route')}</p>
            <h2 className="promo__title">
              {t('promo.titleLine1', 'Découvrez la Tunisie')}<br />
              <span>{t('promo.titleLine2', 'en toute liberté')}</span>
            </h2>
            <p className="promo__desc">
              {t('promo.desc', 'Profitez de nos offres spéciales et partez à l\'aventure.')}
            </p>
            <Link to="/voitures?offres=1" className="promo__btn">
              {t('promo.btn', 'Voir les offres')}
            </Link>
          </div>
          <div className="promo__right">
            <img
              src="/promo_car.png"
              alt="GS-Cars"
              className="promo__img"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

import { Link } from 'react-router-dom'
import { FiArrowRight } from 'react-icons/fi'
import { useLanguage } from '../../context/LanguageContext'
import './Hero.css'

export default function Hero() {
  const { t } = useLanguage()

  return (
    <section className="hero" id="accueil">
      <div className="hero__bg">
        <img src="/hero_background.png" alt="Voitures de luxe en Tunisie" className="hero__bg-img" />
        <div className="hero__overlay" />
      </div>
      <div className="hero__content container">
        <div className="hero__copy">
          <p className="hero__eyebrow">
            <span className="hero__eyebrow-line" aria-hidden="true" />
            {t('hero.badge', 'Votre route commence ici')}
          </p>
          <h1 className="hero__title">
            {t('hero.titleLine1', 'Louez la voiture ')}
            <span>{t('hero.titleSpan', 'parfaite')}</span>
            <br />
            {t('hero.titleLine2', 'en Tunisie')}
          </h1>
          <p className="hero__subtitle">
            {t('hero.subtitle', 'Des voitures de qualité, un service premium et des tarifs compétitifs pour tous vos trajets.')}
          </p>

          <div className="hero__actions">
            <Link to="/voitures" className="hero__cta hero__cta--primary">
              {t('hero.primaryCta', 'Découvrir nos voitures')}
              <FiArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link to="/guide" className="hero__cta hero__cta--secondary">
              {t('hero.secondaryCta', 'Comment ça marche')}
            </Link>
          </div>

          <div className="hero__trust" aria-label={t('hero.trustLabel', 'Les avantages GS-Cars')}>
            <span>{t('hero.trustOne', 'Réservation simple')}</span>
            <span>{t('hero.trustTwo', 'Tarifs transparents')}</span>
            <span>{t('hero.trustThree', 'Assistance 24/7')}</span>
          </div>
        </div>
      </div>
    </section>
  )
}

import { Link } from 'react-router-dom'
import { FiArrowRight, FiMapPin, FiSun } from 'react-icons/fi'
import { useLanguage } from '../../context/LanguageContext'
import './Hero.css'

export default function Hero() {
  const { t } = useLanguage()

  return (
    <section className="hero" id="accueil">
      <div className="hero__content container">
        <div className="hero__copy">
          <p className="hero__eyebrow">
            <FiSun size={17} aria-hidden="true" />
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
        <div className="hero__visual">
          <div className="hero__sun" aria-hidden="true" />
          <div className="hero__photo">
            <img src="/tunisia/coastal-drive.webp" alt={t('hero.imageAlt', 'Une voiture sur la côte tunisienne, entre mer et maisons blanches aux portes bleues')} className="hero__bg-img" fetchPriority="high" width="1672" height="941" />
            <div className="hero__photo-caption">
              <FiMapPin size={17} aria-hidden="true" />
              <span>{t('hero.photoCaption', 'La Tunisie, à votre rythme')}</span>
            </div>
          </div>
          <div className="hero__postcard">
            <img src="/tunisia/sidi-bou-said.webp" alt={t('hero.postcardAlt', 'Ruelle blanche et bleue de Sidi Bou Saïd avec vue sur la Méditerranée')} width="563" height="750" />
            <span>{t('hero.postcardLabel', 'Sidi Bou Saïd')} <FiArrowRight size={14} aria-hidden="true" /></span>
          </div>
          <span className="hero__visual-note">{t('hero.visualNote', 'Un air de Méditerranée.')}</span>
        </div>
      </div>
    </section>
  )
}

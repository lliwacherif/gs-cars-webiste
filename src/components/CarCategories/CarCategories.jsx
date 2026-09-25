import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { vehiclesService } from '../../services/vehiclesService'
import { mediaUrl } from '../../mediaUrl'
import { useLanguage } from '../../context/LanguageContext'
import { useCurrency } from '../../context/CurrencyContext'
import './CarCategories.css'

const PREVIEW_COUNT = 4

export default function CarCategories() {
  const { t, isRtl } = useLanguage()
  const { formatPrice } = useCurrency()
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    vehiclesService.getAll({ limit: 50, page: 1 })
      .then(data => setCars(data.vehicles || []))
      .catch(() => setCars([]))
      .finally(() => setLoading(false))
  }, [])

  const visible = expanded ? cars : cars.slice(0, PREVIEW_COUNT)
  const canExpand = cars.length > PREVIEW_COUNT

  return (
    <section className="categories" id="voitures">
      <div className="container">
        <div className="categories__header">
          <div>
            <p className="categories__eyebrow">{t('categories.eyebrow', 'Notre flotte')}</p>
            <h2 className="categories__title">{t('categories.title', 'Nos voitures')}</h2>
            <p className="categories__subtitle">
              {t('categories.subtitle', 'Une voiture pour chaque trajet, du quotidien à l’évasion.')}
            </p>
          </div>
          <Link to="/voitures" className="categories__view-all">
            {t('categories.viewAll', 'Voir toutes les voitures')}
            <FiArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        <div className="categories__grid">
          {loading
            ? [1, 2, 3, 4].map(i => (
                <div key={i} className="categories__card categories__card--skeleton" />
              ))
            : visible.map((car, index) => (
                <article key={car._id} className="categories__card" style={{ '--card-index': index }}>
                  <Link to={`/voitures/${car._id}`} className="categories__card-link" aria-label={car.name}>
                  <div className="categories__card-img-wrap">
                    {car.images?.[0]
                      ? <img src={mediaUrl(car.images[0])} alt={car.name} className="categories__card-img" loading="lazy" />
                      : <span style={{ fontSize: 40 }}>🚗</span>
                    }
                  </div>
                  <div className="categories__card-info">
                    <div className="categories__card-heading">
                      <div>
                        <p className="categories__card-meta">{[car.brand, car.year].filter(Boolean).join(' · ')}</p>
                        <h3 className="categories__card-name">{car.name}</h3>
                      </div>
                      <span className="categories__card-arrow" aria-hidden="true"><FiArrowRight size={15} /></span>
                    </div>
                    <p className="categories__card-price">
                      {car.pricePerDay != null
                        ? `${formatPrice(car.pricePerDay, isRtl)} / ${t('searchResults.day', 'jour')}`
                        : t('categories.priceOnDemand', 'Prix sur demande')}
                    </p>
                  </div>
                  </Link>
                </article>
              ))
          }
        </div>

        {!loading && cars.length === 0 && (
          <p className="categories__empty">{t('categories.empty', 'Aucun véhicule disponible pour le moment.')}</p>
        )}

        {!loading && canExpand && (
          <button
            type="button"
            className="categories__expand"
            onClick={() => setExpanded(open => !open)}
            aria-expanded={expanded}
          >
            {expanded
              ? t('categories.showLess', 'Réduire')
              : t('categories.showMore', 'Afficher plus de voitures')}
            {expanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
          </button>
        )}
      </div>
    </section>
  )
}

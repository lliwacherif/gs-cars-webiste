import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FiMapPin, FiCalendar, FiUser, FiHeart, FiChevronDown, FiCheck, FiInfo, FiShield, FiAlertCircle, FiSliders } from 'react-icons/fi'
import { vehiclesService, parcsService } from '../../services/vehiclesService'
import { mediaUrl } from '../../mediaUrl'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useCurrency } from '../../context/CurrencyContext'
import Navbar from '../../components/Navbar/Navbar'
import AdminStrip from '../../components/AdminStrip/AdminStrip'
import Footer from '../../components/Footer/Footer'
import ParcSelect from '../../components/ParcSelect/ParcSelect'
import './SearchResults.css'

const CATEGORIES = ['Économique', 'Compacte', 'Berline', 'SUV', 'Luxe', 'Monospace', 'Utilitaire']
const TRANSMISSIONS = ['Manuelle', 'Automatique']
const FUELS = ['Essence', 'Diesel', 'Hybride', 'Électrique']

const CATEGORY_COLORS = {
  'Économique': '#0d6e3f', 'Compacte': '#6b3fa0', 'Berline': '#1e3a8a',
  'SUV': '#92400e', 'Luxe': '#9f1239', 'Monospace': '#155e75', 'Utilitaire': '#374151',
}

function fmt(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysBetween(a, b) {
  if (!a || !b) return 7
  const d = Math.ceil((new Date(b) - new Date(a)) / 86400000)
  return d > 0 ? d : 7
}

function CarCard({ car, searchParams, index }) {
  const [liked, setLiked] = useState(false)
  const navigate = useNavigate()
  const { t, isRtl } = useLanguage()
  const { formatPrice } = useCurrency()
  const color = CATEGORY_COLORS[car.category] || '#1e3a8a'

  const goToDetail = () => navigate(`/voitures/${car._id}?${searchParams}`)

  return (
    <article className="sr-card" style={{ '--card-index': index }}>
      <div className="sr-card__img-wrap">
        {car.images?.[0]
          ? <img src={mediaUrl(car.images[0])} alt={car.name} className="sr-card__img" loading="lazy" />
          : <div className="sr-card__img-placeholder">🚗</div>
        }
      </div>

      <div className="sr-card__body">
        <span className="sr-card__badge" style={{ color, borderColor: color, background: `${color}15` }}>
          {car.category}
        </span>
        <h3 className="sr-card__name">{car.name} <small className="sr-card__year">{car.year}</small></h3>

        <div className="sr-card__specs">
          <span className="sr-card__spec">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            {car.transmission === 'Automatique' ? t('searchResults.automatic', 'Automatique') : t('searchResults.manual', 'Manuelle')}
          </span>
          <span className="sr-card__spec">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
            {car.fuel}
          </span>
          <span className="sr-card__spec">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            {car.seats} {t('vehicleDetail.seats', 'places')}
          </span>
          <span className="sr-card__spec">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-4 0v2"/></svg>
            {car.bags} {t('vehicleDetail.bags', 'sacs')}
          </span>
        </div>

        <div className="sr-card__features">
          {car.features?.ac && <span className="sr-card__feat">❄️ {t('vehicleDetail.ac', 'Climatisation')}</span>}
          {car.features?.bluetooth && <span className="sr-card__feat">📶 {t('vehicleDetail.bluetooth', 'Bluetooth')}</span>}
          {car.features?.gps && <span className="sr-card__feat">🗺️ {t('vehicleDetail.gps', 'GPS')}</span>}
          {car.features?.usb && <span className="sr-card__feat">🔌 {t('vehicleDetail.usb', 'USB')}</span>}
        </div>

        <div className="sr-card__cancellation">
          <FiCheck size={13} color="#16a34a" />
          <span>{t('searchResults.freeCancellation', 'Annulation gratuite')}</span>
          <FiInfo size={12} color="#9ca3af" />
        </div>
      </div>

      <div className="sr-card__right">
        <button
          type="button"
          className="sr-card__heart"
          onClick={() => setLiked(value => !value)}
          aria-pressed={liked}
          aria-label={liked ? t('searchResults.removeFavorite', 'Retirer des favoris') : t('searchResults.addFavorite', 'Ajouter aux favoris')}
        >
          <FiHeart size={18} fill={liked ? '#ef4444' : 'none'} color={liked ? '#ef4444' : '#9ca3af'} />
        </button>

        <div className="sr-card__pricing">
          <span className="sr-card__price-label">{t('searchResults.fromPrice', 'Prix à partir de')}</span>
          <span className="sr-card__price">{formatPrice(car.pricePerDay, isRtl)}</span>
          <span className="sr-card__price-day">{t('searchResults.perDayLabel', 'par jour')}</span>
        </div>

        <div className="sr-card__actions">
          <button className="sr-card__btn sr-card__btn--outline" onClick={goToDetail}>
            {t('searchResults.seeDetails', 'Voir les détails')}
          </button>
          <button className="sr-card__btn sr-card__btn--primary" onClick={goToDetail}>
            {t('searchResults.reserve', 'Réserver')}
          </button>
          <button className="sr-card__btn sr-card__btn--pay" onClick={goToDetail}>
            <span>{t('searchResults.payDeposit', 'Payer l\'acompte avec')}</span>
            <span className="sr-card__clicktopay">Click to Pay</span>
          </button>
          <span className="sr-card__secure"><FiShield size={11} /> {t('searchResults.securedPayment', 'Paiement sécurisé')}</span>
        </div>
      </div>
    </article>
  )
}

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const { t } = useLanguage()

  // Read initial values from URL
  const urlLocation  = searchParams.get('location')  || ''
  const urlPickup    = searchParams.get('pickupDate') || ''
  const urlDropoff   = searchParams.get('dropoffDate') || ''
  const urlAge       = searchParams.get('driverAge')  || '30'
  const urlParcId    = searchParams.get('parcId')     || ''

  const [vehicles, setVehicles] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // search bar editable state
  const [searchLocation, setSearchLocation] = useState(urlLocation)
  const [searchParcId, setSearchParcId]     = useState(urlParcId)
  const [searchPickup, setSearchPickup]     = useState(urlPickup)
  const [searchDropoff, setSearchDropoff]   = useState(urlDropoff)
  const [searchAge, setSearchAge]           = useState(urlAge)

  // filters
  const [selectedCats, setSelectedCats]     = useState([])
  const [selectedTrans, setSelectedTrans]   = useState([])
  const [selectedFuels, setSelectedFuels]   = useState([])
  const [priceRange, setPriceRange]         = useState(500)
  const [sortOrder, setSortOrder]           = useState('asc')
  const [page, setPage]                     = useState(1)

  const [parcs, setParcs] = useState([])
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  useEffect(() => {
    parcsService.getAll().then(data => setParcs(data || [])).catch(() => {})
  }, [])

  const searchDays = daysBetween(searchPickup, searchDropoff)

  // Effective age: logged-in user's account age takes priority (cannot be bypassed)
  const effectiveAge = user?.age ? Number(user.age) : Number(searchAge)

  // URL params to pass when navigating to car detail page
  const carDetailParams = new URLSearchParams({
    location: searchLocation,
    ...(searchParcId  && { parcId: searchParcId }),
    ...(searchPickup  && { pickupDate:  searchPickup }),
    ...(searchDropoff && { dropoffDate: searchDropoff }),
    driverAge: String(effectiveAge),
  }).toString()

  const fetchVehicles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        page,
        limit: 10,
        sortBy: 'pricePerDay',
        sortOrder,
        maxPrice: priceRange,
        ...(selectedCats.length > 0 && { category: selectedCats[0] }),
        ...(selectedTrans.length > 0 && { transmission: selectedTrans[0] }),
        ...(selectedFuels.length > 0 && { fuel: selectedFuels[0] }),
        // Pass dates so backend excludes already-booked vehicles
        ...(searchPickup  && { pickupDate:  searchPickup }),
        ...(searchDropoff && { dropoffDate: searchDropoff }),
        // Age filter — only show cars the driver is old enough to rent
        driverAge: effectiveAge,
        // Parc filter — only show cars assigned to the selected parc
        ...(searchParcId && { parcId: searchParcId }),
      }
      const data = await vehiclesService.getAll(params)
      setVehicles(data.vehicles)
      setPagination(data.pagination)
    } catch {
      setError('Impossible de charger les véhicules. Vérifiez que le serveur est démarré.')
    } finally {
      setLoading(false)
    }
  }, [page, sortOrder, selectedCats, selectedTrans, selectedFuels, priceRange, searchPickup, searchDropoff, effectiveAge, searchParcId])

  useEffect(() => { fetchVehicles() }, [fetchVehicles])

  const handleSearch = () => {
    setPage(1)
    setSearchParams({
      location: searchLocation,
      ...(searchParcId && { parcId: searchParcId }),
      pickupDate: searchPickup,
      dropoffDate: searchDropoff,
      driverAge: String(effectiveAge),
    })
    fetchVehicles()
  }

  const toggleFilter = (arr, setArr, val) =>
    setArr(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])

  const resetFilters = () => {
    setSelectedCats([])
    setSelectedTrans([])
    setSelectedFuels([])
    setPriceRange(500)
    setPage(1)
  }

  return (
    <div className="sr-page">
      <AdminStrip />
      <Navbar />

      <section className="sr-intro">
        <div className="container sr-intro__inner">
          <p className="sr-intro__eyebrow">{t('searchResults.eyebrow', 'Votre prochain trajet')}</p>
          <h1 className="sr-intro__title">{t('searchResults.title', 'Nos véhicules disponibles')}</h1>
          <p className="sr-intro__subtitle">
            {t('searchResults.subtitle', 'Comparez notre flotte et choisissez la voiture qui correspond vraiment à votre voyage.')}
          </p>
        </div>
      </section>

      {/* Search bar — editable, updates URL on Rechercher */}
      <div className="sr-searchbar">
        <div className="sr-searchbar__inner container">
          <div className="sr-searchbar__field">
            <FiMapPin size={14} color="#d4a017" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="sr-searchbar__field-label">{t('booking.pickupLocation', 'Lieu de prise en charge')}</div>
              <ParcSelect
                parcs={parcs}
                value={searchParcId}
                onChange={(parcId, parcName) => {
                  setSearchParcId(parcId)
                  setSearchLocation(parcName)
                }}
                placeholder={t('booking.selectParc', 'Sélectionnez un parc')}
                variant="searchbar"
              />
            </div>
          </div>
          <div className="sr-searchbar__divider"/>
          <div className="sr-searchbar__field">
            <FiCalendar size={14} color="#d4a017" style={{ flexShrink: 0 }} />
            <div>
              <div className="sr-searchbar__field-label">{t('booking.pickupDate', 'Prise en charge')}</div>
              <input
                type="date"
                className="sr-searchbar__field-input"
                value={searchPickup}
                onChange={e => setSearchPickup(e.target.value)}
              />
            </div>
          </div>
          <div className="sr-searchbar__divider"/>
          <div className="sr-searchbar__field">
            <FiCalendar size={14} color="#d4a017" style={{ flexShrink: 0 }} />
            <div>
              <div className="sr-searchbar__field-label">{t('booking.dropoffDate', 'Restitution')}</div>
              <input
                type="date"
                className="sr-searchbar__field-input"
                value={searchDropoff}
                min={searchPickup}
                onChange={e => setSearchDropoff(e.target.value)}
              />
            </div>
          </div>
          <div className="sr-searchbar__divider"/>
          <div className="sr-searchbar__field">
            <FiUser size={14} color="#d4a017" style={{ flexShrink: 0 }} />
            <div>
              <div className="sr-searchbar__field-label">{t('booking.driverAge', 'Âge conducteur')}</div>
              {user ? (
                <div style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 600, color: '#ffffff' }}>{effectiveAge} {t('booking.years', 'ans')}</span>
                  <span style={{ fontSize: 10, color: '#d4a017', background: 'rgba(212, 160, 23, 0.15)', borderRadius: 4, padding: '1px 6px', border: '1px solid rgba(212, 160, 23, 0.3)' }}>{t('booking.accountLocked', '🔒 compte')}</span>
                </div>
              ) : (
                <input
                  type="number"
                  className="sr-searchbar__field-input"
                  value={searchAge}
                  min={18}
                  max={99}
                  onChange={e => setSearchAge(e.target.value)}
                  style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#ffffff', fontFamily: 'inherit', width: '60px' }}
                />
              )}
            </div>
          </div>
          <button className="sr-searchbar__btn" onClick={handleSearch}>{t('booking.search', 'Rechercher')}</button>
        </div>
      </div>

      <div className="sr-body container">
        {/* Sidebar */}
        <aside className={`sr-sidebar ${mobileFiltersOpen ? 'sr-sidebar--open' : ''}`}>
          {/* Recap */}
          <div className="sr-recap">
            <h4 className="sr-recap__title">{t('searchResults.recap', 'Récapitulatif')}</h4>
            <div className="sr-recap__row">
              <span className="sr-recap__label">{t('searchResults.location', 'Lieu')}</span>
              <span className="sr-recap__value">{searchLocation}</span>
            </div>
            {searchPickup && (
              <div className="sr-recap__row">
                <span className="sr-recap__label">{t('booking.pickupDate', 'Prise en charge')}</span>
                <span className="sr-recap__value">{fmt(searchPickup)}</span>
              </div>
            )}
            {searchDropoff && (
              <div className="sr-recap__row">
                <span className="sr-recap__label">{t('booking.dropoffDate', 'Restitution')}</span>
                <span className="sr-recap__value">{fmt(searchDropoff)}</span>
              </div>
            )}
            <div className="sr-recap__row">
              <span className="sr-recap__label">{t('searchResults.duration', 'Durée')}</span>
              <span className="sr-recap__value">{searchDays} {searchDays > 1 ? t('searchResults.days', 'jours') : t('searchResults.day', 'jour')}</span>
            </div>
            <div className="sr-recap__row">
              <span className="sr-recap__label">{t('searchResults.driver', 'Conducteur')}</span>
              <span className="sr-recap__value">{effectiveAge} {t('booking.years', 'ans')}</span>
            </div>
            <button className="sr-recap__modify" onClick={handleSearch}>{t('searchResults.reset', 'Actualiser')}</button>
          </div>

          {/* Filters */}
          <div className="sr-filters">
            <div className="sr-filters__header">
              <span className="sr-filters__title">{t('searchResults.filters', 'Filtres')}</span>
              <button className="sr-filters__reset" onClick={resetFilters}>{t('searchResults.reset', 'Réinitialiser')}</button>
            </div>

            <div className="sr-filter-group">
              <h5 className="sr-filter-group__title">{t('searchResults.category', 'Catégorie')}</h5>
              {CATEGORIES.map(c => (
                <label key={c} className="sr-filter-check">
                  <input type="checkbox" checked={selectedCats.includes(c)} onChange={() => toggleFilter(selectedCats, setSelectedCats, c)} />
                  <span>{c}</span>
                </label>
              ))}
            </div>

            <div className="sr-filter-group">
              <h5 className="sr-filter-group__title">{t('searchResults.maxPrice', 'Prix max / jour')}</h5>
              <div className="sr-filter-price">
                <input type="range" min="10" max="500" value={priceRange} onChange={e => setPriceRange(Number(e.target.value))} className="sr-filter-slider" />
                <div className="sr-filter-price__labels">
                  <span>10 TND</span>
                  <span>{priceRange} TND</span>
                </div>
              </div>
            </div>

            <div className="sr-filter-group">
              <h5 className="sr-filter-group__title">{t('searchResults.transmission', 'Boîte de vitesses')}</h5>
              {TRANSMISSIONS.map(trans => (
                <label key={trans} className="sr-filter-check">
                  <input type="checkbox" checked={selectedTrans.includes(trans)} onChange={() => toggleFilter(selectedTrans, setSelectedTrans, trans)} />
                  <span>{trans === 'Automatique' ? t('searchResults.automatic', 'Automatique') : t('searchResults.manual', 'Manuelle')}</span>
                </label>
              ))}
            </div>

            <div className="sr-filter-group">
              <h5 className="sr-filter-group__title">{t('searchResults.fuel', 'Carburant')}</h5>
              {FUELS.map(f => (
                <label key={f} className="sr-filter-check">
                  <input type="checkbox" checked={selectedFuels.includes(f)} onChange={() => toggleFilter(selectedFuels, setSelectedFuels, f)} />
                  <span>{f}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Main results */}
        <main className="sr-main">
          <div className="sr-main__header">
            <div>
              <p className="sr-main__eyebrow">{t('searchResults.availableNow', 'Disponibles maintenant')}</p>
              <h2 className="sr-main__count">
                {loading ? '...' : `${pagination?.total ?? vehicles.length} ${t('searchResults.carsAvailable', 'voitures disponibles')}`}
              </h2>
            </div>
            <div className="sr-main__sort">
              <button
                type="button"
                className="sr-filters-toggle"
                onClick={() => setMobileFiltersOpen(o => !o)}
              >
                <FiSliders size={15} aria-hidden="true" />
                {mobileFiltersOpen ? t('searchResults.hideFilters', 'Masquer filtres') : t('searchResults.filters', 'Filtres')}
              </button>
              <span>{t('searchResults.sortBy', 'Trier par :')}</span>
              <select className="sr-main__sort-select" value={sortOrder} onChange={e => { setSortOrder(e.target.value); setPage(1) }}>
                <option value="asc">{t('searchResults.priceAsc', 'Prix (croissant)')}</option>
                <option value="desc">{t('searchResults.priceDesc', 'Prix (décroissant)')}</option>
              </select>
              <FiChevronDown size={14} />
            </div>
          </div>

          {error && (
            <div className="sr-error">
              <FiAlertCircle size={18} />
              <span>{error}</span>
              <button onClick={fetchVehicles}>Réessayer</button>
            </div>
          )}

          {loading ? (
            <div className="sr-loading">
              {[1,2,3].map(i => <div key={i} className="sr-skeleton" />)}
            </div>
          ) : (
            <div className="sr-list">
              {vehicles.length === 0
                ? (
                    <div className="sr-empty">
                      <span className="sr-empty__icon" aria-hidden="true">🚗</span>
                      <h3>{t('searchResults.noCarsFound', 'Aucun véhicule trouvé avec ces critères.')}</h3>
                      <p>{t('searchResults.modifySearch', 'Modifiez vos filtres pour voir plus de résultats.')}</p>
                    </div>
                  )
                : vehicles.map((car, index) => <CarCard key={car._id} car={car} searchParams={carDetailParams} index={index} />)
              }
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="sr-pagination">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="sr-pagination__btn">←</button>
              <span className="sr-pagination__info">Page {page} / {pagination.totalPages}</span>
              <button disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)} className="sr-pagination__btn">→</button>
            </div>
          )}
        </main>
      </div>

      {/* Guarantees */}
      <div className="sr-guarantees">
        <div className="container">
          <div className="sr-guarantees__inner">
            {[
              { icon: '✓', title: 'Meilleur prix garanti', desc: 'Prix aligné sur la concurrence' },
              { icon: '✓', title: 'Annulation gratuite', desc: "Jusqu'à 48h avant la prise en charge" },
              { icon: '✓', title: 'Paiement sécurisé', desc: 'Données 100% protégées' },
              { icon: '✓', title: 'Assistance 24/7', desc: 'Toujours là pour vous aider' },
            ].map(g => (
              <div key={g.title} className="sr-guarantees__item">
                <span className="sr-guarantees__icon">{g.icon}</span>
                <div><div className="sr-guarantees__title">{g.title}</div><div className="sr-guarantees__desc">{g.desc}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { FiHeart, FiMapPin, FiCalendar, FiUser, FiCheck, FiChevronLeft, FiChevronRight, FiShield, FiInfo, FiChevronUp, FiChevronDown, FiAlertCircle } from 'react-icons/fi'
import { vehiclesService, reservationsService, holdsService, parcsService } from '../../services/vehiclesService'
import { mediaUrl } from '../../mediaUrl'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useCurrency } from '../../context/CurrencyContext'
import AdminStrip from '../../components/AdminStrip/AdminStrip'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'
import Car3DViewer from '../../components/Car3DViewer/Car3DViewer'
import ParcSelect from '../../components/ParcSelect/ParcSelect'
import './VehicleDetail.css'

const TVA_RATE = 0.19

export default function VehicleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, openAuthModal, pendingBooking, clearPendingBooking } = useAuth()
  const { t } = useLanguage()
  const { formatPrice } = useCurrency()

  // Pre-fill from URL query string (passed from SearchResults / BookingForm)
  const urlLocation   = searchParams.get('location')    || 'Aéroport de Tunis-Carthage'
  const urlPickup     = searchParams.get('pickupDate')  || ''
  const urlDropoff    = searchParams.get('dropoffDate') || ''
  const urlAge        = searchParams.get('driverAge')   || '30'

  // Effective age: account age wins over everything when logged in
  const effectiveAge  = user?.age ? Number(user.age) : Number(urlAge)

  const [car, setCar] = useState(null)
  const [parcs, setParcs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeThumb, setActiveThumb] = useState(0)
  const [liked, setLiked] = useState(false)
  const [mediaMode, setMediaMode] = useState('photo')
  const [paymentOption, setPaymentOption] = useState(2)
  const [showDetail, setShowDetail] = useState(true)
  const [booking, setBooking] = useState({
    pickupDate: urlPickup,
    dropoffDate: urlDropoff,
    pickupLocation: urlLocation,
    dropoffLocation: urlLocation,
    driverAge: effectiveAge,
  })
  const [submitting, setSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingError, setBookingError] = useState(null)
  const [acceptAlternative, setAcceptAlternative] = useState(true)
  // Track hold id so we can release it if the user cancels, and pass it to
  // reservationsService.create so it gets released server-side after booking
  const holdIdRef = useRef(null)

  // Load all parcs for dropdown
  useEffect(() => {
    parcsService.getAll()
      .then(data => setParcs(data || []))
      .catch(() => setParcs([]))
  }, [])

  // Must be defined before early returns so hook order is stable
  const submitReservation = async (data) => {
    setSubmitting(true)
    setBookingError(null)
    try {
      await reservationsService.create(data)
      holdIdRef.current = null
      navigate('/historique')
    } catch (err) {
      setBookingError(err?.response?.data?.message || 'Erreur lors de la réservation.')
    } finally {
      setSubmitting(false)
    }
  }

  // After successful login/register, if there's a pending booking for THIS
  // vehicle, auto-submit it so the user doesn't have to click again.
  // Must be before early returns to keep hook call order stable.
  useEffect(() => {
    if (user && pendingBooking && pendingBooking.vehicleId === id) {
      clearPendingBooking()
      submitReservation(pendingBooking)
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const data = await vehiclesService.getOne(id)
        setCar(data)
        if (data?.model3dUrl) {
          setMediaMode('3d')
        }

        // If car has an assigned parc, and no custom location was in URL params, pre-fill location
        const parcName = data?.parc?.name || (typeof data?.parc === 'string' ? data.parc : null)
        if (parcName) {
          setBooking(prev => ({
            ...prev,
            pickupLocation: prev.pickupLocation || parcName,
            dropoffLocation: prev.dropoffLocation || parcName,
          }))
        }
      } catch (err) {
        console.error('Failed to load vehicle details:', err)
        setError(err?.response?.data?.message || err?.message || 'Véhicule introuvable.')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  if (loading) return (
    <div className="vd-page">
      <div className="container" style={{ padding: '60px 24px', textAlign: 'center', color: '#6b7280' }}>
        <div className="sr-skeleton" style={{ height: 400, borderRadius: 12 }} />
      </div>
    </div>
  )

  if (error || !car) return (
    <div className="vd-page">
      <div className="container" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <FiAlertCircle size={40} color="#ef4444" />
        <p style={{ color: '#374151', marginTop: 12 }}>{error || 'Véhicule introuvable.'}</p>
        <button onClick={() => navigate('/voitures')} style={{ marginTop: 16, padding: '10px 24px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer' }}>← Retour</button>
      </div>
    </div>
  )

  // Pricing calculations
  const calcDays = () => {
    if (!booking.pickupDate || !booking.dropoffDate) return 7
    const d = Math.ceil((new Date(booking.dropoffDate) - new Date(booking.pickupDate)) / 86400000)
    return d > 0 ? d : 7
  }

  const totalDays = calcDays()
  const subtotalHT = car.pricePerDay * totalDays
  const tva = parseFloat((subtotalHT * TVA_RATE).toFixed(2))
  const totalTTC = parseFloat((subtotalHT + tva).toFixed(2))

  const paymentOptions = [
    { label: 'Acompte', pct: '10%', amount: (totalTTC * 0.1).toFixed(2), key: 'acompte' },
    { label: 'Moitié', pct: '50%', amount: (totalTTC * 0.5).toFixed(2), key: 'moitie' },
    { label: 'Totalité', pct: '100%', amount: totalTTC.toFixed(2), key: 'total' },
  ]

  const toPay = parseFloat(paymentOptions[paymentOption].amount)
  const images = car.images?.length > 0 ? car.images.map(mediaUrl) : ['/car_renault_clio_gray.png']

  const handleReserve = async () => {
    if (!booking.pickupDate || !booking.dropoffDate) {
      setBookingError('Veuillez sélectionner vos dates.')
      return
    }

    setBookingError(null)

    // Step 1 — place a hold to lock the car+dates while the user auth/pays
    let holdId = holdIdRef.current
    if (!holdId) {
      try {
        const hold = await holdsService.create(car._id, booking.pickupDate, booking.dropoffDate)
        holdId = hold._id
        holdIdRef.current = holdId
      } catch (err) {
        setBookingError(
          err?.response?.data?.message ||
          'Ce véhicule n\'est plus disponible pour ces dates.'
        )
        return
      }
    }

    // Step 2 — if not logged in, open auth modal with booking context preserved
    if (!user) {
      openAuthModal('login', {
        vehicleId: car._id,
        pickupDate: booking.pickupDate,
        dropoffDate: booking.dropoffDate,
        pickupLocation: booking.pickupLocation,
        dropoffLocation: booking.dropoffLocation,
        driverAge: booking.driverAge,
        paymentOption: paymentOptions[paymentOption].key,
        holdId,
        acceptAlternative,
      })
      return
    }

    // Step 3 — user is logged in, create the reservation
    await submitReservation({
      vehicleId: car._id,
      pickupDate: booking.pickupDate,
      dropoffDate: booking.dropoffDate,
      pickupLocation: booking.pickupLocation,
      dropoffLocation: booking.dropoffLocation,
      driverAge: effectiveAge,   // always use account age when logged in
      paymentOption: paymentOptions[paymentOption].key,
      holdId,
      acceptAlternative,
    })
  }

  return (
    <div className="vd-page">
      <AdminStrip />
      <Navbar />
      <div className="vd-topbar">
        <div className="container">
          <Link to="/voitures" className="vd-back"><FiChevronLeft size={16} /> Retour aux résultats</Link>
        </div>
      </div>

      <div className="vd-body container">
        {/* LEFT */}
        <div className="vd-left">
          <div className="vd-header">
            <div className="vd-header__main">
              <h1 className="vd-title">{car.name}</h1>
              <span className="vd-category">{car.category}</span>
            </div>
            <button className="vd-heart" onClick={() => setLiked(!liked)}>
              <FiHeart size={20} fill={liked ? '#ef4444' : 'none'} color={liked ? '#ef4444' : '#6b7280'} />
            </button>
          </div>

          <div className="vd-specs">
            <div className="vd-spec">👥 {car.seats} places</div>
            <div className="vd-spec">⚙️ {car.transmission}</div>
            <div className="vd-spec">⛽ {car.fuel}</div>
            {car.features?.ac && <div className="vd-spec">❄️ Climatisation</div>}
            {car.features?.gps && <div className="vd-spec">🗺️ GPS</div>}
          </div>

          {/* Media switcher (Photos vs 3D Inspector) */}
          <div className="vd-media-tabs">
            <button
              className={`vd-media-tab ${mediaMode === 'photo' ? 'vd-media-tab--active' : ''}`}
              onClick={() => setMediaMode('photo')}
            >
              📷 Photos ({images.length})
            </button>
            {car.model3dUrl && (
              <button
                className={`vd-media-tab ${mediaMode === '3d' ? 'vd-media-tab--active' : ''}`}
                onClick={() => setMediaMode('3d')}
              >
                📦 Vue 3D 360°
              </button>
            )}
          </div>

          {mediaMode === '3d' && car.model3dUrl ? (
            <Car3DViewer src={car.model3dUrl} carName={car.name} />
          ) : (
            <>
              <div className="vd-photo">
                <img src={images[activeThumb]} alt={car.name} className="vd-photo__main" />
              </div>

              {images.length > 1 && (
                <div className="vd-thumbs">
                  <button className="vd-thumbs__arrow" onClick={() => setActiveThumb(p => (p - 1 + images.length) % images.length)}><FiChevronLeft size={16}/></button>
                  {images.map((img, i) => (
                    <button key={i} className={`vd-thumb ${activeThumb === i ? 'vd-thumb--active' : ''}`} onClick={() => setActiveThumb(i)}>
                      <img src={img} alt={`vue ${i + 1}`} />
                    </button>
                  ))}
                  <button className="vd-thumbs__arrow" onClick={() => setActiveThumb(p => (p + 1) % images.length)}><FiChevronRight size={16}/></button>
                </div>
              )}
            </>
          )}

          <div className="vd-info-box">
            <FiShield size={18} color="#1e3a8a" />
            <div>
              <p className="vd-info-box__title">Annulation gratuite jusqu'à 48h avant la prise en charge</p>
              <p className="vd-info-box__sub">Réservez maintenant et payez plus tard.</p>
            </div>
          </div>

          {car.description && (
            <div className="vd-section">
              <h3 className="vd-section__title">Description</h3>
              <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.6 }}>{car.description}</p>
            </div>
          )}

          {/* Dates picker */}
          <div className="vd-section">
            <h3 className="vd-section__title">Détails de la location</h3>
            <div className="vd-details">
              <div className="vd-detail-row">
                <FiMapPin size={15} color="#6b7280" style={{ marginTop: 8, flexShrink: 0 }} />
                <div style={{ width: 220, maxWidth: '100%' }}>
                  <span className="vd-detail-row__label">Lieu de prise en charge</span>
                  <ParcSelect
                    parcs={parcs}
                    value={booking.pickupLocation}
                    onChange={(parcId, parcName) => setBooking(b => ({ ...b, pickupLocation: parcName }))}
                    placeholder="Sélectionnez un parc"
                    variant="dark"
                  />
                </div>
              </div>
              <div className="vd-detail-row">
                <FiMapPin size={15} color="#6b7280" style={{ marginTop: 8, flexShrink: 0 }} />
                <div style={{ width: 220, maxWidth: '100%' }}>
                  <span className="vd-detail-row__label">Lieu de restitution</span>
                  <ParcSelect
                    parcs={parcs}
                    value={booking.dropoffLocation}
                    onChange={(parcId, parcName) => setBooking(b => ({ ...b, dropoffLocation: parcName }))}
                    placeholder="Sélectionnez un parc"
                    variant="dark"
                  />
                </div>
              </div>
              <div className="vd-detail-row">
                <FiCalendar size={15} color="#6b7280" />
                <div>
                  <span className="vd-detail-row__label">Date de prise en charge</span>
                  <input type="date" className="vd-input" value={booking.pickupDate} min={new Date().toISOString().split('T')[0]} onChange={e => setBooking(b => ({ ...b, pickupDate: e.target.value }))} />
                </div>
              </div>
              <div className="vd-detail-row">
                <FiCalendar size={15} color="#6b7280" />
                <div>
                  <span className="vd-detail-row__label">Date de restitution</span>
                  <input type="date" className="vd-input" value={booking.dropoffDate} min={booking.pickupDate || new Date().toISOString().split('T')[0]} onChange={e => setBooking(b => ({ ...b, dropoffDate: e.target.value }))} />
                </div>
              </div>
              <div className="vd-detail-row">
                <FiUser size={15} color="#6b7280" />
                <div>
                  <span className="vd-detail-row__label">Âge du conducteur</span>
                  {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>{effectiveAge} ans</span>
                      <span style={{ fontSize: 10, color: '#f97316', background: '#fff7ed', borderRadius: 4, padding: '1px 6px', border: '1px solid #fed7aa' }}>🔒 compte</span>
                    </div>
                  ) : (
                    <input type="number" className="vd-input" value={booking.driverAge} min={18} max={99} onChange={e => setBooking(b => ({ ...b, driverAge: Number(e.target.value) }))} />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="vd-two-cols">
            <div>
              <h4 className="vd-two-cols__title">Inclus dans le prix</h4>
              {['Kilométrage illimité', 'Assurance tous risques', 'Assistance 24/7', 'TVA incluse'].map(item => (
                <div key={item} className="vd-two-cols__item"><FiCheck size={13} color="#16a34a" />{item}</div>
              ))}
            </div>
            <div>
              <h4 className="vd-two-cols__title">Options disponibles</h4>
              {['Siège bébé', 'Conducteur additionnel', 'GPS', 'Wi-Fi portable'].map(item => (
                <div key={item} className="vd-two-cols__item"><span className="vd-plus">+</span>{item}</div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT sticky panel */}
        <div className="vd-right">
          {bookingSuccess ? (
            <div className="vd-panel" style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h3 style={{ color: '#16a34a', marginBottom: 8 }}>Réservation confirmée!</h3>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Votre réservation a été créée avec succès. Vous recevrez une confirmation par email.</p>
              <button onClick={() => navigate('/')} style={{ background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}>Retour à l'accueil</button>
            </div>
          ) : (
            <div className="vd-panel">
              <h3 className="vd-panel__title">Résumé de votre réservation</h3>
              <div className="vd-panel__car-name">{car.name} ({car.year})</div>
              <div className="vd-panel__car-cat">⚙️ {car.category}</div>
              <div className="vd-panel__divider" />

              <div className="vd-panel__row"><span>Prix par jour</span><div className="vd-panel__row-right"><span className="vd-panel__row-val">{formatPrice(car.pricePerDay)}</span><span className="vd-panel__row-note">(HT)</span></div></div>
              <div className="vd-panel__row"><span>Durée</span><span className="vd-panel__row-val">{totalDays} jours</span></div>
              <div className="vd-panel__row vd-panel__row--bold"><span>Sous-total HT</span><span>{formatPrice(subtotalHT)}</span></div>

              <button className="vd-panel__detail-toggle" onClick={() => setShowDetail(!showDetail)}>
                <span>Détail du montant</span>
                {showDetail ? <FiChevronUp size={14}/> : <FiChevronDown size={14}/>}
              </button>
              {showDetail && (
                <div className="vd-panel__detail">
                  <div className="vd-panel__detail-row"><span>Sous-total HT</span><span>{formatPrice(subtotalHT)}</span></div>
                  <div className="vd-panel__detail-row"><span>TVA (19%)</span><span>{formatPrice(tva)}</span></div>
                </div>
              )}

              <div className="vd-panel__divider" />
              <div className="vd-panel__total-row"><span>Total TTC <small>(TVA 19% incluse)</small></span><span className="vd-panel__total">{formatPrice(totalTTC)}</span></div>

              <div className="vd-panel__no-fees">
                <FiShield size={14} color="#16a34a" />
                <div><span className="vd-panel__no-fees-title">Aucun frais caché</span><span className="vd-panel__no-fees-sub">Le prix final est affiché.</span></div>
              </div>

              <div className="vd-panel__divider" />
              <h4 className="vd-panel__pay-title">Choisissez le montant à payer</h4>

              <div className="vd-slider">
                <div className="vd-slider__track">
                  <div className="vd-slider__fill" style={{ width: paymentOption === 0 ? '5%' : paymentOption === 1 ? '50%' : '100%' }} />
                  {[0,1,2].map(i => <div key={i} className={`vd-slider__dot ${paymentOption === i ? 'vd-slider__dot--active' : ''}`} style={{ left: i===0?'0%':i===1?'50%':'100%' }} onClick={() => setPaymentOption(i)} />)}
                </div>
                <div className="vd-slider__labels">
                  {paymentOptions.map((opt, i) => (
                    <button key={i} className={`vd-slider__opt ${paymentOption === i ? 'vd-slider__opt--active' : ''}`} onClick={() => setPaymentOption(i)}>
                      <span className="vd-slider__opt-label">{opt.label}</span>
                      <span className="vd-slider__opt-pct">{opt.pct}</span>
                      <span className="vd-slider__opt-amount">{formatPrice(parseFloat(opt.amount))}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="vd-panel__pay-now"><span>Vous payez maintenant</span><span className="vd-panel__pay-now-val">{formatPrice(toPay)}</span></div>

              {/* Alternative vehicle checkbox */}
              <label
                htmlFor="alt-vehicle-check"
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  cursor: 'pointer', padding: '10px 12px',
                  borderRadius: 8,
                  background: acceptAlternative ? 'rgba(212,160,23,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${acceptAlternative ? 'rgba(212,160,23,0.35)' : 'rgba(255,255,255,0.08)'}`,
                  marginBottom: 12, transition: 'all 0.2s',
                }}
              >
                <input
                  id="alt-vehicle-check"
                  type="checkbox"
                  checked={acceptAlternative}
                  onChange={e => setAcceptAlternative(e.target.checked)}
                  style={{ marginTop: 2, accentColor: '#d4a017', width: 15, height: 15, flexShrink: 0, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 12.5, color: acceptAlternative ? '#e5e7eb' : '#a1a1aa', lineHeight: 1.5 }}>
                  Si ce véhicule n'est pas disponible, j'accepte qu'on me propose{' '}
                  <strong style={{ color: acceptAlternative ? '#d4a017' : '#71717a' }}>un véhicule similaire</strong>{' '}de la même catégorie.
                </span>
              </label>

              {bookingError && (
                <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:6, padding:'10px 12px', fontSize:12.5, color:'#991b1b', marginBottom:10 }}>
                  <FiAlertCircle size={14}/> {bookingError}
                </div>
              )}

              <button className="vd-panel__cta" onClick={handleReserve} disabled={submitting}>
                {submitting ? 'Réservation...' : 'Click to Pay'}
              </button>

              <button
                type="button"
                disabled
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.35)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'not-allowed',
                  marginTop: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justify: 'center',
                  gap: 2,
                  fontFamily: 'inherit',
                  pointerEvents: 'none',
                }}
              >
                <span>Payer en ligne</span>
                <span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255, 255, 255, 0.25)', letterSpacing: '0.4px' }}>
                  (Bientôt disponible / Coming soon)
                </span>
              </button>

              <div className="vd-panel__secure"><FiShield size={13}/> Paiement sécurisé</div>

              <div className="vd-panel__logos">
                <div className="vd-logo vd-logo--visa">VISA</div>
                <div className="vd-logo vd-logo--mc"><span className="vd-logo__mc-circle vd-logo__mc-circle--red"/><span className="vd-logo__mc-circle vd-logo__mc-circle--orange"/></div>
                <div className="vd-logo vd-logo--amex">AMEX</div>
                <div className="vd-logo vd-logo--apple">🍎 Pay</div>
              </div>

              {!user && (
                <p style={{ fontSize:11.5, color:'#9ca3af', textAlign:'center', marginTop:8 }}>
                  <button
                    style={{ background:'none', border:'none', color:'#1e3a8a', cursor:'pointer', fontSize:'inherit', textDecoration:'underline', fontFamily:'inherit' }}
                    onClick={() => openAuthModal('login')}
                  >
                    Connectez-vous
                  </button>
                  {' '}ou{' '}
                  <button
                    style={{ background:'none', border:'none', color:'#1e3a8a', cursor:'pointer', fontSize:'inherit', textDecoration:'underline', fontFamily:'inherit' }}
                    onClick={() => openAuthModal('register')}
                  >
                    créez un compte
                  </button>
                  {' '}pour réserver.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="vd-why">
        <div className="container">
          <h3 className="vd-why__title">Pourquoi réserver chez nous ?</h3>
          <div className="vd-why__grid">
            {[{icon:'💲',title:'Meilleurs prix garantis',desc:'Toujours le meilleur tarif.'},{icon:'⊘',title:'Annulation gratuite',desc:"Jusqu'à 48h avant."},{icon:'🎧',title:'Service client 24/7',desc:'Toujours disponibles.'},{icon:'🔒',title:'Réservation sécurisée',desc:'Données 100% protégées.'}].map(w => (
              <div key={w.title} className="vd-why__item"><span className="vd-why__icon">{w.icon}</span><h4 className="vd-why__item-title">{w.title}</h4><p className="vd-why__item-desc">{w.desc}</p></div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

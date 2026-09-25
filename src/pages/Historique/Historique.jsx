import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useCurrency } from '../../context/CurrencyContext'
import { reservationsService } from '../../services/vehiclesService'
import Navbar from '../../components/Navbar/Navbar'
import AdminStrip from '../../components/AdminStrip/AdminStrip'
import Footer from '../../components/Footer/Footer'
import './Historique.css'

/* ── Helpers ─────────────────────────────────────────── */
const fmt = (d, lang = 'fr') =>
  d ? new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

/* ── KPI card ────────────────────────────────────────── */
function KpiCard({ icon, value, label, variant }) {
  return (
    <div className={`hist-kpi hist-kpi--${variant}`}>
      <div className="hist-kpi__icon">{icon}</div>
      <div className="hist-kpi__value">{value}</div>
      <div className="hist-kpi__label">{label}</div>
    </div>
  )
}

/* ── Single reservation card ─────────────────────────── */
function ReservationCard({ r }) {
  const { t, lang, isRtl } = useLanguage()
  const { formatPrice } = useCurrency()
  const totalTTC      = Number(r.totalTTC || 0)
  const amountPaid    = Number(r.amountPaid || 0)
  const remaining     = Number(r.remainingBalance || 0)
  const paidPct       = totalTTC > 0 ? Math.min(100, (amountPaid / totalTTC) * 100) : 0
  const isFullyPaid   = remaining <= 0
  const totalDays     = r.totalDays || 0
  const pricePerDay   = Number(r.pricePerDay || 0)

  const statusLabel = {
    recu:      t('historique.statusRecu', 'Reçu'),
    pending:   t('historique.statusPending', 'En attente'),
    confirmed: t('historique.statusConfirmed', 'Confirmée'),
    completed: t('historique.statusCompleted', 'Terminée'),
    cancelled: t('historique.statusCancelled', 'Annulée'),
  }

  return (
    <div className={`hist-card hist-card--${r.status}`}>
      {/* Header: car image + name + badge */}
      <div className="hist-card__header">
        <div className="hist-card__car-img">
          {r.vehicle?.images?.[0]
            ? <img src={r.vehicle.images[0]} alt={r.vehicle.name} />
            : <span className="hist-card__car-emoji">🚗</span>
          }
        </div>

        <div className="hist-card__info">
          <div className="hist-card__car-name">{r.vehicle?.name || 'Véhicule inconnu'}</div>
          
          {/* Prominent Reservation Code */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '6px 0 8px 0', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#ffffff', textTransform: 'uppercase', fontWeight: 700 }}>
              {t('historique.codeResa', 'Code Réservation :')}
            </span>
            <span style={{
              fontSize: 13,
              fontWeight: 800,
              color: '#d4a017',
              background: 'rgba(212, 160, 23, 0.2)',
              border: '1px solid rgba(212, 160, 23, 0.5)',
              borderRadius: 6,
              padding: '2px 8px',
              letterSpacing: '0.8px',
              fontFamily: 'monospace',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
            }}>
              #GSC-{r._id?.slice(-6).toUpperCase()}
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`#GSC-${r._id?.slice(-6).toUpperCase()}`)
                alert(t('historique.codeCopied', 'Code de réservation copié !'))
              }}
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
              title={t('historique.copyCode', 'Copier le code')}
            >
              {t('historique.copyCode', '📋 Copier')}
            </button>
          </div>

          <div className="hist-card__dates">
            <span>{fmt(r.pickupDate, lang)}</span>
            <span className="hist-card__dates-sep">→</span>
            <span>{fmt(r.dropoffDate, lang)}</span>
            <span style={{ color: 'var(--white-30)', fontSize: 11 }}>({totalDays}{t('searchResults.day', 'j')})</span>
          </div>
        </div>

        <span className={`hist-badge hist-badge--${r.status}`}>
          {statusLabel[r.status] || r.status}
        </span>
      </div>

      {/* Workflow Guidance Banner */}
      {r.status === 'recu' && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: 8,
          padding: '12px 14px',
          margin: '0 16px 14px 16px',
          fontSize: 12.5,
          color: '#93c5fd',
          lineHeight: 1.5
        }}>
          {t('historique.recuMsg', '📥 Demande reçue : Votre réservation a bien été enregistrée. Notre équipe vérifie vos informations et vous notifiera dès validation.')}
        </div>
      )}

      {r.status === 'pending' && (
        <div style={{
          background: 'rgba(212, 160, 23, 0.12)',
          border: '1px solid rgba(212, 160, 23, 0.4)',
          borderRadius: 8,
          padding: '12px 14px',
          margin: '0 16px 14px 16px',
          fontSize: 12.5,
          color: '#fbbf24',
          lineHeight: 1.5
        }}>
          {t('historique.approvedMsg', '⏳ Réservation Approuvée ! Veuillez vous rendre en agence muni(e) de votre code pour verser l\'acompte requis en personne.')}
        </div>
      )}

      {r.status === 'confirmed' && (
        <div style={{
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: 8,
          padding: '12px 14px',
          margin: '0 16px 14px 16px',
          fontSize: 12.5,
          color: '#4ade80',
          lineHeight: 1.5
        }}>
          {t('historique.confirmedMsg', '✅ Réservation Confirmée : Votre véhicule est prêt. Présentez votre code à l\'agence lors du retrait du véhicule.')}
        </div>
      )}

      {/* Body: billing + payment */}
      <div className="hist-card__body">

        {/* Billing breakdown */}
        <div className="hist-card__billing">
          <div className="hist-billing-row">
            <span className="hist-billing-row__label">{t('historique.ratePerDay', 'Tarif / jour')}</span>
            <span className="hist-billing-row__value">{formatPrice(pricePerDay, isRtl)}</span>
          </div>
          <div className="hist-billing-row">
            <span className="hist-billing-row__label">{t('historique.durationLabel', 'Durée')}</span>
            <span className="hist-billing-row__value">{totalDays} {t('searchResults.days', 'jours')}</span>
          </div>
          {r.depositAmount > 0 && (
            <div className="hist-billing-row">
              <span className="hist-billing-row__label">{t('vehicleDetail.requiredDeposit', 'Caution/Dépôt')}</span>
              <span className="hist-billing-row__value">{formatPrice(r.depositAmount, isRtl)}</span>
            </div>
          )}
          <div className="hist-billing-row hist-billing-row--total">
            <span className="hist-billing-row__label">{t('historique.totalTTC', 'Total TTC')}</span>
            <span className="hist-billing-row__value">{formatPrice(totalTTC, isRtl)}</span>
          </div>
        </div>

        {/* Payment status */}
        <div className="hist-card__payment">
          <div className="hist-payment-title">{t('historique.paymentState', 'État du paiement')}</div>

          {/* Progress bar */}
          <div className="hist-payment-bar">
            <div
              className={`hist-payment-bar__fill hist-payment-bar__fill--${isFullyPaid ? 'full' : 'partial'}`}
              style={{ width: `${paidPct}%` }}
            />
          </div>

          <div className="hist-payment-amounts">
            <span className="hist-payment-amounts__paid">✓ {formatPrice(amountPaid, isRtl)} {t('historique.paid', 'payé')}</span>
            {!isFullyPaid && (
              <span className="hist-payment-amounts__due">! {formatPrice(remaining, isRtl)} {t('historique.remaining', 'restant')}</span>
            )}
          </div>

          {isFullyPaid ? (
            <span className="hist-balance-pill hist-balance-pill--paid">
              {t('historique.fullyPaid', '✓ Soldé — Aucun montant dû')}
            </span>
          ) : (
            <span className="hist-balance-pill hist-balance-pill--partial">
              {t('historique.unpaidBalance', '⚠ Solde impayé :')} {formatPrice(remaining, isRtl)}
            </span>
          )}

          {/* Pickup info */}
          {r.pickupLocation && (
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--white-30)' }}>
              📍 {r.pickupLocation}
              {r.dropoffLocation && r.dropoffLocation !== r.pickupLocation && (
                <> → {r.dropoffLocation}</>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════ */
export default function Historique() {
  const { user, openAuthModal } = useAuth()
  const { t, isRtl } = useLanguage()
  const { formatPrice } = useCurrency()
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const filters = [
    { key: 'all',       label: t('historique.allFilters', 'Toutes') },
    { key: 'pending',   label: t('historique.statusPending', 'En attente') },
    { key: 'confirmed', label: t('historique.statusConfirmed', 'Confirmées') },
    { key: 'completed', label: t('historique.statusCompleted', 'Terminées') },
    { key: 'cancelled', label: t('historique.statusCancelled', 'Annulées') },
  ]

  useEffect(() => {
    if (!user) return
    setLoading(true)
    reservationsService
      .getAll()
      .then(data => setReservations(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  /* ── Computed KPIs ──────────────────────────────────── */
  const active     = reservations.filter(r => ['pending','confirmed'].includes(r.status))
  const totalSpent = reservations
    .filter(r => r.status !== 'cancelled')
    .reduce((s, r) => s + Number(r.amountPaid || 0), 0)
  const totalDue   = reservations
    .filter(r => !['cancelled','completed'].includes(r.status))
    .reduce((s, r) => s + Number(r.remainingBalance || 0), 0)

  /* ── Filtered list ──────────────────────────────────── */
  const visible = filter === 'all'
    ? reservations
    : reservations.filter(r => r.status === filter)

  const sorted = [...visible].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )

  /* ── Guard: must be logged in ───────────────────────── */
  if (!user) {
    return (
      <>
        <AdminStrip />
        <Navbar />
        <div className="hist-page">
          <div className="hist-empty" style={{ marginTop: 120 }}>
            <div className="hist-empty__icon">🔒</div>
            <h2 className="hist-empty__title">{t('historique.loginRequired', 'Connexion requise')}</h2>
            <p className="hist-empty__text">
              {t('historique.loginMsg', 'Connectez-vous pour accéder à votre historique de réservations.')}
            </p>
            <button
              className="hist-empty__cta"
              onClick={() => openAuthModal('login')}
            >
              {t('nav.login', 'Se connecter')}
            </button>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <AdminStrip />
      <Navbar />

      <div className="hist-page">
        {/* ── Hero header ─────────────────────────────── */}
        <div className="hist-hero">
          <div className="hist-hero__inner">
            <div>
              <h1 className="hist-hero__title">{t('historique.title', 'Mon Historique')}</h1>
              <p className="hist-hero__sub">
                {t('historique.welcomeSub', 'Bonjour')} <strong>{user.firstName} {user.lastName}</strong> — {t('historique.welcomeText', 'voici toutes vos locations')}
              </p>
            </div>
            <Link to="/voitures" className="hist-empty__cta" style={{ fontSize: 13, padding: '10px 20px' }}>
              {t('historique.rentCarBtn', '🚗 Louer une voiture')}
            </Link>
          </div>
        </div>

        {/* ── KPI summary ─────────────────────────────── */}
        {!loading && (
          <div className="hist-kpis">
            <KpiCard
              icon="📋"
              value={reservations.length}
              label={t('historique.totalReservations', 'Réservations totales')}
              variant="gold"
            />
            <KpiCard
              icon="🚗"
              value={active.length}
              label={t('historique.activeReservations', 'En cours / actives')}
              variant="blue"
            />
            <KpiCard
              icon="💰"
              value={formatPrice(totalSpent, isRtl)}
              label={t('historique.totalSpent', 'Total dépensé')}
              variant="green"
            />
            <KpiCard
              icon="⚠"
              value={totalDue > 0 ? formatPrice(totalDue, isRtl) : '—'}
              label={totalDue > 0 ? t('historique.balanceDue', 'Solde restant dû') : t('historique.allSettled', 'Tout est soldé')}
              variant={totalDue > 0 ? 'red' : 'green'}
            />
          </div>
        )}

        {/* ── Filter pills ─────────────────────────────── */}
        {!loading && reservations.length > 0 && (
          <div className="hist-filters">
            {filters.map(f => (
              <button
                key={f.key}
                className={`hist-filter-btn ${filter === f.key ? 'hist-filter-btn--active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
            <span className="hist-filters__count">
              {sorted.length} {t('historique.resultsCount', 'résultat')}
            </span>
          </div>
        )}

        {/* ── Loading skeleton ─────────────────────────── */}
        {loading && (
          <div className="hist-skeleton">
            {[1, 2, 3].map(i => <div key={i} className="hist-skeleton__card" />)}
          </div>
        )}

        {/* ── Empty state ──────────────────────────────── */}
        {!loading && reservations.length === 0 && (
          <div className="hist-empty">
            <div className="hist-empty__icon">🗂️</div>
            <h2 className="hist-empty__title">{t('historique.noReservations', 'Aucune réservation')}</h2>
            <p className="hist-empty__text">
              {t('historique.noResText', 'Vous n\'avez pas encore effectué de réservation. Parcourez notre flotte et planifiez votre prochaine aventure !')}
            </p>
            <Link to="/voitures" className="hist-empty__cta">
              {t('guide.ctaBtn', '🚗 Voir nos voitures')}
            </Link>
          </div>
        )}

        {/* ── No results for current filter ────────────── */}
        {!loading && reservations.length > 0 && sorted.length === 0 && (
          <div className="hist-empty" style={{ marginTop: 40 }}>
            <div className="hist-empty__icon">🔍</div>
            <h2 className="hist-empty__title">{t('searchResults.noCarsFound', 'Aucun résultat')}</h2>
            <p className="hist-empty__text">
              {t('searchResults.modifySearch', 'Aucune réservation avec ce statut.')}
            </p>
            <button
              className="hist-empty__cta"
              onClick={() => setFilter('all')}
            >
              {t('historique.allFilters', 'Voir toutes')}
            </button>
          </div>
        )}

        {/* ── Reservations list ────────────────────────── */}
        {!loading && sorted.length > 0 && (
          <div className="hist-list">
            {sorted.map(r => (
              <ReservationCard key={r._id} r={r} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </>
  )
}

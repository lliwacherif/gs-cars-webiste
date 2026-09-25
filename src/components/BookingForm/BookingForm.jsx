import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiCalendar, FiUser, FiCheck } from 'react-icons/fi'
import { parcsService } from '../../services/vehiclesService'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import ParcSelect from '../ParcSelect/ParcSelect'
import './BookingForm.css'

const today = new Date().toISOString().split('T')[0]
const inSevenDays = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

export default function BookingForm() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('location')
  const [sameReturn, setSameReturn] = useState(true)
  const [parcs, setParcs] = useState([])
  const [form, setForm] = useState({
    location: '',
    parcId: '',
    pickupDate: today,
    dropoffDate: inSevenDays,
    driverAge: '',
  })

  // Load parcs for the dropdown
  useEffect(() => {
    parcsService.getAll()
      .then(data => {
        setParcs(data || [])
        if (data?.length > 0 && !form.location) {
          setForm(prev => ({ ...prev, location: data[0].name, parcId: data[0]._id }))
        }
      })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  // Effective age: account age wins when logged in
  const effectiveAge = user?.age ? String(user.age) : form.driverAge

  const handleSearch = () => {
    const params = new URLSearchParams({
      location: form.location,
      ...(form.parcId && { parcId: form.parcId }),
      pickupDate: form.pickupDate,
      dropoffDate: form.dropoffDate,
      driverAge: effectiveAge || '18',
    })
    navigate(`/voitures?${params.toString()}`)
  }

  const minDropoff = form.pickupDate || today

  return (
    <section className="booking">
      <div className="booking__card container">
        {/* Tabs */}
        <div className="booking__tabs">
          <button
            type="button"
            className={`booking__tab ${activeTab === 'location' ? 'booking__tab--active' : ''}`}
            onClick={() => setActiveTab('location')}
            aria-pressed={activeTab === 'location'}
          >
            {t('booking.carRental', 'Location de voiture')}
          </button>
          <button
            type="button"
            className={`booking__tab ${activeTab === 'utilitaire' ? 'booking__tab--active' : ''}`}
            onClick={() => setActiveTab('utilitaire')}
            aria-pressed={activeTab === 'utilitaire'}
          >
            {t('booking.vanUtility', 'Camionnette & utilitaire')}
          </button>
        </div>

        {/* Form */}
        <div className="booking__form">
          <div className="booking__fields">
            {/* Lieu de remise — custom dropdown from parcs */}
            <div className="booking__field booking__field--wide">
              <label className="booking__label">{t('booking.pickupLocation', 'Lieu de remise')}</label>
              <ParcSelect
                parcs={parcs}
                value={form.parcId}
                onChange={(parcId, parcName) => {
                  setForm(prev => ({
                    ...prev,
                    parcId,
                    location: parcName,
                  }))
                }}
                placeholder={t('booking.selectParc', 'Sélectionnez un parc')}
                variant="dark"
              />
            </div>

            {/* Date prise en charge */}
            <div className="booking__field">
              <label className="booking__label">{t('booking.pickupDate', 'Date de prise en charge')}</label>
              <div className="booking__input-wrap">
                <input
                  type="date"
                  className="booking__input booking__input--date"
                  value={form.pickupDate}
                  min={today}
                  onChange={e => {
                    const v = e.target.value
                    setForm(prev => ({
                      ...prev,
                      pickupDate: v,
                      dropoffDate: prev.dropoffDate < v ? v : prev.dropoffDate,
                    }))
                  }}
                />
                <FiCalendar className="booking__input-icon-right" size={15} />
              </div>
            </div>

            {/* Date restitution */}
            <div className="booking__field">
              <label className="booking__label">{t('booking.dropoffDate', 'Date de restitution')}</label>
              <div className="booking__input-wrap">
                <input
                  type="date"
                  className="booking__input booking__input--date"
                  value={form.dropoffDate}
                  min={minDropoff}
                  onChange={set('dropoffDate')}
                />
                <FiCalendar className="booking__input-icon-right" size={15} />
              </div>
            </div>

            {/* Âge du conducteur — locked when logged in */}
            <div className="booking__field booking__field--narrow">
              <label className="booking__label">{t('booking.driverAge', 'Âge du conducteur')}</label>
              <div className="booking__input-wrap">
                <FiUser className="booking__input-icon" size={15} />
                {user?.age ? (
                  <span className="booking__input" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'default' }}>
                    <span style={{ fontWeight: 600 }}>{user.age} {t('booking.years', 'ans')}</span>
                    <span style={{ fontSize: 10, color: '#f97316', background: '#fff7ed', borderRadius: 4, padding: '1px 5px', border: '1px solid #fed7aa' }}>{t('booking.accountLocked', '🔒 compte')}</span>
                  </span>
                ) : (
                  <input
                    type="number"
                    className="booking__input"
                    value={form.driverAge}
                    min={18}
                    max={99}
                    onChange={set('driverAge')}
                    placeholder="ex: 25"
                  />
                )}
              </div>
            </div>

            {/* Search Button */}
            <div className="booking__field booking__field--btn">
              <label className="booking__label booking__label--hidden">{t('booking.search', 'Rechercher')}</label>
              <button type="button" className="booking__search-btn" onClick={handleSearch}>
                {t('booking.search', 'Rechercher')}
              </button>
            </div>
          </div>

          {/* Same return checkbox */}
          <div className="booking__footer">
            <div className="booking__checkbox-label">
              <button
                type="button"
                className={`booking__checkbox ${sameReturn ? 'booking__checkbox--checked' : ''}`}
                onClick={() => setSameReturn(value => !value)}
                aria-pressed={sameReturn}
                aria-label={t('booking.sameReturn', 'Même lieu de restitution')}
              >
                {sameReturn && <FiCheck size={11} color="#fff" />}
              </button>
              <span>{t('booking.sameReturn', 'Même lieu de restitution')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

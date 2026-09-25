import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiEdit2, FiTrash2, FiEye, FiPlus, FiCalendar, FiChevronRight,
  FiAlertCircle, FiRefreshCw, FiX, FiCheck, FiTrendingUp, FiTrendingDown,
  FiDollarSign, FiBarChart2, FiUpload, FiStar, FiClock, FiList, FiTool, FiUser,
} from 'react-icons/fi'
import { vehiclesService, reservationsService, uploadService, parcsService } from '../../services/vehiclesService'
import { useAuth } from '../../context/AuthContext'
import { useCurrency } from '../../context/CurrencyContext'
import AdminStrip from '../../components/AdminStrip/AdminStrip'
import Navbar from '../../components/Navbar/Navbar'
import './Admin.css'

// ── Tiny helpers ──────────────────────────────────────────────────────────────
function Toggle({ active, onChange, disabled }) {
  return (
    <button className={`admin-toggle ${active ? 'admin-toggle--on' : ''}`}
      onClick={() => onChange(!active)} 
      role="switch" 
      aria-checked={active}
      disabled={disabled}
      style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>
      <span className="admin-toggle__knob" />
    </button>
  )
}

function StatusDot({ status }) {
  const c = { Disponible: 'var(--success)', Réservé: 'var(--warning)', Maintenance: 'var(--danger)' }
  return (
    <span className="admin-status">
      <span className="admin-status__dot" style={{ background: c[status] || 'var(--white-30)' }} />
      <span className="admin-status__label" style={{ color: c[status] || 'var(--white-50)' }}>{status}</span>
    </span>
  )
}

function ResBadge({ status }) {
  const map = {
    recu:      { bg: 'rgba(59,130,246,.15)',  c: '#60a5fa', l: 'Reçu'      },
    confirmed: { bg: 'rgba(34,197,94,.12)',   c: '#4ade80', l: 'Confirmée' },
    pending:   { bg: 'rgba(245,158,11,.12)',  c: '#fbbf24', l: 'En attente'},
    cancelled: { bg: 'rgba(239,68,68,.12)',   c: '#f87171', l: 'Annulée'  },
    completed: { bg: 'rgba(139,92,246,.12)',  c: '#a78bfa', l: 'Terminée' },
  }
  const s = map[status] || { bg: 'var(--black-4)', c: 'var(--white-50)', l: status }
  return <span className="res-badge" style={{ background: s.bg, color: s.c }}>{s.l}</span>
}

function PayBadge({ status }) {
  const map = {
    paid:     { bg: 'rgba(34,197,94,.12)',  c: '#4ade80', l: 'Payé'      },
    partial:  { bg: 'rgba(245,158,11,.12)', c: '#fbbf24', l: 'Partiel'   },
    pending:  { bg: 'rgba(239,68,68,.12)',  c: '#f87171', l: 'En attente'},
    refunded: { bg: 'rgba(139,92,246,.12)', c: '#a78bfa', l: 'Remboursé' },
  }
  const s = map[status] || { bg: 'var(--black-4)', c: 'var(--white-50)', l: status }
  return <span className="res-badge" style={{ background: s.bg, color: s.c }}>{s.l}</span>
}

function KpiCard({ icon, label, value, sub, trend, up }) {
  return (
    <div className="dash-stat">
      <div className="dash-stat__icon">{icon}</div>
      <div className="dash-stat__body">
        <span className="dash-stat__label">{label}</span>
        <span className="dash-stat__value">{value ?? '—'}</span>
        {sub && <span className="dash-stat__sub">{sub}</span>}
      </div>
      {trend != null && (
        <div className={`dash-stat__trend ${up ? 'dash-stat__trend--up' : 'dash-stat__trend--down'}`}>
          {up ? <FiTrendingUp size={12}/> : <FiTrendingDown size={12}/>}
          <span>{trend > 0 ? '+' : ''}{trend}%</span>
        </div>
      )}
    </div>
  )
}

// ── Typeahead Brand Selector ──────────────────────────────────────────────────
const CAR_BRANDS = [
  'Audi', 'Cherry', 'Chevrolet', 'Citroën', 'Fiat', 'Geely', 'Haval',
  'Honda', 'Hyundai', 'Kia', 'Mahindra', 'Mercedes', 'MG', 'Nissan',
  'Opel', 'Peugeot', 'Renault', 'Seat', 'Škoda', 'Suzuki', 'Toyota', 'Volkswagen'
]

function BrandTypeahead({ value, onChange, required }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value || '')
  const wrapRef = useRef(null)

  useEffect(() => {
    setQuery(value || '')
  }, [value])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = CAR_BRANDS.filter(b =>
    b.toLowerCase().includes((query || '').toLowerCase())
  )

  const handleSelect = (brand) => {
    setQuery(brand)
    onChange(brand)
    setOpen(false)
  }

  const handleInputChange = (e) => {
    const val = e.target.value
    setQuery(val)
    onChange(val)
    setOpen(true)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        placeholder="Tapez une marque..."
        required={required}
        autoComplete="off"
        style={{
          width: '100%',
          padding: '9px 12px',
          borderRadius: 8,
          background: 'var(--black-3)',
          border: '1px solid var(--black-5)',
          color: '#ffffff',
          fontSize: 13,
          fontFamily: 'inherit',
          outline: 'none',
        }}
      />
      {open && filtered.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#1a1a1a',
            border: '1px solid rgba(201, 168, 76, 0.4)',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
            zIndex: 300,
            maxHeight: 180,
            overflowY: 'auto',
          }}
        >
          {filtered.map(brand => (
            <div
              key={brand}
              onClick={() => handleSelect(brand)}
              style={{
                padding: '8px 12px',
                fontSize: 13,
                color: '#ffffff',
                cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(201, 168, 76, 0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              🚗 {brand}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Calendar helpers ──────────────────────────────────────────────────────────
function getWeekDays(offsetDays = 0) {
  const out = []
  const today = new Date(); today.setHours(0, 0, 0, 0)
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + offsetDays + i)
    const isToday = d.toDateString() === today.toDateString()
    out.push({
      label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' }),
      date: d,
      isToday,
      isPast: d < today,
    })
  }
  return out
}

function dayStatus(v, reservations, date) {
  const d = new Date(date); d.setHours(0, 0, 0, 0)
  const next = new Date(d); next.setDate(d.getDate() + 1)
  const hit = reservations.find(r => {
    // Use .toString() to safely compare ObjectId / string IDs
    const vid = (r.vehicle?._id || r.vehicle)?.toString()
    if (vid !== v._id?.toString()) return false
    const p = new Date(r.pickupDate); p.setHours(0, 0, 0, 0)
    const dr = new Date(r.dropoffDate); dr.setHours(0, 0, 0, 0)
    return p < next && dr > d
  })
  if (!hit) return { state: v.status === 'Disponible' ? 'ok' : 'maintenance', res: null }
  return { state: hit.status === 'pending' ? 'pending' : 'booked', res: hit }
}

function fmtDate(s) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtMoney(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 0 }) + ' TND'
}

// ════════════════════════════════════════════════════════
// VEHICLE FORM MODAL  (Add + Edit)
// ════════════════════════════════════════════════════════
const EMPTY = {
  name: '', brand: '', modelName: '', year: new Date().getFullYear(),
  plate: '', color: '', category: 'Économique', transmission: 'Manuelle',
  fuel: 'Essence', seats: 5, doors: 5, bags: 2,
  engineSize: '', fuelTankCapacity: '', mileage: '',
  pricePerDay: '', pricePerWeek: '', pricePerMonth: '',
  depositAmount: 500, minDriverAge: 21,
  status: 'Disponible', isActive: true,
  features: { ac: false, bluetooth: false, radio: false, usb: false, gps: false, cruiseControl: false, parkingSensors: false, camera360: false, sunroof: false, heatedSeats: false },
  description: '', tags: '', model3dUrl: '',
  lastMaintenanceDate: '', nextMaintenanceDate: '', maintenanceNotes: '',
  acquisitionDate: '', acquisitionCost: '',
}

function VehicleModal({ vehicle, onClose, onSaved }) {
  const init = vehicle
    ? {
        ...EMPTY, ...vehicle,
        features: { ...EMPTY.features, ...(vehicle.features || {}) },
        tags: (vehicle.tags || []).join(', '),
        model3dUrl: vehicle.model3dUrl || '',
        lastMaintenanceDate:  vehicle.lastMaintenanceDate  ? vehicle.lastMaintenanceDate.slice(0, 10) : '',
        nextMaintenanceDate:  vehicle.nextMaintenanceDate  ? vehicle.nextMaintenanceDate.slice(0, 10) : '',
        acquisitionDate:      vehicle.acquisitionDate      ? vehicle.acquisitionDate.slice(0, 10)     : '',
      }
    : EMPTY

  const [form, setForm] = useState(init)
  const [images, setImages] = useState(vehicle?.images || [])
  const [uploading, setUploading] = useState(false)
  const [uploading3d, setUploading3d] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('general') // general | pricing | features | maintenance

  const set = (f) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(p => ({ ...p, [f]: val }))
    setError('')
  }
  const setFeat = (f) => setForm(p => ({ ...p, features: { ...p.features, [f]: !p.features[f] } }))

  const handleImage = async (e) => {
    const file = e.target.files[0]; if (!file) return
    setUploading(true)
    try {
      const r = await uploadService.uploadImage(file, 'tunisia-car-rental/vehicles')
      setImages(p => [...p, r.url])
    } catch (err) {
      const msg = err?.response?.data?.message
      setError(Array.isArray(msg) ? msg[0] : (msg || 'Erreur upload image.'))
    }
    finally { setUploading(false) }
  }

  const file3dRef = useRef(null)

  const handleGlbClick = () => {
    if (file3dRef.current) {
      file3dRef.current.click()
    }
  }

  const handleGlb = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading3d(true)
    setError('')
    try {
      console.log('[handleGlb] Selected file:', file.name, file.size, 'bytes', file.type)
      const r = await uploadService.uploadGlb(file)
      console.log('[handleGlb] Got result:', r)
      const url = r?.url || r?.data?.url || (typeof r === 'string' ? r : null)
      if (!url) throw new Error('Aucun lien Cloudinary retourné')
      setForm(p => ({ ...p, model3dUrl: url }))
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur upload .glb'
      console.error('[handleGlb] Error:', msg, err)
      setError('❌ ' + msg)
    } finally {
      if (e.target) e.target.value = ''
      setUploading3d(false)
    }
  }

  // Client-side validation before submit
  const validateForm = () => {
    const errors = []

    // Required text fields
    if (!form.name?.trim())  errors.push('❌ Nom du véhicule — requis')
    if (!form.brand?.trim()) errors.push('❌ Marque — requis')
    if (!form.plate?.trim()) errors.push('❌ Plaque — requis (doit être unique)')
    if (!form.category?.trim()) errors.push('❌ Catégorie — requis')
    if (!form.transmission?.trim()) errors.push('❌ Transmission — requis')
    if (!form.fuel?.trim()) errors.push('❌ Carburant — requis')

    // Required numbers with type check
    if (form.year === '' || isNaN(Number(form.year))) errors.push('❌ Année — doit être un nombre valide')
    if (form.seats === '' || isNaN(Number(form.seats))) errors.push('❌ Places — doit être un nombre valide')
    if (form.bags === '' || isNaN(Number(form.bags))) errors.push('❌ Sacs — doit être un nombre valide')
    if (form.pricePerDay === '' || isNaN(parseFloat(form.pricePerDay))) errors.push('❌ Tarif / jour — doit être un nombre valide (ex: 26 ou 26.5)')

    // Optional numbers with type check (if provided, must be valid)
    if (form.doors !== '' && isNaN(Number(form.doors))) errors.push('❌ Portes — doit être un nombre si rempli')
    if (form.fuelTankCapacity !== '' && isNaN(Number(form.fuelTankCapacity))) errors.push('❌ Réservoir (L) — doit être un nombre si rempli')
    if (form.mileage !== '' && isNaN(Number(form.mileage))) errors.push('❌ Kilométrage actuel — doit être un nombre si rempli')
    if (form.pricePerWeek !== '' && isNaN(parseFloat(form.pricePerWeek))) errors.push('❌ Tarif / semaine — doit être un nombre si rempli')
    if (form.pricePerMonth !== '' && isNaN(parseFloat(form.pricePerMonth))) errors.push('❌ Tarif / mois — doit être un nombre si rempli')
    if (form.depositAmount !== '' && isNaN(Number(form.depositAmount))) errors.push('❌ Caution/dépôt — doit être un nombre si rempli')
    if (form.minDriverAge !== '' && isNaN(Number(form.minDriverAge))) errors.push('❌ Âge min conducteur — doit être un nombre si rempli')
    if (form.acquisitionCost !== '' && isNaN(Number(form.acquisitionCost))) errors.push('❌ Coût d\'acquisition — doit être un nombre si rempli')

    // Range checks
    if (form.year && (Number(form.year) < 1990 || Number(form.year) > 2030)) errors.push('❌ Année — doit être entre 1990 et 2030')
    if (form.seats && (Number(form.seats) < 1 || Number(form.seats) > 9)) errors.push('❌ Places — doit être entre 1 et 9')
    if (form.minDriverAge && (Number(form.minDriverAge) < 18 || Number(form.minDriverAge) > 30)) errors.push('❌ Âge min conducteur — doit être entre 18 et 30')
    if (form.pricePerDay && Number(form.pricePerDay) <= 0) errors.push('❌ Tarif / jour — doit être supérieur à 0')

    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')

    // Validate client-side first
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'))
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        images,
        year:              Number(form.year),
        seats:             Number(form.seats),
        doors:             form.doors !== '' ? Number(form.doors) : undefined,
        bags:              Number(form.bags),
        pricePerDay:       parseFloat(form.pricePerDay),
        pricePerWeek:      form.pricePerWeek  ? parseFloat(form.pricePerWeek)  : undefined,
        pricePerMonth:     form.pricePerMonth ? parseFloat(form.pricePerMonth) : undefined,
        depositAmount:     form.depositAmount !== '' ? Number(form.depositAmount) : 500,
        minDriverAge:      form.minDriverAge !== '' ? Number(form.minDriverAge) : 21,
        fuelTankCapacity:  form.fuelTankCapacity ? Number(form.fuelTankCapacity) : undefined,
        mileage:           form.mileage          ? Number(form.mileage)          : undefined,
        acquisitionCost:   form.acquisitionCost  ? Number(form.acquisitionCost)  : undefined,
        tags:              form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        lastMaintenanceDate: form.lastMaintenanceDate || undefined,
        nextMaintenanceDate: form.nextMaintenanceDate || undefined,
        acquisitionDate:     form.acquisitionDate     || undefined,
      }
      // Strip MongoDB metadata and auto-managed fields — DTO will reject them
      // eslint-disable-next-line no-unused-vars
      const { _id, __v, createdAt, updatedAt, status, isActive, parc, parcs, id, ...cleanPayload } = payload

      if (vehicle) await vehiclesService.update(vehicle._id, cleanPayload)
      else         await vehiclesService.create(cleanPayload)
      onSaved()
    } catch (err) {
      const msg = err?.response?.data?.message
      // If backend also sends validation errors, show them
      if (Array.isArray(msg)) {
        setError(msg.map(m => '❌ ' + m).join('\n'))
      } else if (msg) {
        setError('❌ ' + msg)
      } else {
        setError('❌ Erreur lors de la sauvegarde. Vérifiez les données et réessayez.')
      }
    } finally { setSaving(false) }
  }

  const TABS = [['general','Général'],['pricing','Tarifs'],['features','Équipements'],['maintenance','Historique']]
  const CATS = ['Économique','Compacte','Berline','SUV','Luxe','Monospace','Utilitaire']
  const FUELS = ['Essence','Diesel','Hybride','Électrique']

  return (
    <div className="vm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="vm-modal">
        <div className="vm-header">
          <h2 className="vm-title">{vehicle ? '✏️ Modifier le véhicule' : '➕ Nouveau véhicule'}</h2>
          <button className="vm-close" onClick={onClose}><FiX size={18}/></button>
        </div>

        {/* Sub-tabs */}
        <div className="vm-tabs">
          {TABS.map(([k, l]) => (
            <button key={k} className={`vm-tab ${tab === k ? 'vm-tab--active' : ''}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {error && <div className="vm-error"><FiAlertCircle size={13}/> {error}</div>}

        <form onSubmit={handleSubmit} className="vm-form">

          {/* ── GÉNÉRAL ── */}
          {tab === 'general' && (
            <>
              <div className="vm-row">
                <div className="vm-field vm-field--grow2">
                  <label>Nom complet *</label>
                  <input value={form.name} onChange={set('name')} placeholder="Ex: Renault Clio 5" required />
                </div>
                <div className="vm-field">
                  <label>Marque *</label>
                  <BrandTypeahead value={form.brand} onChange={val => setForm(p => ({ ...p, brand: val }))} required />
                </div>
                <div className="vm-field">
                  <label>Modèle</label>
                  <input value={form.modelName} onChange={set('modelName')} placeholder="Clio 5" />
                </div>
              </div>
              <div className="vm-row">
                <div className="vm-field">
                  <label>Année *</label>
                  <input type="number" value={form.year} onChange={set('year')} min={2000} max={2030} required />
                </div>
                <div className="vm-field">
                  <label>Plaque *</label>
                  <input value={form.plate} onChange={e => setForm(p => ({ ...p, plate: e.target.value.toUpperCase() }))} placeholder="TU-123-AB" required />
                </div>
                <div className="vm-field">
                  <label>Couleur</label>
                  <input value={form.color} onChange={set('color')} placeholder="Gris Platine" />
                </div>
              </div>
              <div className="vm-row">
                <div className="vm-field">
                  <label>Catégorie *</label>
                  <select value={form.category} onChange={set('category')}>
                    {CATS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="vm-field">
                  <label>Transmission *</label>
                  <select value={form.transmission} onChange={set('transmission')}>
                    <option>Manuelle</option><option>Automatique</option>
                  </select>
                </div>
                <div className="vm-field">
                  <label>Carburant *</label>
                  <select value={form.fuel} onChange={set('fuel')}>
                    {FUELS.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div className="vm-row">
                <div className="vm-field"><label>Places *</label><input type="number" value={form.seats} onChange={set('seats')} min={1} max={9} required /></div>
                <div className="vm-field"><label>Portes</label><input type="number" value={form.doors} onChange={set('doors')} min={2} max={6} /></div>
                <div className="vm-field"><label>Sacs</label><input type="number" value={form.bags} onChange={set('bags')} min={0} /></div>
                <div className="vm-field"><label>Motorisation</label><input value={form.engineSize} onChange={set('engineSize')} placeholder="1.5 dCi" /></div>
                <div className="vm-field"><label>Réservoir (L)</label><input type="number" value={form.fuelTankCapacity} onChange={set('fuelTankCapacity')} min={0} /></div>
              </div>
              <div className="vm-row">
                <div className="vm-field"><label>Kilométrage actuel</label><input type="number" value={form.mileage} onChange={set('mileage')} min={0} placeholder="32 000" /></div>
                <div className="vm-field"><label>Âge min conducteur</label><input type="number" value={form.minDriverAge} onChange={set('minDriverAge')} min={18} max={30} /></div>
                <div className="vm-field">
                  <label>Statut</label>
                  <div style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--black-3)', border: '1px solid var(--black-5)', fontSize: 12, color: 'var(--white-50)' }}>
                    🔄 Géré automatiquement selon les réservations. Utilisez le bouton <strong style={{ color: 'var(--white-70)' }}>🔧 Maint.</strong> dans le tableau pour forcer la maintenance.
                  </div>
                </div>
              </div>
              <div className="vm-field">
                <label>Tags (séparés par virgule)</label>
                <input value={form.tags} onChange={set('tags')} placeholder="famille, confort, économique" />
              </div>
              <div className="vm-field">
                <label>Description</label>
                <textarea value={form.description} onChange={set('description')} rows={3} placeholder="Description du véhicule..." />
              </div>
              <div className="vm-field">
                <label>Photos</label>
                <div className="vm-images">
                  {images.map((url, i) => (
                    <div key={i} className="vm-image-thumb">
                      <img src={url} alt={`photo ${i + 1}`} />
                      <button type="button" className="vm-image-remove" onClick={() => setImages(p => p.filter((_, j) => j !== i))}><FiX size={11}/></button>
                    </div>
                  ))}
                  <label className="vm-image-add">
                    {uploading ? <span className="admin-spinner"/> : <><FiUpload size={15}/><span>Ajouter</span></>}
                    <input type="file" accept="image/*" onChange={handleImage} hidden disabled={uploading}/>
                  </label>
                </div>
              </div>

              {/* ── MODÈLE 3D (.GLB) ── */}
              <div className="vm-field">
                <label>Modèle 3D (.GLB)</label>
                <div className="vm-3d-section">
                  {form.model3dUrl ? (
                    <div className="vm-3d-active-box">
                      <div className="vm-3d-active-box__icon">📦</div>
                      <div className="vm-3d-active-box__info">
                        <span className="vm-3d-active-box__title">Modèle 3D 360° configuré</span>
                        <span className="vm-3d-active-box__sub">Fichier .glb prêt et sauvegardé sur Cloudinary</span>
                      </div>
                      <button
                        type="button"
                        className="vm-image-remove"
                        style={{ position: 'static', opacity: 1, width: 28, height: 28 }}
                        title="Supprimer le modèle 3D"
                        onClick={() => setForm(p => ({ ...p, model3dUrl: '' }))}
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        ref={file3dRef}
                        type="file"
                        accept=".glb,.gltf"
                        onChange={handleGlb}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        className="vm-3d-upload-dropzone"
                        onClick={handleGlbClick}
                        disabled={uploading3d}
                        style={{ width: '100%', textAlign: 'left' }}
                      >
                        {uploading3d ? (
                          <div className="vm-3d-dropzone-loading">
                            <span className="admin-spinner" style={{ width: 22, height: 22 }} />
                            <span>Upload du fichier 3D (.glb) vers Cloudinary...</span>
                          </div>
                        ) : (
                          <>
                            <div className="vm-3d-dropzone-icon">
                              <FiUpload size={20} color="var(--gold)" />
                            </div>
                            <div className="vm-3d-dropzone-text">
                              <strong>Choisir un fichier 3D (.glb) depuis votre PC</strong>
                              <span>Sauvegarde automatique sur Cloudinary (max 50 Mo)</span>
                            </div>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* ── UPLOAD ERROR (visible in modal) ── */}
              {error && (
                <div style={{
                  background: '#ff000033',
                  border: '1px solid #ff4444',
                  borderRadius: 8,
                  padding: '10px 14px',
                  color: '#ff6666',
                  fontSize: 13,
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  marginTop: 4,
                }}>
                  {error}
                </div>
              )}

              <label className="vm-active-check">
                <input type="checkbox" checked={form.isActive} onChange={set('isActive')}/>
                <span>Véhicule actif (visible sur le site client)</span>
              </label>
            </>
          )}

          {/* ── TARIFS ── */}
          {tab === 'pricing' && (
            <>
              <div className="vm-info-box">💡 Tous les tarifs sont en TND (Hors Taxe - HT). La TVA (19%) sera calculée et ajoutée automatiquement.</div>
              <div className="vm-row">
                <div className="vm-field"><label>Tarif HT / jour (TND) *</label><input type="number" value={form.pricePerDay} onChange={set('pricePerDay')} min={1} step={0.5} placeholder="26" required /></div>
                <div className="vm-field"><label>Tarif / semaine</label><input type="number" value={form.pricePerWeek} onChange={set('pricePerWeek')} min={0} step={1} placeholder="160" /></div>
                <div className="vm-field"><label>Tarif / mois</label><input type="number" value={form.pricePerMonth} onChange={set('pricePerMonth')} min={0} step={1} placeholder="580" /></div>
              </div>
              <div className="vm-row">
                <div className="vm-field"><label>Caution / dépôt (TND)</label><input type="number" value={form.depositAmount} onChange={set('depositAmount')} min={0} /></div>
                <div className="vm-field"><label>Coût d'acquisition (TND)</label><input type="number" value={form.acquisitionCost} onChange={set('acquisitionCost')} min={0} placeholder="28 000" /></div>
                <div className="vm-field"><label>Date d'acquisition</label><input type="date" value={form.acquisitionDate} onChange={set('acquisitionDate')} /></div>
              </div>
            </>
          )}

          {/* ── ÉQUIPEMENTS ── */}
          {tab === 'features' && (
            <div className="vm-features-grid">
              {[
                ['ac',            '❄️ Climatisation'],
                ['bluetooth',     '📶 Bluetooth'],
                ['radio',         '📻 Radio FM'],
                ['usb',           '🔌 Port USB'],
                ['gps',           '🗺️ GPS intégré'],
                ['cruiseControl', '🚗 Régulateur de vitesse'],
                ['parkingSensors','📡 Capteurs de parking'],
                ['camera360',     '📷 Caméra 360°'],
                ['sunroof',       '☀️ Toit ouvrant'],
                ['heatedSeats',   '🔥 Sièges chauffants'],
              ].map(([k, l]) => (
                <label key={k} className={`vm-feat-check ${form.features[k] ? 'vm-feat-check--on' : ''}`}>
                  <input type="checkbox" checked={!!form.features[k]} onChange={() => setFeat(k)}/>
                  <span>{l}</span>
                </label>
              ))}
            </div>
          )}

          {/* ── MAINTENANCE / HISTORIQUE ── */}
          {tab === 'maintenance' && (
            <>
              <div className="vm-row">
                <div className="vm-field"><label>Dernière révision</label><input type="date" value={form.lastMaintenanceDate} onChange={set('lastMaintenanceDate')} /></div>
                <div className="vm-field"><label>Prochaine révision</label><input type="date" value={form.nextMaintenanceDate} onChange={set('nextMaintenanceDate')} /></div>
              </div>
              <div className="vm-field">
                <label>Notes de maintenance</label>
                <textarea value={form.maintenanceNotes} onChange={set('maintenanceNotes')} rows={4} placeholder="Vidange effectuée, plaquettes changées..." />
              </div>
              <div className="vm-info-box">
                📋 L'historique des réservations est consultable via le bouton <strong>Historique</strong> dans la liste des véhicules.
              </div>
            </>
          )}

          <div className="vm-actions">
            <button type="button" className="admin-btn admin-btn--outline" onClick={onClose}>Annuler</button>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
              {saving ? <span className="admin-spinner"/> : vehicle ? 'Enregistrer' : 'Créer le véhicule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════
// VEHICLE HISTORY MODAL
// ════════════════════════════════════════════════════════
function HistoryModal({ vehicle, onClose }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    reservationsService.getVehicleHistory(vehicle._id)
      .then(setHistory)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [vehicle._id])

  const totalRevenue = history.reduce((s, r) => s + (r.amountPaid || 0), 0)
  const totalKm = history.reduce((s, r) => {
    if (r.mileageAtPickup != null && r.mileageAtDropoff != null) return s + (r.mileageAtDropoff - r.mileageAtPickup)
    return s
  }, 0)

  return (
    <div className="vm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="vm-modal vm-modal--wide">
        <div className="vm-header">
          <div>
            <h2 className="vm-title">📋 Historique — {vehicle.name}</h2>
            <p style={{ fontSize: 12, color: 'var(--white-50)', margin: '3px 0 0' }}>
              Plaque: {vehicle.plate} · {vehicle.year} · {vehicle.category}
            </p>
          </div>
          <button className="vm-close" onClick={onClose}><FiX size={18}/></button>
        </div>

        {/* Vehicle summary */}
        <div className="hist-vehicle-info">
          <div className="hist-thumb">
            {vehicle.images?.[0]
              ? <img src={vehicle.images[0]} alt={vehicle.name}/>
              : <span style={{ fontSize: 32 }}>🚗</span>}
          </div>
          <div className="hist-kpis">
            <div className="hist-kpi">
              <span className="hist-kpi__val">{history.length}</span>
              <span className="hist-kpi__lbl">Réservations</span>
            </div>
            <div className="hist-kpi">
              <span className="hist-kpi__val">{fmtMoney(totalRevenue)}</span>
              <span className="hist-kpi__lbl">Revenus générés</span>
            </div>
            <div className="hist-kpi">
              <span className="hist-kpi__val">{totalKm > 0 ? `${totalKm.toLocaleString()} km` : '—'}</span>
              <span className="hist-kpi__lbl">Km parcourus (suivi)</span>
            </div>
            <div className="hist-kpi">
              <span className="hist-kpi__val">{vehicle.mileage != null ? `${Number(vehicle.mileage).toLocaleString()} km` : '—'}</span>
              <span className="hist-kpi__lbl">Kilométrage actuel</span>
            </div>
            {vehicle.lastMaintenanceDate && (
              <div className="hist-kpi">
                <span className="hist-kpi__val">{fmtDate(vehicle.lastMaintenanceDate)}</span>
                <span className="hist-kpi__lbl">Dernière révision</span>
              </div>
            )}
            {vehicle.acquisitionDate && (
              <div className="hist-kpi">
                <span className="hist-kpi__val">{fmtDate(vehicle.acquisitionDate)}</span>
                <span className="hist-kpi__lbl">Acquis le</span>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--white-30)' }}>Chargement…</div>
        ) : history.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--white-30)' }}>Aucune réservation pour ce véhicule.</div>
        ) : (
          <div className="admin-table-wrap" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>CLIENT</th><th>PRISE EN CHARGE</th><th>RESTITUTION</th>
                  <th>JOURS</th><th>TOTAL TTC</th><th>PAYÉ</th><th>KM</th>
                  <th>STATUT PAIE</th><th>STATUT RÉS.</th>
                </tr>
              </thead>
              <tbody>
                {history.map(r => (
                  <tr key={r._id} className="admin-table__row">
                    <td>
                      <div className="admin-table__car-name">{r.user?.firstName} {r.user?.lastName}</div>
                      <div className="admin-table__car-year">{r.user?.email}</div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--white-70)' }}>{fmtDate(r.pickupDate)}</td>
                    <td style={{ fontSize: 12, color: 'var(--white-70)' }}>{fmtDate(r.dropoffDate)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--white)' }}>{r.totalDays}</td>
                    <td style={{ color: 'var(--white)', fontWeight: 700 }}>{fmtMoney(r.totalTTC)}</td>
                    <td style={{ color: 'var(--gold)', fontWeight: 700 }}>{fmtMoney(r.amountPaid)}</td>
                    <td style={{ fontSize: 12, color: 'var(--white-50)' }}>
                      {r.mileageAtPickup != null && r.mileageAtDropoff != null
                        ? `+${(r.mileageAtDropoff - r.mileageAtPickup).toLocaleString()} km`
                        : '—'}
                    </td>
                    <td><PayBadge status={r.paymentStatus}/></td>
                    <td><ResBadge status={r.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {vehicle.maintenanceNotes && (
          <div style={{ margin: '0 20px 20px', padding: '12px 14px', background: 'var(--black-3)', borderRadius: 8, border: '1px solid var(--black-5)' }}>
            <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Notes de maintenance</div>
            <p style={{ fontSize: 12.5, color: 'var(--white-70)', margin: 0, lineHeight: 1.6 }}>{vehicle.maintenanceNotes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════
// CUSTOMER PROFILE SIDE CARD — Expands side-by-side with StatusModal
// ════════════════════════════════════════════════════════
function CustomerProfileCard({ user, reservation, allReservations = [], onClose }) {
  try {
    if (!user) return null
    const u = (user && typeof user === 'object')
      ? user
      : { email: String(user || ''), firstName: 'Client', lastName: '', role: 'customer', isEmailVerified: false }

    const targetId = String(u._id || u.id || '').toLowerCase()
    const targetEmail = String(u.email || '').toLowerCase()

    const userReservations = Array.isArray(allReservations)
      ? allReservations.filter(r => {
          if (!r || !r.user) return false
          const rId = String(r.user._id || r.user.id || r.user || '').toLowerCase()
          const rEmail = String(r.user.email || '').toLowerCase()
          return (targetId && rId && rId === targetId) || (targetEmail && rEmail && rEmail === targetEmail)
        })
      : []

    const totalCount = userReservations.length
    const completedCount = userReservations.filter(r => r && r.status === 'completed').length
    const totalSpent = userReservations.reduce((sum, r) => sum + (Number(r?.amountPaid) || 0), 0)
    const formattedSpent = isNaN(totalSpent) ? '0' : Math.round(totalSpent).toString()

    return (
      <div
        className="vm-modal"
        style={{
          flex: 1,
          maxWidth: 520,
          margin: 0,
          background: 'var(--black-2)',
          border: '1.5px solid rgba(34, 197, 94, 0.45)',
          borderRadius: 16,
          boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 25px rgba(34, 197, 94, 0.15)',
          animation: 'clientCardSlideRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        <div className="vm-header" style={{ background: 'var(--black-3)', padding: '18px 24px', borderBottom: '1px solid var(--black-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', background: 'rgba(34,197,94,0.15)',
              border: '1px solid rgba(34,197,94,0.4)', color: '#4ade80',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15
            }}>
              👤
            </div>
            <div>
              <h2 className="vm-title" style={{ fontSize: 16, color: '#4ade80' }}>Profil Client</h2>
              <div style={{ fontSize: 11.5, color: 'var(--white-50)', marginTop: 2 }}>{u.firstName || 'Client'} {u.lastName || ''}</div>
            </div>
          </div>
          <button className="vm-close" onClick={onClose}><FiX size={18}/></button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Identity Card */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: 'var(--black-4)', borderRadius: 10, padding: 14,
            border: '1px solid var(--black-5)'
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
              background: 'var(--black-3)', border: '2px solid #4ade80',
              boxShadow: '0 4px 10px rgba(0,0,0,0.4)'
            }}>
              {u.avatar
                ? <img src={u.avatar} alt={u.firstName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#4ade80' }}>
                    {u.firstName?.[0] || 'C'}{u.lastName?.[0] || ''}
                  </div>
              }
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--white)' }}>
                {u.firstName || 'Client'} {u.lastName || ''}
              </div>
              <div style={{ fontSize: 12, color: 'var(--white-50)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{u.role === 'admin' ? '👑 Admin' : '👤 Client'}</span>
                <span>•</span>
                <span>{u.age ? `${u.age} ans` : 'Âge non renseigné'}</span>
              </div>
            </div>
            <div style={{
              fontSize: 10.5, padding: '4px 10px', borderRadius: 20,
              background: u.isEmailVerified ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              color: u.isEmailVerified ? '#4ade80' : '#f87171',
              border: `1px solid ${u.isEmailVerified ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'}`,
              fontWeight: 700
            }}>
              {u.isEmailVerified ? '✓ Email vérifié' : '✉️ Email non vérifié'}
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div style={{ background: 'var(--black-4)', borderRadius: 8, padding: '10px', textAlign: 'center', border: '1px solid var(--black-5)' }}>
              <div style={{ fontSize: 9.5, color: 'var(--white-50)', fontWeight: 600 }}>RÉSERVATIONS</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--white)', marginTop: 2 }}>{totalCount}</div>
            </div>
            <div style={{ background: 'var(--black-4)', borderRadius: 8, padding: '10px', textAlign: 'center', border: '1px solid var(--black-5)' }}>
              <div style={{ fontSize: 9.5, color: 'var(--white-50)', fontWeight: 600 }}>RÉUSSIES</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#4ade80', marginTop: 2 }}>{completedCount}</div>
            </div>
            <div style={{ background: 'var(--black-4)', borderRadius: 8, padding: '10px', textAlign: 'center', border: '1px solid var(--black-5)' }}>
              <div style={{ fontSize: 9.5, color: 'var(--white-50)', fontWeight: 600 }}>TOTAL DÉPENSÉ</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--gold)', marginTop: 2 }}>{formattedSpent} TND</div>
            </div>
          </div>

          {/* Contact Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ background: 'var(--black-4)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--black-5)' }}>
              <div style={{ fontSize: 9.5, color: 'var(--white-40)', marginBottom: 2, fontWeight: 600 }}>EMAIL</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--white)', wordBreak: 'break-all' }}>{u.email || '—'}</div>
            </div>
            <div style={{ background: 'var(--black-4)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--black-5)' }}>
              <div style={{ fontSize: 9.5, color: 'var(--white-40)', marginBottom: 2, fontWeight: 600 }}>TÉLÉPHONE</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--white)' }}>{u.phone || 'Non renseigné'}</div>
            </div>
          </div>

          {/* Preferences */}
          {reservation && (
            <div style={{ background: 'var(--black-4)', borderRadius: 8, padding: '12px', border: '1px solid var(--black-5)' }}>
              <div style={{ fontSize: 10, color: 'var(--white-50)', fontWeight: 700, marginBottom: 8, letterSpacing: '0.4px' }}>
                DEMANDE ACTUELLE
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 11.5, padding: '3px 9px', borderRadius: 20, fontWeight: 600,
                  background: reservation.acceptAlternative ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                  color: reservation.acceptAlternative ? '#4ade80' : '#f87171',
                  border: `1px solid ${reservation.acceptAlternative ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                }}>
                  {reservation.acceptAlternative ? '✓ Accepte similaire' : '✕ Exige ce modèle'}
                </span>
                <span style={{ fontSize: 11.5, padding: '3px 9px', borderRadius: 20, background: 'rgba(212,160,23,0.12)', color: 'var(--gold)', border: '1px solid rgba(212,160,23,0.3)', fontWeight: 600 }}>
                  💳 {reservation.paymentOption === 'acompte' ? 'Acompte 10%' : reservation.paymentOption === 'moitie' ? 'Moitié 50%' : 'Totalité 100%'}
                </span>
              </div>
              {reservation.notes && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--black-5)', fontSize: 12, color: 'var(--white-70)' }}>
                  <strong style={{ color: 'var(--gold)' }}>Note: </strong> "{reservation.notes}"
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {u.email && (
              <a
                href={`mailto:${u.email}`}
                style={{
                  flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: 'rgba(212,160,23,0.15)', color: 'var(--gold)', border: '1px solid rgba(212,160,23,0.4)',
                  borderRadius: 8, padding: '9px', fontSize: 12, fontWeight: 700, textDecoration: 'none'
                }}
              >
                ✉️ Email
              </a>
            )}
            {u.phone && (
              <a
                href={`tel:${u.phone}`}
                style={{
                  flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.4)',
                  borderRadius: 8, padding: '9px', fontSize: 12, fontWeight: 700, textDecoration: 'none'
                }}
              >
                📞 Appeler
              </a>
            )}
          </div>
        </div>
      </div>
    )
  } catch (err) {
    console.error('CustomerProfileCard error:', err)
    return (
      <div className="vm-modal" style={{ flex: 1, maxWidth: 450, padding: 20, background: 'var(--black-2)', borderRadius: 16, border: '1px solid rgba(34,197,94,0.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: '#4ade80', margin: 0, fontSize: 16 }}>Profil Client</h3>
          <button className="vm-close" onClick={onClose}><FiX size={16}/></button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--white-50)', marginTop: 12 }}>Informations du client chargées.</p>
      </div>
    )
  }
}

// RESERVATION STATUS MODAL - Complete rewrite with payment management
// ════════════════════════════════════════════════════════
function StatusModal({ reservation, allReservations = [], onClose, onSaved, onRequestDelete }) {
  if (!reservation) return null

  const [activeTab, setActiveTab] = useState('status')  // status | payment | details
  const [showClientProfile, setShowClientProfile] = useState(false)
  
  // Status tab
  const [status, setStatus] = useState(reservation.status || 'recu')
  const [cancelReason, setCancelReason] = useState(reservation.cancelReason || '')
  const [requiredDepositPercentage, setRequiredDepositPercentage] = useState(reservation.requiredDepositPercentage || 30)

  // Payment tab
  const [amountPaid, setAmountPaid] = useState(reservation.amountPaid || 0)
  const [paymentStatus, setPaymentStatus] = useState(reservation.paymentStatus || 'pending')
  const [paymentMethod, setPaymentMethod] = useState(reservation.paymentMethod || '')
  const [paymentReference, setPaymentReference] = useState(reservation.paymentReference || '')

  // Details tab
  const [mileageAtPickup, setMileageAtPickup] = useState(reservation.mileageAtPickup ?? '')
  const [mileageAtDropoff, setMileageAtDropoff] = useState(reservation.mileageAtDropoff ?? '')
  const [internalNotes, setInternalNotes] = useState(reservation.internalNotes || '')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const totalTTC = Number(reservation.totalTTC) || 0
  const safeAmountPaid = Number(amountPaid) || 0
  const remainingBalance = Math.max(0, parseFloat((totalTTC - safeAmountPaid).toFixed(2)))
  const isPaid = safeAmountPaid >= totalTTC && totalTTC > 0
  const isPartial = safeAmountPaid > 0 && safeAmountPaid < totalTTC

  const handleSave = async () => {
    if (!status) {
      setError('Le statut est requis')
      return
    }
    if (status === 'completed' && remainingBalance > 0) {
      setError(`Impossible de terminer la réservation avec un solde restant de ${remainingBalance.toFixed(2)} TND. Veuillez d'abord enregistrer le paiement complet.`)
      return
    }

    setSaving(true)
    setError('')
    try {
      const payload = {
        status,
        requiredDepositPercentage: Number(requiredDepositPercentage) || 30,
        internalNotes: internalNotes || undefined,
        cancelReason: cancelReason || undefined,
        mileageAtPickup: mileageAtPickup !== '' ? Number(mileageAtPickup) : undefined,
        mileageAtDropoff: mileageAtDropoff !== '' ? Number(mileageAtDropoff) : undefined,
        amountPaid: Number(amountPaid) || 0,
        paymentStatus: paymentStatus || undefined,
        paymentMethod: paymentMethod || undefined,
        paymentReference: paymentReference || undefined,
      }

      await reservationsService.updateStatus(reservation._id, payload)
      onSaved()
    } catch (err) {
      const msg = err?.response?.data?.message
      setError(Array.isArray(msg) ? msg[0] : msg || 'Erreur lors de la sauvegarde.')
    } finally { setSaving(false) }
  }

  const TABS = [
    ['status', '📋 Statut'],
    ['payment', '💳 Paiement'],
    ['details', '📝 Détails'],
  ]

  return (
    <div className="vm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div
        className="status-modal-layout"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: 20,
          width: '100%',
          maxWidth: showClientProfile ? 1160 : 620,
          padding: '0 16px',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          margin: '0 auto',
        }}
      >
        {/* BLUE BOX: Main Reservation Modal */}
        <div
          className="vm-modal"
          style={{
            flex: 1,
            maxWidth: 620,
            margin: 0,
            border: showClientProfile ? '1.5px solid rgba(59, 130, 246, 0.55)' : undefined,
            boxShadow: showClientProfile ? '0 24px 60px rgba(0,0,0,0.8), 0 0 25px rgba(59, 130, 246, 0.15)' : undefined,
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div className="vm-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h2 className="vm-title">Gérer la réservation</h2>
              {reservation.user && (
                <button
                  type="button"
                  onClick={() => setShowClientProfile(!showClientProfile)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: showClientProfile ? '#d4a017' : 'rgba(212, 160, 23, 0.15)',
                    color: showClientProfile ? '#000' : '#d4a017',
                    border: '1px solid rgba(212, 160, 23, 0.5)',
                    borderRadius: 20,
                    padding: '4px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: '0 2px 8px rgba(212, 160, 23, 0.2)',
                  }}
                  title={showClientProfile ? "Fermer le profil client" : "Voir les informations complètes du client"}
                >
                  <FiUser size={13} /> {showClientProfile ? '✓ Profil Ouvert' : 'Profil Client'}
                </button>
              )}
            </div>
            <button className="vm-close" onClick={onClose}><FiX size={18}/></button>
          </div>


        {/* Reservation Info Summary */}
        <div style={{ background: 'var(--black-3)', padding: '16px 24px', borderBottom: '1px solid var(--black-4)' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 8 }}>
            {reservation.vehicle?.images?.[0] && (
              <div style={{ width: 60, height: 40, borderRadius: 6, overflow: 'hidden', background: 'var(--black-4)', flexShrink: 0 }}>
                <img src={reservation.vehicle.images[0]} alt={reservation.vehicle.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            )}
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span>{reservation.user?.firstName} {reservation.user?.lastName} · {reservation.vehicle?.name}</span>
                <span style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#d4a017',
                  background: 'rgba(212,160,23,0.15)',
                  border: '1px solid rgba(212,160,23,0.4)',
                  borderRadius: 5,
                  padding: '2px 8px',
                  fontFamily: 'monospace',
                  letterSpacing: '0.5px',
                }}>
                  #GSC-{reservation._id?.slice(-6).toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--white-50)', marginTop: 2 }}>
                {fmtDate(reservation.pickupDate)} → {fmtDate(reservation.dropoffDate)} ({reservation.totalDays} jours)
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
            <div style={{ background: 'var(--black-4)', padding: '10px 12px', borderRadius: 6 }}>
              <div style={{ fontSize: 10, color: 'var(--white-50)', marginBottom: 2 }}>MONTANT TOTAL</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--gold)' }}>{fmtMoney(reservation.totalTTC)}</div>
            </div>
            <div style={{ background: 'var(--black-4)', padding: '10px 12px', borderRadius: 6 }}>
              <div style={{ fontSize: 10, color: 'var(--white-50)', marginBottom: 2 }}>PAYÉ</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: isPaid ? 'var(--success)' : 'var(--white)' }}>{fmtMoney(amountPaid)}</div>
            </div>
            <div style={{ background: 'var(--black-4)', padding: '10px 12px', borderRadius: 6 }}>
              <div style={{ fontSize: 10, color: 'var(--white-50)', marginBottom: 2 }}>SOLDE</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: remainingBalance > 0 ? 'var(--danger)' : 'var(--success)' }}>{fmtMoney(remainingBalance)}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="vm-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--black-4)', padding: '0 24px' }}>
          {TABS.map(([k, l]) => (
            <button
              key={k}
              onClick={() => setActiveTab(k)}
              style={{
                background: 'none',
                border: 'none',
                padding: '12px 16px',
                fontSize: 13,
                fontWeight: activeTab === k ? 700 : 500,
                color: activeTab === k ? 'var(--gold)' : 'var(--white-50)',
                borderBottom: activeTab === k ? '2px solid var(--gold)' : 'none',
                marginBottom: activeTab === k ? '-1px' : '0',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all .15s',
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {error && <div className="vm-error"><FiAlertCircle size={13}/> {error}</div>}

        <div className="vm-form">
          {/* ── STATUS TAB ── */}
          {activeTab === 'status' && (
            <>
              <div className="vm-field">
                <label>Statut de la réservation</label>
                <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: '10px 12px' }}>
                  <option value="recu">📥 Reçu (en attente de validation admin)</option>
                  <option value="pending">⏳ En attente (client doit payer)</option>
                  <option value="confirmed">✅ Confirmée (prête pour la location)</option>
                  <option value="completed" disabled={remainingBalance > 0}
                    style={remainingBalance > 0 ? { color: 'var(--white-30)', background: 'var(--black-3)' } : {}}>
                    🏁 Terminée (location effectuée){remainingBalance > 0 ? ` — solde restant: ${remainingBalance.toFixed(2)} TND` : ''}
                  </option>
                  <option value="cancelled">❌ Annulée</option>
                </select>
              </div>

              {remainingBalance > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#fbbf24', lineHeight: 1.5
                }}>
                  <span style={{ fontSize: 15, flexShrink: 0 }}>⚠️</span>
                  <span>
                    <strong>Solde impayé : {remainingBalance.toFixed(2)} TND.</strong> Le statut <em>Terminée</em> sera disponible uniquement après le paiement complet. Allez dans l'onglet <strong>Paiement</strong> pour enregistrer le solde.
                  </span>
                </div>
              )}

              {status === 'cancelled' && (
                <div className="vm-field">
                  <label>Raison de l'annulation *</label>
                  <textarea
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                    rows={3}
                    placeholder="Client a annulé par téléphone, client a changé d'avis..."
                    style={{ padding: '10px 12px' }}
                  />
                </div>
              )}

              <div style={{ background: 'var(--black-3)', border: '1px solid var(--black-5)', borderRadius: 8, padding: '12px 14px', fontSize: 12, color: 'var(--white-70)', lineHeight: 1.6 }}>
                <strong>Guide des statuts:</strong><br/>
                • <strong>En attente:</strong> Réservation créée, attendant paiement<br/>
                • <strong>Confirmée:</strong> Paiement reçu ou suffisant, client peut récupérer<br/>
                • <strong>Terminée:</strong> Location effectuée, kilométrage enregistré <span style={{ color: '#fbbf24' }}>(paiement complet requis)</span><br/>
                • <strong>Annulée:</strong> Réservation annulée, véhicule libéré
              </div>
            </>
          )}

          {/* ── PAYMENT TAB ── */}
          {activeTab === 'payment' && (
            <>
              <div style={{ background: 'var(--black-3)', border: '1px solid var(--black-4)', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--white-50)', marginBottom: 8 }}>RÉSUMÉ PAIEMENT</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--white-50)' }}>Montant dû</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--gold)' }}>{fmtMoney(reservation.totalTTC)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--white-50)' }}>Reçu jusqu'à présent</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--white)' }}>{fmtMoney(amountPaid)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--white-50)' }}>Reste à payer</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: remainingBalance > 0 ? 'var(--danger)' : 'var(--success)' }}>{fmtMoney(remainingBalance)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--white-50)' }}>Statut</div>
                    <PayBadge status={paymentStatus} />
                  </div>
                </div>
              </div>

              <div className="vm-field">
                <label>Montant payé par le client (TND) *</label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={e => setAmountPaid(e.target.value)}
                  min={0}
                  max={reservation.totalTTC}
                  step={0.5}
                  style={{ padding: '10px 12px' }}
                />
                <div style={{ fontSize: 11, color: 'var(--white-50)', marginTop: 4 }}>
                  {isPaid && '✅ Montant complet reçu'}
                  {isPartial && `⚠️ Montant partiel: ${remainingBalance} TND restent dus`}
                  {!isPaid && amountPaid === 0 && '⏳ Aucun paiement reçu'}
                </div>
              </div>

              <div className="vm-row">
                <div className="vm-field">
                  <label>Méthode de paiement</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ padding: '10px 12px' }}>
                    <option value="">-- Sélectionner --</option>
                    <option value="espèces">💵 Espèces</option>
                    <option value="carte">💳 Carte bancaire</option>
                    <option value="virement">🏦 Virement bancaire</option>
                    <option value="chèque">📄 Chèque</option>
                    <option value="autre">📝 Autre</option>
                  </select>
                </div>
                <div className="vm-field">
                  <label>Référence/Reçu</label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={e => setPaymentReference(e.target.value)}
                    placeholder="Numéro de reçu, ID transaction..."
                    style={{ padding: '10px 12px' }}
                  />
                </div>
              </div>

              <div style={{ background: 'var(--black-3)', border: '1px solid var(--black-5)', borderRadius: 8, padding: '12px 14px', fontSize: 12, color: 'var(--white-70)', lineHeight: 1.6 }}>
                <strong>💡 Comment enregistrer un paiement:</strong><br/>
                1. Saisissez le montant que le client a payé<br/>
                2. La méthode de paiement vous aide à tracer le paiement<br/>
                3. Sauvegarder met automatiquement à jour le solde dû<br/>
                4. Si payé = montant total, la réservation peut être confirmée
              </div>
            </>
          )}

          {/* ── DETAILS TAB ── */}
          {activeTab === 'details' && (
            <>
              {(status === 'confirmed' || status === 'completed') && (
                <div className="vm-row">
                  <div className="vm-field">
                    <label>Kilométrage à la prise</label>
                    <input
                      type="number"
                      value={mileageAtPickup}
                      onChange={e => setMileageAtPickup(e.target.value)}
                      min={0}
                      placeholder="32000"
                      style={{ padding: '10px 12px' }}
                    />
                  </div>
                  <div className="vm-field">
                    <label>Kilométrage à la restitution</label>
                    <input
                      type="number"
                      value={mileageAtDropoff}
                      onChange={e => setMileageAtDropoff(e.target.value)}
                      min={0}
                      placeholder="32450"
                      style={{ padding: '10px 12px' }}
                    />
                  </div>
                </div>
              )}

              <div className="vm-field">
                <label>Notes internes (admin uniquement - non visibles au client)</label>
                <textarea
                  value={internalNotes}
                  onChange={e => setInternalNotes(e.target.value)}
                  rows={3}
                  placeholder="Payé en espèces, ID vérifié, légère rayure remarquée..."
                  style={{ padding: '10px 12px' }}
                />
              </div>
            </>
          )}

          <div className="vm-actions" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
            {onRequestDelete && (
              <button
                type="button"
                className="admin-btn admin-btn--danger"
                onClick={() => onRequestDelete(reservation)}
                disabled={saving}
              >
                <FiTrash2 size={13}/> Supprimer
              </button>
            )}
            <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
              <button type="button" className="admin-btn admin-btn--outline" onClick={onClose}>Annuler</button>
              <button type="button" className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="admin-spinner"/> : '💾 Enregistrer les modifications'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* GREEN BOX: Client Profile Side Card (Slides right along animation path) */}
      {showClientProfile && (
        <CustomerProfileCard
          user={reservation.user}
          reservation={reservation}
          allReservations={allReservations}
          onClose={() => setShowClientProfile(false)}
        />
      )}
    </div>
  </div>
)
}

// ════════════════════════════════════════════════════════
// PARC MODAL — create / edit a parking location
// ════════════════════════════════════════════════════════
function ParcModal({ parc, onClose, onSaved }) {
  const isEdit = !!parc
  const [form, setForm] = useState({
    name: parc?.name || '',
    city: parc?.city || '',
    address: parc?.address || '',
    capacity: parc?.capacity || 30,
    description: parc?.description || '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.name.trim()) { setErr('Le nom du parc est requis.'); return }
    setSaving(true); setErr('')
    try {
      if (isEdit) {
        await parcsService.update(parc._id, { ...form, capacity: Number(form.capacity) })
      } else {
        await parcsService.create({ ...form, capacity: Number(form.capacity) })
      }
      onSaved()
    } catch (e) {
      setErr(e?.response?.data?.message || 'Erreur lors de la sauvegarde.')
    } finally { setSaving(false) }
  }

  return (
    <div className="vm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="vm-modal" style={{ maxWidth: 480 }}>
        <div className="vm-modal__header">
          <h3 className="vm-modal__title">{isEdit ? 'Modifier le parc' : 'Nouveau parc'}</h3>
          <button className="vm-modal__close" onClick={onClose}><FiX size={16}/></button>
        </div>
        {err && <div className="vm-error"><FiAlertCircle size={13}/> {err}</div>}
        <form onSubmit={handleSubmit} className="vm-form">
          <div className="vm-field">
            <label className="vm-label">Nom du parc *</label>
            <input className="vm-input" value={form.name} onChange={set('name')} placeholder="ex: Aéroport de Tunis-Carthage" required />
          </div>
          <div className="vm-row-two">
            <div className="vm-field">
              <label className="vm-label">Ville</label>
              <input className="vm-input" value={form.city} onChange={set('city')} placeholder="Tunis" />
            </div>
            <div className="vm-field">
              <label className="vm-label">Capacité (véhicules)</label>
              <input className="vm-input" type="number" min={1} value={form.capacity} onChange={set('capacity')} />
            </div>
          </div>
          <div className="vm-field">
            <label className="vm-label">Adresse</label>
            <input className="vm-input" value={form.address} onChange={set('address')} placeholder="Route de l'Aéroport, Tunis" />
          </div>
          <div className="vm-field">
            <label className="vm-label">Description</label>
            <textarea className="vm-input vm-textarea" value={form.description} onChange={set('description')} placeholder="Description du parc..." rows={3} />
          </div>
          <div className="vm-actions">
            <button type="button" className="admin-btn admin-btn--outline" onClick={onClose}>Annuler</button>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
              {saving ? 'Sauvegarde...' : isEdit ? 'Enregistrer' : 'Créer le parc'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════
// DELETE RESERVATION CONFIRMATION MODAL
// ════════════════════════════════════════════════════════
function ConfirmDeleteReservationModal({ reservation, deleting, onCancel, onConfirm }) {
  if (!reservation) return null
  const code = `#GSC-${reservation._id?.slice(-6).toUpperCase()}`
  const client = [reservation.user?.firstName, reservation.user?.lastName].filter(Boolean).join(' ') || '—'
  const vehicle = reservation.vehicle?.name || '—'

  return (
    <div className="vm-overlay" onClick={e => e.target === e.currentTarget && !deleting && onCancel()}>
      <div className="confirm-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-delete-title">
        <div className="confirm-delete-modal__icon">
          <FiAlertCircle size={28} />
        </div>
        <h2 id="confirm-delete-title" className="confirm-delete-modal__title">Supprimer cette réservation ?</h2>
        <p className="confirm-delete-modal__text">
          Cette action est <strong>irréversible</strong>. La réservation sera définitivement retirée et le véhicule sera libéré si plus aucune location active ne le concerne.
        </p>
        <div className="confirm-delete-modal__details">
          <div><span>Code</span><strong>{code}</strong></div>
          <div><span>Client</span><strong>{client}</strong></div>
          <div><span>Véhicule</span><strong>{vehicle}</strong></div>
          <div><span>Dates</span><strong>{fmtDate(reservation.pickupDate)} → {fmtDate(reservation.dropoffDate)}</strong></div>
        </div>
        <div className="confirm-delete-modal__actions">
          <button type="button" className="admin-btn admin-btn--outline" onClick={onCancel} disabled={deleting}>
            Annuler
          </button>
          <button type="button" className="admin-btn admin-btn--danger" onClick={onConfirm} disabled={deleting}>
            {deleting ? <span className="admin-spinner" style={{ borderTopColor: '#fff' }}/> : <FiTrash2 size={14}/>}
            {deleting ? 'Suppression…' : 'Oui, supprimer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════
// MAIN ADMIN COMPONENT
// ════════════════════════════════════════════════════════
export default function Admin() {
  const { user } = useAuth()
  const { rates, updateRates } = useCurrency()
  const navigate = useNavigate()
  const [calOffset, setCalOffset] = useState(0)
  const DAYS = getWeekDays(calOffset)

  // Rate Changer state
  const [rateEurInput, setRateEurInput] = useState(rates?.EUR_TND || 3.33)
  const [rateUsdInput, setRateUsdInput] = useState(rates?.USD_TND || 3.12)
  const [rateSavedMsg, setRateSavedMsg] = useState(false)

  useEffect(() => {
    if (rates) {
      setRateEurInput(rates.EUR_TND)
      setRateUsdInput(rates.USD_TND)
    }
  }, [rates])

  const handleSaveExchangeRates = () => {
    updateRates({ EUR_TND: rateEurInput, USD_TND: rateUsdInput })
    setRateSavedMsg(true)
    setTimeout(() => setRateSavedMsg(false), 3000)
  }

  // data
  const [vehicles, setVehicles] = useState([])
  const [allReservations, setAllReservations] = useState([])
  const [upcomingRes, setUpcomingRes] = useState([])
  const [stats, setStats] = useState(null)
  const [parcs, setParcs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [resSearchQuery, setResSearchQuery] = useState('')

  const filteredReservations = allReservations.filter(r => {
    if (!resSearchQuery.trim()) return true
    const q = resSearchQuery.toLowerCase().trim()
    const resCode = `#tcr-${r._id?.slice(-6)}`.toLowerCase()
    const fullId = String(r._id || '').toLowerCase()
    const clientName = `${r.user?.firstName || ''} ${r.user?.lastName || ''}`.toLowerCase()
    const clientEmail = String(r.user?.email || '').toLowerCase()
    const carName = String(r.vehicle?.name || '').toLowerCase()
    const carPlate = String(r.vehicle?.plate || '').toLowerCase()
    return resCode.includes(q) || fullId.includes(q) || clientName.includes(q) || clientEmail.includes(q) || carName.includes(q) || carPlate.includes(q)
  })

  // ── Calendar-specific state (separate from main data) ──
  const [calData, setCalData]       = useState({ vehicles: [], reservations: [] })
  const [calLoading, setCalLoading] = useState(false)

  // UI state
  const [activeTab, setActiveTab] = useState('dashboard')
  const [vehicleModal, setVehicleModal] = useState(null)
  const [historyModal, setHistoryModal] = useState(null)
  const [statusModal, setStatusModal] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleteReservation, setDeleteReservation] = useState(null)
  const [deletingRes, setDeletingRes] = useState(false)
  const [toast, setToast] = useState(null)
  const [vehicleFilterStatus, setVehicleFilterStatus] = useState('all')
  const [vehicleSortBy, setVehicleSortBy] = useState('name')
  const [togglingVehicleId, setTogglingVehicleId] = useState(null)
  // Parcs UI state
  const [parcModal, setParcModal] = useState(null)   // null | 'add' | parc obj
  const [draggedVehicle, setDraggedVehicle] = useState(null)
  const [dragOverParc, setDragOverParc] = useState(null)
  // Multi-parc mode state
  const [multiParcMode, setMultiParcMode] = useState(false)
  const [selectedVehicles, setSelectedVehicles] = useState(new Set())
  const [targetParcs, setTargetParcs] = useState(new Set())
  const [applyingMultiParc, setApplyingMultiParc] = useState(false)

  const loadData = async (opts = {}) => {
    if (!opts.silent) { setLoading(true); setError(null) }
    try {
      const [v, rAll, rUp, st] = await Promise.all([
        vehiclesService.getAllAdmin(),
        reservationsService.getAll(),
        reservationsService.getUpcoming(),
        reservationsService.getStats(),
      ])
      setVehicles(v)
      setAllReservations(rAll)
      setUpcomingRes(rUp)
      setStats(st)
      // Parcs loaded separately — failure must not crash the page
      try {
        const p = await parcsService.getAll()
        setParcs(p || [])
      } catch { setParcs([]) }
    } catch (e) {
      if (!opts.silent) setError('Impossible de charger les données. ' + (e?.message || ''))
    } finally { if (!opts.silent) setLoading(false) }
  }

  // Loads only the data needed for the visible calendar week
  const loadCalendarData = async () => {
    if (!DAYS.length) return
    setCalLoading(true)
    try {
      const startDate = DAYS[0].date.toISOString()
      const endDate   = (() => {
        const d = new Date(DAYS[DAYS.length - 1].date)
        d.setDate(d.getDate() + 1)   // include full last day
        return d.toISOString()
      })()
      const data = await reservationsService.getCalendar(startDate, endDate)
      setCalData(data || { vehicles: [], reservations: [] })
    } catch (e) {
      console.error('Calendar load error:', e)
    } finally { setCalLoading(false) }
  }

  useEffect(() => { loadData() }, [])
  // Re-fetch calendar data whenever the visible week changes or calendar tab opens
  useEffect(() => {
    if (activeTab === 'calendar') loadCalendarData()
  }, [calOffset, activeTab])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  // handlers
  const handleToggle = async (id, val) => {
    setTogglingVehicleId(id)
    try { 
      const u = await vehiclesService.toggleActive(id)
      setVehicles(p => p.map(v => v._id === id ? { ...v, isActive: u.isActive } : v))
    } catch (e) {
      alert('Erreur lors de la mise à jour: ' + (e?.message || 'erreur inconnue'))
    } finally {
      setTogglingVehicleId(null)
    }
  }

  const handleDelete = async (id) => {
    try {
      await vehiclesService.remove(id)
      setVehicles(p => p.filter(v => v._id !== id))
      setConfirmDelete(null)
      // After deletion, vehicle statuses will be resynced by the backend,
      // refresh our local list to reflect the updated statuses
      setTimeout(() => loadData(), 800)
    } catch (e) {
      alert('Impossible de supprimer: ' + (e?.message || 'erreur inconnue'))
    }
  }

  const requestDeleteReservation = (r) => {
    setStatusModal(null)
    setDeleteReservation(r)
  }

  const handleDeleteReservation = async () => {
    if (!deleteReservation?._id) return
    setDeletingRes(true)
    const code = `#GSC-${deleteReservation._id.slice(-6).toUpperCase()}`
    try {
      await reservationsService.remove(deleteReservation._id)
      setAllReservations(p => p.filter(r => r._id !== deleteReservation._id))
      setUpcomingRes(p => p.filter(r => r._id !== deleteReservation._id))
      setDeleteReservation(null)
      setToast({ type: 'success', message: `Réservation ${code} supprimée.` })
      loadData({ silent: true })
      if (activeTab === 'calendar') loadCalendarData()
    } catch (e) {
      const msg = e?.response?.data?.message
      const text = Array.isArray(msg) ? msg[0] : (msg || e?.message || 'erreur inconnue')
      setToast({ type: 'error', message: `Impossible de supprimer ${code} : ${text}` })
    } finally {
      setDeletingRes(false)
    }
  }

  const handleMaintenanceToggle = async (v) => {
    const enable = v.status !== 'Maintenance'
    try {
      const updated = await vehiclesService.setMaintenance(v._id, enable)
      setVehicles(p => p.map(x => x._id === v._id ? { ...x, ...updated } : x))
    } catch (e) {
      alert('Erreur maintenance: ' + (e?.message || 'erreur inconnue'))
    }
  }

  const handleSyncStatuses = async () => {
    try {
      await vehiclesService.syncAllStatuses()
      await loadData()  // refresh the list with updated statuses
    } catch (e) {
      alert('Sync échoué: ' + (e?.message || 'erreur inconnue'))
    }
  }

  const handleSaved = () => {
    setVehicleModal(null)
    setStatusModal(null)
    loadData()
  }

  // ── Multi-parc mode helpers ──────────────────────────────────────────────────
  const getVehicleParcIds = (v) => {
    // Get all parc IDs this vehicle is assigned to
    if (v.parcs && v.parcs.length > 0) {
      return v.parcs.map(p => p?._id || p).filter(Boolean)
    }
    if (v.parc) return [v.parc?._id || v.parc]
    return []
  }

  const toggleVehicleSelection = (vehicleId) => {
    setSelectedVehicles(prev => {
      const next = new Set(prev)
      if (next.has(vehicleId)) next.delete(vehicleId)
      else next.add(vehicleId)
      return next
    })
  }

  const toggleTargetParc = (parcId) => {
    setTargetParcs(prev => {
      const next = new Set(prev)
      if (next.has(parcId)) next.delete(parcId)
      else next.add(parcId)
      return next
    })
  }

  const clearMultiParcSelection = () => {
    setSelectedVehicles(new Set())
    setTargetParcs(new Set())
  }

  const applyMultiParcAssignment = async () => {
    if (selectedVehicles.size === 0) return
    setApplyingMultiParc(true)
    try {
      const parcIdArray = Array.from(targetParcs)
      await Promise.all(
        Array.from(selectedVehicles).map(vId =>
          vehiclesService.assignToParcs(vId, parcIdArray)
        )
      )
      clearMultiParcSelection()
      await loadData()
    } catch (e) {
      alert('Erreur d\'affectation multi-parc: ' + (e?.message || 'erreur inconnue'))
    } finally {
      setApplyingMultiParc(false)
    }
  }

  const handleToggleMultiParcMode = (active) => {
    setMultiParcMode(active)
    if (!active) clearMultiParcSelection()
  }

  // Filtering & sorting for vehicles
  const filteredVehicles = vehicles.filter(v => {
    if (vehicleFilterStatus === 'active')       return v.isActive
    if (vehicleFilterStatus === 'inactive')     return !v.isActive
    if (vehicleFilterStatus === 'available')    return v.status === 'Disponible' && v.isActive
    if (vehicleFilterStatus === 'reserved')     return v.status === 'Réservé'
    if (vehicleFilterStatus === 'maintenance')  return v.status === 'Maintenance'
    return true
  })

  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    if (vehicleSortBy === 'name') return a.name.localeCompare(b.name)
    if (vehicleSortBy === 'price-low') return a.pricePerDay - b.pricePerDay
    if (vehicleSortBy === 'price-high') return b.pricePerDay - a.pricePerDay
    if (vehicleSortBy === 'recent') return new Date(b.createdAt) - new Date(a.createdAt)
    if (vehicleSortBy === 'year') return b.year - a.year
    return 0
  })

  if (loading) return (
    <div className="admin-page">
      <AdminStrip />
      <div style={{ padding: 60, textAlign: 'center' }}>
        <div className="sr-skeleton" style={{ height: 300, borderRadius: 12, maxWidth: 900, margin: '0 auto' }} />
      </div>
    </div>
  )

  return (
    <div className="admin-page">
      <AdminStrip />
      <Navbar />

      {/* Top bar */}
      <div className="admin-topbar">
        <div className="admin-topbar__left">
          <h1 className="admin-topbar__title">Tableau de bord</h1>
          <p className="admin-topbar__sub">
            Bonjour <strong>{user?.firstName}</strong> —{' '}
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button className="admin-btn admin-btn--outline" onClick={loadData}><FiRefreshCw size={13}/> Actualiser</button>
      </div>

      {/* Tabs */}
      <div className="admin-tabs-bar">
        {[['dashboard','📊 Dashboard'],['vehicles','🚗 Véhicules'],['reservations','📋 Réservations'],['calendar','📅 Calendrier'],['parcs','🏢 Parcs']].map(([k, l]) => (
          <button key={k} className={`admin-tab-btn ${activeTab === k ? 'admin-tab-btn--active' : ''}`} onClick={() => setActiveTab(k)}>{l}</button>
        ))}
      </div>

      {error && (
        <div className="admin-error-bar">
          <FiAlertCircle size={15}/> {error}
          <button onClick={loadData}><FiRefreshCw size={12}/> Réessayer</button>
        </div>
      )}

      {/* ══════════ DASHBOARD ══════════ */}
      {activeTab === 'dashboard' && (
        <div className="dash-layout">
          {/* KPI row — from real server stats */}
          <div className="dash-kpi-row">
            <KpiCard icon={<FiDollarSign size={20}/>} label="Revenus ce mois"
              value={stats ? fmtMoney(stats.revenueThisMonth) : '—'}
              sub={stats ? `Total : ${fmtMoney(stats.totalRevenue)}` : ''}
              trend={stats?.revTrend} up={stats?.revTrend > 0}
            />
            <KpiCard icon={<FiCalendar size={20}/>} label="Réservations ce mois"
              value={stats?.thisMonthReservations ?? '—'}
              sub={stats ? `${stats.statusBreakdown?.confirmed ?? 0} confirmées · ${stats.statusBreakdown?.pending ?? 0} en attente` : ''}
              trend={stats?.countTrend} up={stats?.countTrend > 0}
            />
            <KpiCard icon={<FiBarChart2 size={20}/>} label="Taux d'utilisation"
              value={vehicles.length ? `${Math.round((vehicles.filter(v => v.status !== 'Disponible').length / vehicles.length) * 100)}%` : '—'}
              sub={`${vehicles.filter(v => v.status === 'Réservé').length} loués · ${vehicles.filter(v => v.status === 'Disponible').length} libres`}
            />
            <KpiCard icon={<FiList size={20}/>} label="Total réservations"
              value={stats?.totalReservations ?? '—'}
              sub={`${vehicles.length} véhicules dans la flotte`}
            />
          </div>

          {/* Main + side */}
          <div className="dash-main">
            {/* Top vehicles */}
            {stats?.topVehicles?.length > 0 && (
              <div className="admin-card">
                <div className="admin-card__header">
                  <h3 className="admin-card__title">🏆 Véhicules les plus réservés</h3>
                </div>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead><tr><th>VÉHICULE</th><th>CATÉGORIE</th><th>RÉSERVATIONS</th><th>REVENUS GÉNÉRÉS</th><th>TARIF/JOUR</th></tr></thead>
                    <tbody>
                      {stats.topVehicles.map((v, i) => (
                        <tr key={v.vehicleId} className="admin-table__row">
                          <td>
                            <div className="admin-table__vehicle">
                              <div className="admin-table__car-img">
                                {v.images?.[0] ? <img src={v.images[0]} alt={v.name}/> : <span>🚗</span>}
                              </div>
                              <div>
                                <div className="admin-table__car-name">{i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : ''}{v.name || '—'}</div>
                                <div className="admin-table__car-year">{v.brand}</div>
                              </div>
                            </div>
                          </td>
                          <td className="admin-table__category">{v.category}</td>
                          <td><span style={{ color: 'var(--gold)', fontWeight: 700 }}>{v.count}</span></td>
                          <td><span style={{ color: 'var(--success)', fontWeight: 700 }}>{fmtMoney(v.revenue)}</span></td>
                          <td style={{ color: 'var(--white-70)' }}>{v.pricePerDay ? `${v.pricePerDay} TND` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Fleet status */}
            <div className="admin-card">
              <div className="admin-card__header"><h3 className="admin-card__title">Statut de la flotte</h3></div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Disponible',  count: vehicles.filter(v => v.status === 'Disponible').length,  color: 'var(--success)' },
                  { label: 'Réservé',     count: vehicles.filter(v => v.status === 'Réservé').length,     color: 'var(--warning)' },
                  { label: 'Maintenance', count: vehicles.filter(v => v.status === 'Maintenance').length,  color: 'var(--danger)'  },
                ].map(({ label, count, color }) => (
                  <div key={label} className="dash-fleet-row">
                    <span className="dash-fleet-dot" style={{ background: color }}/>
                    <span className="dash-fleet-label">{label}</span>
                    <div className="dash-fleet-bar-wrap">
                      <div className="dash-fleet-bar" style={{ width: vehicles.length ? `${count / vehicles.length * 100}%` : '0%', background: color }}/>
                    </div>
                    <span className="dash-fleet-count">{count} / {vehicles.length}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent activity */}
            <div className="admin-card">
              <div className="admin-card__header">
                <h3 className="admin-card__title">Activité récente</h3>
                <button className="admin-btn admin-btn--outline" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => setActiveTab('reservations')}>Voir tout →</button>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>CLIENT</th><th>VÉHICULE</th><th>DATES</th><th>PAYÉ</th><th>SOLDE</th><th>STATUT</th></tr></thead>
                  <tbody>
                    {(stats?.recentActivity || []).slice(0, 8).map(r => (
                      <tr key={r._id} className="admin-table__row">
                        <td>
                          <div className="admin-table__car-name">{r.user?.firstName} {r.user?.lastName}</div>
                          <div className="admin-table__car-year">{r.user?.email}</div>
                        </td>
                        <td className="admin-table__car-name">{r.vehicle?.name || '—'}</td>
                        <td style={{ fontSize: 11.5, color: 'var(--white-50)' }}>
                          {fmtDate(r.pickupDate)} → {fmtDate(r.dropoffDate)}
                        </td>
                        <td style={{ color: 'var(--gold)', fontWeight: 700 }}>{fmtMoney(r.amountPaid)}</td>
                        <td style={{ color: r.remainingBalance > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                          {fmtMoney(r.remainingBalance)}
                        </td>
                        <td><ResBadge status={r.status}/></td>
                      </tr>
                    ))}
                    {!stats?.recentActivity?.length && (
                      <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--white-30)', padding: 28 }}>Aucune réservation.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="dash-side">
            <div className="admin-card">
              <div className="admin-card__header"><h3 className="admin-card__title">Prochaines arrivées</h3></div>
              <div className="admin-reservations">
                {upcomingRes.length === 0
                  ? <p style={{ textAlign: 'center', color: 'var(--white-30)', fontSize: 13, padding: '20px 16px' }}>Aucune.</p>
                  : upcomingRes.slice(0, 8).map(r => {
                      const p = new Date(r.pickupDate)
                      return (
                        <div key={r._id} className="res-item" onClick={() => setStatusModal(r)} style={{ cursor: 'pointer' }}>
                          <div className="res-item__date">
                            <span className="res-item__day">{p.getDate()}</span>
                            <span className="res-item__month">{p.toLocaleString('fr-FR', { month: 'short' }).toUpperCase()}</span>
                          </div>
                          <div className="res-item__info">
                            <div className="res-item__top">
                              <span className="res-item__client">{r.user?.firstName} {r.user?.lastName}</span>
                              <ResBadge status={r.status}/>
                            </div>
                            <span className="res-item__car">{r.vehicle?.name}</span>
                            <span className="res-item__dates">{fmtMoney(r.totalTTC)} · {r.totalDays} jours</span>
                          </div>
                        </div>
                      )
                    })
                }
              </div>
            </div>
            <div className="admin-card">
              <div className="admin-card__header"><h3 className="admin-card__title">Actions rapides</h3></div>
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="admin-btn admin-btn--primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setVehicleModal('add')}><FiPlus size={14}/> Ajouter un véhicule</button>
                <button className="admin-btn admin-btn--outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setActiveTab('reservations')}><FiCalendar size={14}/> Réservations</button>
                <button className="admin-btn admin-btn--outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setActiveTab('calendar')}><FiClock size={14}/> Calendrier</button>
              </div>
            </div>

            {/* Exchange Rate Changer Widget */}
            <div className="admin-card" style={{ marginTop: 16 }}>
              <div className="admin-card__header">
                <h3 className="admin-card__title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  💱 Taux de change (TND)
                </h3>
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: 'var(--white-50)', fontWeight: 600 }}>1 EUR (€) =</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="number"
                      step="0.01"
                      value={rateEurInput}
                      onChange={e => setRateEurInput(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: 'var(--black-3)', border: '1px solid var(--black-5)', color: '#fff', fontSize: 13, fontFamily: 'inherit' }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700 }}>TND</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: 'var(--white-50)', fontWeight: 600 }}>1 USD ($) =</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="number"
                      step="0.01"
                      value={rateUsdInput}
                      onChange={e => setRateUsdInput(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: 'var(--black-3)', border: '1px solid var(--black-5)', color: '#fff', fontSize: 13, fontFamily: 'inherit' }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700 }}>TND</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="admin-btn admin-btn--primary"
                  onClick={handleSaveExchangeRates}
                  style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                >
                  <FiCheck size={14} /> Enregistrer les taux
                </button>
                {rateSavedMsg && (
                  <span style={{ fontSize: 11, color: 'var(--success)', textAlign: 'center', fontWeight: 600, display: 'block' }}>
                    ✓ Taux mis à jour avec succès !
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ══════════ VEHICLES TAB ══════════ */}
      {activeTab === 'vehicles' && (
        <div className="admin-full">
          {/* KPI Cards */}
          <div className="admin-summary-row">
            <div className="admin-summary-card">
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gold)' }}>{vehicles.length}</div>
              <div style={{ fontSize: 11, color: 'var(--white-50)', marginTop: 2 }}>Total</div>
            </div>
            <div className="admin-summary-card">
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)' }}>{vehicles.filter(v => v.status === 'Disponible').length}</div>
              <div style={{ fontSize: 11, color: 'var(--white-50)', marginTop: 2 }}>Disponibles</div>
            </div>
            <div className="admin-summary-card">
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--warning)' }}>{vehicles.filter(v => v.status === 'Réservé').length}</div>
              <div style={{ fontSize: 11, color: 'var(--white-50)', marginTop: 2 }}>Réservés</div>
            </div>
            <div className="admin-summary-card">
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--danger)' }}>{vehicles.filter(v => v.status === 'Maintenance').length}</div>
              <div style={{ fontSize: 11, color: 'var(--white-50)', marginTop: 2 }}>Maintenance</div>
            </div>
            <div className="admin-summary-card">
              <div style={{ fontSize: 24, fontWeight: 800, color: '#a78bfa' }}>{vehicles.filter(v => v.isActive).length}</div>
              <div style={{ fontSize: 11, color: 'var(--white-50)', marginTop: 2 }}>Actifs</div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                <h2 className="admin-card__title">Véhicules <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--white-30)' }}>({sortedVehicles.length})</span></h2>
                
                {/* Filter */}
                <select value={vehicleFilterStatus} onChange={e => setVehicleFilterStatus(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--black-5)', background: 'var(--black-3)', color: 'var(--white)', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actifs</option>
                  <option value="inactive">Inactifs</option>
                  <option value="available">Disponibles</option>
                  <option value="reserved">Réservés</option>
                  <option value="maintenance">Maintenance</option>
                </select>

                {/* Sort */}
                <select value={vehicleSortBy} onChange={e => setVehicleSortBy(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--black-5)', background: 'var(--black-3)', color: 'var(--white)', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>
                  <option value="name">Trier par nom</option>
                  <option value="price-low">Tarif: bas → haut</option>
                  <option value="price-high">Tarif: haut → bas</option>
                  <option value="year">Année récente</option>
                  <option value="recent">Ajout récent</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  className="admin-btn admin-btn--outline"
                  style={{ fontSize: 12, padding: '6px 12px' }}
                  onClick={handleSyncStatuses}
                  title="Recalcule les statuts de tous les véhicules depuis les réservations"
                >
                  <FiRefreshCw size={13}/> Sync statuts
                </button>
                <button className="admin-btn admin-btn--primary" onClick={() => setVehicleModal('add')}><FiPlus size={14}/> Nouveau véhicule</button>
              </div>
            </div>

            {sortedVehicles.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--white-30)' }}>
                <div style={{ fontSize: 14, marginBottom: 8 }}>Aucun véhicule trouvé</div>
                <button className="admin-btn admin-btn--primary" onClick={() => setVehicleModal('add')}><FiPlus size={13}/> Créer un véhicule</button>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>VÉHICULE</th>
                      <th>MARQUE</th>
                      <th>PLAQUE</th>
                      <th>CATÉGORIE</th>
                      <th>TARIF / JOUR</th>
                      <th>KM ACTUEL</th>
                      <th>STATUT</th>
                      <th>ACTIF</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedVehicles.map(v => (
                      <tr key={v._id} className="admin-table__row">
                        <td>
                          <div className="admin-table__vehicle">
                            <div className="admin-table__car-img">
                              {v.images?.[0] ? <img src={v.images[0]} alt={v.name}/> : <span style={{ fontSize: 18 }}>🚗</span>}
                            </div>
                            <div>
                              <div className="admin-table__car-name">{v.name}</div>
                              <div className="admin-table__car-year">{v.year} · {v.seats} places</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: 12.5, color: 'var(--white-70)' }}>{v.brand}</td>
                        <td className="admin-table__plate">{v.plate}</td>
                        <td style={{ fontSize: 12, color: 'var(--white-50)' }}>{v.category}</td>
                        <td>
                          <div className="admin-table__rate">
                            <span className="admin-table__rate-val">{Number(v.pricePerDay).toFixed(2)} TND</span>
                          </div>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--white-50)' }}>
                          {v.mileage != null ? `${Number(v.mileage).toLocaleString()} km` : '—'}
                        </td>
                        <td>
                          {!v.isActive ? (
                            <span style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:5,fontSize:12,fontWeight:600,background:'rgba(107,114,128,0.15)',color:'#9ca3af' }}>Inactif</span>
                          ) : v.status === 'Disponible' ? (
                            <span style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:5,fontSize:12,fontWeight:600,background:'rgba(34,197,94,0.15)',color:'var(--success)' }}>Disponible</span>
                          ) : v.status === 'Réservé' ? (
                            <span style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:5,fontSize:12,fontWeight:600,background:'rgba(245,158,11,0.15)',color:'var(--warning)' }}>Réservé</span>
                          ) : v.status === 'Maintenance' ? (
                            <span style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:5,fontSize:12,fontWeight:600,background:'rgba(239,68,68,0.12)',color:'#f87171' }}>⚙ Maintenance</span>
                          ) : (
                            <span style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:5,fontSize:12,fontWeight:600,background:'rgba(239,68,68,0.15)',color:'var(--danger)' }}>{v.status}</span>
                          )}
                        </td>
                        <td>
                          <Toggle active={v.isActive} onChange={val => handleToggle(v._id, val)} disabled={togglingVehicleId === v._id}/>
                        </td>
                        <td>
                          <div className="admin-table__actions">
                            <button className="admin-table__action" onClick={() => setVehicleModal(v)} title="Modifier" style={{ gap: 4 }}>
                              <FiEdit2 size={12}/> Éditer
                            </button>
                            <button className="admin-table__action" onClick={() => setHistoryModal(v)} title="Historique" style={{ gap: 4 }}>
                              <FiList size={12}/> Hist.
                            </button>
                            <button
                              className="admin-table__action"
                              onClick={() => handleMaintenanceToggle(v)}
                              title={v.status === 'Maintenance' ? 'Retirer de maintenance' : 'Mettre en maintenance'}
                              style={{ gap: 4, color: v.status === 'Maintenance' ? '#f87171' : 'var(--white-50)' }}
                            >
                              <FiTool size={12}/> {v.status === 'Maintenance' ? '✓ Maint.' : 'Maint.'}
                            </button>
                            {confirmDelete === v._id
                              ? <>
                                  <button className="admin-table__action admin-table__action--danger" onClick={() => handleDelete(v._id)} title="Confirmer suppression" style={{ gap: 4 }}>
                                    <FiCheck size={12}/> OUI
                                  </button>
                                  <button className="admin-table__action" onClick={() => setConfirmDelete(null)} title="Annuler" style={{ gap: 4 }}>
                                    <FiX size={12}/> NON
                                  </button>
                                </>
                              : <button className="admin-table__action admin-table__action--danger" onClick={() => setConfirmDelete(v._id)} title="Supprimer" style={{ gap: 4 }}>
                                  <FiTrash2 size={12}/> Suppr.
                                </button>
                            }
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════ RESERVATIONS TAB ══════════ */}
      {activeTab === 'reservations' && (
        <div className="admin-full">
          <div className="admin-card">
            <div className="admin-card__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <h2 className="admin-card__title">
                Réservations <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--white-30)' }}>({filteredReservations.length} sur {allReservations.length})</span>
              </h2>
              {/* Search Bar for Code ID, Client, or Vehicle */}
              <div style={{ position: 'relative', width: 320, maxWidth: '100%' }}>
                <input
                  type="text"
                  placeholder="🔍 Code (#GSC-...), Client, Email, Voiture..."
                  value={resSearchQuery}
                  onChange={e => setResSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    borderRadius: 8,
                    background: 'var(--black-3)',
                    border: '1px solid var(--black-5)',
                    color: '#ffffff',
                    fontSize: 12.5,
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                />
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, pointerEvents: 'none' }}>🔍</span>
                {resSearchQuery && (
                  <button
                    onClick={() => setResSearchQuery('')}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 12 }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>CODE RÉSERV.</th>
                    <th>CLIENT</th>
                    <th>VÉHICULE</th>
                    <th>DATES</th>
                    <th>JOURS</th>
                    <th style={{ textAlign: 'center' }}>ALT.</th>
                    <th>TOTAL TTC</th>
                    <th>PAYÉ</th>
                    <th>SOLDE</th>
                    <th>STATUT PAIE</th>
                    <th>STATUT</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.length === 0 && (
                    <tr>
                      <td colSpan={12} style={{ textAlign: 'center', color: 'var(--white-30)', padding: 32 }}>
                        {resSearchQuery ? 'Aucune réservation ne correspond à votre recherche.' : 'Aucune réservation.'}
                      </td>
                    </tr>
                  )}
                  {filteredReservations.map(r => {
                    const code = `#GSC-${r._id?.slice(-6).toUpperCase()}`
                    return (
                      <tr key={r._id} className="admin-table__row">
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              color: '#d4a017',
                              background: 'rgba(212, 160, 23, 0.15)',
                              border: '1px solid rgba(212, 160, 23, 0.4)',
                              borderRadius: 5,
                              padding: '3px 8px',
                              fontSize: 12,
                              letterSpacing: '0.5px',
                            }}>
                              {code}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(code)
                                alert(`Code ${code} copié !`)
                              }}
                              style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 12 }}
                              title="Copier le code"
                            >
                              📋
                            </button>
                          </div>
                        </td>
                        <td>
                          <div className="admin-table__car-name">{r.user?.firstName} {r.user?.lastName}</div>
                          <div className="admin-table__car-year">{r.user?.email}</div>
                        </td>
                        <td>
                          <div className="admin-table__car-name">{r.vehicle?.name || '—'}</div>
                          <div className="admin-table__car-year">{r.vehicle?.plate}</div>
                        </td>
                        <td style={{ fontSize: 11.5, color: 'var(--white-50)' }}>
                          {fmtDate(r.pickupDate)}<br/>{fmtDate(r.dropoffDate)}
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--white)' }}>{r.totalDays}</td>
                         <td style={{ textAlign: 'center', fontSize: 18, lineHeight: 1 }}>
                           {r.acceptAlternative
                             ? <span title="Accepte un véhicule similaire" style={{ color: '#22c55e', fontWeight: 700 }}>✓</span>
                             : <span title="N'accepte pas de remplacement" style={{ color: '#ef4444', fontWeight: 700 }}>✕</span>
                           }
                         </td>
                        <td style={{ fontWeight: 700, color: 'var(--white)' }}>{fmtMoney(r.totalTTC)}</td>
                        <td style={{ color: 'var(--gold)', fontWeight: 700 }}>{fmtMoney(r.amountPaid)}</td>
                        <td style={{ color: r.remainingBalance > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>{fmtMoney(r.remainingBalance)}</td>
                        <td><PayBadge status={r.paymentStatus}/></td>
                        <td><ResBadge status={r.status}/></td>
                        <td>
                          <div className="admin-table__actions">
                            <button className="admin-table__action" onClick={() => setStatusModal(r)}>
                              <FiEdit2 size={12}/> Gérer
                            </button>
                            <button
                              className="admin-table__action admin-table__action--danger"
                              onClick={() => requestDeleteReservation(r)}
                              title="Supprimer la réservation"
                            >
                              <FiTrash2 size={12}/> Suppr.
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ CALENDAR TAB ══════════ */}
      {activeTab === 'calendar' && (
        <div className="dash-layout">
          <div className="dash-main">
            <div className="admin-card" style={{ overflow: 'hidden' }}>

              {/* ── Header ── */}
              <div className="admin-card__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiCalendar size={15} color="var(--gold)"/>
                  <h3 className="admin-card__title">
                    Disponibilités
                    <span style={{ fontWeight: 400, color: 'var(--white-30)', fontSize: 12, marginLeft: 8 }}>
                      {DAYS[0]?.date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} – {DAYS[DAYS.length-1]?.date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </h3>
                  {calLoading && <span className="admin-spinner" style={{ marginLeft: 6 }}/>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button className="admin-btn admin-btn--outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setCalOffset(o => o - 7)}>← Préc.</button>
                  <button className="admin-btn admin-btn--outline" style={{ padding: '4px 10px', fontSize: 12, opacity: calOffset === 0 ? 0.4 : 1 }} onClick={() => setCalOffset(0)} disabled={calOffset === 0}>Aujourd'hui</button>
                  <button className="admin-btn admin-btn--outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setCalOffset(o => o + 7)}>Suiv. →</button>
                  <button className="admin-btn admin-btn--outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={loadCalendarData} title="Actualiser"><FiRefreshCw size={12}/></button>
                </div>
              </div>

              {/* ── Legend ── */}
              <div style={{ display: 'flex', gap: 20, padding: '6px 16px 10px', borderBottom: '1px solid var(--black-5)', flexWrap: 'wrap' }}>
                {[
                  { color: '#4ade80', label: 'Disponible' },
                  { color: '#f97316', label: 'En attente' },
                  { color: '#f87171', label: 'Loué (confirmé)' },
                  { color: '#6b7280', label: 'Maintenance / Inactif' },
                ].map(({ color, label }) => (
                  <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--white-50)' }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }}/>
                    {label}
                  </span>
                ))}
              </div>

              {/* ── Loading skeleton ── */}
              {calLoading && calData.vehicles.length === 0 && (
                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[...Array(6)].map((_, i) => <div key={i} className="sr-skeleton" style={{ height: 52, borderRadius: 6 }}/>)}
                </div>
              )}

              {/* ── Grid ── */}
              {(!calLoading || calData.vehicles.length > 0) && (
              <div className="admin-avail-grid">

                {/* Header row */}
                <div className="admin-avail-row admin-avail-row--header">
                  <div className="admin-avail-row__car-col">
                    <span style={{ fontSize: 10, color: 'var(--white-30)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Véhicule</span>
                  </div>
                  {DAYS.map(d => {
                    const parts = d.date.toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase()
                    const dateNum = d.date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
                    return (
                      <div
                        key={d.label}
                        className="admin-avail-row__day"
                        style={{
                          flexDirection: 'column',
                          gap: 1,
                          background: d.isToday ? 'rgba(249,115,22,0.18)' : undefined,
                          color: d.isToday ? '#f97316' : d.isPast ? 'var(--white-20)' : 'var(--white-50)',
                          borderRadius: d.isToday ? '4px 4px 0 0' : undefined,
                        }}
                      >
                        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.5 }}>{parts}</span>
                        <span style={{ fontSize: 10, fontWeight: d.isToday ? 700 : 500 }}>{dateNum}</span>
                        {d.isToday && <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#f97316', marginTop: 1 }}/>}
                      </div>
                    )
                  })}
                </div>

                {/* Vehicle rows — from calData.vehicles */}
                {calData.vehicles.map(v => (
                  <div key={v._id} className="admin-avail-row" style={{ opacity: v.isActive ? 1 : 0.45 }}>
                    <div className="admin-avail-row__car-col">
                      <div className="admin-avail-row__car-img">
                        {v.images?.[0] ? <img src={v.images[0]} alt={v.name}/> : <span style={{ fontSize: 16 }}>🚗</span>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                        <span className="admin-avail-row__car-name">{v.name}</span>
                        {!v.isActive
                          ? <span style={{ fontSize: 9, color: '#f87171', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>Inactif</span>
                          : v.status === 'Maintenance'
                            ? <span style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>Maintenance</span>
                            : null
                        }
                      </div>
                    </div>

                    {DAYS.map(d => {
                      const { state, res } = dayStatus(v, calData.reservations, d.date)
                      const COLOR = {
                        ok:          { bg: 'transparent',            dot: '#4ade80', title: 'Disponible' },
                        pending:     { bg: 'rgba(249,115,22,0.09)',  dot: '#f97316', title: `En attente — ${res?.user?.firstName ?? ''} ${res?.user?.lastName ?? ''}`.trim() || 'En attente' },
                        booked:      { bg: 'rgba(248,113,113,0.09)', dot: '#f87171', title: `Loué — ${res?.user?.firstName ?? ''} ${res?.user?.lastName ?? ''}`.trim() || 'Loué' },
                        maintenance: { bg: 'rgba(107,114,128,0.07)', dot: '#6b7280', title: v.status || 'Maintenance' },
                      }
                      const c = COLOR[state]
                      return (
                        <div
                          key={d.label}
                          className="admin-avail-row__day"
                          title={c.title}
                          style={{
                            background: d.isToday ? (state === 'ok' ? 'rgba(249,115,22,0.05)' : c.bg) : c.bg,
                            borderLeft: d.isToday ? '2px solid rgba(249,115,22,0.35)' : undefined,
                            cursor: res ? 'pointer' : 'default',
                          }}
                          onClick={() => res && setStatusModal(res)}
                        >
                          {state === 'ok' && (
                            <span className="avail-icon avail-icon--ok">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.dot} strokeWidth="2.8"><polyline points="20 6 9 17 4 12"/></svg>
                            </span>
                          )}
                          {state === 'pending' && (
                            <span className="avail-icon avail-icon--pending">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.dot} strokeWidth="2.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
                            </span>
                          )}
                          {state === 'booked' && (
                            <span className="avail-icon avail-icon--unavailable">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.dot} strokeWidth="2.5"><circle cx="12" cy="12" r="9"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                            </span>
                          )}
                          {state === 'maintenance' && (
                            <span className="avail-icon" style={{ background: 'rgba(107,114,128,0.12)' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.dot} strokeWidth="2.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
              )}

              {/* ── Footer: live from calData ── */}
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--black-5)', display: 'flex', gap: 20, fontSize: 11, color: 'var(--white-50)' }}>
                <span>🚗 {calData.vehicles.length} véhicules</span>
                <span style={{ color: '#4ade80' }}>✓ {calData.vehicles.filter(v => v.status === 'Disponible' && v.isActive).length} disponibles</span>
                <span style={{ color: '#f97316' }}>⏳ {calData.reservations.filter(r => r.status === 'pending').length} en attente cette semaine</span>
                <span style={{ color: '#f87171' }}>🔴 {calData.reservations.filter(r => r.status === 'confirmed').length} confirmées cette semaine</span>
              </div>
            </div>
          </div>

          {/* ── Sidebar: upcoming reservations ── */}
          <div className="dash-side">
            <div className="admin-card">
              <div className="admin-card__header">
                <h3 className="admin-card__title">Prochaines réservations</h3>
              </div>
              <div className="admin-reservations">
                {upcomingRes.length === 0
                  ? <p style={{ textAlign: 'center', color: 'var(--white-30)', fontSize: 13, padding: '20px 16px' }}>Aucune réservation à venir.</p>
                  : upcomingRes.map(r => {
                      const p = new Date(r.pickupDate)
                      return (
                        <div key={r._id} className="res-item" style={{ cursor: 'pointer' }} onClick={() => setStatusModal(r)}>
                          <div className="res-item__date">
                            <span className="res-item__day">{p.getDate()}</span>
                            <span className="res-item__month">{p.toLocaleString('fr-FR', { month: 'short' }).toUpperCase()}</span>
                          </div>
                          <div className="res-item__info">
                            <div className="res-item__top">
                              <span className="res-item__client">{r.user?.firstName} {r.user?.lastName}</span>
                              <ResBadge status={r.status}/>
                            </div>
                            <span className="res-item__car">{r.vehicle?.name}</span>
                            <span className="res-item__dates">{fmtDate(r.pickupDate)} → {fmtDate(r.dropoffDate)}</span>
                          </div>
                        </div>
                      )
                    })
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODALS ══════════ */}

      {/* ══════════ PARCS TAB ══════════ */}
      {activeTab === 'parcs' && (
        <div className="admin-full">
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
            <div>
              <h2 style={{ fontSize:22, fontWeight:700, color:'var(--white)', margin:0 }}>Affectation des Véhicules par Parc</h2>
              <p style={{ fontSize:13, color:'var(--white-50)', margin:'4px 0 0' }}>
                {multiParcMode
                  ? 'Sélectionnez les véhicules puis choisissez les parcs cibles'
                  : 'Glissez-déposez les véhicules pour les affecter à un parc'}
              </p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {/* Multi-Parc Mode Toggle */}
              <div className={`parc-multimode-toggle ${multiParcMode ? 'parc-multimode-toggle--active' : ''}`}>
                <span className="parc-multimode-toggle__icon">🔀</span>
                <span className="parc-multimode-toggle__label">Multi-Parc</span>
                <Toggle active={multiParcMode} onChange={handleToggleMultiParcMode} />
              </div>
              <button className="admin-btn admin-btn--primary" onClick={() => setParcModal('add')}>
                <FiPlus size={14}/> Nouveau Parc
              </button>
            </div>
          </div>

          {/* Multi-parc mode hint banner */}
          {multiParcMode && (
            <div className="parc-multimode-hint">
              <span>💡</span>
              <span>
                <strong>Mode Multi-Parc activé</strong> — Cochez les véhicules, sélectionnez les parcs dans la barre d'action, puis cliquez « Appliquer ».
                Un même véhicule peut apparaître dans plusieurs parcs.
              </span>
            </div>
          )}

          {/* Columns */}
          <div className="parc-board">
            {/* Unassigned column */}
            <div
              className={`parc-col parc-col--unassigned ${!multiParcMode && dragOverParc === 'unassigned' ? 'parc-col--drag-over' : ''}`}
              {...(!multiParcMode ? {
                onDragOver: e => { e.preventDefault(); setDragOverParc('unassigned') },
                onDragLeave: () => setDragOverParc(null),
                onDrop: async () => {
                  setDragOverParc(null)
                  if (!draggedVehicle) return
                  try {
                    await vehiclesService.update(draggedVehicle._id, { parcId: null })
                    await loadData()
                  } catch { /* ignore */ }
                  setDraggedVehicle(null)
                }
              } : {})}
            >
              <div className="parc-col__header">
                <span className="parc-col__title">Véhicules non affectés</span>
                <span className="parc-col__badge" style={{ background:'var(--white-10)', color:'var(--white-50)' }}>
                  {vehicles.filter(v => getVehicleParcIds(v).length === 0).length}
                </span>
              </div>
              <div className="parc-col__body">
                {vehicles.filter(v => getVehicleParcIds(v).length === 0).map(v => {
                  const isSelected = selectedVehicles.has(v._id)
                  return (
                    <div
                      key={v._id}
                      className={`parc-vehicle-card ${multiParcMode ? 'parc-vehicle-card--selectable' : ''} ${isSelected ? 'parc-vehicle-card--selected' : ''}`}
                      {...(multiParcMode
                        ? { onClick: () => toggleVehicleSelection(v._id) }
                        : { draggable: true, onDragStart: () => setDraggedVehicle(v), onDragEnd: () => setDraggedVehicle(null) }
                      )}
                    >
                      {multiParcMode && (
                        <span className="parc-vehicle-card__checkbox">
                          <FiCheck size={12} color="#000" />
                        </span>
                      )}
                      {v.images?.[0]
                        ? <img src={v.images[0]} alt={v.name} className="parc-vehicle-card__img" />
                        : <div className="parc-vehicle-card__img parc-vehicle-card__img--placeholder">🚗</div>
                      }
                      <div className="parc-vehicle-card__info">
                        <div className="parc-vehicle-card__name">{v.name}</div>
                        <div className="parc-vehicle-card__sub">{v.year} · {v.seats} places</div>
                      </div>
                      {!multiParcMode && <span className="parc-drag-handle">⠿</span>}
                    </div>
                  )
                })}
                {vehicles.filter(v => getVehicleParcIds(v).length === 0).length === 0 && (
                  <p style={{ fontSize:12, color:'var(--white-30)', textAlign:'center', padding:'20px 0' }}>Tous les véhicules sont affectés</p>
                )}
              </div>
            </div>

            {/* One column per parc */}
            {parcs.map(parc => {
              const parcVehicles = vehicles.filter(v => {
                const pids = getVehicleParcIds(v)
                return pids.some(pid => pid === parc._id)
              })
              return (
                <div
                  key={parc._id}
                  className={`parc-col ${!multiParcMode && dragOverParc === parc._id ? 'parc-col--drag-over' : ''}`}
                  {...(!multiParcMode ? {
                    onDragOver: e => { e.preventDefault(); setDragOverParc(parc._id) },
                    onDragLeave: () => setDragOverParc(null),
                    onDrop: async () => {
                      setDragOverParc(null)
                      if (!draggedVehicle) return
                      try {
                        await vehiclesService.update(draggedVehicle._id, { parcId: parc._id })
                        await loadData()
                      } catch { /* ignore */ }
                      setDraggedVehicle(null)
                    }
                  } : {})}
                >
                  <div className="parc-col__header">
                    <div>
                      <div className="parc-col__title">{parc.name}</div>
                      {parc.city && <div style={{ fontSize:11, color:'var(--white-30)', marginTop:2 }}>{parc.city}</div>}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span className="parc-col__badge">
                        {parcVehicles.length}/{parc.capacity}
                      </span>
                      <button
                        className="admin-btn admin-btn--icon"
                        title="Modifier"
                        onClick={() => setParcModal(parc)}
                        style={{ padding:'4px 6px', fontSize:12 }}
                      ><FiEdit2 size={12}/></button>
                      <button
                        className="admin-btn admin-btn--icon admin-btn--danger"
                        title="Supprimer"
                        onClick={async () => {
                          if (!confirm(`Supprimer le parc "${parc.name}" ?`)) return
                          await parcsService.remove(parc._id)
                          await loadData()
                        }}
                        style={{ padding:'4px 6px', fontSize:12 }}
                      ><FiTrash2 size={12}/></button>
                    </div>
                  </div>

                  <div className="parc-col__drop-zone">
                    {!multiParcMode && <span className="parc-drop-label">Drop Zone</span>}
                    {parcVehicles.map(v => {
                      const isSelected = selectedVehicles.has(v._id)
                      const multiCount = getVehicleParcIds(v).length
                      return (
                        <div
                          key={v._id}
                          className={`parc-vehicle-card parc-vehicle-card--assigned ${multiParcMode ? 'parc-vehicle-card--selectable' : ''} ${isSelected ? 'parc-vehicle-card--selected' : ''}`}
                          {...(multiParcMode
                            ? { onClick: () => toggleVehicleSelection(v._id) }
                            : { draggable: true, onDragStart: () => setDraggedVehicle(v), onDragEnd: () => setDraggedVehicle(null) }
                          )}
                        >
                          {multiParcMode && (
                            <span className="parc-vehicle-card__checkbox">
                              <FiCheck size={12} color="#000" />
                            </span>
                          )}
                          {v.images?.[0]
                            ? <img src={v.images[0]} alt={v.name} className="parc-vehicle-card__img" />
                            : <div className="parc-vehicle-card__img parc-vehicle-card__img--placeholder">🚗</div>
                          }
                          <div className="parc-vehicle-card__info">
                            <div className="parc-vehicle-card__name">{v.name}</div>
                            <div className="parc-vehicle-card__sub">{v.year} · {v.seats} places</div>
                          </div>
                          {multiCount > 1 && (
                            <span className="parc-vehicle-card__multi-badge">{multiCount} parcs</span>
                          )}
                          {!multiParcMode && <span className="parc-vehicle-card__dot" />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Floating Drop zone to unassign (only in normal mode) */}
            {!multiParcMode && draggedVehicle?.parc && (
              <div
                className={`parc-col--unassign-drop ${dragOverParc === 'unassign' ? 'parc-col--drag-over' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOverParc('unassign') }}
                onDragLeave={() => setDragOverParc(null)}
                onDrop={async () => {
                  setDragOverParc(null)
                  if (!draggedVehicle) return
                  try {
                    await vehiclesService.update(draggedVehicle._id, { parcId: null })
                    await loadData()
                  } catch { /* ignore */ }
                  setDraggedVehicle(null)
                }}
              >
                <FiTrash2 size={24} color="#ef4444" />
                <span style={{ fontSize:13, fontWeight:700, color:'#ef4444', textAlign:'center' }}>
                  Désaffecter du parc
                </span>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)', textAlign:'center' }}>
                  Glissez ici pour retirer
                </span>
              </div>
            )}
          </div>

          {/* ── Multi-Parc Floating Action Bar ── */}
          <div className={`parc-action-bar ${multiParcMode && selectedVehicles.size > 0 ? 'parc-action-bar--visible' : ''}`}>
            <span className="parc-action-bar__count">
              {selectedVehicles.size} véhicule{selectedVehicles.size > 1 ? 's' : ''} sélectionné{selectedVehicles.size > 1 ? 's' : ''}
            </span>
            <div className="parc-action-bar__sep" />
            <div className="parc-checklist">
              {parcs.map(p => {
                const checked = targetParcs.has(p._id)
                return (
                  <div
                    key={p._id}
                    className={`parc-checklist__item ${checked ? 'parc-checklist__item--checked' : ''}`}
                    onClick={() => toggleTargetParc(p._id)}
                  >
                    <span className="parc-checklist__check">
                      {checked && <FiCheck size={10} color="#000" />}
                    </span>
                    {p.name}
                  </div>
                )
              })}
            </div>
            <div className="parc-action-bar__sep" />
            <button
              className="parc-action-bar__btn parc-action-bar__btn--apply"
              disabled={targetParcs.size === 0 || applyingMultiParc}
              onClick={applyMultiParcAssignment}
            >
              {applyingMultiParc ? '⏳ Application...' : '✅ Appliquer'}
            </button>
            <button
              className="parc-action-bar__btn parc-action-bar__btn--unassign"
              onClick={async () => {
                setApplyingMultiParc(true)
                try {
                  await Promise.all(
                    Array.from(selectedVehicles).map(vId =>
                      vehiclesService.assignToParcs(vId, [])
                    )
                  )
                  clearMultiParcSelection()
                  await loadData()
                } catch (e) {
                  alert('Erreur: ' + (e?.message || 'erreur inconnue'))
                } finally { setApplyingMultiParc(false) }
              }}
              disabled={applyingMultiParc}
            >
              🗑️ Désaffecter
            </button>
            <button
              className="parc-action-bar__btn parc-action-bar__btn--clear"
              onClick={clearMultiParcSelection}
            >
              ✕ Annuler
            </button>
          </div>

          {/* Stats bar */}
          <div className="parc-stats">
            <div className="parc-stat">
              <span className="parc-stat__icon">🚗</span>
              <div><div className="parc-stat__val">{vehicles.length}</div><div className="parc-stat__label">Total Véhicules</div></div>
            </div>
            <div className="parc-stat">
              <span className="parc-stat__icon">✅</span>
              <div><div className="parc-stat__val">{vehicles.filter(v => getVehicleParcIds(v).length > 0).length}</div><div className="parc-stat__label">Véhicules Affectés</div></div>
            </div>
            <div className="parc-stat">
              <span className="parc-stat__icon">⏳</span>
              <div><div className="parc-stat__val">{vehicles.filter(v => getVehicleParcIds(v).length === 0).length}</div><div className="parc-stat__label">Non Affectés</div></div>
            </div>
            <div className="parc-stat">
              <span className="parc-stat__icon">🔀</span>
              <div><div className="parc-stat__val">{vehicles.filter(v => getVehicleParcIds(v).length > 1).length}</div><div className="parc-stat__label">Multi-Parc</div></div>
            </div>
            <div className="parc-stat">
              <span className="parc-stat__icon">🏢</span>
              <div><div className="parc-stat__val">{parcs.length}</div><div className="parc-stat__label">Parcs actifs</div></div>
            </div>
          </div>
        </div>
      )}
      {/* ══════════ PARC MODAL ══════════ */}
      {parcModal && (
        <ParcModal
          parc={parcModal === 'add' ? null : parcModal}
          onClose={() => setParcModal(null)}
          onSaved={async () => { setParcModal(null); await loadData() }}
        />
      )}

      {vehicleModal && (
        <VehicleModal
          vehicle={vehicleModal === 'add' ? null : vehicleModal}
          onClose={() => setVehicleModal(null)}
          onSaved={handleSaved}
        />
      )}
      {historyModal && (
        <HistoryModal
          vehicle={historyModal}
          onClose={() => setHistoryModal(null)}
        />
      )}
      {statusModal && (
        <StatusModal
          reservation={statusModal}
          allReservations={allReservations}
          onClose={() => setStatusModal(null)}
          onSaved={() => { setStatusModal(null); loadData() }}
          onRequestDelete={requestDeleteReservation}
        />
      )}
      {deleteReservation && (
        <ConfirmDeleteReservationModal
          reservation={deleteReservation}
          deleting={deletingRes}
          onCancel={() => !deletingRes && setDeleteReservation(null)}
          onConfirm={handleDeleteReservation}
        />
      )}
      {toast && (
        <div className={`admin-toast admin-toast--${toast.type}`} role="status">
          {toast.type === 'success' ? <FiCheck size={16}/> : <FiAlertCircle size={16}/>}
          <span>{toast.message}</span>
          <button type="button" className="admin-toast__close" onClick={() => setToast(null)} aria-label="Fermer">
            <FiX size={14}/>
          </button>
        </div>
      )}
    </div>
  )
}

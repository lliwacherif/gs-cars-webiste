import { Link } from 'react-router-dom'
import { FiGrid } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import './AdminStrip.css'

export default function AdminStrip() {
  const { user } = useAuth()
  const { t } = useLanguage()

  if (!user || user.role !== 'admin') return null

  return (
    <div className="admin-strip">
      <span className="admin-strip__label">
        🛡️ {t('nav.modeAdmin', 'Mode Administrateur')}
      </span>
      <div className="admin-strip__actions">
        <Link to="/admin" className="admin-strip__link">
          <FiGrid size={12} /> {t('nav.tableauDeBord', 'Tableau de bord')}
        </Link>
        <span className="admin-strip__sep">|</span>
        <Link to="/voitures" className="admin-strip__link">
          {t('nav.voirSiteClient', 'Voir le site client')} →
        </Link>
      </div>
    </div>
  )
}

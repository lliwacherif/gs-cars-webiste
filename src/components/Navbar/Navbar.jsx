import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { FiUser, FiPhone, FiChevronDown, FiMenu, FiX, FiLogOut, FiGrid, FiClock } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import CurrencyToggle from '../CurrencyToggle/CurrencyToggle'
import { brandLogo, BRAND_NAME, BRAND_PHONES } from '../../brand'
import './Navbar.css'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)
  const { user, openAuthModal, logout } = useAuth()
  const { lang, setLanguage, t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const langRef = useRef(null)
  const isAdmin = user?.role === 'admin'

  const navLinks = [
    { key: 'accueil',     href: '/',             label: t('nav.accueil', 'Accueil') },
    { key: 'voitures',    href: '/voitures',     label: t('nav.voitures', 'Voitures') },
    { key: 'guide',       href: '/guide',        label: t('nav.guide', 'Guide') },
    { key: 'contact',     href: '/contact',      label: t('nav.contact', 'À Propos') },
  ]

  // Close language dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="navbar">
      <div className="navbar__inner container">
        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <img src={brandLogo} alt={BRAND_NAME} className="navbar__logo-img" />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="navbar__nav">
          {navLinks.map(link => (
            <Link
              key={link.key}
              to={link.href}
              className={`navbar__link ${location.pathname === link.href ? 'navbar__link--active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="navbar__actions">
          {/* Currency Toggle */}
          <CurrencyToggle />

          {/* Language Selector Dropdown */}
          <div className="navbar__lang-wrap" ref={langRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="navbar__lang"
              onClick={() => setLangDropdownOpen(prev => !prev)}
              style={{ display: 'flex', alignItems: 'center', gap: 7 }}
            >
              <img
                src={lang === 'ar' ? '/Ar.png' : '/Fr.png'}
                alt={lang}
                style={{ width: 20, height: 14, objectFit: 'cover', borderRadius: 2 }}
              />
              <span>{lang === 'ar' ? 'العربية' : 'Français'}</span>
              <FiChevronDown size={13} style={{ transform: langDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {langDropdownOpen && (
              <div
                className="navbar__lang-dropdown"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  background: '#18181c',
                  border: '1px solid rgba(212, 160, 23, 0.3)',
                  borderRadius: 8,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                  zIndex: 200,
                  overflow: 'hidden',
                  minWidth: 140,
                }}
              >
                <button
                  type="button"
                  className={`navbar__lang-opt ${lang === 'fr' ? 'active' : ''}`}
                  onClick={() => { setLanguage('fr'); setLangDropdownOpen(false) }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '9px 14px',
                    border: 'none',
                    background: lang === 'fr' ? 'rgba(212,160,23,0.15)' : 'transparent',
                    color: '#ffffff',
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <img src="/Fr.png" alt="Français" style={{ width: 20, height: 14, objectFit: 'cover', borderRadius: 2 }} />
                  <span>Français</span>
                </button>
                <button
                  type="button"
                  className={`navbar__lang-opt ${lang === 'ar' ? 'active' : ''}`}
                  onClick={() => { setLanguage('ar'); setLangDropdownOpen(false) }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '9px 14px',
                    border: 'none',
                    background: lang === 'ar' ? 'rgba(212,160,23,0.15)' : 'transparent',
                    color: '#ffffff',
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <img src="/Ar.png" alt="العربية" style={{ width: 20, height: 14, objectFit: 'cover', borderRadius: 2 }} />
                  <span>العربية</span>
                </button>
              </div>
            )}
          </div>

          {user ? (
            <div className="navbar__user-menu">
              {isAdmin && (
                <Link to="/admin" className="navbar__admin-badge">
                  <FiGrid size={13} /> {t('nav.admin', 'Admin')}
                </Link>
              )}
              {!isAdmin && (
                <Link
                  to="/historique"
                  className="navbar__admin-badge"
                  title={t('nav.historique', 'Historique')}
                  style={{ gap: 5 }}
                >
                  <FiClock size={13} /> {t('nav.historique', 'Historique')}
                </Link>
              )}
              <span className="navbar__user-name">
                <FiUser size={15} /> {user.firstName}
              </span>
              <button
                className="navbar__user navbar__user--logout"
                onClick={handleLogout}
                title={t('nav.logout', 'Déconnexion')}
              >
                <FiLogOut size={16} />
              </button>
            </div>
          ) : null}

          <a href={BRAND_PHONES.bureau.href} className="navbar__phone">
            <FiPhone size={14} />
            <span>{BRAND_PHONES.bureau.display}</span>
          </a>
        </div>

        {!user && (
          <button type="button" className="navbar__user navbar__login-btn" onClick={() => openAuthModal('login')} title={t('nav.login', 'Se connecter')} aria-label={t('nav.login', 'Se connecter')}>
            <FiUser size={17} />
          </button>
        )}

        {/* Mobile Hamburger */}
        <button type="button" className="navbar__hamburger" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
          {mobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="navbar__mobile">
          <div className="navbar__mobile-tools">
            <CurrencyToggle />
            <div className="navbar__mobile-langs">
              <button
                type="button"
                className={`navbar__mobile-lang ${lang === 'fr' ? 'navbar__mobile-lang--active' : ''}`}
                onClick={() => setLanguage('fr')}
              >
                <img src="/Fr.png" alt="" style={{ width: 20, height: 14, objectFit: 'cover', borderRadius: 2 }} />
                Français
              </button>
              <button
                type="button"
                className={`navbar__mobile-lang ${lang === 'ar' ? 'navbar__mobile-lang--active' : ''}`}
                onClick={() => setLanguage('ar')}
              >
                <img src="/Ar.png" alt="" style={{ width: 20, height: 14, objectFit: 'cover', borderRadius: 2 }} />
                العربية
              </button>
            </div>
          </div>
          {(isAdmin
            ? [{ key: 'admin', label: t('nav.tableauDeBord', 'Dashboard'), href: '/admin' }, ...navLinks]
            : [...navLinks, { key: 'historique', label: `🕐 ${t('nav.historique', 'Historique')}`, href: '/historique' }]
          ).map(link => (
            <Link
              key={link.key}
              to={link.href}
              className="navbar__mobile-link"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <button
              type="button"
              className="navbar__mobile-link navbar__mobile-link--btn"
              onClick={() => { handleLogout(); setMobileOpen(false) }}
            >
              <FiLogOut size={14} /> {t('nav.logout', 'Déconnexion')}
            </button>
          ) : (
            <button
              type="button"
              className="navbar__mobile-link navbar__mobile-link--btn"
              onClick={() => { setMobileOpen(false); openAuthModal('login') }}
            >
              <FiUser size={14} /> {t('nav.login', 'Se connecter')}
            </button>
          )}
          <a href={BRAND_PHONES.bureau.href} className="navbar__mobile-phone">
            <FiPhone size={14} /> Bureau {BRAND_PHONES.bureau.display}
          </a>
          <a href={BRAND_PHONES.whatsapp.href} className="navbar__mobile-phone" target="_blank" rel="noreferrer">
            WhatsApp {BRAND_PHONES.whatsapp.display}
          </a>
          <a href={BRAND_PHONES.mobile.href} className="navbar__mobile-phone">
            <FiPhone size={14} /> {BRAND_PHONES.mobile.display}
          </a>
        </div>
      )}
    </header>
  )
}

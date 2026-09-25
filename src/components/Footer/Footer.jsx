import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiPhone, FiMail, FiSend, FiFacebook, FiInstagram, FiLinkedin, FiTwitter } from 'react-icons/fi'
import { useLanguage } from '../../context/LanguageContext'
import { brandLogo, BRAND_NAME, BRAND_EMAIL, BRAND_EMAIL_LABEL, BRAND_PHONES } from '../../brand'
import './Footer.css'

const YEAR = new Date().getFullYear()

export default function Footer() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const { t } = useLanguage()

  const handleNewsletter = (e) => {
    e.preventDefault()
    if (!email) return
    setSent(true)
    setEmail('')
    setTimeout(() => setSent(false), 4000)
  }

  const infoList = [
    t('footer.terms', 'Conditions générales'),
    t('footer.privacy', 'Politique de confidentialité'),
    t('footer.faq', 'FAQ'),
    t('footer.guide', 'Guide de location'),
  ]

  return (
    <footer className="footer">
      <div className="footer__top container">
        {/* Brand column */}
        <div className="footer__col footer__col--brand">
          <Link to="/" className="footer__logo">
            <img src={brandLogo} alt={BRAND_NAME} className="footer__logo-img" />
          </Link>
          <p className="footer__brand-desc">
            {t('footer.brandDesc', 'Votre partenaire de confiance pour la location de voitures en Tunisie.')}
          </p>
          <div className="footer__socials">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="footer__social" aria-label="Facebook"><FiFacebook size={16} /></a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="footer__social" aria-label="Instagram"><FiInstagram size={16} /></a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="footer__social" aria-label="Twitter"><FiTwitter size={16} /></a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="footer__social" aria-label="LinkedIn"><FiLinkedin size={16} /></a>
          </div>
        </div>

        {/* Liens utiles */}
        <div className="footer__col">
          <h4 className="footer__col-title">{t('footer.usefulLinks', 'Liens utiles')}</h4>
          <ul className="footer__links">
            <li><Link to="/" className="footer__link">{t('footer.home', 'Accueil')}</Link></li>
            <li><Link to="/voitures" className="footer__link">{t('footer.cars', 'Voitures')}</Link></li>
            <li><Link to="/voitures?sortBy=pricePerDay&sortOrder=asc" className="footer__link">{t('footer.offers', 'Offres spéciales')}</Link></li>
            <li><Link to="/voitures" className="footer__link">{t('footer.allCategories', 'Toutes les catégories')}</Link></li>
          </ul>
        </div>

        {/* Informations */}
        <div className="footer__col">
          <h4 className="footer__col-title">{t('footer.information', 'Informations')}</h4>
          <ul className="footer__links">
            {infoList.map(l => (
              <li key={l}><span className="footer__link footer__link--text">{l}</span></li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div className="footer__col">
          <h4 className="footer__col-title">{t('footer.contact', 'Contact')}</h4>
          <ul className="footer__contact-list">
            <li className="footer__contact-item" style={{ alignItems: 'flex-start' }}>
              <FiPhone size={13} style={{ marginTop: 3 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <a href={BRAND_PHONES.bureau.href} className="footer__link">Bureau {BRAND_PHONES.bureau.display}</a>
                <a href={BRAND_PHONES.whatsapp.href} className="footer__link" target="_blank" rel="noreferrer">WhatsApp {BRAND_PHONES.whatsapp.display}</a>
                <a href={BRAND_PHONES.mobile.href} className="footer__link">{BRAND_PHONES.mobile.display}</a>
              </div>
            </li>
            <li className="footer__contact-item">
              <FiMail size={13} />
              <a href={`mailto:${BRAND_EMAIL}`} className="footer__link" dir="ltr">{BRAND_EMAIL_LABEL}</a>
            </li>
          </ul>
        </div>

        {/* Newsletter */}
        <div className="footer__col">
          <h4 className="footer__col-title">{t('footer.newsletter', 'Newsletter')}</h4>
          <p className="footer__newsletter-desc">{t('footer.newsletterDesc', 'Recevez nos offres et actualités')}</p>
          {sent ? (
            <p style={{ color: '#4ade80', fontSize: 13, marginTop: 8 }}>{t('footer.subscribedMsg', '✓ Merci, vous êtes abonné !')}</p>
          ) : (
            <form className="footer__newsletter" onSubmit={handleNewsletter}>
              <input
                type="email"
                className="footer__newsletter-input"
                placeholder={t('footer.emailPlaceholder', 'Votre email')}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="footer__newsletter-btn" aria-label={t('footer.subscribeBtn', "S'abonner")}>
                <FiSend size={14} />
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container">
          <p className="footer__copyright">© {YEAR} {BRAND_NAME}. {t('footer.copyright', 'Tous droits réservés.')}</p>
        </div>
      </div>
    </footer>
  )
}

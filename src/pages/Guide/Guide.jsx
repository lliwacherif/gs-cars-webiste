import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiChevronDown } from 'react-icons/fi'
import Navbar from '../../components/Navbar/Navbar'
import AdminStrip from '../../components/AdminStrip/AdminStrip'
import Footer from '../../components/Footer/Footer'
import { useLanguage } from '../../context/LanguageContext'
import './Guide.css'

export default function Guide() {
  const [activeFaq, setActiveFaq] = useState(0)
  const rowsRef = useRef([])
  const { t } = useLanguage()

  const steps = [
    {
      step: '01',
      badge: t('guide.step1Badge', '0 TND Débité'),
      badgeColor: '#3b82f6',
      title: t('guide.step1Title', '1. Choisissez votre voiture & Réservez'),
      desc: t('guide.step1Desc', 'Parcourez notre flotte de véhicules disponibles, choisissez vos dates et sélectionnez vos agences de départ et d\'arrivée. Aucun centime n\'est prélevé à cette étape.'),
      img: '/guide_car_selection.png',
    },
    {
      step: '02',
      badge: t('guide.step2Badge', 'Vérification rapide'),
      badgeColor: '#d4a017',
      title: t('guide.step2Title', '2. Validation par notre équipe & Notification'),
      desc: t('guide.step2Desc', 'Notre équipe vérifie la disponibilité exacte et valide votre profil client. Dès approbation, la réservation passe en statut En attente ⏳. Vous recevez un e-mail avec votre code unique #GSC-XXXXXX.'),
      img: '/guide_approval_notification.png',
    },
    {
      step: '03',
      badge: t('guide.step3Badge', 'Paiement en Agence'),
      badgeColor: '#fbbf24',
      title: t('guide.step3Title', '3. Rendez-vous en agence avec votre code'),
      desc: t('guide.step3Desc', 'Présentez-vous dans l\'une de nos agences muni(e) de votre code de réservation #GSC-XXXXXX. Réglez l\'acompte requis (ou la totalité) en espèces ou par carte bancaire.'),
      img: '/guide_agency_payment.png',
    },
    {
      step: '04',
      badge: t('guide.step4Badge', 'Véhicule Bloqué'),
      badgeColor: '#4ade80',
      title: t('guide.step4Title', '4. Validation & Prise des clés'),
      desc: t('guide.step4Desc', 'Dès le règlement de l\'acompte en agence, l\'agent valide votre réservation en statut Confirmée ✅. Votre véhicule est officiellement bloqué pour vos dates et les clés vous sont remises !'),
      img: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
    },
  ]

  const statusList = [
    {
      key: 'recu',
      badge: `📥 ${t('historique.statusRecu', 'Reçu')}`,
      color: '#60a5fa',
      bg: 'rgba(59, 130, 246, 0.08)',
      border: 'rgba(59, 130, 246, 0.3)',
      title: t('guide.recuTitle', 'Demande reçue'),
      text: t('guide.recuText', 'Demande enregistrée sur le site. Notre équipe vérifie vos données et votre permis.'),
    },
    {
      key: 'pending',
      badge: `⏳ ${t('historique.statusPending', 'En attente')}`,
      color: '#fbbf24',
      bg: 'rgba(212, 160, 23, 0.08)',
      border: 'rgba(212, 160, 23, 0.35)',
      title: t('guide.approvedTitle', 'Réservation Approuvée'),
      text: t('guide.approvedText', 'Approuvée ! Apportez votre code #GSC-XXXXXX et l\'acompte requis en agence.'),
    },
    {
      key: 'confirmed',
      badge: `✅ ${t('historique.statusConfirmed', 'Confirmée')}`,
      color: '#4ade80',
      bg: 'rgba(34, 197, 94, 0.08)',
      border: 'rgba(34, 197, 94, 0.35)',
      title: t('guide.confirmedTitle', 'Véhicule Verrouillé'),
      text: t('guide.confirmedText', 'Acompte versé en agence. Le véhicule est bloqué et prêt pour votre départ.'),
    },
    {
      key: 'completed',
      badge: `🏁 ${t('historique.statusCompleted', 'Terminée')}`,
      color: '#c084fc',
      bg: 'rgba(168, 85, 247, 0.08)',
      border: 'rgba(168, 85, 247, 0.35)',
      title: t('guide.completedTitle', 'Location Effectuée'),
      text: t('guide.completedText', 'Restitution du véhicule enregistrée, kilométrage vérifié et solde réglé.'),
    },
    {
      key: 'cancelled',
      badge: `❌ ${t('historique.statusCancelled', 'Annulée')}`,
      color: '#f87171',
      bg: 'rgba(239, 68, 68, 0.08)',
      border: 'rgba(239, 68, 68, 0.35)',
      title: t('guide.cancelledTitle', 'Réservation Annulée'),
      text: t('guide.cancelledText', 'Annulation effectuée par le client ou indisponibilité du véhicule.'),
    },
  ]

  const faqs = [
    {
      q: t('guide.faq1Q', 'Est-ce que je paye quelque chose lors de la réservation en ligne ?'),
      a: t('guide.faq1A', 'Absolument rien ! La réservation sur le site web est 100% sans frais immédiats. Vous n\'avez pas besoin d\'entrer de carte bancaire pour effectuer votre demande.'),
    },
    {
      q: t('guide.faq2Q', 'Comment est calculé le montant de mon acompte ?'),
      a: t('guide.faq2A', 'L\'acompte est déterminé par notre agent lors de l\'approbation de votre demande (généralement entre 10% et 50% du montant total). Le montant exact est affiché dans votre compte et vous est envoyé par e-mail.'),
    },
    {
      q: t('guide.faq3Q', 'Que dois-je ramener avec moi à l\'agence ?'),
      a: t('guide.faq3A', 'Il vous suffit de vous présenter avec votre code de réservation (#GSC-XXXXXX), votre permis de conduire original (valide depuis plus de 2 ans) et une pièce d\'identité (ou passeport).'),
    },
    {
      q: t('guide.faq4Q', 'Que faire si le véhicule choisi est indisponible ?'),
      a: t('guide.faq4A', 'Si vous avez coché l\'option "Accepter un véhicule similaire", nous vous attribuerons automatiquement une voiture équivalente de la même catégorie au même prix.'),
    },
  ]

  // Scroll Trigger Observer for Side Slide Animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('guide-row-visible')
          }
        })
      },
      { threshold: 0.15 }
    )

    rowsRef.current.forEach((el) => el && observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return (
    <div className="guide-page">
      <AdminStrip />
      <Navbar />

      <main className="guide-container container">
        {/* Animated Hero Banner */}
        <div className="guide-hero-banner">
          <div className="guide-hero-badge">{t('guide.badge', 'GUIDE PAS À PAS')}</div>
          <h1 className="guide-title">
            {t('guide.titleMain', 'COMMENT ÇA ')}
            <span className="guide-title--gold">{t('guide.titleGold', 'MARCHE ?')}</span>
          </h1>
          <p className="guide-subtitle">
            {t('guide.subtitle', 'Du clic sur notre site jusqu\'à la remise des clés en agence : découvrez notre processus de réservation transparent et sécurisé.')}
          </p>
        </div>

        {/* Step-by-step Visual Timeline */}
        <div className="guide-timeline-container">
          {steps.map((s, index) => (
            <div
              key={index}
              ref={(el) => (rowsRef.current[index] = el)}
              className={`guide-timeline-row ${index % 2 === 1 ? 'guide-timeline-row--reverse' : ''}`}
            >
              {/* Visual Card Image */}
              <div className="guide-timeline-img-card">
                <img src={s.img} alt={s.title} />
                <div className="guide-img-overlay">
                  <span className="guide-step-tag">{s.step}</span>
                </div>
              </div>

              {/* Text Card */}
              <div className="guide-timeline-text-card">
                <div className="guide-timeline-head">
                  <span
                    className="guide-badge-pill"
                    style={{ background: `${s.badgeColor}20`, color: s.badgeColor, border: `1px solid ${s.badgeColor}50` }}
                  >
                    {s.badge}
                  </span>
                </div>

                <h3 className="guide-timeline-title">{s.title}</h3>
                <p className="guide-timeline-desc">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Section 2: Guide des statuts de réservation */}
        <section className="guide-section">
          <div className="guide-section-head">
            <h2>{t('guide.statusSectionTitle', 'Guide des Statuts de Réservation')}</h2>
            <p>{t('guide.statusSectionSub', 'Suivez en temps réel l\'avancement de votre réservation depuis votre espace Historique')}</p>
          </div>

          <div className="guide-status-cards">
            {statusList.map((st) => (
              <div
                key={st.key}
                className="guide-status-box"
                style={{ background: st.bg, borderColor: st.border }}
              >
                <div className="guide-status-badge" style={{ color: st.color }}>
                  {st.badge}
                </div>
                <h4 style={{ color: 'var(--white)', fontSize: 14, fontWeight: 700, margin: '6px 0 4px' }}>
                  {st.title}
                </h4>
                <p className="guide-status-sub">{st.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Interactive FAQ Accordion */}
        <section className="guide-section">
          <div className="guide-section-head">
            <h2>{t('guide.faqTitle', 'Questions Fréquentes')}</h2>
            <p>{t('guide.faqSub', 'Cliquez sur une question pour afficher la réponse')}</p>
          </div>

          <div className="guide-faq-accordion">
            {faqs.map((f, i) => (
              <div
                key={i}
                className={`guide-faq-item ${activeFaq === i ? 'guide-faq-item--open' : ''}`}
                onClick={() => setActiveFaq(activeFaq === i ? -1 : i)}
              >
                <div className="guide-faq-question">
                  <span>{f.q}</span>
                  <FiChevronDown
                    size={18}
                    className="guide-faq-chevron"
                    style={{ transform: activeFaq === i ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}
                  />
                </div>
                {activeFaq === i && (
                  <div className="guide-faq-answer">
                    <p>{f.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA Banner */}
        <div className="guide-cta-card">
          <div className="guide-cta-content">
            <h3>{t('guide.ctaTitle', 'Envie de réserver votre voiture ?')}</h3>
            <p>{t('guide.ctaSub', 'Parcourez nos offres spéciales et notre parc de voitures prêtes pour la route.')}</p>
          </div>
          <Link to="/voitures" className="guide-cta-btn">
            {t('guide.ctaBtn', 'Voir nos voitures')} <FiArrowRight size={16} />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}

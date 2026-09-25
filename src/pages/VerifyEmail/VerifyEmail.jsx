import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { FiCheckCircle, FiAlertTriangle, FiArrowRight, FiLoader } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'
import './VerifyEmail.css'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const { verifyEmail } = useAuth()

  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setLoading(false)
      setError('Lien de vérification invalide ou manquant.')
      return
    }

    let isMounted = true
    const doVerify = async () => {
      try {
        const res = await verifyEmail(token)
        if (isMounted) {
          setSuccess(true)
          setMessage(res?.message || 'Votre e-mail a été vérifié avec succès !')
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.response?.data?.message || 'Le lien de vérification a expiré ou est invalide.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    doVerify()

    return () => { isMounted = false }
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="ve-page">
      <Navbar />
      <div className="ve-container container">
        <div className="ve-card">
          {loading && (
            <div className="ve-state">
              <FiLoader size={48} className="ve-spin" />
              <h1 className="ve-title">Vérification en cours...</h1>
              <p className="ve-sub">Veuillez patienter pendant que nous confirmons votre adresse e-mail.</p>
            </div>
          )}

          {!loading && success && (
            <div className="ve-state">
              <div className="ve-icon-wrap ve-icon-wrap--success">
                <FiCheckCircle size={44} color="#22c55e" />
              </div>
              <h1 className="ve-title">E-mail confirmé avec succès ! 🎉</h1>
              <p className="ve-sub">{message}</p>
              <p className="ve-desc">
                Votre compte est désormais activé. Vous pouvez louer vos véhicules préférés dès maintenant.
              </p>

              <div className="ve-actions">
                <button onClick={() => navigate('/voitures')} className="ve-btn ve-btn--primary">
                  <span>Explorer nos véhicules</span>
                  <FiArrowRight size={16} />
                </button>
                <Link to="/" className="ve-btn ve-btn--secondary">
                  Retour à l'accueil
                </Link>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="ve-state">
              <div className="ve-icon-wrap ve-icon-wrap--error">
                <FiAlertTriangle size={44} color="#ef4444" />
              </div>
              <h1 className="ve-title">Échec de la vérification</h1>
              <p className="ve-sub ve-sub--error">{error}</p>
              <p className="ve-desc">
                Le lien de vérification que vous avez utilisé est expiré ou a déjà été consommé.
              </p>

              <div className="ve-actions">
                <Link to="/" className="ve-btn ve-btn--primary">
                  Retour à l'accueil
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}

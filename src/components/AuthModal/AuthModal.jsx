import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiX, FiEye, FiEyeOff, FiAlertCircle, FiMail } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { brandLogo, BRAND_NAME } from '../../brand'
import './AuthModal.css'

// ─── Social OAuth Buttons ─────────────────────────────────────────────────────
function SocialOAuthButtons({ loading }) {
  const handleGoogleClick = () => {
    // Redirect browser to NestJS Google OAuth 2.0 Authorization Endpoint
    window.location.href = 'http://localhost:3000/api/auth/google'
  }

  const handleFacebookClick = () => {
    // Redirect browser to NestJS Facebook OAuth 2.0 Authorization Endpoint
    window.location.href = 'http://localhost:3000/api/auth/facebook'
  }

  return (
    <div className="am-social-wrap" style={{ marginTop: 12 }}>
      <div className="am-divider">
        <span>OU</span>
      </div>

      <div className="am-social-buttons">
        <button
          type="button"
          className="am-social-btn am-social-btn--google"
          onClick={handleGoogleClick}
          disabled={loading}
        >
          <svg className="am-social-icon" width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Continuer avec Google</span>
        </button>

        <button
          type="button"
          className="am-social-btn am-social-btn--facebook"
          onClick={handleFacebookClick}
          disabled={loading}
        >
          <svg className="am-social-icon" width="18" height="18" viewBox="0 0 24 24" fill="#ffffff">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span>Continuer avec Facebook</span>
        </button>
      </div>
    </div>
  )
}

// ─── Register Panel ───────────────────────────────────────────────────────────
function RegisterPanel({ onSwitch, onSubmit, onOAuth, loading, error }) {
  const { t } = useLanguage()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '', age: '', agree: false })
  const [showPw, setShowPw] = useState(false)
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.age || Number(form.age) < 18) {
      onSubmit({ ...form, _ageError: true })
      return
    }
    onSubmit(form)
  }

  return (
    <div className="am-panel am-panel--form">
      <div className="am-panel__inner">
        <div className="am-logo">
          <img src={brandLogo} alt={BRAND_NAME} className="am-logo__img" />
        </div>

        <h2 className="am-title">{t('auth.registerTitle', 'Créer un compte')}</h2>

        {error && (
          <div className="am-error">
            <FiAlertCircle size={13} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="am-form" noValidate>
          <div className="am-row-two">
            <div className="am-field">
              <label className="am-label">{t('auth.firstName', 'Prénom')}</label>
              <input className="am-input" type="text" placeholder="Mohamed" value={form.firstName} onChange={set('firstName')} required autoComplete="given-name" />
            </div>
            <div className="am-field">
              <label className="am-label">{t('auth.lastName', 'Nom')}</label>
              <input className="am-input" type="text" placeholder="Ben Ali" value={form.lastName} onChange={set('lastName')} required autoComplete="family-name" />
            </div>
          </div>

          <div className="am-field">
            <label className="am-label">{t('auth.email', 'Adresse email')}</label>
            <input className="am-input" type="email" placeholder="vous@exemple.com" value={form.email} onChange={set('email')} required autoComplete="email" />
          </div>

          <div className="am-row-two">
            <div className="am-field">
              <label className="am-label">{t('auth.phone', 'Téléphone')}</label>
              <input className="am-input" type="tel" placeholder="+216 98 765 432" value={form.phone} onChange={set('phone')} autoComplete="tel" />
            </div>
            <div className="am-field">
              <label className="am-label">{t('auth.age', 'Âge du conducteur')}</label>
              <input className="am-input" type="number" placeholder="ex: 25" min={18} max={99} value={form.age} onChange={set('age')} required />
            </div>
          </div>

          <div className="am-field">
            <div className="am-label-row">
              <label className="am-label">{t('auth.password', 'Mot de passe')}</label>
            </div>
            <div className="am-pw-wrap">
              <input className="am-input" type={showPw ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={set('password')} required autoComplete="new-password" />
              <button type="button" className="am-eye" onClick={() => setShowPw(s => !s)} tabIndex={-1}>
                {showPw ? <FiEyeOff size={15}/> : <FiEye size={15}/>}
              </button>
            </div>
          </div>

          <label className="am-check">
            <input type="checkbox" checked={form.agree} onChange={set('agree')} required />
            <span>J'accepte les Conditions</span>
          </label>

          <button className="am-submit" type="submit" disabled={loading || !form.agree}>
            {loading ? <span className="am-spinner" /> : t('auth.registerBtn', 'S’inscrire')}
          </button>
        </form>

        <SocialOAuthButtons onOAuth={onOAuth} loading={loading} />

        <p className="am-switch-text">
          {t('auth.hasAccount', 'Déjà un compte ?')}{' '}
          <button className="am-switch-btn" onClick={onSwitch} type="button">{t('auth.loginLink', 'Se connecter')}</button>
        </p>
      </div>
    </div>
  )
}

// ─── Login Panel ──────────────────────────────────────────────────────────────
function LoginPanel({ onSwitch, onSubmit, onOAuth, loading, error }) {
  const { t } = useLanguage()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <div className="am-panel am-panel--form">
      <div className="am-panel__inner">
        <div className="am-logo">
          <img src={brandLogo} alt={BRAND_NAME} className="am-logo__img" />
        </div>

        <h2 className="am-title">{t('auth.loginTitle', 'Connexion')}</h2>

        {error && (
          <div className="am-error">
            <FiAlertCircle size={13} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="am-form" noValidate>
          <div className="am-field">
            <label className="am-label">{t('auth.email', 'Adresse email')}</label>
            <input className="am-input" type="email" placeholder="vous@exemple.com" value={form.email} onChange={set('email')} required autoComplete="email" />
          </div>

          <div className="am-field">
            <div className="am-label-row">
              <label className="am-label">{t('auth.password', 'Mot de passe')}</label>
            </div>
            <div className="am-pw-wrap">
              <input className="am-input" type={showPw ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={set('password')} required autoComplete="current-password" />
              <button type="button" className="am-eye" onClick={() => setShowPw(s => !s)} tabIndex={-1}>
                {showPw ? <FiEyeOff size={15}/> : <FiEye size={15}/>}
              </button>
            </div>
          </div>

          <button className="am-submit" type="submit" disabled={loading}>
            {loading ? <span className="am-spinner" /> : t('auth.loginBtn', 'Se connecter')}
          </button>
        </form>

        <SocialOAuthButtons onOAuth={onOAuth} loading={loading} />

        <p className="am-switch-text">
          {t('auth.noAccount', 'Pas encore de compte ?')}{' '}
          <button className="am-switch-btn" onClick={onSwitch} type="button">{t('auth.createOne', 'Créer un compte')}</button>
        </p>
      </div>
    </div>
  )
}

// ─── Image Panel ──────────────────────────────────────────────────────────────
function ImagePanel({ mode }) {
  const isLogin = mode === 'login'
  const bgImg = isLogin ? '/auth_login.png' : '/auth_register.png'

  return (
    <div className="am-panel am-panel--image">
      <img
        src={bgImg}
        alt={BRAND_NAME}
        className="am-bg-img"
      />
      <div className="am-image-overlay" />
      <div className="am-image-content">
        <p className="am-image-tagline">
          {isLogin ? "Plus qu'une voiture." : "Rejoignez l'aventure."}
        </p>
        <p className="am-image-tagline am-image-tagline--accent">
          {isLogin ? "C'est la liberté." : "Voyagez sans limites."}
        </p>
        <p className="am-image-desc">
          {isLogin
            ? "Connectez-vous pour gérer vos réservations et profiter d'un service premium en Tunisie."
            : "Créez votre compte en 1 minute et découvrez la Tunisie avec le véhicule idéal."
          }
        </p>
      </div>
    </div>
  )
}

// ─── Verification Sent Panel ──────────────────────────────────────────────────
const MAX_RESENDS = 5
const COOLDOWN_SECS = 30

function VerificationSentPanel({ data, onClose }) {
  const { resendVerification } = useAuth()
  const [sendCount, setSendCount] = useState(1) // first email already sent on register
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [cooldown, setCooldown] = useState(0) // seconds remaining

  const email = data?.email || data

  // tick the cooldown every second
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const handleResend = async () => {
    if (cooldown > 0 || sendCount >= MAX_RESENDS) return
    setLoading(true)
    setError('')
    setSuccessMsg('')
    try {
      await resendVerification(email)
      setSendCount(c => c + 1)
      setCooldown(COOLDOWN_SECS)
      setSuccessMsg('✓ E-mail de vérification renvoyé !')
    } catch (err) {
      setError(err?.response?.data?.message || 'Erreur lors de l\'envoi.')
    } finally {
      setLoading(false)
    }
  }

  const attemptsLeft = MAX_RESENDS - sendCount
  const isExhausted = sendCount >= MAX_RESENDS
  const isDisabled = loading || cooldown > 0 || isExhausted

  return (
    <div className="am-panel am-panel--form">
      <div className="am-panel__inner" style={{ textAlign: 'center', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(212,160,23,0.15)', border: '1.5px solid rgba(212,160,23,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <FiMail size={24} color="#d4a017" />
        </div>
        <h2 className="am-title" style={{ fontSize: 20, marginBottom: 6 }}>Vérifiez vos e-mails 📩</h2>
        <p style={{ fontSize: 12.5, color: '#a1a1aa', lineHeight: 1.5, marginBottom: 14 }}>
          Un e-mail de confirmation a été envoyé à <strong style={{ color: '#ffffff' }}>{email}</strong>.<br />
          Cliquez sur le lien dans le mail pour activer votre compte.
        </p>

        {successMsg && (
          <div className="am-error" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', marginBottom: 10, padding: '6px 10px', fontSize: 11.5 }}>
            <span>{successMsg}</span>
          </div>
        )}
        {error && (
          <div className="am-error" style={{ marginBottom: 10 }}>
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
          <button
            className="am-submit"
            onClick={handleResend}
            disabled={isDisabled}
            style={{ background: '#27272a', color: isDisabled ? '#52525b' : '#e5e7eb', border: '1px solid #3f3f46', padding: '9px 12px', fontSize: 13, cursor: isDisabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
          >
            {loading
              ? <span className="am-spinner" />
              : isExhausted
                ? '🚫 Limite atteinte (5/5)'
                : cooldown > 0
                  ? `⏳ Renvoyer dans ${cooldown}s — (${attemptsLeft} essai${attemptsLeft > 1 ? 's' : ''} restant${attemptsLeft > 1 ? 's' : ''})`
                  : `Renvoyer l'e-mail${attemptsLeft < MAX_RESENDS ? ` (${attemptsLeft} restant${attemptsLeft > 1 ? 's' : ''})` : ''}`
            }
          </button>
          <button className="am-submit" onClick={onClose} style={{ background: 'transparent', color: '#71717a', border: '1px solid #27272a', padding: '8px 12px', fontSize: 12 }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function AuthModal() {
  const { authModal, closeAuthModal, login, register, oauthLogin } = useAuth()
  const { open, mode: initialMode } = authModal
  const navigate = useNavigate()

  const [mode, setMode] = useState(initialMode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verificationEmail, setVerificationEmail] = useState(null)
  const [animating, setAnimating] = useState(false)
  const overlayRef = useRef(null)

  useEffect(() => {
    if (open) {
      setMode(initialMode)
      setError('')
      setLoading(false)
      setAnimating(false)
      setVerificationEmail(null)
    }
  }, [open, initialMode])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const switchMode = () => {
    if (animating) return
    setAnimating(true)
    setError('')
    setVerificationEmail(null)
    setTimeout(() => {
      setMode(m => m === 'login' ? 'register' : 'login')
      setAnimating(false)
    }, 380)
  }

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) closeAuthModal()
  }

  const handleRegister = async (form) => {
    if (form._ageError) { setError("Veuillez entrer un âge valide (18 ans minimum)."); return }
    if (form.password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return }
    setError(''); setLoading(true)
    try {
      const res = await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        age: form.age ? Number(form.age) : undefined,
      })

      if (res?.requiresVerification) {
        setVerificationEmail(res)
        return
      }
      closeAuthModal()
    } catch (err) {
      const msg = err?.response?.data?.message
      setError(Array.isArray(msg) ? msg[0] : msg || 'Erreur lors de l\'inscription.')
    } finally { setLoading(false) }
  }

  const handleLogin = async (form) => {
    setError(''); setLoading(true)
    try {
      const loggedUser = await login(form.email, form.password)
      closeAuthModal()
      if (loggedUser?.role === 'admin') {
        navigate('/admin')
      }
    } catch (err) {
      const msg = err?.response?.data?.message
      setError(Array.isArray(msg) ? msg[0] : msg || 'Email ou mot de passe incorrect.')
    } finally { setLoading(false) }
  }

  const handleOAuth = async (oauthData) => {
    setError(''); setLoading(true)
    try {
      const loggedUser = await oauthLogin(oauthData)
      closeAuthModal()
      if (loggedUser?.role === 'admin') {
        navigate('/admin')
      }
    } catch (err) {
      const msg = err?.response?.data?.message
      setError(Array.isArray(msg) ? msg[0] : msg || 'Erreur lors de la connexion OAuth.')
    } finally { setLoading(false) }
  }

  const isLogin = mode === 'login'

  return (
    <div
      className="am-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={isLogin ? 'Connexion' : 'Créer un compte'}
    >
      <div className={`am-card ${isLogin ? 'am-card--login' : 'am-card--register'} ${animating ? 'am-card--animating' : ''}`}>

        <button className="am-close" onClick={closeAuthModal} aria-label="Fermer">
          <FiX size={18} />
        </button>

        <div className="am-slot am-slot--a">
          {verificationEmail ? (
            <VerificationSentPanel data={verificationEmail} onClose={closeAuthModal} />
          ) : isLogin ? (
            <ImagePanel mode={mode} />
          ) : (
            <RegisterPanel onSwitch={switchMode} onSubmit={handleRegister} onOAuth={handleOAuth} loading={loading} error={error} />
          )}
        </div>

        <div className="am-slot am-slot--b">
          {verificationEmail ? (
            <ImagePanel mode={mode} />
          ) : isLogin ? (
            <LoginPanel onSwitch={switchMode} onSubmit={handleLogin} onOAuth={handleOAuth} loading={loading} error={error} />
          ) : (
            <ImagePanel mode={mode} />
          )}
        </div>
      </div>
    </div>
  )
}

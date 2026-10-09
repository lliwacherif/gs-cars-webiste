import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useLanguage } from './context/LanguageContext'
import AuthModal from './components/AuthModal/AuthModal'
import './index.css'
import './App.css'
import Home from './pages/Home/Home'
import SearchResults from './pages/SearchResults/SearchResults'
import VehicleDetail from './pages/VehicleDetail/VehicleDetail'
import Admin from './pages/Admin/Admin'
import Historique from './pages/Historique/Historique'
import VerifyEmail from './pages/VerifyEmail/VerifyEmail'
import Guide from './pages/Guide/Guide'
import Contact from './pages/Contact/Contact'

function RouteLoading() {
  const { t } = useLanguage()
  return (
    <div className="route-loading" role="status">
      <span className="route-loading__spinner" aria-hidden="true" />
      <p>{t('app.loading', 'Chargement…')}</p>
    </div>
  )
}

/** Must be rendered inside AuthProvider */
function AdminRoute() {
  const { user, loading } = useAuth()
  if (loading) return <RouteLoading />
  if (!user) return <Navigate to="/" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return <Admin />
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <RouteLoading />
  if (!user) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  // Listen for OAuth 2.0 redirect tokens or error parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const userStr = params.get('user')
    const oauthError = params.get('oauth_error')

    // Don't auto-reload if on /verify-email page
    if (token && window.location.pathname.startsWith('/verify-email')) {
      return
    }

    if (token) {
      localStorage.setItem('tcr_token', token)
      if (userStr) {
        try {
          localStorage.setItem('tcr_user', userStr)
        } catch (e) {}
      }
      // Clean query string from browser URL bar
      window.history.replaceState({}, document.title, window.location.pathname)
      window.location.reload()
    } else if (oauthError) {
      alert(`🔑 OAuth 2.0 Message :\n${decodeURIComponent(oauthError)}`)
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/voitures" element={<SearchResults />} />
        <Route path="/voitures/:id" element={<VehicleDetail />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/admin" element={<AdminRoute />} />
        <Route path="/root/dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="/historique" element={<PrivateRoute><Historique /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AuthModal />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

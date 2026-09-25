import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const [authModal, setAuthModal] = useState({ open: false, mode: 'login' })
  const [pendingBooking, setPendingBooking] = useState(null)

  useEffect(() => {
    const stored = authService.getCurrentUser()
    if (!stored) {
      setLoading(false)
      return
    }
    setUser(stored)
    authService.getMe()
      .then(freshUser => setUser(freshUser))
      .catch(() => {
        authService.logout()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const { user: u } = await authService.login(email, password)
    setUser(u)
    return u
  }

  const register = async (data) => {
    const res = await authService.register(data)
    if (res.user) setUser(res.user)
    return res
  }

  const verifyEmail = async (token) => {
    const { user: u, message } = await authService.verifyEmail(token)
    if (u) setUser(u)
    return { user: u, message }
  }

  const resendVerification = async (email) => {
    return await authService.resendVerification(email)
  }

  const oauthLogin = async (oauthData) => {
    const { user: u } = await authService.oauthLogin(oauthData)
    setUser(u)
    return u
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  const openAuthModal = useCallback((mode = 'login', booking = null) => {
    if (booking) setPendingBooking(booking)
    setAuthModal({ open: true, mode })
  }, [])

  const closeAuthModal = useCallback(() => {
    setAuthModal(prev => ({ ...prev, open: false }))
  }, [])

  const clearPendingBooking = useCallback(() => setPendingBooking(null), [])

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      verifyEmail,
      resendVerification,
      oauthLogin,
      logout,
      authModal,
      openAuthModal,
      closeAuthModal,
      pendingBooking,
      setPendingBooking,
      clearPendingBooking,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

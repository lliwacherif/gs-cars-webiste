import api from './api'

export const authService = {
  async register(data) {
    const res = await api.post('/auth/register', data)
    const result = res.data.data
    if (result.token && result.user) {
      localStorage.setItem('tcr_token', result.token)
      localStorage.setItem('tcr_user', JSON.stringify(result.user))
    }
    return result
  },

  async verifyEmail(token) {
    const res = await api.get(`/auth/verify-email?token=${token}`)
    const { token: jwtToken, user, message } = res.data.data
    if (jwtToken && user) {
      localStorage.setItem('tcr_token', jwtToken)
      localStorage.setItem('tcr_user', JSON.stringify(user))
    }
    return { token: jwtToken, user, message }
  },

  async resendVerification(email) {
    const res = await api.post('/auth/resend-verification', { email })
    return res.data.data
  },

  async login(email, password) {
    const res = await api.post('/auth/login', { email, password })
    const { token, user } = res.data.data
    localStorage.setItem('tcr_token', token)
    localStorage.setItem('tcr_user', JSON.stringify(user))
    return { token, user }
  },

  async oauthLogin(oauthData) {
    const res = await api.post('/auth/oauth', oauthData)
    const { token, user } = res.data.data
    localStorage.setItem('tcr_token', token)
    localStorage.setItem('tcr_user', JSON.stringify(user))
    return { token, user }
  },

  async getMe() {
    const res = await api.get('/auth/me')
    return res.data.data
  },

  logout() {
    localStorage.removeItem('tcr_token')
    localStorage.removeItem('tcr_user')
  },

  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem('tcr_user'))
    } catch {
      return null
    }
  },

  isAuthenticated() {
    return !!localStorage.getItem('tcr_token')
  },
}

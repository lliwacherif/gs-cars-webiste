import api from './api'

export const vehiclesService = {
  async getAll(params = {}) {
    const res = await api.get('/vehicles', { params })
    return res.data.data // { vehicles, pagination }
  },

  async getAllAdmin() {
    const res = await api.get('/vehicles/admin')
    return res.data.data
  },

  async getOne(id) {
    const res = await api.get(`/vehicles/${id}`)
    return res.data.data
  },

  async create(data) {
    const res = await api.post('/vehicles', data)
    return res.data.data
  },

  async update(id, data) {
    const res = await api.put(`/vehicles/${id}`, data)
    return res.data.data
  },

  async toggleActive(id) {
    const res = await api.patch(`/vehicles/${id}/toggle`)
    return res.data.data
  },

  // enable=true → Maintenance, enable=false → recomputes Disponible/Réservé
  async setMaintenance(id, enable) {
    const res = await api.patch(`/vehicles/${id}/maintenance`, { enable })
    return res.data.data
  },

  async syncAllStatuses() {
    const res = await api.post('/vehicles/sync-status')
    return res.data
  },

  async remove(id) {
    const res = await api.delete(`/vehicles/${id}`)
    return res.data.data
  },

  // Assign a vehicle to multiple parcs simultaneously
  async assignToParcs(id, parcIds) {
    const res = await api.patch(`/vehicles/${id}/parcs`, { parcIds })
    return res.data.data
  },
}

export const reservationsService = {
  async getAll() {
    const res = await api.get('/reservations')
    return res.data.data
  },

  async getUpcoming() {
    const res = await api.get('/reservations/upcoming')
    return res.data.data
  },

  async getStats() {
    const res = await api.get('/reservations/stats')
    return res.data.data
  },

  async getVehicleHistory(vehicleId) {
    const res = await api.get(`/reservations/vehicle/${vehicleId}/history`)
    return res.data.data
  },

  async getOne(id) {
    const res = await api.get(`/reservations/${id}`)
    return res.data.data
  },

  async create(data) {
    const res = await api.post('/reservations', data)
    return res.data.data
  },

  async updateStatus(id, payload) {
    const res = await api.patch(`/reservations/${id}/status`, payload)
    return res.data.data
  },

  async getCalendar(startDate, endDate) {
    const res = await api.get('/reservations/calendar', { params: { startDate, endDate } })
    return res.data.data  // { vehicles, reservations }
  },

  async remove(id) {
    const res = await api.delete(`/reservations/${id}`)
    return res.data.data
  },
}

export const uploadService = {
  async uploadImage(file, folder = 'tunisia-car-rental') {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)
    const res = await api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data // { url, publicId, width, height, format }
  },

  async uploadGlb(file, folder = 'tunisia-car-rental/3d-models') {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)
    console.log('[uploadGlb] Starting upload, file size:', file.size, 'bytes')
    const res = await api.post('/upload/glb', formData, {
      timeout: 0, // No timeout — GLB files can be up to 50 MB
      onUploadProgress: (e) => {
        const pct = Math.round((e.loaded / e.total) * 100)
        console.log(`[uploadGlb] Upload progress: ${pct}%`)
      },
    })
    console.log('[uploadGlb] Response:', res.data)
    const data = res.data?.data ?? res.data
    if (!data?.url) throw new Error('No URL in Cloudinary response: ' + JSON.stringify(res.data))
    return data // { url, publicId }
  },
}

export const holdsService = {
  async create(vehicleId, pickupDate, dropoffDate) {
    const res = await api.post('/holds', { vehicleId, pickupDate, dropoffDate })
    return res.data.data // hold document with _id
  },

  async release(holdId) {
    await api.delete(`/holds/${holdId}`)
  },
}

export const parcsService = {
  async getAll() {
    const res = await api.get('/parcs')
    return res.data.data // array of parcs
  },

  async getOne(id) {
    const res = await api.get(`/parcs/${id}`)
    return res.data.data
  },

  async create(data) {
    const res = await api.post('/parcs', data)
    return res.data.data
  },

  async update(id, data) {
    const res = await api.patch(`/parcs/${id}`, data)
    return res.data.data
  },

  async remove(id) {
    const res = await api.delete(`/parcs/${id}`)
    return res.data.data
  },
}

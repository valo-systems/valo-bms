import api from './client'

export const auth = {
  login: (email, password) => api.post('/auth/login.php', { email, password }),
  me: () => api.get('/auth/me.php'),
}

export const clients = {
  list: () => api.get('/clients/index.php'),
  get: (id) => api.get(`/clients/show.php?id=${id}`),
  create: (data) => api.post('/clients/create.php', data),
  update: (id, data) => api.put(`/clients/update.php?id=${id}`, data),
  delete: (id) => api.delete(`/clients/delete.php?id=${id}`),
}

export const invoices = {
  list: (params = {}) => api.get('/invoices/index.php', { params }),
  get: (id) => api.get(`/invoices/show.php?id=${id}`),
  create: (data) => api.post('/invoices/create.php', data),
  update: (id, data) => api.put(`/invoices/update.php?id=${id}`, data),
  delete: (id) => api.delete(`/invoices/delete.php?id=${id}`),
  updateStatus: (id, status) => api.patch(`/invoices/status.php?id=${id}`, { status }),
}

export const expenses = {
  list: (params = {}) => api.get('/expenses/index.php', { params }),
  create: (data) => api.post('/expenses/create.php', data),
  update: (id, data) => api.put(`/expenses/update.php?id=${id}`, data),
  delete: (id) => api.delete(`/expenses/delete.php?id=${id}`),
}

export const documents = {
  list: () => api.get('/documents/index.php'),
  get: (id) => api.get(`/documents/show.php?id=${id}`),
  create: (data) => api.post('/documents/create.php', data),
  update: (id, data) => api.put(`/documents/update.php?id=${id}`, data),
  upload: (file, onProgress) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/documents/upload.php', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    })
  },
}

export const company = {
  get: () => api.get('/company/index.php'),
  update: (data) => api.put('/company/update.php', data),
}

export const dashboard = {
  summary: () => api.get('/dashboard/summary.php'),
}

export const paymentPlans = {
  list: (params = {}) => api.get('/payment-plans/index.php', { params }),
  create: (data) => api.post('/payment-plans/create.php', data),
  update: (id, data) => api.put(`/payment-plans/update.php?id=${id}`, data),
  delete: (id) => api.delete(`/payment-plans/delete.php?id=${id}`),
}

export const team = {
  list:   ()       => api.get('/users/index.php'),
  get:    (id)     => api.get(`/users/show.php?id=${id}`),
  update: (id, d)  => api.put(`/users/update.php?id=${id}`, d),
}

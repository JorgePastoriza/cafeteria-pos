// src/services/api.js
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      const slug = localStorage.getItem('slug');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');
      if (slug) window.location.href = `/${slug}/login`;
    }
    return Promise.reject(error);
  }
);

const u = (slug, path) => `/${slug}${path}`;

export const tenantAPI = {
  getInfo: (slug) => api.get(`/tenant-info/${slug}`)
};

export const authAPI = {
  login: (slug, data) => api.post(u(slug, '/auth/login'), data),
  me: (slug) => api.get(u(slug, '/auth/me'))
};

export const superAdminAPI = {
  login: (data) => api.post('/superadmin/login', data),
  me: () => api.get('/superadmin/me'),
  getStats: () => api.get('/superadmin/stats'),
  getTenants: () => api.get('/superadmin/tenants'),
  createTenant: (data) => api.post('/superadmin/tenants', data),
  updateTenant: (id, data) => api.put(`/superadmin/tenants/${id}`, data),
  deleteTenant: (id) => api.delete(`/superadmin/tenants/${id}`),
  toggleTenant: (id) => api.post(`/superadmin/tenants/${id}/toggle`),
  getTenantUsers: (id) => api.get(`/superadmin/tenants/${id}/users`),
  changeUserPassword: (tenantId, userId, password) =>
    api.put(`/superadmin/tenants/${tenantId}/users/${userId}/password`, { password })
};

export const makeSlugAPI = (slug) => ({
  products: {
    getAll: (params) => api.get(u(slug, '/products'), { params }),
    getById: (id) => api.get(u(slug, `/products/${id}`)),
    create: (data) => api.post(u(slug, '/products'), data),
    update: (id, data) => api.put(u(slug, `/products/${id}`), data),
    delete: (id) => api.delete(u(slug, `/products/${id}`))
  },
  categories: {
    getAll: (params) => api.get(u(slug, '/categories'), { params }),
    create: (data) => api.post(u(slug, '/categories'), data),
    update: (id, data) => api.put(u(slug, `/categories/${id}`), data),
    delete: (id) => api.delete(u(slug, `/categories/${id}`))
  },
  sales: {
    create: (data) => api.post(u(slug, '/sales'), data),
    getAll: (params) => api.get(u(slug, '/sales'), { params }),
    getById: (id) => api.get(u(slug, `/sales/${id}`))
  },
  stock: {
    adjust: (data) => api.post(u(slug, '/stock/adjust'), data),
    getMovements: () => api.get(u(slug, '/stock/movements'))
  },
  cierre: {
    getToday: () => api.get(u(slug, '/cierre/today')),
    close: (data) => api.post(u(slug, '/cierre/close'), data),
    getHistory: () => api.get(u(slug, '/cierre/history'))
  },
  dashboard: {
    getStats: () => api.get(u(slug, '/dashboard/stats')),
    getChart: (params) => api.get(u(slug, '/dashboard/chart'), { params }),
    getTopProducts: () => api.get(u(slug, '/dashboard/top-products'))
  },
  users: {
    getAll: () => api.get(u(slug, '/users')),
    create: (data) => api.post(u(slug, '/users'), data),
    update: (id, data) => api.put(u(slug, `/users/${id}`), data),
    delete: (id) => api.delete(u(slug, `/users/${id}`))
  },
  roles: { getAll: () => api.get(u(slug, '/roles')) }
});

export default api;

// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor: agregar token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor: manejar errores de autenticación
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// AUTH
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me')
};

// PRODUCTS
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  adjustStock: (id, data) => api.post(`/products/${id}/stock`, data),
  getMovements: (id) => api.get(`/products/${id}/movements`)
};

// CATEGORIES
export const categoriesAPI = {
  getAll: (params) => api.get('/categories', { params }),
  create: (data) => api.post('/categories', data)
};

// SALES
export const salesAPI = {
  create: (data) => api.post('/sales', data),
  getAll: (params) => api.get('/sales', { params }),
  today: () => api.get('/sales/today'),
  closeDay: (data) => api.post('/sales/close-day', data)
};

// DASHBOARD
export const dashboardAPI = {
  get: (params) => api.get('/dashboard', { params })
};

// USERS
export const usersAPI = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getRoles: () => api.get('/roles')
};

export default api;

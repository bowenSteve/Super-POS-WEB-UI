import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(
          `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api'}/auth/refresh/`,
          { refresh: refreshToken }
        );

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  signup: (userData) => api.post('/auth/signup/', userData),
  logout: () => api.post('/auth/logout/'),
  getCurrentUser: () => api.get('/auth/user/'),
};

// Products API calls
export const productsAPI = {
  getAll: (params) => api.get('/products/', { params }),
  search: (searchTerm) => api.get('/products/', { params: { search: searchTerm } }),
  getById: (id) => api.get(`/products/${id}/`),
  create: (data) => api.post('/products/', data),
  update: (id, data) => api.put(`/products/${id}/`, data),
  delete: (id) => api.delete(`/products/${id}/`),
  getCategories: () => api.get('/products/categories/'),
};

// Sales API calls
export const salesAPI = {
  getTransactions: (params) => api.get('/sales/transactions/', { params }),
  getTransactionById: (id) => api.get(`/sales/transactions/${id}/`),
  createTransaction: (data) => api.post('/sales/transactions/', data),
};

// Customers API calls
export const customersAPI = {
  getAll: (params) => api.get('/customers/', { params }),
  getById: (id) => api.get(`/customers/${id}/`),
  create: (data) => api.post('/customers/', data),
  update: (id, data) => api.put(`/customers/${id}/`, data),
  delete: (id) => api.delete(`/customers/${id}/`),
};

// Inventory API calls
export const inventoryAPI = {
  getMovements: (params) => api.get('/inventory/movements/', { params }),
  createMovement: (data) => api.post('/inventory/movements/', data),
  getAlerts: (params) => api.get('/inventory/alerts/', { params }),
};

export default api;
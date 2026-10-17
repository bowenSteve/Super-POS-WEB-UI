import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and shop ID
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add shop ID header if current shop is set
    const currentShop = localStorage.getItem('current_shop');
    if (currentShop) {
      try {
        const shop = JSON.parse(currentShop);
        // Only set header if shop.id exists and is valid
        if (shop && shop.id) {
          config.headers['X-Shop-ID'] = shop.id;
        }
      } catch (e) {
        // Invalid JSON in localStorage, ignore it
      }
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
        localStorage.removeItem('current_shop');
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
  signupWithShop: (data) => api.post('/auth/signup-with-shop/', data),
  logout: (data) => api.post('/auth/logout/', data),
  getCurrentUser: () => api.get('/auth/user/'),
  get: (url, config) => api.get(url, config),
  mintHandoff: (shopId) => api.post('/auth/handoff/mint/', { shop_id: shopId }),
  exchangeHandoff: (code) => api.post('/auth/handoff/exchange/', { code }),
  verifyLoginOtp: (loginToken, otpCode, rememberMe) => api.post('/auth/login/verify-otp/', { login_token: loginToken, otp_code: otpCode, remember_me: rememberMe }),
  resendLoginOtp: (loginToken) => api.post('/auth/login/resend-otp/', { login_token: loginToken }),
  verifyEmail: (code) => api.post('/auth/verify-email/', { code }),
  resendVerifyEmail: () => api.post('/auth/resend-verify-email/'),
  getInvite: (token) => api.get(`/auth/invite/${token}/`),
  acceptInvite: (token, password) => api.post(`/auth/invite/${token}/accept/`, { password }),
};

// Shops API calls
export const shopsAPI = {
  getMyShops: () => api.get('/shops/my_shops/'),
  getAll: (params) => api.get('/shops/', { params }),
  getById: (id) => api.get(`/shops/${id}/`),
  create: (data) => api.post('/shops/', data),
  update: (id, data) => api.patch(`/shops/${id}/`, data),
  getMembers: (shopId) => api.get(`/shops/${shopId}/members/`),
  inviteStaff: (shopId, data) => api.post(`/shops/${shopId}/invite/`, data),
  removeMember: (shopId, userId) => api.post(`/shops/${shopId}/remove_member/`, { user_id: userId }),
  updateMemberRole: (shopId, userId, role) => api.post(`/shops/${shopId}/update_member_role/`, { user_id: userId, role }),
  checkSlug: (slug) => api.get('/shops/check_slug/', { params: { slug } }),
  resolveBySlug: (slug) => api.get('/shops/resolve/', { params: { slug } }),
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
  createCategory: (data) => api.post('/products/categories/', data),
  deleteCategory: (id) => api.delete(`/products/categories/${id}/`),
  importProducts: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/products/import_products/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  downloadSample: () => {
    return api.get('/products/download_sample/', {
      responseType: 'blob',
    });
  },
};

// Sales API calls
export const salesAPI = {
  getTransactions: (params) => api.get('/sales/transactions/', { params }),
  getTransactionById: (id) => api.get(`/sales/transactions/${id}/`),
  createTransaction: (data) => api.post('/sales/transactions/', data),
  exportPDF: (dateFrom, dateTo) => api.get('/sales/transactions/export_pdf/', {
    params: { date_from: dateFrom, date_to: dateTo },
    responseType: 'blob',
  }),
  // Refund API calls
  createRefund: (transactionId, data) => api.post(`/sales/transactions/${transactionId}/refund/`, data),
  getRefunds: (transactionId) => api.get(`/sales/transactions/${transactionId}/refunds/`),
  // Shift API calls
  getCurrentShift: () => api.get('/sales/shifts/current/'),
  getShifts: (params) => api.get('/sales/shifts/', { params }),
  getShiftById: (id) => api.get(`/sales/shifts/${id}/`),
  openShift: (data) => api.post('/sales/shifts/open/', data),
  closeShift: (id, data) => api.post(`/sales/shifts/${id}/close/`, data),
  getShiftReport: (id) => api.get(`/sales/shifts/${id}/report/`),
  exportShiftPDF: (id) => api.get(`/sales/shifts/${id}/export_pdf/`, {
    responseType: 'blob',
  }),
  // Historical sales import (backfilling sales recorded on paper)
  importSales: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/sales/transactions/import_sales/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  downloadImportSample: () => api.get('/sales/transactions/download_import_sample/', {
    responseType: 'blob',
  }),
  quickAddSale: (data) => api.post('/sales/transactions/quick_add_sale/', data),
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

// Reports API calls
export const reportsAPI = {
  getSalesSummary: (params) => api.get('/reports/sales-summary/', { params }),
  getSalesTrend: (params) => api.get('/reports/sales-trend/', { params }),
  getTopProducts: (params) => api.get('/reports/top-products/', { params }),
  getPaymentBreakdown: (params) => api.get('/reports/payment-breakdown/', { params }),
};

// Platform admin API calls - cross-tenant, requires is_superuser
export const platformAdminAPI = {
  getOverview: () => api.get('/platform/overview/'),
  getShops: (params) => api.get('/platform/shops/', { params }),
  getUsers: (params) => api.get('/platform/users/', { params }),
};

// AI sales reports - owner/manager only
export const aiReportsAPI = {
  generate: (period) => api.post('/ai-reports/generate/', { period }),
};

export default api;
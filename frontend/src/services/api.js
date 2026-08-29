import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API
export const authApi = {
  login: (credentials) => api.post('/users/login', credentials),
  register: (data) => api.post('/users/register', data),
  logout: () => api.post('/users/logout'),
  getProfile: () => api.get('/users/me'),
};

// Campaigns API
export const campaignApi = {
  getAll: () => api.get('/campaigns'),
  getById: (id) => api.get(`/campaigns/${id}`),
  create: (data) => api.post('/campaigns', data),
  update: (id, data) => api.put(`/campaigns/${id}`, data),
  delete: (id) => api.delete(`/campaigns/${id}`),
};

// Offers API
export const offerApi = {
  getAll: () => api.get('/offers'),
  getById: (id) => api.get(`/offers/${id}`),
  create: (data) => api.post('/offers', data),
  update: (id, data) => api.put(`/offers/${id}`, data),
  delete: (id) => api.delete(`/offers/${id}`),
};

// Landers API
export const landerApi = {
  getAll: () => api.get('/landers'),
  getById: (id) => api.get(`/landers/${id}`),
  create: (data) => api.post('/landers', data),
  update: (id, data) => api.put(`/landers/${id}`, data),
  delete: (id) => api.delete(`/landers/${id}`),
};

// Links API
export const linkApi = {
  getAll: (campaignId) => api.get('/links', { params: { campaignId } }),
  getById: (id) => api.get(`/links/${id}`),
  create: (data) => api.post('/links', data),
  update: (id, data) => api.put(`/links/${id}`, data),
  delete: (id) => api.delete(`/links/${id}`),
};

// Analytics API
export const analyticsApi = {
  getOverview: () => api.get('/analytics/overview'),
  getTimeSeries: (days = 7) => api.get('/analytics/timeseries', { params: { days } }),
  getCampaigns: () => api.get('/analytics/campaigns'),
  getGeo: () => api.get('/analytics/geo'),
  getDevice: () => api.get('/analytics/device'),
  getClicks: (limit = 50) => api.get('/analytics/clicks', { params: { limit } }),
  getConversions: (limit = 50) => api.get('/analytics/conversions', { params: { limit } }),
};

// Postback Simulator API
// export const postbackApi = {
//   // Dispatches postback simulation requests
//   simulate: (params) => axios.get('/postback', { params }),
  
//   // Fetches active POSTBACK_SECRET token for the UI
//   getToken: () => api.get('/postback/config/token'),
// };


export const postbackApi = {
  simulate: (params) => api.get('/postback', { params }),
  getToken: () => api.get('/postback/config/token'),
};

export default api;

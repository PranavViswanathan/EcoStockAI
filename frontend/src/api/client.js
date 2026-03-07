import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_URL,
});

export const getItems = (search = '', category = '') => 
  apiClient.get('/items', { params: { search, category } }).then(res => res.data);

export const createItem = (item) => 
  apiClient.post('/items', item).then(res => res.data);

export const getPrediction = (id) => 
  apiClient.get(`/items/${id}/prediction`).then(res => res.data);

export const advanceDays = (days) => 
  apiClient.post('/devmode/advance-days', { days }).then(res => res.data);

export const resetToSeed = () =>
  apiClient.post('/devmode/reset').then(res => res.data);

export const resetQuantities = () =>
  apiClient.post('/devmode/reset-quantities').then(res => res.data);

export const getDriftStatus = () => 
  apiClient.get('/drift/status').then(res => res.data);

export const getUsageHistory = () =>
  apiClient.get('/analytics/usage-history').then(res => res.data);

export const getStockLevels = () =>
  apiClient.get('/analytics/stock-levels').then(res => res.data);

export const getCategoryBreakdown = () =>
  apiClient.get('/analytics/category-breakdown').then(res => res.data);

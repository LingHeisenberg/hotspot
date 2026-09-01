import axios from 'axios';

const configuredBaseUrl = String(import.meta.env.VITE_API_URL || '').trim();

const api = axios.create({
  baseURL: configuredBaseUrl || undefined,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Nao foi possivel comunicar com o servidor.';
    const normalized = new Error(message);

    normalized.status = error.response?.status;
    normalized.reason = error.response?.data?.reason;
    normalized.data = error.response?.data;

    return Promise.reject(normalized);
  }
);

export async function getPlans() {
  const response = await api.get('/api/plans');
  return response.data;
}

export async function createOrder(payload) {
  const response = await api.post('/api/orders', payload);
  return response.data;
}

export async function startFreeTrial(payload) {
  const response = await api.post('/api/free-trials/start', payload);
  return response.data;
}

export async function getOrderStatus(reference) {
  const response = await api.get(
    `/api/orders/${encodeURIComponent(reference)}/status`
  );

  return response.data;
}

export async function adminLogin(password) {
  const response = await api.post('/api/admin/login', {
    password
  });

  return response.data;
}

export async function getAdminSummary(token) {
  const response = await api.get('/api/admin/summary', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data;
}

export async function generateVouchers(token, payload) {
  const response = await api.post(
    '/api/admin/vouchers/generate',
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.data;
}

export async function downloadAdminCsv(token, inicio, fim) {
  const response = await api.get('/api/admin/export.csv', {
    params: {
      inicio,
      fim
    },
    headers: {
      Authorization: `Bearer ${token}`
    },
    responseType: 'blob'
  });

  return response.data;
}

export default api;

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {})
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    const errorBody = contentType.includes('application/json') ? await response.json() : {};
    throw new Error(errorBody.message || 'Pedido recusado pelo servidor.');
  }

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

export function getPlans() {
  return request('/api/plans');
}

export function createOrder(payload) {
  return request('/api/orders', {
    method: 'POST',
    body: payload
  });
}

export function getOrderStatus(reference) {
  return request(`/api/orders/${encodeURIComponent(reference)}/status`);
}

export function adminLogin(password) {
  return request('/api/admin/login', {
    method: 'POST',
    body: { password }
  });
}

export function getAdminSummary(token) {
  return request('/api/admin/summary', { token });
}

export function generateVouchers(token, payload) {
  return request('/api/admin/vouchers/generate', {
    method: 'POST',
    token,
    body: payload
  });
}

export async function downloadAdminCsv(token, inicio, fim) {
  const response = await fetch(`/api/admin/export.csv?inicio=${inicio}&fim=${fim}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Nao foi possivel exportar o relatorio.');
  }

  return response.blob();
}

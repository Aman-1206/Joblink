import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export const api = {
  get: (url) => fetch(BASE + url, { headers: getHeaders() }).then(async (r) => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'Request failed');
    return { data, status: r.status };
  }),

  post: (url, body, isForm = false) => {
    const token = localStorage.getItem('token');
    const opts = {
      method: 'POST',
      headers: isForm ? { ...(token && { Authorization: `Bearer ${token}` }) } : getHeaders(),
      body: isForm ? body : JSON.stringify(body),
    };
    if (!isForm) opts.headers['Content-Type'] = 'application/json';
    return fetch(BASE + url, opts).then(async (r) => {
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Request failed');
      return { data, status: r.status };
    });
  },

  put: (url, body) =>
    fetch(BASE + url, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body),
    }).then(async (r) => {
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Request failed');
      return { data, status: r.status };
    }),

  patch: (url, body) =>
    fetch(BASE + url, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(body),
    }).then(async (r) => {
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Request failed');
      return { data, status: r.status };
    }),

  delete: (url) =>
    fetch(BASE + url, { method: 'DELETE', headers: getHeaders() }).then(async (r) => {
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Request failed');
      return { data };
    }),
};

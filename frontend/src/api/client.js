// In dev, Vite proxies all API routes to localhost:8000 (same origin → httpOnly cookies work)
// In prod, set VITE_API_URL to the backend URL (same domain via reverse proxy)
const BASE = import.meta.env.VITE_API_URL || "";

function getToken() {
  return localStorage.getItem("access_token");
}

function setToken(token) {
  localStorage.setItem("access_token", token);
}

// Detect which refresh endpoint to call based on stored role marker
function _refreshUrl() {
  if (localStorage.getItem("dayan"))  return "/auth/dayan/refresh";
  if (localStorage.getItem("lawyer")) return "/auth/lawyer/refresh";
  return "/auth/refresh";
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${getToken()}`;
      const retry = await fetch(`${BASE}${path}`, { ...options, headers, credentials: "include" });
      if (!retry.ok) throw await retry.json();
      return retry.status === 204 ? null : retry.json();
    }
    localStorage.clear();
    window.location.href = "/";
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "שגיאה בשרת" }));
    throw err;
  }
  return res.status === 204 ? null : res.json();
}

async function tryRefresh() {
  try {
    const url = _refreshUrl();
    // No body needed — backend reads refresh token from httpOnly cookie
    const res = await fetch(`${BASE}${url}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      credentials: "include",
    });
    if (!res.ok) return false;
    const data = await res.json();
    setToken(data.access_token);
    return true;
  } catch {
    return false;
  }
}

export const api = {
  get:    (path)        => request(path),
  post:   (path, body)  => request(path, { method: "POST",   body: body != null ? JSON.stringify(body) : undefined }),
  put:    (path, body)  => request(path, { method: "PUT",    body: JSON.stringify(body) }),
  patch:  (path, body)  => request(path, { method: "PATCH",  body: JSON.stringify(body) }),
  delete: (path)        => request(path, { method: "DELETE" }),

  silentRefresh: tryRefresh,
  setToken,

  uploadFile: async (path, formData) => {
    const token = getToken();
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
      credentials: "include",
    });
    if (!res.ok) throw await res.json().catch(() => ({ detail: "שגיאת העלאה" }));
    return res.json();
  },

  googleLoginUrl:      () => `${BASE}/auth/google`,
  googleDayanLoginUrl: () => `${BASE}/auth/dayan/google`,
  googleLawyerLoginUrl:() => `${BASE}/auth/lawyer/google`,
};

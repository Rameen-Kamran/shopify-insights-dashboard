// api.js — one small place that knows how to talk to our backend.
// Every component imports these functions instead of calling fetch directly,
// so if the API shape ever changes we only fix it here.

// Because Vite proxies /api to the backend (see vite.config.js), we can use
// relative URLs and they "just work" in development.

// Shared helper: fetch a URL, throw on a non-2xx status, otherwise return JSON.
async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    // Try to read the error message our backend sends, fall back to status.
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error?.message) message = body.error.message;
    } catch (_) {
      // response wasn't JSON; keep the generic message
    }
    throw new Error(message);
  }
  return res.json();
}

export function getStats() {
  return getJson('/api/stats');
}

export function getProducts() {
  return getJson('/api/products');
}

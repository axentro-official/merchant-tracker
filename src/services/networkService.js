/**
 * Network Service
 * Handles outbound HTTP requests with timeout and safe JSON parsing.
 */

import { CONFIG } from '../config/supabase.js';

const DEFAULT_TIMEOUT_MS = 12000;

function createTimeoutSignal(timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new Error('REQUEST_TIMEOUT')), timeoutMs);
  return { signal: controller.signal, clear: () => clearTimeout(timeoutId) };
}

export async function postJson(url, payload, { timeoutMs = DEFAULT_TIMEOUT_MS, headers = {} } = {}) {
  const { signal, clear } = createTimeoutSignal(timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-store',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers
      },
      body: JSON.stringify(payload),
      signal
    });

    const contentType = response.headers.get('content-type') || '';
    const body = contentType.includes('application/json') ? await response.json() : await response.text();

    if (!response.ok) {
      const message = typeof body === 'string' ? body : body?.message || body?.error || `HTTP_${response.status}`;
      throw new Error(message);
    }

    return body;
  } finally {
    clear();
  }
}

export async function sendRequestEmailNotification(payload, options = {}) {
  return postJson(CONFIG.EMAIL_ENDPOINT, {
    action: 'sendRequestEmail',
    payload
  }, options);
}

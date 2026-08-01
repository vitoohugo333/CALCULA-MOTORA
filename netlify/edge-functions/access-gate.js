const COOKIE_NAME = '__vetta_access';
const LOGIN_PATH = '/__vetta_access';
const LOGOUT_PATH = '/__vetta_logout';
const SESSION_TTL_SECONDS = 12 * 60 * 60;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export const config = {
  path: '/*',
};

function runtimeEnv(name) {
  if (typeof Netlify === 'undefined' || !Netlify.env) return '';
  return Netlify.env.get(name) || '';
}

export function parseCredentials(raw) {
  let value;
  try {
    value = JSON.parse(raw || '[]');
  } catch {
    return [];
  }

  if (!Array.isArray(value)) return [];

  return value
    .filter(item => item && typeof item === 'object')
    .map(item => ({
      id: String(item.id || '').trim(),
      hash: String(item.hash || '').trim().toLowerCase(),
      expiresAt: item.expiresAt ? String(item.expiresAt) : null,
    }))
    .filter(item => /^[a-z0-9_-]{1,40}$/i.test(item.id))
    .filter(item => /^[a-f0-9]{64}$/.test(item.hash))
    .filter(item => !item.expiresAt || Number.isFinite(Date.parse(item.expiresAt)));
}

export function isCredentialActive(credential, nowMs = Date.now()) {
  if (!credential) return false;
  if (!credential.expiresAt) return true;
  return Date.parse(credential.expiresAt) > nowMs;
}

export async function sha256Hex(value) {
  const bytes = textEncoder.encode(String(value));
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return [...digest].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export function constantTimeEqual(left, right) {
  const a = String(left);
  const b = String(right);
  const length = Math.max(a.length, b.length);
  let difference = a.length ^ b.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0);
  }
  return difference === 0;
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '');
}

function base64UrlToBytes(value) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(normalized + padding);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

async function hmacBase64Url(value, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, textEncoder.encode(value)),
  );
  return bytesToBase64Url(signature);
}

export async function createSession(credential, secret, nowMs = Date.now()) {
  const credentialExpiryMs = credential.expiresAt
    ? Date.parse(credential.expiresAt)
    : Number.POSITIVE_INFINITY;
  const expiresAtMs = Math.min(
    nowMs + SESSION_TTL_SECONDS * 1000,
    credentialExpiryMs,
  );

  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= nowMs) {
    throw new Error('Credential is expired');
  }

  const payload = {
    version: 1,
    id: credential.id,
    fingerprint: credential.hash.slice(0, 16),
    expiresAt: Math.floor(expiresAtMs / 1000),
  };
  const encodedPayload = bytesToBase64Url(
    textEncoder.encode(JSON.stringify(payload)),
  );
  const signature = await hmacBase64Url(encodedPayload, secret);

  return {
    token: `${encodedPayload}.${signature}`,
    expiresAt: payload.expiresAt,
  };
}

export async function verifySession(token, credentials, secret, nowMs = Date.now()) {
  if (!token || !secret) return null;
  const pieces = String(token).split('.');
  if (pieces.length !== 2) return null;

  const [encodedPayload, suppliedSignature] = pieces;
  const expectedSignature = await hmacBase64Url(encodedPayload, secret);
  if (!constantTimeEqual(suppliedSignature, expectedSignature)) return null;

  let payload;
  try {
    payload = JSON.parse(textDecoder.decode(base64UrlToBytes(encodedPayload)));
  } catch {
    return null;
  }

  const nowSeconds = Math.floor(nowMs / 1000);
  if (
    payload?.version !== 1 ||
    typeof payload.id !== 'string' ||
    typeof payload.fingerprint !== 'string' ||
    !Number.isInteger(payload.expiresAt) ||
    payload.expiresAt <= nowSeconds
  ) {
    return null;
  }

  const credential = credentials.find(item => item.id === payload.id);
  if (!isCredentialActive(credential, nowMs)) return null;
  if (!constantTimeEqual(payload.fingerprint, credential.hash.slice(0, 16))) {
    return null;
  }

  return payload;
}

function readCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const [cookieName, ...cookieValue] = part.trim().split('=');
    if (cookieName === name) return cookieValue.join('=');
  }
  return '';
}

function safeNext(value) {
  const candidate = String(value || '/');
  if (!candidate.startsWith('/') || candidate.startsWith('//')) return '/';
  return candidate.slice(0, 1500);
}

function redirect(location, cookie = '') {
  const headers = new Headers({
    location,
    'cache-control': 'no-store, max-age=0',
  });
  if (cookie) headers.append('set-cookie', cookie);
  return new Response(null, { status: 303, headers });
}

function sessionCookie(token, maxAge) {
  return [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    `Max-Age=${Math.max(0, Math.floor(maxAge))}`,
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
  ].join('; ');
}

function clearedCookie() {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}

function loginPage(next, message = '', status = 401) {
  const feedback = message
    ? `<p class="feedback" role="alert">${message}</p>`
    : '<p class="hint">Digite a senha enviada pelo responsável da demonstração.</p>';

  return new Response(`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#0b1121">
  <title>Acesso à demonstração | VETTA</title>
  <style>
    :root{color-scheme:light;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f8fafc;color:#0f172a}
    *{box-sizing:border-box}body{min-height:100vh;margin:0;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at top,#dbeafe 0,#f8fafc 42%)}
    main{width:min(100%,420px);background:#fff;border:1px solid #e2e8f0;border-radius:28px;padding:32px;box-shadow:0 24px 70px rgba(15,23,42,.14)}
    .brand{display:flex;align-items:center;gap:12px;margin-bottom:28px}.mark{width:48px;height:48px;border-radius:16px;display:grid;place-items:center;background:#0b1121;color:#fff;font-weight:900}.brand strong{display:block;font-size:22px}.brand span{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#64748b;font-weight:800}
    h1{font-size:28px;line-height:1.1;margin:0 0 10px}p{line-height:1.55}.hint{color:#64748b;font-size:14px;margin:0 0 22px}.feedback{color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;border-radius:14px;padding:12px 14px;font-size:14px;margin:0 0 18px}
    label{display:block;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;color:#475569}input{width:100%;border:1px solid #cbd5e1;border-radius:16px;padding:15px 16px;font-size:16px;outline:none}input:focus{border-color:#2563eb;box-shadow:0 0 0 4px rgba(37,99,235,.12)}button{width:100%;border:0;border-radius:16px;padding:15px 18px;margin-top:14px;background:#2563eb;color:#fff;font-size:15px;font-weight:800;cursor:pointer}small{display:block;margin-top:18px;color:#94a3b8;text-align:center}
  </style>
</head>
<body data-vetta-access-gate="true">
  <main>
    <div class="brand"><div class="mark">V</div><div><strong>VETTA</strong><span>Driver Intelligence</span></div></div>
    <h1>Demonstração protegida</h1>
    ${feedback}
    <form method="post" action="${LOGIN_PATH}">
      <input type="hidden" name="next" value="${next.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}">
      <label for="password">Senha de acesso</label>
      <input id="password" name="password" type="password" required autocomplete="current-password" autofocus>
      <button type="submit">Entrar na demonstração</button>
    </form>
    <small>O acesso pode ser revogado a qualquer momento.</small>
  </main>
</body>
</html>`, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
      'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    },
  });
}

function unavailablePage() {
  return new Response('A demonstração está temporariamente indisponível.', {
    status: 503,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
    },
  });
}

export default async function accessGate(request, context) {
  try {
    const credentials = parseCredentials(
      runtimeEnv('VETTA_ACCESS_CREDENTIALS_JSON'),
    );
    const sessionSecret = runtimeEnv('VETTA_ACCESS_SESSION_SECRET');

    if (credentials.length === 0 || sessionSecret.length < 32) {
      return unavailablePage();
    }

    const url = new URL(request.url);

    if (url.pathname === LOGOUT_PATH) {
      return redirect('/', clearedCookie());
    }

    if (url.pathname === LOGIN_PATH) {
      if (request.method === 'GET') {
        return loginPage(safeNext(url.searchParams.get('next')));
      }
      if (request.method !== 'POST') {
        return new Response('Método não permitido.', { status: 405 });
      }

      const form = await request.formData();
      const password = String(form.get('password') || '');
      const next = safeNext(form.get('next'));
      const suppliedHash = await sha256Hex(password);
      const nowMs = Date.now();
      const credential = credentials.find(item =>
        isCredentialActive(item, nowMs) &&
        constantTimeEqual(item.hash, suppliedHash),
      );

      if (!credential) {
        return loginPage(next, 'Senha inválida ou expirada.', 401);
      }

      const session = await createSession(credential, sessionSecret, nowMs);
      const maxAge = session.expiresAt - Math.floor(nowMs / 1000);
      return redirect(next, sessionCookie(session.token, maxAge));
    }

    const token = readCookie(request, COOKIE_NAME);
    const validSession = await verifySession(
      token,
      credentials,
      sessionSecret,
    );
    if (validSession) return context.next();

    const acceptsHtml = (request.headers.get('accept') || '').includes('text/html');
    if (request.method === 'GET' && (request.mode === 'navigate' || acceptsHtml)) {
      return loginPage(safeNext(`${url.pathname}${url.search}`));
    }

    return new Response('Acesso não autorizado.', {
      status: 401,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-store, max-age=0',
      },
    });
  } catch {
    return unavailablePage();
  }
}

import { createClient } from '@supabase/supabase-js';

const SUPABASE_DEV_PROXY_PREFIX = '/__supabase_proxy__';
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase client env is not configured.');
}

const supabaseOrigin = new URL(supabaseUrl).origin;
const isBrowser = typeof window !== 'undefined';

const resolveRequestUrl = (input) => {
  const browserOrigin = globalThis.location?.origin || 'http://localhost';

  if (input instanceof Request) {
    return new URL(input.url, browserOrigin);
  }

  if (input instanceof URL) {
    return input;
  }

  if (typeof input === 'string') {
    return new URL(input, browserOrigin);
  }

  return null;
};

const routeSupabaseRequest = (input) => {
  if (!isBrowser) {
    return input;
  }

  const requestUrl = resolveRequestUrl(input);

  if (!requestUrl || requestUrl.origin !== supabaseOrigin) {
    return input;
  }

  return `${SUPABASE_DEV_PROXY_PREFIX}${requestUrl.pathname}${requestUrl.search}`;
};

const supabaseFetch = (input, init) => {
  const proxiedInput = routeSupabaseRequest(input);

  if (input instanceof Request && typeof proxiedInput === 'string') {
    return fetch(new Request(proxiedInput, input), init);
  }

  return fetch(proxiedInput, init);
};

export const getSupabaseRequestUrl = (path) => (
  isBrowser
    ? `${SUPABASE_DEV_PROXY_PREFIX}${path}`
    : `${supabaseUrl}${path}`
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: supabaseFetch,
  },
});

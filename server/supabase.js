const { createClient } = require('@supabase/supabase-js');
const { getRequiredEnv } = require('./config');

let cachedClient = null;

const getSupabaseClient = () => {
  if (!cachedClient) {
    cachedClient = createClient(
      getRequiredEnv('SUPABASE_URL'),
      getRequiredEnv('SUPABASE_ANON_KEY'),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  return cachedClient;
};

const verifySupabaseAccessToken = async (token) => {
  const { data, error } = await getSupabaseClient().auth.getUser(token);

  if (error || !data.user) {
    throw new Error(error?.message || 'Supabase user could not be verified.');
  }

  return data.user;
};

module.exports = {
  getSupabaseClient,
  verifySupabaseAccessToken,
};

/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseRequestUrl, supabase, supabaseAnonKey } from '../lib/supabase';

const AppContext = createContext();
const EMAIL_ACTION_COOLDOWN_MS = 60 * 1000;

const getSupabaseErrorMessage = (error, fallbackMessage) => error?.message || fallbackMessage;
const normalizeEmail = (email) => email.trim().toLowerCase();
const isEmailConfirmationPending = (error) =>
  error?.code === 'email_not_confirmed'
  || /email not confirmed/i.test(error?.message || '');
const isFetchFailure = (error) => /failed to fetch/i.test(error?.message || '');
const isEmailRateLimited = (error) =>
  error?.code === 'over_email_send_rate_limit'
  || /email rate limit/i.test(error?.message || '')
  || /too many requests/i.test(error?.message || '');
const authHeaders = {
  apikey: supabaseAnonKey,
  'Content-Type': 'application/json',
};

const readJson = async (response) => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

const parseAuthResponse = async (response, fallbackMessage) => {
  const payload = await readJson(response);

  if (!response.ok) {
    const error = new Error(
      payload?.msg
      || payload?.message
      || payload?.error_description
      || payload?.error
      || fallbackMessage
    );

    error.code = payload?.code || payload?.error_code;
    error.status = response.status;
    throw error;
  }

  return payload || {};
};

const signUpWithRestFallback = async ({ name, email, password, totalBalance }) => {
  const response = await fetch(getSupabaseRequestUrl('/auth/v1/signup'), {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      email,
      password,
      data: {
        name: name.trim(),
        totalBalance: Number(totalBalance) || 0,
      },
    }),
  });

  return parseAuthResponse(response, 'Unable to create your account.');
};

const signInWithRestFallback = async ({ email, password }) => {
  const response = await fetch(getSupabaseRequestUrl('/auth/v1/token?grant_type=password'), {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ email, password }),
  });

  return parseAuthResponse(response, 'Unable to sign in.');
};

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState('');
  const [emailCooldownUntil, setEmailCooldownUntil] = useState(0);

  const clearSessionState = () => {
    setToken(null);
    setUser(null);
    setTransactions([]);
    setSummary(null);
  };

  const startEmailCooldown = () => {
    setEmailCooldownUntil(Date.now() + EMAIL_ACTION_COOLDOWN_MS);
  };

  const calculateSummary = (transList, profile) => {
    if (!profile) return null;

    let totalSpent = 0;
    let totalBorrowed = 0;
    let totalLent = 0;
    const categoryBreakdown = {};

    transList.forEach((transaction) => {
      const amount = Number(transaction.amount) || 0;
      if (transaction.type === 'expense') {
        totalSpent += amount;
        categoryBreakdown[transaction.category] =
          (categoryBreakdown[transaction.category] || 0) + amount;
      } else if (transaction.type === 'borrowed') {
        totalBorrowed += amount;
      } else if (transaction.type === 'lent') {
        totalLent += amount;
      }
    });

    const totalBalance = Number(profile.total_balance) || 0;

    return {
      totalBalance,
      currentBalance: totalBalance - totalSpent - totalLent + totalBorrowed,
      totalSpent,
      totalBorrowed,
      totalLent,
      categoryBreakdown,
      transactionCount: transList.length,
    };
  };

  const ensureProfile = async (authUser) => {
    const defaultProfile = {
      id: authUser.id,
      name: authUser.user_metadata?.name?.trim() || authUser.email?.split('@')[0] || '',
      total_balance: Number(authUser.user_metadata?.totalBalance) || 0,
    };

    const { data: existingProfile, error: lookupError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (lookupError) {
      throw lookupError;
    }

    if (existingProfile) {
      return existingProfile;
    }

    const { data: createdProfile, error: createError } = await supabase
      .from('profiles')
      .insert([defaultProfile])
      .select('*')
      .single();

    if (createError) {
      throw createError;
    }

    return createdProfile || defaultProfile;
  };

  const loadAllData = async (authUserArg) => {
    try {
      setLoading(true);
      const authUser = authUserArg || (await supabase.auth.getUser()).data.user;

      if (!authUser?.id) {
        throw new Error('Unable to restore your account session.');
      }

      const profile = await ensureProfile(authUser);

      const { data: transData, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', authUser.id)
        .order('date', { ascending: false });

      if (transError) throw transError;

      const transList = transData || [];

      const normalizedTransactions = transList.map((t) => ({
        ...t,
        _id: t.id,
        userId: t.user_id,
      }));

      const userData = {
        id: profile.id,
        name: profile.name,
        email: authUser.email,
        totalBalance: profile.total_balance,
      };

      setUser(userData);
      setTransactions(normalizedTransactions);
      setSummary(calculateSummary(normalizedTransactions, profile));
      setError('');
      setNotice('');
      setPendingConfirmationEmail('');
    } catch (err) {
      console.error('Failed to load data:', err.message);
      setError(getSupabaseErrorMessage(err, 'Unable to load your account data.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrapSession = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (sessionError) {
          setError(getSupabaseErrorMessage(sessionError, 'Unable to restore your session.'));
          setLoading(false);
          return;
        }

        const accessToken = data.session?.access_token ?? null;
        setToken(accessToken);

        if (data.session?.user?.id) {
          await loadAllData(data.session.user);
        } else {
          setLoading(false);
        }
      } catch (bootstrapError) {
        if (!isMounted) return;
        setError(getSupabaseErrorMessage(bootstrapError, 'Unable to restore your session.'));
        clearSessionState();
        setLoading(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      const accessToken = session?.access_token ?? null;
      setToken(accessToken);

      if (event === 'SIGNED_OUT' || !accessToken) {
        clearSessionState();
        setLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user?.id) {
          loadAllData(session.user);
        }
      }
    });

    void bootstrapSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signup = async (name, email, password, totalBalance) => {
    try {
      const normalizedEmail = normalizeEmail(email);
      const trimmedName = name.trim();
      const openingBalance = Number(totalBalance) || 0;

      setError('');
      setNotice('');
      setLoading(true);

      let data;

      try {
        const signupResult = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              name: trimmedName,
              totalBalance: openingBalance,
            },
          },
        });

        if (signupResult.error) {
          throw signupResult.error;
        }

        data = signupResult.data;
      } catch (sdkError) {
        if (!isFetchFailure(sdkError)) {
          throw sdkError;
        }

        data = await signUpWithRestFallback({
          name: trimmedName,
          email: normalizedEmail,
          password,
          totalBalance: openingBalance,
        });

        if (data.access_token && data.refresh_token) {
          await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
          });
        }
      }

      const user_id = data.user?.id || data.session?.user?.id;

      const accessToken =
        data.session?.access_token
        || data.access_token
        || null;

      if (!accessToken) {
        setPendingConfirmationEmail(normalizedEmail);
        startEmailCooldown();
        setNotice(
          'Account created. Check your inbox and spam folder to confirm your email before signing in.'
        );
        setLoading(false);
        return;
      }

      setPendingConfirmationEmail('');
      setToken(accessToken);
      if (user_id) {
        await loadAllData(data.user || data.session?.user || { id: user_id, email: normalizedEmail });
      }
    } catch (signupFailure) {
      setLoading(false);
      if (isEmailRateLimited(signupFailure)) {
        startEmailCooldown();
        setNotice('Too many email attempts. Wait a minute before trying again.');
        setError('');
      } else {
        setError(getSupabaseErrorMessage(signupFailure, 'Unable to create your account.'));
      }

      throw signupFailure;
    }
  };

  const login = async (email, password) => {
    try {
      const normalizedEmail = normalizeEmail(email);

      setError('');
      setNotice('');
      setLoading(true);

      let data;

      try {
        const loginResult = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (loginResult.error) {
          throw loginResult.error;
        }

        data = loginResult.data;
      } catch (sdkError) {
        if (!isFetchFailure(sdkError)) {
          throw sdkError;
        }

        data = await signInWithRestFallback({ email: normalizedEmail, password });

        if (data.access_token && data.refresh_token) {
          await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
          });
        }
      }

      const accessToken =
        data.session?.access_token
        || data.access_token
        || null;
      const userId = data.user?.id || data.session?.user?.id;

      setPendingConfirmationEmail('');
      setToken(accessToken);
      if (userId) {
        await loadAllData(data.user || data.session?.user || { id: userId, email: normalizedEmail });
      }
    } catch (loginFailure) {
      setLoading(false);
      if (isEmailConfirmationPending(loginFailure)) {
        setPendingConfirmationEmail(normalizeEmail(email));
        setNotice(
          'Confirm your email before signing in. Check your inbox and spam folder, or resend the confirmation email below.'
        );
      } else {
        setError(getSupabaseErrorMessage(loginFailure, 'Unable to sign in.'));
      }
      throw loginFailure;
    }
  };

  const resendConfirmation = async (email = pendingConfirmationEmail) => {
    try {
      const normalizedEmail = normalizeEmail(email);
      if (!normalizedEmail) throw new Error('Enter your email address first.');

      if (emailCooldownUntil > Date.now()) {
        throw new Error('Please wait before sending another confirmation email.');
      }

      setError('');
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
      });

      if (resendError) throw resendError;
      startEmailCooldown();
      setNotice('Confirmation email sent again. Check your inbox and spam folder.');
    } catch (resendFailure) {
      if (isEmailRateLimited(resendFailure)) {
        startEmailCooldown();
        setNotice('Too many email attempts. Wait a minute before trying again.');
        setError('');
      } else {
        setError(getSupabaseErrorMessage(resendFailure, 'Unable to resend confirmation email.'));
      }

      throw resendFailure;
    }
  };

  const logout = () => {
    clearSessionState();
    void supabase.auth.signOut();
  };

  const addTransaction = async (transactionData) => {
    try {
      setError('');
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('User not authenticated');

      const { error: insertError } = await supabase
        .from('transactions')
        .insert([{
          user_id: authUser.id,
          type: transactionData.type,
          amount: Number(transactionData.amount),
          category: transactionData.category,
          description: transactionData.description || '',
          person: transactionData.person || '',
          date: transactionData.date || new Date().toISOString(),
        }]);

      if (insertError) throw insertError;
      await loadAllData(authUser);
    } catch (err) {
      setError(err.message || 'Failed to add transaction');
      throw err;
    }
  };

  const deleteTransaction = async (id) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await loadAllData(authUser);
    } catch {
      setError('Unable to delete this transaction.');
    }
  };

  const resetBalance = async (currentBalance) => {
    try {
      setError('');
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('User not authenticated');

      // Summary is needed to back-calculate the initial total_balance
      // TotalBalance = RequestedCurrentBalance + totalSpent + totalLent - totalBorrowed
      const newTotalBalance =
        Number(currentBalance)
        + (summary?.totalSpent || 0)
        + (summary?.totalLent || 0)
        - (summary?.totalBorrowed || 0);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ total_balance: newTotalBalance })
        .eq('id', authUser.id);

      if (updateError) throw updateError;
      await loadAllData(authUser);
    } catch (err) {
      setError(err.message || 'Unable to reset your balance.');
      throw err;
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        transactions,
        summary,
        loading,
        error,
        notice,
        pendingConfirmationEmail,
        emailCooldownUntil,
        signup,
        login,
        logout,
        resendConfirmation,
        addTransaction,
        deleteTransaction,
        resetBalance,
        setError,
        setNotice,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);

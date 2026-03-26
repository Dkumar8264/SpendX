/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext();

const getSupabaseErrorMessage = (error, fallbackMessage) => error?.message || fallbackMessage;
const isEmailConfirmationPending = (error) =>
  error?.code === 'email_not_confirmed'
  || /email not confirmed/i.test(error?.message || '');

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState('');

  const clearSessionState = () => {
    setToken(null);
    setUser(null);
    setTransactions([]);
    setSummary(null);
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

  const loadAllData = async (userId) => {
    try {
      setLoading(true);

      // Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "No rows found"
        throw profileError;
      }

      // Fetch Transactions
      const { data: transData, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (transError) throw transError;

      const profile = profileData || { id: userId, name: '', total_balance: 0 };
      const transList = transData || [];

      // Map Supabase fields to the UI expected fields (if different)
      const normalizedTransactions = transList.map((t) => ({
        ...t,
        _id: t.id, // UI expects _id from MongoDB
        userId: t.user_id,
      }));

      const userData = {
        id: profile.id,
        name: profile.name,
        email: (await supabase.auth.getUser()).data.user?.email,
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
          await loadAllData(data.session.user.id);
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
          loadAllData(session.user.id);
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
      setError('');
      setNotice('');
      setLoading(true);

      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name.trim(),
            totalBalance: Number(totalBalance) || 0,
          },
        },
      });

      if (signupError) throw signupError;

      const user_id = data.user?.id || data.session?.user?.id;

      if (user_id) {
        // Create Profile record
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user_id,
              name: name.trim(),
              total_balance: Number(totalBalance) || 0,
            },
          ]);

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // We don't throw here to avoid blocking signup if Profile fails but user exists
        }
      }

      const accessToken = data.session?.access_token ?? null;

      if (!accessToken) {
        setPendingConfirmationEmail(email.trim());
        setNotice(
          'Account created. Check your inbox and spam folder to confirm your email before signing in.'
        );
        setLoading(false);
        return;
      }

      setPendingConfirmationEmail('');
      setToken(accessToken);
      if (user_id) await loadAllData(user_id);
    } catch (signupFailure) {
      setLoading(false);
      setError(getSupabaseErrorMessage(signupFailure, 'Unable to create your account.'));
      throw signupFailure;
    }
  };

  const login = async (email, password) => {
    try {
      setError('');
      setNotice('');
      setLoading(true);

      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;

      const accessToken = data.session?.access_token ?? null;
      const userId = data.user?.id;

      setPendingConfirmationEmail('');
      setToken(accessToken);
      if (userId) await loadAllData(userId);
    } catch (loginFailure) {
      setLoading(false);
      if (isEmailConfirmationPending(loginFailure)) {
        setPendingConfirmationEmail(email.trim());
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
      const normalizedEmail = email.trim();
      if (!normalizedEmail) throw new Error('Enter your email address first.');

      setError('');
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
      });

      if (resendError) throw resendError;
      setNotice('Confirmation email sent again. Check your inbox and spam folder.');
    } catch (resendFailure) {
      setError(getSupabaseErrorMessage(resendFailure, 'Unable to resend confirmation email.'));
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
      await loadAllData(authUser.id);
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
      await loadAllData(authUser.id);
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
      await loadAllData(authUser.id);
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

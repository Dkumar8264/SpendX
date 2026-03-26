/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AppContext = createContext();

const API_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const api = axios.create({
    baseURL: API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  useEffect(() => {
    if (token) {
      loadUser();
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUser = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/auth/me');
      setUser(data);
      await loadTransactions();
      await loadSummary();
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password, totalBalance) => {
    try {
      setError('');
      const { data } = await axios.post(`${API_URL}/auth/signup`, {
        name,
        email,
        password,
        totalBalance,
      });
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (error) {
      setError(error.response?.data?.message || 'Unable to create your account.');
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      setError('');
      const { data } = await axios.post(`${API_URL}/auth/login`, { email, password });
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (error) {
      setError(error.response?.data?.message || 'Unable to sign in.');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setTransactions([]);
    setSummary(null);
  };

  const loadTransactions = async () => {
    try {
      const { data } = await api.get('/transactions');
      setTransactions(data);
    } catch {
      console.error('Failed to load transactions');
    }
  };

  const loadSummary = async () => {
    try {
      const { data } = await api.get('/transactions/summary');
      setSummary(data);
    } catch {
      console.error('Failed to load summary');
    }
  };

  const addTransaction = async (transactionData) => {
    try {
      setError('');
      await api.post('/transactions', transactionData);
      await loadTransactions();
      await loadSummary();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add transaction');
      throw error;
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
      await loadTransactions();
      await loadSummary();
    } catch {
      setError('Unable to delete this transaction.');
    }
  };

  const resetBalance = async (currentBalance) => {
    try {
      setError('');
      const { data } = await api.patch('/auth/balance', { currentBalance });
      setUser(data.user);
      setSummary(data.summary);
    } catch (error) {
      setError(error.response?.data?.message || 'Unable to reset your balance.');
      throw error;
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
        signup,
        login,
        logout,
        addTransaction,
        deleteTransaction,
        resetBalance,
        setError,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);

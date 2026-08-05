import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { jwtDecode } from 'jwt-decode'; // need to install jwt-decode

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkUserLoggedIn();
  }, []);

  const checkUserLoggedIn = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          const res = await api.get('/auth-me');
          setUser(res.data?.data || null);
        }
      } catch (err) {
        logout();
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const endpoint = '/auth-admin-login';
      const res = await api.post(endpoint, { email, password });
      
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setError(null);
      return res.data.user;
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
      throw err;
    }
  };

  const candidateStart = async (name, registerNumber, department, year, quizId) => {
    try {
      const res = await api.post('/auth-candidate-start', { name, registerNumber, department, year, quizId });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setError(null);
      return res.data.user;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start quiz');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, candidateStart, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

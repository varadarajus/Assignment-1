// frontend/src/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import API from './api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      API.get('/auth/me').then(res => setUser(res.data)).catch(() => setUser(null)).finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    return API.get('/auth/me').then(res => setUser(res.data));
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

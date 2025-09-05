import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const UserContext = createContext(null);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const login = useCallback((userData) => {
    const { token, role, permissions } = userData;
    // If token is an object with access token, use that, otherwise use the token string
    const tokenString = typeof token === 'object' ? token.access : token;
    localStorage.setItem('token', tokenString);
    localStorage.setItem('role', role);
    localStorage.setItem('permissions', JSON.stringify(permissions || {}));
    setUser({ ...userData, token: tokenString });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('permissions');
    setUser(null);
    // Redirect to login page
    navigate('/', { replace: true });
  }, [navigate]);

  // refresh user from backend if token exists
  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api/auth';
    
    const refresh = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        logout();
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/me`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // Check specific error responses
        if (res.status === 401 || res.status === 403) {
          // Token expired or invalid
          logout();
          throw new Error('Session expired. Please login again.');
        }

        if (!res.ok) {
          throw new Error('Authentication failed');
        }

        const data = await res.json();
        const userData = { 
          token, 
          role: data.role, 
          permissions: data.permissions, 
          name: data.username || data.email || data.role,
          id: data.id
        };

        setUser(userData);
        localStorage.setItem('role', data.role);
        localStorage.setItem('permissions', JSON.stringify(data.permissions || {}));
      } catch (e) {
        console.error('Auth check failed:', e);
        logout();
        // Force navigation to login if token is invalid/expired
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      } finally {
        setLoading(false);
      }
    };
    refresh();
    // ensure loading flag ends if no token or after refresh
    const token = localStorage.getItem('token');
    if (!token) setLoading(false);
    else {
      // wait a tick to set loading false after refresh attempts
      (async () => {
        try {
          // small delay to allow refresh to complete
          await new Promise(r => setTimeout(r, 300));
        } finally {
          setLoading(false);
        }
      })();
    }
  }, []);

  return (
    <UserContext.Provider value={{ 
      user, 
      login,
      logout,
      loading 
    }}>
      {children}
    </UserContext.Provider>
  );
};

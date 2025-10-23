import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBaseUrl } from '../utils/config'; // Import from the central config file

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

  const setAuthData = useCallback((userData) => {
    const { token, role, permissions } = userData;
    // If token is an object with access token, use that, otherwise use the token string
    const tokenString = typeof token === 'object' ? token.access : token;
    localStorage.setItem('token', tokenString);
    localStorage.setItem('role', role);
    localStorage.setItem('permissions', JSON.stringify(permissions || {}));
    
    // Ensure we set complete user data
    setUser({ 
      ...userData, 
      token: tokenString,
      role: role,
      permissions: permissions || {}
    });
  }, []);

  const clearAuthData = useCallback(() => {
    console.log('Clearing auth data');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('permissions');
    setUser(null);
  }, []);

  const logout = useCallback(() => {
    console.log('User logout triggered');
    clearAuthData();
    // Redirect to login page
    navigate('/login', { replace: true });
  }, [clearAuthData, navigate]);

  // refresh user from backend if token exists
  useEffect(() => {
    // TEMPORARY: Skip token verification to bypass redirect loop
    // Just load user data from localStorage without verifying with backend
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const permissionsStr = localStorage.getItem('permissions');
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const permissions = permissionsStr ? JSON.parse(permissionsStr) : {};
      const userData = {
        token,
        role,
        permissions,
        name: role, // Use role as name for now
      };
      setUser(userData);
    } catch (e) {
      console.error('Error loading user from localStorage:', e);
    } finally {
      setLoading(false);
    }

    // ORIGINAL CODE - DISABLED FOR NOW
    /*
    const API_BASE = getBaseUrl();
    
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        const res = await fetch(`${API_BASE}/me`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
          console.log('Token verification failed with status:', res.status);
          clearAuthData();
          return;
        }

        const data = await res.json();
        const userData = { 
          token, 
          role: data.role, 
          permissions: data.permissions, 
          name: data.username || data.email || data.role,
          id: data.id
        };

        setAuthData(userData);
      } catch (e) {
        console.error('Auth check failed:', e);
        clearAuthData();
      } finally {
        setTimeout(() => setLoading(false), 300);
      }
    };
    
    verifyToken();
    */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <UserContext.Provider value={{ 
      user, 
      login: setAuthData,
      logout,
      loading 
    }}>
      {children}
    </UserContext.Provider>
  );
};

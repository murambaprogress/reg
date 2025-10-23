/**
 * Authentication utilities for handling token management and auth state
 */
import axios from './axios';
import { authConfig } from './config';

// Store authentication tokens and user data
export const setAuthTokens = (tokens) => {
  if (tokens.access) {
    localStorage.setItem(authConfig.tokenKey, tokens.access);
  }
  
  if (tokens.refresh) {
    localStorage.setItem(authConfig.refreshTokenKey, tokens.refresh);
  }
  
  // Set token expiry (default to 24 hours if not specified)
  const expiryTime = tokens.expiry || Date.now() + (24 * 60 * 60 * 1000);
  localStorage.setItem(authConfig.tokenExpiry, expiryTime);
};

// Store user data in local storage
export const setCurrentUser = (userData) => {
  localStorage.setItem(authConfig.userKey, JSON.stringify(userData));
};

// Get the current user from local storage
export const getCurrentUser = () => {
  try {
    const userString = localStorage.getItem(authConfig.userKey);
    return userString ? JSON.parse(userString) : null;
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem(authConfig.tokenKey);
  const expiry = localStorage.getItem(authConfig.tokenExpiry);
  
  if (!token) {
    return false;
  }
  
  // Check if token has expired
  if (expiry && Date.now() > parseInt(expiry, 10)) {
    logout();
    return false;
  }
  
  return true;
};

// Get the current access token
export const getAccessToken = () => {
  return localStorage.getItem(authConfig.tokenKey);
};

// Refresh the access token using the refresh token
export const refreshToken = async () => {
  const refreshToken = localStorage.getItem(authConfig.refreshTokenKey);
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  try {
    const response = await axios.post('/token/refresh/', {
      refresh: refreshToken
    });
    
    if (response.data && response.data.access) {
      setAuthTokens({
        access: response.data.access,
        refresh: response.data.refresh || refreshToken
      });
      return response.data.access;
    } else {
      throw new Error('Invalid response from refresh token endpoint');
    }
  } catch (error) {
    console.error('Failed to refresh token:', error);
    logout();
    throw error;
  }
};

// Log out the current user
export const logout = () => {
  localStorage.removeItem(authConfig.tokenKey);
  localStorage.removeItem(authConfig.refreshTokenKey);
  localStorage.removeItem(authConfig.tokenExpiry);
  localStorage.removeItem(authConfig.userKey);
};

// Login function that handles the entire login flow
export const login = async (username, password) => {
  try {
    const response = await axios.post('/login/', {
      username,
      password
    });
    
    if (response.data) {
      setAuthTokens({
        access: response.data.access_token,
        refresh: response.data.refresh_token
      });
      
      setCurrentUser(response.data.user);
      return response.data;
    }
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

export default {
  setAuthTokens,
  setCurrentUser,
  getCurrentUser,
  isAuthenticated,
  getAccessToken,
  refreshToken,
  logout,
  login
};
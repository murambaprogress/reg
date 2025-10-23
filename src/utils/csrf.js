// CSRF utility for React app
// Usage: import { getCSRFToken, fetchAndStoreCSRFToken } from './csrf';

// Get CSRF token from cookies
export function getCSRFToken() {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : null;
}

// Fetch CSRF token from backend and set cookie
export async function fetchAndStoreCSRFToken() {
  // Adjust endpoint if your backend exposes a different one
  await fetch('/get-csrf-token/', {
    credentials: 'include',
  });
}

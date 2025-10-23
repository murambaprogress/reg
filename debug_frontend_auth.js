console.log('=== Frontend Auth Debug ===');
console.log('Token in localStorage:', localStorage.getItem('token'));
console.log('Current user:', localStorage.getItem('currentUser'));
console.log('Token expiry:', localStorage.getItem('tokenExpiry'));

// Test if the token is valid by making a simple API call
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';
const token = localStorage.getItem('token');

if (token) {
    fetch(`${API_BASE}/me`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        console.log('Token validation response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Token validation response:', data);
    })
    .catch(error => {
        console.error('Token validation error:', error);
    });
} else {
    console.log('No token found in localStorage');
}
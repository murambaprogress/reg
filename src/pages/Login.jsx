import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../components/UserContext';
import Button from '../components/ui/Button';

import Icon from '../components/AppIcon';



// Abstract SVG lines for left background
const AbstractLines = () => (
  <svg className="absolute left-0 top-0 h-full w-1/2 z-0" viewBox="0 0 600 800" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="lines" x1="0" y1="0" x2="600" y2="800" gradientUnits="userSpaceOnUse">
        <stop stopColor="#b3cfff" stopOpacity="0.18" />
        <stop offset="1" stopColor="#0a2540" stopOpacity="0.08" />
      </linearGradient>
    </defs>
    {[...Array(8)].map((_, i) => (
      <path
        key={i}
        d={`M${50 + i * 30},0 Q${200 + i * 20},400 ${100 + i * 40},800`}
        stroke="url(#lines)"
        strokeWidth="2"
        fill="none"
        opacity={0.7 - i * 0.08}
      />
    ))}
  </svg>
);

const Login = () => {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const { login } = useUser();
  const navigate = useNavigate();
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api/auth';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (!username || !password) {
        setError('Please provide username and password');
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.message || `Login failed: ${res.status}`);
        setLoading(false);
        return;
      }
      
      if (data.otpRequired) {
        // OTP step required (supervisor or admin)
        setOtpRequired(true);
        setOtpEmail('murambaprogress@gmail.com');
        setLoading(false);
        return;
      }
      
      // Normal login returned token and permissions
      const { token, role, permissions } = data;
      login({ token, role, permissions, name: username });
      navigate('/dashboard-overview');
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setLoading(true);
    
    if (!otpCode || !otpEmail) {
      setError('Enter OTP');
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/verify-otp`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email: otpEmail, otp: otpCode })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.message || 'OTP verification failed');
        setLoading(false);
        return;
      }
      
      // If token returned, login complete
      if (data.token) {
        const { token, role, permissions } = data;
        login({ token, role, permissions, name: username });
        navigate('/dashboard-overview');
      } else {
        // simple verified message
        setOtpRequired(false);
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Regimark logo path (used inline next to inputs)
  const logoSrc = "/assets/images/Regimark%20logo.png";

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-background via-surface to-background relative overflow-hidden">
  {/* Abstract lines left background */}
      <AbstractLines />
      <div className="flex flex-1 items-center justify-center relative z-10">
        {/* Login form and big button */}
        <form onSubmit={handleLogin} className="w-full max-w-2xl flex flex-col md:flex-row items-center justify-center gap-12 px-4 py-12">
          {/* Logo above the inputs */}
          <div className="w-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-6 w-full max-w-xs">
              <div className="w-72 h-36 flex items-center justify-center">
                <img src={logoSrc} alt="Regimark logo" className="w-full h-full object-contain" draggable={false} />
              </div>
              {/* Inputs and labels */}
              <div className="w-full">
                <div className="flex flex-col gap-8">
                  {/* Username */}
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      required
                      className="peer w-full bg-transparent border-0 border-b-2 border-blue-300 focus:border-blue-400 text-black placeholder-transparent py-3 px-0 text-lg focus:outline-none"
                      placeholder="Username"
                      autoComplete="username"
                    />
                    <label className="absolute left-0 top-1/2 -translate-y-1/2 text-black text-base pointer-events-none transition-all peer-focus:top-0 peer-focus:text-xs peer-focus:text-black peer-valid:top-0 peer-valid:text-xs peer-valid:text-black">Username</label>
                  </div>
                  {/* Password */}
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className="peer w-full bg-transparent border-0 border-b-2 border-blue-300 focus:border-blue-400 text-black placeholder-transparent py-3 px-0 text-lg focus:outline-none"
                      placeholder="Password"
                      autoComplete="current-password"
                    />
                    <label className="absolute left-0 top-1/2 -translate-y-1/2 text-black text-base pointer-events-none transition-all peer-focus:top-0 peer-focus:text-xs peer-focus:text-black peer-valid:top-0 peer-valid:text-xs peer-valid:text-black">Password</label>
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-blue-200 hover:text-blue-400"
                      onClick={() => setShowPassword(v => !v)}
                      aria-label="Show password"
                    >
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                  </div>
                {/* Remember Password */}
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    className="w-4 h-4 accent-blue-400"
                  />
                  <label htmlFor="remember" className="text-black text-sm">Remember Password</label>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Big circular LOGIN button */}
          <div className="flex flex-col items-center gap-6">
            {error && <div className="text-red-600 mb-2">{error}</div>}
            {!otpRequired ? (
              <button
                type="submit"
                disabled={loading}
                className={`w-44 h-44 rounded-full bg-gradient-to-br from-primary to-accent shadow-2xl flex items-center justify-center text-2xl font-bold text-primary-foreground border-4 border-primary transition-transform ${
                  loading ? 'opacity-75 cursor-not-allowed' : 'hover:scale-105'
                }`}
                style={{ boxShadow: '0 0 40px 0 #dc2626aa' }}
              >
                {loading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    <span className="text-sm">Loading...</span>
                  </div>
                ) : (
                  'LOGIN'
                )}
              </button>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="text-center text-black">Enter the OTP sent to {otpEmail}</div>
                <input 
                  type="text" 
                  value={otpCode} 
                  onChange={e => setOtpCode(e.target.value)} 
                  className="px-4 py-2 border rounded text-center text-lg font-mono tracking-wider" 
                  placeholder="000000"
                  maxLength="6"
                  disabled={loading}
                />
                <button 
                  type="button" 
                  onClick={handleVerifyOtp} 
                  disabled={loading}
                  className={`px-6 py-3 bg-blue-600 text-white rounded flex items-center gap-2 ${
                    loading ? 'opacity-75 cursor-not-allowed' : 'hover:bg-blue-700'
                  }`}
                >
                  {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setOtpRequired(false);
                    setOtpCode('');
                    setError('');
                  }} 
                  disabled={loading}
                  className="px-6 py-3 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
      {/* Forgot password above footer */}
      <div className="w-full flex justify-center mt-4 z-20">
        <button className="px-8 py-2 rounded-t-2xl bg-gradient-to-t from-primary to-accent text-primary-foreground font-bold shadow-lg">Forgot password?</button>
      </div>

    </div>
  );
};

export default Login;

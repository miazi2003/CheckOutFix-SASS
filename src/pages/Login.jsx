import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { API_BASE } from '../config';
import { persistUserPreferences } from '../lib/userPreferences';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const text = await res.text();
      
      if (!res.ok) {
        let errMsg = `Server unreachable (${res.status})`;
        try { errMsg = JSON.parse(text).error; } catch(e) {}
        throw new Error(errMsg);
      }
      
      const data = JSON.parse(text);

      localStorage.setItem('checkoutfix_user', data.userId);
      localStorage.setItem('checkoutfix_token', data.token);
      persistUserPreferences(data.user || { theme: data.theme });
      toast.success('Welcome back!');
      navigate('/app');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-logo">CheckoutFix AI</h1>
        <p className="auth-subtitle">Sign in to your account to continue</p>
        
        <form className="auth-form" onSubmit={handleLogin}>
          <Input 
            label="Email address" 
            type="email" 
            id="email" 
            placeholder="you@example.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
          <Input 
            label="Password" 
            type="password" 
            id="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
          
          <Button type="submit" variant="primary" fullWidth style={{ marginTop: '0.5rem', padding: '0.625rem' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        
        <div className="auth-link">
          Don't have an account? <Link to="/register">Sign up</Link>
        </div>
      </div>
    </div>
  );
}

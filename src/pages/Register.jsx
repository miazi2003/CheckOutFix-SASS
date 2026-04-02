import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { API_BASE } from '../config';
import { persistUserPreferences } from '../lib/userPreferences';
import './Auth.css';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
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
      toast.success('Account created successfully!');
      navigate('/');
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
        <p className="auth-subtitle">Create a new account</p>

        <form className="auth-form" onSubmit={handleRegister}>
          <Input
            label="Full Name"
            type="text"
            id="name"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
            {loading ? 'Creating...' : 'Create Account'}
          </Button>
        </form>
        
        <div className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

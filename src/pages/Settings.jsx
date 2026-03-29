import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function Settings() {
  const [email, setEmail] = useState('');
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const userId = localStorage.getItem('checkoutfix_user');

  useEffect(() => {
    // If we already saved the theme in local DOM before backend loaded
    if (document.body.classList.contains('dark-mode')) {
      setTheme('dark');
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('checkoutfix_token')}`
          }
        });
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();
        
        if (data.user) {
          setEmail(data.user.email);
          setTheme(data.user.theme || 'light');
          
          // Sync backend theme state to local DOM
          if (data.user.theme === 'dark') {
            document.body.classList.add('dark-mode');
          } else {
            document.body.classList.remove('dark-mode');
          }
        }
      } catch (err) {
        toast.error('Could not load profile settings');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    const saveToast = toast.loading('Updating profile...');
    
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('checkoutfix_token')}`
        },
        body: JSON.stringify({ email, theme })
      });
      const text = await res.text();
      
      if (!res.ok) {
        let errMsg = 'Update failed';
        try { errMsg = JSON.parse(text).error; } catch(e) {}
        throw new Error(errMsg);
      }

      // Automatically apply theme locally & persistently
      if (theme === 'dark') {
        localStorage.setItem('checkoutfix_theme', 'dark');
        document.body.classList.add('dark-mode');
      } else {
        localStorage.removeItem('checkoutfix_theme');
        document.body.classList.remove('dark-mode');
      }

      toast.success('Settings saved successfully!', { id: saveToast });
    } catch (err) {
      toast.error(err.message, { id: saveToast });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const result = await Swal.fire({
      title: 'Delete Entire Account?',
      text: "This action is catastrophic. It will PERMANENTLY wipe your account, all attached stores, and every single scan history record forever.",
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#e53e3e',
      confirmButtonText: 'Yes, permanently delete it'
    });

    if (!result.isConfirmed) return;
    
    const delToast = toast.loading('Wiping account...');
    try {
      const res = await fetch(`/api/users/${userId}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('checkoutfix_token')}`
        }
      });
      if (!res.ok) throw new Error('Failed to delete account');
      
      toast.success('Account completely wiped.', { id: delToast });
      
      // Cleanup DOM
      document.body.classList.remove('dark-mode');
      localStorage.removeItem('checkoutfix_user');
      localStorage.removeItem('checkoutfix_token');
      localStorage.removeItem('checkoutfix_theme');
      
      // Force reload to completely dump memory and route back to login
      setTimeout(() => {
         window.location.href = '/login';
      }, 1000);
      
    } catch (err) {
      toast.error(err.message, { id: delToast });
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading settings...</div>;

  return (
    <div style={{ maxWidth: '600px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>Settings</h1>
      
      <Card style={{ marginBottom: '2rem' }}>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex-col gap-4" onSubmit={handleUpdate} style={{ display: 'flex' }}>
            <Input 
              label="Email address" 
              type="email" 
              id="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
            
            <div className="ui-input-wrapper">
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>Interface Theme</label>
              <select className="ui-input" value={theme} onChange={(e) => setTheme(e.target.value)}>
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode (Night)</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card style={{ borderColor: 'var(--color-error)' }}>
        <CardHeader>
          <CardTitle style={{ color: 'var(--color-error)' }}>Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-secondary" style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
            Permanently delete your account and all associated stores. This action cannot be undone and automatically deletes your entire business history.
          </p>
          <Button variant="outline" style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }} onClick={handleDeleteAccount}>
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

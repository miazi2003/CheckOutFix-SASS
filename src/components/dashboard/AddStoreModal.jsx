import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export function AddStoreModal({ isOpen, onClose, onSave }) {
  const [url, setUrl] = useState('');
  const [alertEmail, setAlertEmail] = useState('');
  const [scanFrequency, setScanFrequency] = useState('hourly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('checkoutfix_token')}`
        },
        body: JSON.stringify({ url, alertEmail, scanFrequency })
      });
      const text = await res.text();
      
      if (!res.ok) {
        let errMsg = `Server unreachable (${res.status})`;
        try { errMsg = JSON.parse(text).error; } catch(e) {}
        throw new Error(errMsg);
      }
      
      const data = JSON.parse(text);
      
      onSave(data.store);
      
      // Reset form
      setUrl('');
      setAlertEmail('');
      setScanFrequency('hourly');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add New Store</h2>
          <button className="modal-close" onClick={onClose} disabled={loading}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>{error}</div>}
            
            <Input 
              label="Store URL" 
              id="storeUrl" 
              placeholder="https://mystore.com" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required 
            />
            <Input 
              label="Alert Email" 
              type="email" 
              id="alertEmail" 
              placeholder="alerts@mystore.com" 
              value={alertEmail}
              onChange={(e) => setAlertEmail(e.target.value)}
              required 
            />
            
            <div className="ui-input-wrapper">
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>Scan Frequency</label>
              <select className="ui-input" value={scanFrequency} onChange={(e) => setScanFrequency(e.target.value)}>
                <option value="hourly">Every 1 hour</option>
                <option value="6h">Every 6 hours</option>
                <option value="daily">Daily</option>
              </select>
            </div>
          </div>
          
          <div className="modal-footer">
            <Button variant="ghost" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Store'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

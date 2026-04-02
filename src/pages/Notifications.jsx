import React, { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { API_BASE } from '../config';
import './Report.css';

export default function Notifications() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API_BASE}/scan/alerts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('checkoutfix_token')}`
        }
      });
      const text = await res.text();

      if (!res.ok) {
        let errMsg = `Server unreachable (${res.status})`;
        try { errMsg = JSON.parse(text).error; } catch (e) { }
        throw new Error(errMsg);
      }

      const data = JSON.parse(text);
      setAlerts(data.alerts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleClearAll = async () => {
    const loadingToast = toast.loading('Clearing all notifications...');
    try {
      const res = await fetch(`${API_BASE}/scan/alerts`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('checkoutfix_token')}`
        }
      });
      if (!res.ok) throw new Error('Failed to clear notifications');

      setAlerts([]);
      toast.success('All notifications cleared!', { id: loadingToast });
    } catch (err) {
      toast.error(err.message, { id: loadingToast });
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading notifications...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'var(--color-error)' }}>{error}</div>;

  return (
    <div style={{ maxWidth: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Notifications</h1>
        {alerts.length > 0 && (
          <Button variant="outline" onClick={handleClearAll} style={{ color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trash2 size={16} /> Clear All
          </Button>
        )}
      </div>

      {alerts.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius)' }}>
          <p style={{ color: 'var(--color-text-secondary)' }}>No automated alerts or warnings to report!</p>
        </div>
      ) : (
        <div className="list-container">
          {alerts.map(alert => {
            const isIssue = alert.status === 'issue';
            const storeUrl = alert.storeId?.url || 'Unknown Store';
            const mainIssue = (alert.issues && alert.issues.length > 0) ? alert.issues[0] : 'Checkout flow failed';

            return (
              <div key={alert._id} className="list-item">
                <div className={`list-item-icon ${isIssue ? 'error' : 'warning'}`}>
                  {isIssue ? <AlertCircle size={20} /> : <AlertTriangle size={20} />}
                </div>
                <div className="list-item-content">
                  <div className="list-item-title">
                    <strong>{storeUrl}</strong>: {mainIssue}
                  </div>
                  <div className="list-item-time" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{new Date(alert.createdAt).toLocaleString()}</div>
                </div>
                <div className="list-item-actions">
                  <span className={`text-${isIssue ? 'error' : 'warning'}`} style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                    {alert.status === 'issue' ? 'WARNING' : 'PERFORMANCE'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import './Report.css';

export default function Notifications() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/scan/alerts', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('checkoutfix_token')}`
          }
        });
        const text = await res.text();
        
        if (!res.ok) {
          let errMsg = `Server unreachable (${res.status})`;
          try { errMsg = JSON.parse(text).error; } catch(e) {}
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

    fetchAlerts();
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Loading notifications...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'var(--color-error)' }}>{error}</div>;

  return (
    <div style={{ maxWidth: '800px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>Notifications</h1>
      
      {alerts.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius)' }}>
          <p style={{ color: 'var(--color-text-secondary)' }}>No automated alerts or warnings to report!</p>
        </div>
      ) : (
        <div className="list-container">
          {alerts.map(alert => {
            const isError = alert.status === 'broken';
            const storeUrl = alert.storeId?.url || 'Unknown Store';
            const mainIssue = (alert.issues && alert.issues.length > 0) ? alert.issues[0] : 'Checkout flow failed';
            
            return (
              <div key={alert._id} className="list-item">
                <div className={`list-item-icon ${isError ? 'error' : 'warning'}`}>
                  {isError ? <AlertCircle size={20} /> : <AlertTriangle size={20} />}
                </div>
                <div className="list-item-content">
                  <div className="list-item-title">
                    <strong>{storeUrl}</strong>: {mainIssue}
                  </div>
                  <div className="list-item-time">{new Date(alert.createdAt).toLocaleString()}</div>
                </div>
                <div className="list-item-actions">
                  <span className={`text-${isError ? 'error' : 'warning'}`} style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                    {alert.status}
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

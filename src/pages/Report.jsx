import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { AlertCircle, CheckCircle2, XCircle, ArrowLeft, Zap, Globe, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { API_BASE } from '../config';
import { getStoredSubscription, persistSubscription } from '../lib/session';
import './Report.css';

export default function Report() {
  const { id } = useParams();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [subscription, setSubscription] = useState(getStoredSubscription());
  const isScanLimitReached = subscription.plan !== 'pro' && (subscription.scansRemaining ?? 0) <= 0;

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/scan/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('checkoutfix_token')}`
        }
      });
      const text = await res.text();
      
      if (!res.ok) {
        let errMsg = `Server unreachable (${res.status})`;
        try { errMsg = JSON.parse(text).error || 'Failed to fetch report'; } catch {}
        throw new Error(errMsg);
      }
      const data = JSON.parse(text);
      
      // Get the latest scan
      if (data.history && data.history.length > 0) {
        setReportData(data.history[0]);
      } else {
        setReportData(null); // No scans yet
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    const fetchSubscription = async () => {
      const userId = localStorage.getItem('checkoutfix_user');

      try {
        const res = await fetch(`${API_BASE}/users/${userId}/subscription`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('checkoutfix_token')}`
          }
        });
        const text = await res.text();

        if (!res.ok) {
          return;
        }

        const data = text ? JSON.parse(text) : {};
        if (data.subscription) {
          setSubscription(data.subscription);
          persistSubscription(data.subscription);
        }
      } catch {
        // Ignore subscription refresh failures here and keep cached values.
      }
    };

    fetchSubscription();
  }, []);

  const handleRunScan = async () => {
    if (isScanLimitReached) {
      toast.error('You have used all free scans for this cycle. Upgrade to keep scanning.');
      return;
    }

    setIsScanning(true);
    const scanToast = toast.loading('Running full checkout automation scan...', { duration: Infinity });
    try {
      const res = await fetch(`${API_BASE}/scan`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('checkoutfix_token')}`
        },
        body: JSON.stringify({ storeId: id })
      });
      if (res.ok) {
        toast.dismiss(scanToast);
        toast.success('Scan completed successfully!');
        const data = await res.json();
        if (data.subscription) {
          setSubscription(data.subscription);
          persistSubscription(data.subscription);
        }
        await fetchHistory(); // Refresh to get the new scan
      } else {
        const data = await res.json();
        if (data.subscription) {
          setSubscription(data.subscription);
          persistSubscription(data.subscription);
        }
        toast.error('Scan failed: ' + data.error, { id: scanToast });
      }
    } catch (err) {
      toast.error('Error triggering scan: ' + err.message, { id: scanToast });
    } finally {
      setIsScanning(false);
    }
  };

  if (loading) return <div>Loading report...</div>;
  if (error) return <div style={{ color: 'var(--color-error)' }}>{error}</div>;

  if (!reportData) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Link to="/" className="text-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '2rem' }}><ArrowLeft size={16} /> Back to Dashboard</Link>
        <h2 style={{ marginBottom: '1rem' }}>No scans have been run for this store yet.</h2>
        <p className="text-secondary" style={{ marginBottom: '1rem' }}>
          {subscription.plan === 'pro'
            ? 'Your Pro plan can run scans any time.'
            : `${subscription.scansRemaining} free scans remain in this cycle.`}
        </p>
        <Button variant="primary" onClick={handleRunScan} disabled={isScanning}>
          {isScanning ? 'Running Scan...' : isScanLimitReached ? 'Free Limit Reached' : 'Trigger Manual Scan Now'}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Link to="/" className="text-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '1rem' }}><ArrowLeft size={16} /> Back to Dashboard</Link>
          <h1 className="report-title">
            Store Report
            <Badge status={reportData.status === 'healthy' ? 'success' : reportData.status === 'warning' ? 'warning' : 'error'} className="ml-2">
              {reportData.status === 'issue' ? 'WARNING' : reportData.status.toUpperCase()}
            </Badge>
          </h1>
          <div className="text-secondary" style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Latest scan: {new Date(reportData.createdAt).toLocaleString()}</div>
        </div>
        
        <Button variant="outline" onClick={handleRunScan} disabled={isScanning || isScanLimitReached}>
          <RefreshCw size={16} style={{ marginRight: '0.5rem', animation: isScanning ? 'spin 1s linear infinite' : 'none' }} /> 
          {isScanning ? 'Scanning...' : isScanLimitReached ? 'Limit Reached' : 'Run Scan'}
        </Button>
      </div>

      {subscription.plan !== 'pro' && (
        <div style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
          {subscription.scansRemaining} of {subscription.scanLimit} free scans remain this cycle.
        </div>
      )}

      <div className="report-grid">
        {/* Overall Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe size={18} /> Overall Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
              {reportData.status === 'healthy' ? <CheckCircle2 size={40} color="var(--color-success)" /> : <XCircle size={40} color={reportData.status === 'warning' ? 'var(--color-warning)' : 'var(--color-error)'} />}
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: reportData.status === 'healthy' ? 'var(--color-success)' : 'var(--color-error)' }}>{reportData.status}</div>
                <div className="text-secondary" style={{ fontSize: '0.875rem' }}>Most recent automated check</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap size={18} /> Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: reportData.loadTime > 5 ? 'var(--color-warning-bg)' : 'var(--color-success-bg)', borderRadius: '50%' }}>
                <Zap size={24} color={reportData.loadTime > 5 ? 'var(--color-warning)' : 'var(--color-success)'} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: reportData.loadTime > 5 ? 'var(--color-warning)' : 'var(--color-success)' }}>{reportData.loadTime}s</div>
                <div className="text-secondary" style={{ fontSize: '0.875rem' }}>Average load time</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Checkout Flow */}
        <Card>
          <CardHeader>
            <CardTitle>Checkout Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flow-list">
              <div className={`flow-item ${!reportData.productPage ? 'error' : ''}`}>
                <span>Product Page Load</span>
                {reportData.productPage ? <CheckCircle2 size={18} color="var(--color-success)" /> : <XCircle size={18} color="var(--color-error)" />}
              </div>
              <div className={`flow-item ${!reportData.addToCart ? 'error' : ''}`}>
                <span>Add to Cart</span>
                {reportData.addToCart ? <CheckCircle2 size={18} color="var(--color-success)" /> : <XCircle size={18} color="var(--color-error)" />}
              </div>
              <div className={`flow-item ${!reportData.checkoutPage ? 'error' : ''}`}>
                <span>Checkout Page Render</span>
                {reportData.checkoutPage ? <CheckCircle2 size={18} color="var(--color-success)" /> : <XCircle size={18} color="var(--color-error)" />}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issues Section */}
      {reportData.issues && reportData.issues.length > 0 && (
        <>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Identified Issues</h3>
          {reportData.issues.map((issue, idx) => (
            <div key={idx} className="issue-alert">
              <AlertCircle className="issue-icon" size={24} />
              <div className="issue-content">
                <h4>Error Detection</h4>
                <p>{issue}</p>
              </div>
            </div>
          ))}

          {/* Dynamic Suggested Fix */}
          <div className="fix-card">
            <h4>Suggested Action</h4>
            <p style={{ color: 'var(--color-text-primary)' }}>
              {reportData.issues.toString().includes('load') ? 'Optimize your homepage images, defer blocking JavaScript, or consider upgrading your hosting/CDN to improve load times. ' : ''}
              {reportData.issues.toString().includes('product') ? 'Ensure your homepage has clearly visible, accessible "<a>" anchor links pointing to product URLs. ' : ''}
              {reportData.issues.toString().includes('Add to Cart') ? 'Check if your Add to Cart button is hidden under popups (like Newsletter modals), or if the CSS class/name has changed. ' : ''}
              {reportData.issues.toString().includes('Checkout') ? 'Verify the checkout route is accessible and not resulting in a 404 or an empty cart redirect. ' : ''}
              {!reportData.issues.toString().match(/load|product|Add to Cart|Checkout/) ? 'Review the exact failing step in the bot logs and check your website DOM for overlapping elements or delayed rendering.' : ''}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

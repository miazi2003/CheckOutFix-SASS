import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Button } from '../components/ui/Button';
import { StoreCard } from '../components/dashboard/StoreCard';
import { AddStoreModal } from '../components/dashboard/AddStoreModal';
import { API_BASE } from '../config';
import { getStoredPreferences } from '../lib/userPreferences';
import { getStoredSubscription, persistSubscription } from '../lib/session';
import { openBillingPortal, startCheckout } from '../lib/billing';
import '../components/dashboard/Dashboard.css';

export default function Dashboard() {
  const [stores, setStores] = useState([]);
  const [subscription, setSubscription] = useState(getStoredSubscription());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dashboardLayout = getStoredPreferences().dashboardLayout || 'comfortable';

  const fetchStores = async () => {
    try {
      const res = await fetch(`${API_BASE}/stores`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('checkoutfix_token')}`
        }
      });
      const text = await res.text();
      if (!res.ok) {
        throw new Error(text ? (JSON.parse(text).error || 'Backend Error') : `Server down (${res.status})`);
      }
      const data = text ? JSON.parse(text) : { stores: [] };
      setStores(data.stores || []);
      const profileRes = await fetch(`${API_BASE}/users/${localStorage.getItem('checkoutfix_user')}/subscription`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('checkoutfix_token')}`
        }
      });
      const profileText = await profileRes.text();
      if (profileRes.ok) {
        const profileData = profileText ? JSON.parse(profileText) : {};
        if (profileData.subscription) {
          setSubscription(profileData.subscription);
          persistSubscription(profileData.subscription);
        }
      }
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load your stores!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleStoreAdded = (newStore, nextSubscription) => {
    setStores([newStore, ...stores]);
    if (nextSubscription) {
      setSubscription(nextSubscription);
      persistSubscription(nextSubscription);
    }
    setIsModalOpen(false);
    toast.success('Store added successfully!');
  };

  const handleDeleteStore = async (id) => {
    const result = await Swal.fire({
      title: 'Are you absolutely sure?',
      text: "This will permanently wipe this store and its entire automation history. You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e53e3e',
      cancelButtonColor: '#718096',
      confirmButtonText: 'Yes, delete it forever!'
    });

    if (!result.isConfirmed) return;
    
    const loadingToast = toast.loading('Deleting store...');
    try {
      const res = await fetch(`${API_BASE}/stores/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('checkoutfix_token')}`
        }
      });
      if (!res.ok) throw new Error('Failed to delete store');
      
      // Fix: Use functional state update to guarantee we edit the most recent array
      setStores(prevStores => prevStores.filter(store => store._id !== id));
      
      toast.success('Store deleted permanently.', { id: loadingToast });
    } catch (err) {
      toast.error(err.message, { id: loadingToast });
    }
  };

  const handleBillingAction = async () => {
    try {
      if (subscription.plan === 'pro') {
        await openBillingPortal();
        return;
      }

      await startCheckout();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const scansRemainingLabel = subscription.scanLimit === null
    ? 'Unlimited'
    : `${subscription.scansRemaining} left`;
  const canAddStore = stores.length < (subscription.storesLimit ?? 1);

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Your Stores</h1>
          <p className="dashboard-subtitle">Monitor plan usage, store capacity, and scan availability from one view.</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          disabled={!canAddStore}
        >
          + Add Store
        </Button>
      </div>

      <div className="dashboard-plan-panel">
        <div className="dashboard-plan-copy">
          <div className="dashboard-plan-pill">{subscription.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}</div>
          <div className="dashboard-plan-metrics">
            <span><strong>{scansRemainingLabel}</strong> scans available</span>
            <span><strong>{stores.length}/{subscription.storesLimit ?? 1}</strong> stores in use</span>
            <span><strong>{(subscription.allowedFrequencies || ['daily']).join(', ')}</strong> scan cadence</span>
          </div>
        </div>
        <Button
          variant={subscription.plan === 'pro' ? 'outline' : 'primary'}
          onClick={handleBillingAction}
        >
          {subscription.plan === 'pro' ? 'Manage Billing' : 'Unlock Pro'}
        </Button>
      </div>

      {!canAddStore && (
        <div className="dashboard-limit-banner">
          Your current plan has reached its store limit. Upgrade to add more monitored stores.
        </div>
      )}

      {loading && <p>Loading stores...</p>}
      {error && <p style={{ color: 'var(--color-error)' }}>Error loading stores: {error}</p>}

      {!loading && !error && stores.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius)' }}>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>You don't have any stores yet.</p>
          <Button variant="outline" onClick={() => setIsModalOpen(true)} disabled={!canAddStore}>Add your first store</Button>
        </div>
      )}

      <div className={`store-grid ${dashboardLayout === 'compact' ? 'compact' : ''}`}>
        {stores.map(store => (
          <StoreCard key={store._id} store={{
            id: store._id,
            url: store.url,
            status: store.latestStatus || 'no_data',
            lastChecked: new Date(store.lastChecked).toLocaleString()
          }} onDelete={handleDeleteStore} />
        ))}
      </div>

      <AddStoreModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleStoreAdded} 
        subscription={subscription}
      />
    </div>
  );
}

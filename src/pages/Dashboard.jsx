import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Button } from '../components/ui/Button';
import { StoreCard } from '../components/dashboard/StoreCard';
import { AddStoreModal } from '../components/dashboard/AddStoreModal';
import '../components/dashboard/Dashboard.css';

export default function Dashboard() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchStores = async () => {
    try {
      const res = await fetch('/api/stores', {
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

  const handleStoreAdded = (newStore) => {
    setStores([newStore, ...stores]);
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
      const res = await fetch(`/api/stores/${id}`, { 
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

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Your Stores</h1>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>+ Add Store</Button>
      </div>

      {loading && <p>Loading stores...</p>}
      {error && <p style={{ color: 'var(--color-error)' }}>Error loading stores: {error}</p>}

      {!loading && !error && stores.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius)' }}>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>You don't have any stores yet.</p>
          <Button variant="outline" onClick={() => setIsModalOpen(true)}>Add your first store</Button>
        </div>
      )}

      <div className="store-grid">
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
      />
    </div>
  );
}

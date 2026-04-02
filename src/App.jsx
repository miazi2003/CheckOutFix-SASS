import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Report from './pages/Report';
import Login from './pages/Login';
import Register from './pages/Register';
import { Toaster } from 'react-hot-toast';
import { applyDashboardLayout, applyTheme } from './lib/userPreferences';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('checkoutfix_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  useEffect(() => {
    applyTheme(localStorage.getItem('checkoutfix_theme') === 'dark' ? 'dark' : 'light');
    applyDashboardLayout(localStorage.getItem('checkoutfix_dashboard_layout') || 'comfortable');
  }, []);

  return (
    <>
      <Toaster position="top-center" />
      <BrowserRouter>
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
          <Route path="report/:id" element={<Report />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;

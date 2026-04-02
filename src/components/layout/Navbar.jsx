import React from 'react';
import { Menu, User } from 'lucide-react';
import './Layout.css';
import { useLocation } from 'react-router-dom';

export function Navbar({ toggleSidebar }) {
  const location = useLocation();
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/app': return 'Dashboard';
      case '/app/notifications': return 'Notifications';
      case '/app/settings': return 'Settings';
      default: 
        if (location.pathname.startsWith('/app/report/')) return 'Report';
        return '';
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="menu-btn" onClick={toggleSidebar} aria-label="Toggle Menu">
          <Menu size={24} />
        </button>
        <h2 className="page-title">{getPageTitle()}</h2>
      </div>
      
      <div className="navbar-right">
        <div className="avatar-placeholder">
          <User size={20} color="#6b7280" />
        </div>
      </div>
    </header>
  );
}

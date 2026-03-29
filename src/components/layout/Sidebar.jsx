import React from 'react';
import { LayoutDashboard, Bell, Settings, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import './Layout.css';

export function Sidebar({ isOpen, onClose }) {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-box"></div>
          <h1 className="logo-text">CheckoutFix AI</h1>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Icon size={20} className="nav-icon" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
          
          <button 
            className="nav-link" 
            style={{ 
              marginTop: 'auto', 
              border: 'none', 
              background: 'none', 
              width: '100%', 
              cursor: 'pointer', 
              color: 'var(--color-error)',
              textAlign: 'left'
            }}
            onClick={() => {
              localStorage.removeItem('checkoutfix_token');
              localStorage.removeItem('checkoutfix_user');
              localStorage.removeItem('checkoutfix_theme');
              document.body.classList.remove('dark-mode');
              window.location.href = '/login';
            }}
          >
            <LogOut size={20} className="nav-icon" />
            <span>Sign Out</span>
          </button>
        </nav>
      </aside>
    </>
  );
}

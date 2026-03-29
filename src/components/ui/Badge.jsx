import React from 'react';

export function Badge({ children, status, className = '' }) {
  return (
    <span className={`ui-badge ${status} ${className}`}>
      <span className={`status-dot ${status}`}></span>
      {children}
    </span>
  );
}

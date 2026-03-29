import React from 'react';

export function Button({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) {
  return (
    <button 
      className={`ui-button ${variant} ${fullWidth ? 'full-width' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

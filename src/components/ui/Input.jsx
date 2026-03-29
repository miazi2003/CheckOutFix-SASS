import React from 'react';

export function Input({ label, id, className = '', ...props }) {
  return (
    <div className={`ui-input-wrapper ${className}`}>
      {label && <label htmlFor={id} style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>{label}</label>}
      <input id={id} className="ui-input" {...props} />
    </div>
  );
}

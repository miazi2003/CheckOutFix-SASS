import React from 'react';

export function Card({ children, className = '', ...props }) {
  return (
    <div className={`ui-card ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`card-header ${className}`} style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }} className={className}>{children}</h3>;
}

export function CardContent({ children, className = '' }) {
  return <div className={`card-content ${className}`} style={{ padding: '1.5rem' }}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={`card-footer ${className}`} style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)' }}>{children}</div>;
}

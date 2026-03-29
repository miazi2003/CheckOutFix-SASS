import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Clock, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function StoreCard({ store, onDelete }) {
  const getStatusColor = (status) => {
    switch(status) {
      case 'Healthy': return 'success';
      case 'Warning': return 'warning';
      case 'Broken': return 'error';
      default: return 'warning';
    }
  };

  return (
    <Card className="store-card">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{store.url}</CardTitle>
          <Badge status={getStatusColor(store.status)}>{store.status}</Badge>
        </div>
        <div className="store-meta">
          <Clock size={14} />
          <span>Last checked: {store.lastChecked}</span>
        </div>
      </CardHeader>
      <CardContent style={{ flexGrow: 1 }}>
        <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
          Monitoring checkout flow, load time, and JavaScript errors.
        </p>
      </CardContent>
      <CardFooter>
        <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
          <Link to={`/report/${store.id}`} style={{ flexGrow: 1 }}>
            <Button variant="outline" fullWidth>View Report</Button>
          </Link>
          <Button variant="outline" onClick={() => onDelete && onDelete(store.id)} style={{ color: 'var(--color-error)', padding: '0 0.75rem' }}>
            <Trash2 size={18} />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

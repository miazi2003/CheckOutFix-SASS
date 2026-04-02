import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Clock, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function StoreCard({ store, onDelete }) {
  const getStatusColor = (status) => {
    switch(status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'issue': return 'error';
      case 'no_data': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status) => {
    if (status === 'no_data') return 'No Scans Run';
    if (status === 'issue') return 'WARNING'; // Changed from 'BROKEN'
    return status.toUpperCase();
  };

  return (
    <Card className="store-card">
      <CardHeader>
        <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
          <CardTitle style={{ maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
             {store.url}
          </CardTitle>
          <Badge status={getStatusColor(store.status)}>{getStatusLabel(store.status)}</Badge>
        </div>
        <div className="store-meta" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
          <Clock size={12} />
          <span>{store.status === 'no_data' ? 'Waiting for first check' : `Last checked: ${store.lastChecked}`}</span>
        </div>
      </CardHeader>
      <CardContent style={{ flexGrow: 1 }}>
        <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
          Monitoring checkout flow, load time, and JavaScript errors.
        </p>
      </CardContent>
      <CardFooter>
        <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
          <Link to={`/app/report/${store.id}`} style={{ flexGrow: 1 }}>
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

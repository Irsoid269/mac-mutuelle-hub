import { useState } from 'react';
import { Search, Filter, Download, FileText, RefreshCw, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockAuditLogs } from '@/data/mockData';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const actionIcons = {
  CREATE: FileText,
  UPDATE: RefreshCw,
  VALIDATE: CheckCircle,
  DELETE: Trash2,
};

const actionColors = {
  CREATE: 'bg-success/10 text-success border-success/20',
  UPDATE: 'bg-info/10 text-info border-info/20',
  VALIDATE: 'bg-primary/10 text-primary border-primary/20',
  DELETE: 'bg-destructive/10 text-destructive border-destructive/20',
};

const actionLabels = {
  CREATE: 'Création',
  UPDATE: 'Modification',
  VALIDATE: 'Validation',
  DELETE: 'Suppression',
};

const extendedLogs = [
  ...mockAuditLogs,
  {
    id: '4',
    userId: '4',
    userName: 'Comptable Fatima',
    action: 'UPDATE',
    entityType: 'reimbursement',
    entityId: '1',
    details: 'Paiement du remboursement RMB-2025-0001',
    timestamp: new Date('2025-03-24T15:00:00'),
  },
  {
    id: '5',
    userId: '1',
    userName: 'Admin Principal',
    action: 'CREATE',
    entityType: 'insured',
    entityId: '5',
    details: 'Ajout du nouvel assuré Ali HASSANE',
    timestamp: new Date('2025-03-24T11:30:00'),
  },
  {
    id: '6',
    userId: '2',
    userName: 'Agent Ahmed',
    action: 'VALIDATE',
    entityType: 'subscription',
    entityId: '4',
    details: 'Validation de la souscription MSF25-0004',
    timestamp: new Date('2025-03-23T16:45:00'),
  },
];

export default function AuditLog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const filteredLogs = extendedLogs.filter((log) => {
    const matchesSearch =
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Journal d'Audit</h1>
          <p className="page-subtitle">
            Historique de toutes les actions du système
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exporter le journal
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans le journal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Type d'action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les actions</SelectItem>
            <SelectItem value="CREATE">Création</SelectItem>
            <SelectItem value="UPDATE">Modification</SelectItem>
            <SelectItem value="VALIDATE">Validation</SelectItem>
            <SelectItem value="DELETE">Suppression</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(actionLabels).map(([action, label]) => {
          const Icon = actionIcons[action as keyof typeof actionIcons];
          const colorClass = actionColors[action as keyof typeof actionColors];
          const count = extendedLogs.filter((l) => l.action === action).length;

          return (
            <div
              key={action}
              className={cn(
                'bg-card p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md',
                actionFilter === action && 'ring-2 ring-primary'
              )}
              onClick={() => setActionFilter(actionFilter === action ? 'all' : action)}
            >
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', colorClass.split(' ').slice(0, 2).join(' '))}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{count}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="space-y-6">
          {filteredLogs.map((log, index) => {
            const Icon = actionIcons[log.action as keyof typeof actionIcons] || AlertCircle;
            const colorClass = actionColors[log.action as keyof typeof actionColors] || 'bg-muted text-muted-foreground border-muted';

            return (
              <div key={log.id} className="relative flex gap-4">
                {/* Timeline line */}
                {index < filteredLogs.length - 1 && (
                  <div className="absolute left-5 top-10 bottom-0 w-px bg-border" />
                )}

                {/* Icon */}
                <div className={cn('relative z-10 p-2 rounded-full border', colorClass)}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">{log.details}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">{log.userName}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          {log.entityType === 'subscription' && 'Souscription'}
                          {log.entityType === 'reimbursement' && 'Remboursement'}
                          {log.entityType === 'insured' && 'Assuré'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
                          colorClass
                        )}
                      >
                        {actionLabels[log.action as keyof typeof actionLabels]}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(log.timestamp, { addSuffix: true, locale: fr })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

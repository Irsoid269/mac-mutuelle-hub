import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileText, RefreshCw, CheckCircle, AlertCircle, Trash2, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  details: string | null;
  user_name: string | null;
  created_at: string;
}

interface RecentActivityProps {
  data: AuditLog[];
}

const actionIcons: Record<string, typeof FileText> = {
  CREATE: FileText,
  INSERT: FileText,
  UPDATE: RefreshCw,
  VALIDATE: CheckCircle,
  DELETE: Trash2,
};

const actionColors: Record<string, string> = {
  CREATE: 'bg-success/10 text-success',
  INSERT: 'bg-success/10 text-success',
  UPDATE: 'bg-info/10 text-info',
  VALIDATE: 'bg-primary/10 text-primary',
  DELETE: 'bg-destructive/10 text-destructive',
};

const actionLabels: Record<string, string> = {
  CREATE: 'Création',
  INSERT: 'Création',
  UPDATE: 'Modification',
  VALIDATE: 'Validation',
  DELETE: 'Suppression',
};

export function RecentActivity({ data }: RecentActivityProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Activity className="w-12 h-12 text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">Aucune activité récente</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((log) => {
        const actionKey = log.action.toUpperCase();
        const Icon = actionIcons[actionKey] || FileText;
        const colorClass = actionColors[actionKey] || 'bg-muted text-muted-foreground';
        const actionLabel = actionLabels[actionKey] || log.action;

        return (
          <div
            key={log.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className={cn('p-2 rounded-lg', colorClass)}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground line-clamp-1">
                {log.details || `${actionLabel} - ${log.entity_type}`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {log.user_name || 'Système'} •{' '}
                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: fr })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

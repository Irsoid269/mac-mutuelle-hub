import { mockAuditLogs } from '@/data/mockData';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileText, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const actionIcons = {
  CREATE: FileText,
  UPDATE: RefreshCw,
  VALIDATE: CheckCircle,
  DELETE: AlertCircle,
};

const actionColors = {
  CREATE: 'bg-success/10 text-success',
  UPDATE: 'bg-info/10 text-info',
  VALIDATE: 'bg-primary/10 text-primary',
  DELETE: 'bg-destructive/10 text-destructive',
};

export function RecentActivity() {
  return (
    <div className="space-y-4">
      {mockAuditLogs.map((log) => {
        const Icon = actionIcons[log.action as keyof typeof actionIcons] || FileText;
        const colorClass = actionColors[log.action as keyof typeof actionColors] || 'bg-muted text-muted-foreground';

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
                {log.details}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {log.userName} •{' '}
                {formatDistanceToNow(log.timestamp, { addSuffix: true, locale: fr })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

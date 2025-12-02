import { cn } from '@/lib/utils';
import { SubscriptionStatus, ReimbursementStatus } from '@/types';
import { Clock, CheckCircle, XCircle, AlertTriangle, CreditCard, Search } from 'lucide-react';

interface StatusBadgeProps {
  status: SubscriptionStatus | ReimbursementStatus;
  className?: string;
}

const subscriptionConfig: Record<
  SubscriptionStatus,
  { label: string; className: string; icon: typeof Clock }
> = {
  en_attente: {
    label: 'En attente',
    className: 'status-pending',
    icon: Clock,
  },
  validee: {
    label: 'Validée',
    className: 'status-validated',
    icon: CheckCircle,
  },
  rejetee: {
    label: 'Rejetée',
    className: 'status-rejected',
    icon: XCircle,
  },
  reserve_medicale: {
    label: 'Réserve médicale',
    className: 'bg-amber-100 text-amber-700',
    icon: AlertTriangle,
  },
};

const reimbursementConfig: Record<
  ReimbursementStatus,
  { label: string; className: string; icon: typeof Clock }
> = {
  soumis: {
    label: 'Soumis',
    className: 'status-pending',
    icon: Clock,
  },
  verification: {
    label: 'En vérification',
    className: 'status-verified',
    icon: Search,
  },
  valide: {
    label: 'Validé',
    className: 'status-validated',
    icon: CheckCircle,
  },
  paye: {
    label: 'Payé',
    className: 'status-paid',
    icon: CreditCard,
  },
  rejete: {
    label: 'Rejeté',
    className: 'status-rejected',
    icon: XCircle,
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config =
    subscriptionConfig[status as SubscriptionStatus] ||
    reimbursementConfig[status as ReimbursementStatus];

  if (!config) return null;

  const Icon = config.icon;

  return (
    <span className={cn('status-badge', config.className, className)}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

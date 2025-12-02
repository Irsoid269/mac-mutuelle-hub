import { FileText, Users, CreditCard, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { ReimbursementChart } from '@/components/dashboard/ReimbursementChart';
import { StatusPieChart } from '@/components/dashboard/StatusPieChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { mockDashboardStats, mockAlerts, mockReimbursements } from '@/data/mockData';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-KM', {
      style: 'currency',
      currency: 'KMF',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const pendingReimbursements = mockReimbursements.filter(
    (r) => r.status === 'soumis' || r.status === 'verification'
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-subtitle">Vue d'ensemble de l'activité MAC Assurances</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Dernière mise à jour:</span>
          <span className="text-sm font-medium text-foreground">
            {new Date().toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Souscriptions"
          value={mockDashboardStats.totalSubscriptions}
          change={`+${mockDashboardStats.subscriptionsThisMonth} ce mois`}
          changeType="positive"
          icon={FileText}
        />
        <StatCard
          title="Assurés Actifs"
          value={mockDashboardStats.activeInsured}
          change="+8.2% vs mois dernier"
          changeType="positive"
          icon={Users}
        />
        <StatCard
          title="Remboursements en cours"
          value={mockDashboardStats.pendingReimbursements}
          change="5 urgents"
          changeType="neutral"
          icon={Clock}
        />
        <StatCard
          title="Total mensuel"
          value={formatCurrency(mockDashboardStats.monthlyReimbursementTotal)}
          change="+12.5% vs mois dernier"
          changeType="positive"
          icon={TrendingUp}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Évolution mensuelle</h2>
              <p className="text-sm text-muted-foreground">
                Souscriptions et remboursements sur 6 mois
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">Souscriptions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-accent" />
                <span className="text-xs text-muted-foreground">Remboursements</span>
              </div>
            </div>
          </div>
          <ReimbursementChart />
        </div>

        {/* Status Distribution */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Statut des remboursements
          </h2>
          <p className="text-sm text-muted-foreground mb-4">Distribution par état</p>
          <StatusPieChart />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Activité récente</h2>
            <a href="/audit" className="text-sm text-primary hover:underline">
              Voir tout
            </a>
          </div>
          <RecentActivity />
        </div>

        {/* Alerts */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Alertes</h2>
            <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded-full">
              {mockAlerts.filter((a) => !a.read).length} nouvelles
            </span>
          </div>
          <div className="space-y-3">
            {mockAlerts.slice(0, 4).map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  'p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50',
                  !alert.read && 'border-l-4',
                  alert.type === 'warning' && 'border-l-warning',
                  alert.type === 'error' && 'border-l-destructive',
                  alert.type === 'info' && 'border-l-info',
                  alert.type === 'success' && 'border-l-success'
                )}
              >
                <div className="flex items-start gap-2">
                  <AlertCircle
                    className={cn(
                      'w-4 h-4 mt-0.5 flex-shrink-0',
                      alert.type === 'warning' && 'text-warning',
                      alert.type === 'error' && 'text-destructive',
                      alert.type === 'info' && 'text-info',
                      alert.type === 'success' && 'text-success'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{alert.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {alert.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Reimbursements Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Remboursements en attente
              </h2>
              <p className="text-sm text-muted-foreground">
                {pendingReimbursements.length} demandes à traiter
              </p>
            </div>
            <a
              href="/reimbursements"
              className="text-sm font-medium text-primary hover:underline"
            >
              Voir tous les remboursements
            </a>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>N° Remboursement</th>
                <th>Assuré</th>
                <th>Montant</th>
                <th>Date soins</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {pendingReimbursements.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium text-foreground">{r.reimbursementNumber}</td>
                  <td>{r.insuredName}</td>
                  <td className="font-semibold">{formatCurrency(r.amount)}</td>
                  <td>{r.medicalDate.toLocaleDateString('fr-FR')}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

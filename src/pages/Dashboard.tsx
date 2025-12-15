import { FileText, Users, CreditCard, TrendingUp, Clock, RefreshCw, Wallet, PiggyBank, ArrowDownCircle, ArrowUpCircle, Calculator } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { ReimbursementChart } from '@/components/dashboard/ReimbursementChart';
import { StatusPieChart } from '@/components/dashboard/StatusPieChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardData } from '@/hooks/useDashboardData';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const {
    stats,
    monthlyTrends,
    reimbursementsByStatus,
    recentActivity,
    pendingReimbursements,
    isLoading,
    refetch,
  } = useDashboardData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-KM', {
      style: 'currency',
      currency: 'KMF',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="page-header">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-subtitle">Vue d'ensemble de l'activité MAC Assurances</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </Button>
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
      </div>

      {/* Section Globale */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Vue globale</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Contrats"
            value={stats.totalContracts}
            change={`+${stats.contractsThisMonth} ce mois`}
            changeType={stats.contractsThisMonth > 0 ? 'positive' : 'neutral'}
            icon={FileText}
          />
          <StatCard
            title="Assurés Actifs"
            value={stats.activeInsured}
            change="Statut validé"
            changeType="positive"
            icon={Users}
          />
          <StatCard
            title="Total Cotisations Encaissées"
            value={formatCurrency(stats.totalContributionsPaid)}
            change="Depuis le début"
            changeType="positive"
            icon={PiggyBank}
          />
          <StatCard
            title="Total Remboursements Payés"
            value={formatCurrency(stats.totalReimbursementsPaid)}
            change="Depuis le début"
            changeType="neutral"
            icon={Wallet}
          />
        </div>
      </div>

      {/* Section Mensuelle */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Ce mois-ci</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Cotisations encaissées"
            value={formatCurrency(stats.monthlyContributionsTotal)}
            change="Ce mois"
            changeType="positive"
            icon={ArrowDownCircle}
          />
          <StatCard
            title="Remboursements payés"
            value={formatCurrency(stats.monthlyReimbursementsTotal)}
            change="Ce mois"
            changeType={stats.monthlyReimbursementsTotal > 0 ? 'negative' : 'neutral'}
            icon={ArrowUpCircle}
          />
          <StatCard
            title="Solde mensuel"
            value={formatCurrency(stats.monthlyContributionsTotal - stats.monthlyReimbursementsTotal)}
            change="Cotisations - Remboursements"
            changeType={stats.monthlyContributionsTotal - stats.monthlyReimbursementsTotal >= 0 ? 'positive' : 'negative'}
            icon={Calculator}
          />
          <StatCard
            title="Remboursements en cours"
            value={stats.pendingReimbursements}
            change={stats.pendingReimbursements > 5 ? 'Urgents à traiter' : 'À traiter'}
            changeType={stats.pendingReimbursements > 5 ? 'negative' : 'neutral'}
            icon={Clock}
          />
        </div>
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
          <ReimbursementChart data={monthlyTrends} />
        </div>

        {/* Status Distribution */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Statut des remboursements
          </h2>
          <p className="text-sm text-muted-foreground mb-4">Distribution par état</p>
          <StatusPieChart data={reimbursementsByStatus} />
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
          <RecentActivity data={recentActivity} />
        </div>

        {/* Quick Stats */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Résumé statuts</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(reimbursementsByStatus).map(([status, count]) => (
              <div
                key={status}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
              >
                <StatusBadge status={status as any} />
                <span className="text-lg font-bold text-foreground">{count}</span>
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
        {pendingReimbursements.length > 0 ? (
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
                    <td className="font-medium text-foreground">{r.reimbursement_number}</td>
                    <td>{r.insured_name}</td>
                    <td className="font-semibold">{formatCurrency(r.claimed_amount)}</td>
                    <td>{formatDate(r.medical_date)}</td>
                    <td>
                      <StatusBadge status={r.status as any} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Clock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun remboursement en attente</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Plus, Search, Filter, Download, Eye, Edit, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/ui/status-badge';
import { mockSubscriptions, mockInsured } from '@/data/mockData';
import { SubscriptionStatus } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SubscriptionForm } from '@/components/forms/SubscriptionForm';

export default function Subscriptions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const filteredSubscriptions = mockSubscriptions.filter((sub) => {
    const matchesSearch =
      sub.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.raisonSociale.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getInsuredName = (insuredId: string) => {
    const insured = mockInsured.find((i) => i.id === insuredId);
    return insured ? `${insured.firstName} ${insured.lastName}` : 'N/A';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion des Souscriptions</h1>
          <p className="page-subtitle">
            {mockSubscriptions.length} souscriptions au total
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nouvelle souscription
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Formulaire de Souscription Familiale</DialogTitle>
            </DialogHeader>
            <SubscriptionForm onClose={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par N° contrat ou raison sociale..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="en_attente">En attente</SelectItem>
            <SelectItem value="validee">Validée</SelectItem>
            <SelectItem value="rejetee">Rejetée</SelectItem>
            <SelectItem value="reserve_medicale">Réserve médicale</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exporter
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'En attente', count: mockSubscriptions.filter((s) => s.status === 'en_attente').length, color: 'bg-warning/10 text-warning' },
          { label: 'Validées', count: mockSubscriptions.filter((s) => s.status === 'validee').length, color: 'bg-success/10 text-success' },
          { label: 'Rejetées', count: mockSubscriptions.filter((s) => s.status === 'rejetee').length, color: 'bg-destructive/10 text-destructive' },
          { label: 'Réserve médicale', count: mockSubscriptions.filter((s) => s.status === 'reserve_medicale').length, color: 'bg-amber-100 text-amber-700' },
        ].map((stat) => (
          <div key={stat.label} className="bg-card p-4 rounded-xl border border-border">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color.split(' ')[1]}`}>{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>N° Contrat</th>
                <th>Client</th>
                <th>Assuré principal</th>
                <th>Date création</th>
                <th>Statut</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscriptions.map((sub) => (
                <tr key={sub.id}>
                  <td>
                    <span className="font-mono text-sm font-medium text-foreground">
                      {sub.contractNumber}
                    </span>
                  </td>
                  <td>
                    <div>
                      <p className="font-medium text-foreground">{sub.raisonSociale}</p>
                      <p className="text-xs text-muted-foreground">Code: {sub.clientCode}</p>
                    </div>
                  </td>
                  <td>{getInsuredName(sub.insuredId)}</td>
                  <td>{sub.createdAt.toLocaleDateString('fr-FR')}</td>
                  <td>
                    <StatusBadge status={sub.status} />
                  </td>
                  <td className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2">
                          <Eye className="w-4 h-4" />
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Edit className="w-4 h-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2">
                          <Download className="w-4 h-4" />
                          Télécharger PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

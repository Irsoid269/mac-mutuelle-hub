import { useState } from 'react';
import { Plus, Search, Check, Clock, AlertCircle, CreditCard, Receipt, Download, History, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useContributionsData, ContributionPayment } from '@/hooks/useContributionsData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { generateContributionReceiptPDF, ContributionReceiptPDFData } from '@/lib/pdfGenerator';
import { PDFPreview, usePDFPreview } from '@/components/ui/pdf-preview';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import * as XLSX from 'xlsx';

export default function Contributions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedContribution, setSelectedContribution] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<ContributionPayment[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportDates, setExportDates] = useState({
    startDate: '',
    endDate: '',
  });
  const pdfPreview = usePDFPreview();

  // Form state
  const [formData, setFormData] = useState({
    contract_id: '',
    amount: '',
    period_start: '',
    period_end: '',
    notes: '',
  });

  // Payment form state
  const [paymentData, setPaymentData] = useState({
    paid_amount: '',
    payment_reference: '',
  });

  // Generate unique payment reference
  const generatePaymentReference = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PAY-${year}${month}${day}-${random}`;
  };

  // Open payment dialog with auto-generated reference
  const openPaymentDialog = (contribution: any) => {
    setSelectedContribution(contribution);
    setPaymentData({
      paid_amount: String(contribution.amount - contribution.paid_amount),
      payment_reference: generatePaymentReference(),
    });
    setIsPaymentOpen(true);
  };

  const { contributions, contracts, stats, isLoading, createContribution, updatePaymentStatus, getPaymentHistory, getPaymentsForExport } =
    useContributionsData(searchTerm, statusFilter);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-KM', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' KMF';
  };

  const handleExportExcel = async () => {
    if (!exportDates.startDate || !exportDates.endDate) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une période.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    try {
      const payments = await getPaymentsForExport(exportDates.startDate, exportDates.endDate);

      if (payments.length === 0) {
        toast({
          title: 'Aucune donnée',
          description: 'Aucun paiement trouvé pour cette période.',
          variant: 'destructive',
        });
        setIsExporting(false);
        return;
      }

      // Prepare data for Excel
      const excelData = payments.map((payment: any) => ({
        'Date de paiement': format(new Date(payment.payment_date), 'dd/MM/yyyy HH:mm', { locale: fr }),
        'Référence': payment.payment_reference || 'N/A',
        'Contrat': payment.contribution?.contract?.contract_number || 'N/A',
        'Client': payment.contribution?.contract?.raison_sociale || 'N/A',
        'Code Client': payment.contribution?.contract?.client_code || 'N/A',
        'Période': payment.contribution ? 
          `${format(new Date(payment.contribution.period_start), 'dd/MM/yyyy')} - ${format(new Date(payment.contribution.period_end), 'dd/MM/yyyy')}` : 
          'N/A',
        'Montant payé (KMF)': payment.amount,
        'Notes': payment.notes || '',
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      ws['!cols'] = [
        { wch: 20 }, // Date
        { wch: 20 }, // Référence
        { wch: 18 }, // Contrat
        { wch: 30 }, // Client
        { wch: 15 }, // Code Client
        { wch: 25 }, // Période
        { wch: 18 }, // Montant
        { wch: 25 }, // Notes
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Paiements');

      // Generate filename with date range
      const fileName = `paiements_${exportDates.startDate}_${exportDates.endDate}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: 'Export réussi',
        description: `${payments.length} paiement(s) exporté(s) vers ${fileName}`,
      });
      setIsExportOpen(false);
      setExportDates({ startDate: '', endDate: '' });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'exporter les données.",
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateContribution = async () => {
    try {
      await createContribution({
        contract_id: formData.contract_id,
        amount: parseFloat(formData.amount),
        period_start: formData.period_start,
        period_end: formData.period_end,
        notes: formData.notes || undefined,
      });
      toast({
        title: 'Cotisation créée',
        description: 'La cotisation a été enregistrée avec succès.',
      });
      setIsFormOpen(false);
      setFormData({ contract_id: '', amount: '', period_start: '', period_end: '', notes: '' });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible de créer la cotisation.",
        variant: 'destructive',
      });
    }
  };

  const handlePayment = async () => {
    if (!selectedContribution) return;

    try {
      const newPaidAmount = parseFloat(paymentData.paid_amount);
      const totalPaidAmount = selectedContribution.paid_amount + newPaidAmount;
      const status = totalPaidAmount >= selectedContribution.amount ? 'paye' : 'partiel';

      await updatePaymentStatus(
        selectedContribution.id,
        status,
        totalPaidAmount,
        paymentData.payment_reference,
        selectedContribution.contract_id,
        selectedContribution.paid_amount
      );

      toast({
        title: 'Paiement enregistré',
        description: status === 'paye' 
          ? "La cotisation a été entièrement payée."
          : "Un paiement partiel a été enregistré.",
      });
      setIsPaymentOpen(false);
      setSelectedContribution(null);
      setPaymentData({ paid_amount: '', payment_reference: '' });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible d'enregistrer le paiement.",
        variant: 'destructive',
      });
    }
  };

  const handleDownloadReceipt = (contribution: any) => {
    const pdfData: ContributionReceiptPDFData = {
      contract: {
        contract_number: contribution.contract?.contract_number || 'N/A',
        raison_sociale: contribution.contract?.raison_sociale || 'N/A',
        client_code: contribution.contract?.client_code || 'N/A',
      },
      period_start: contribution.period_start,
      period_end: contribution.period_end,
      amount: contribution.amount,
      paid_amount: contribution.paid_amount,
      payment_date: contribution.payment_date,
      payment_reference: contribution.payment_reference,
      payment_status: contribution.payment_status,
    };

    pdfPreview.openPreview(
      async () => {
        const result = await generateContributionReceiptPDF(pdfData, { preview: true });
        return result as { dataUrl: string; fileName: string };
      },
      `Reçu de paiement - ${contribution.contract?.contract_number || 'N/A'}`
    );
  };

  const handleViewHistory = async (contribution: any) => {
    setSelectedContribution(contribution);
    setIsLoadingHistory(true);
    setIsHistoryOpen(true);
    try {
      const history = await getPaymentHistory(contribution.id);
      setPaymentHistory(history);
    } catch (error) {
      console.error('Error loading payment history:', error);
      setPaymentHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      paye: {
        label: 'Payé',
        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        icon: <Check className="w-3 h-3" />,
      },
      en_attente: {
        label: 'En attente',
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        icon: <Clock className="w-3 h-3" />,
      },
      partiel: {
        label: 'Partiel',
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        icon: <AlertCircle className="w-3 h-3" />,
      },
      annule: {
        label: 'Annulé',
        className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        icon: <AlertCircle className="w-3 h-3" />,
      },
    };

    const config = statusConfig[status] || statusConfig.en_attente;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };


  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion des Cotisations</h1>
          <p className="page-subtitle">{stats.total} cotisations enregistrées</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Export Excel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Exporter l'historique des paiements</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Sélectionnez la période pour laquelle vous souhaitez exporter les paiements.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="input-group">
                    <Label className="input-label">Date de début</Label>
                    <Input
                      type="date"
                      value={exportDates.startDate}
                      onChange={(e) => setExportDates({ ...exportDates, startDate: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <Label className="input-label">Date de fin</Label>
                    <Input
                      type="date"
                      value={exportDates.endDate}
                      onChange={(e) => setExportDates({ ...exportDates, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsExportOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleExportExcel} 
                    disabled={!exportDates.startDate || !exportDates.endDate || isExporting}
                  >
                    {isExporting ? 'Export en cours...' : 'Exporter'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nouvelle cotisation
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle Cotisation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="input-group">
                <Label className="input-label">Contrat</Label>
                <Select
                  value={formData.contract_id}
                  onValueChange={(v) => setFormData({ ...formData, contract_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un contrat" />
                  </SelectTrigger>
                  <SelectContent>
                    {contracts.map((contract) => (
                      <SelectItem key={contract.id} value={contract.id}>
                        {contract.raison_sociale} ({contract.contract_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="input-group">
                <Label className="input-label">Montant (KMF)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 50000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <Label className="input-label">Début de période</Label>
                  <Input
                    type="date"
                    value={formData.period_start}
                    onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <Label className="input-label">Fin de période</Label>
                  <Input
                    type="date"
                    value={formData.period_end}
                    onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                  />
                </div>
              </div>
              <div className="input-group">
                <Label className="input-label">Notes</Label>
                <Textarea
                  placeholder="Notes optionnelles..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateContribution} disabled={!formData.contract_id || !formData.amount}>
                  Créer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-icon bg-primary/10">
            <Receipt className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="stat-value">{stats.total}</p>
            <p className="stat-label">Total cotisations</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-green-500/10">
            <Check className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="stat-value text-green-600">{stats.paid}</p>
            <p className="stat-label">Payées</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-yellow-500/10">
            <Clock className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <p className="stat-value text-yellow-600">{stats.pending}</p>
            <p className="stat-label">En attente</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-blue-500/10">
            <CreditCard className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="stat-value">{formatCurrency(stats.paidAmount)}</p>
            <p className="stat-label">Montant encaissé</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card p-4 rounded-xl border border-border flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par contrat, référence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="en_attente">En attente</SelectItem>
            <SelectItem value="paye">Payé</SelectItem>
            <SelectItem value="partiel">Partiel</SelectItem>
            <SelectItem value="annule">Annulé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Contrat</th>
                <th>Période</th>
                <th>Montant</th>
                <th>Payé</th>
                <th>Statut</th>
                <th>Référence paiement</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contributions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucune cotisation trouvée
                  </td>
                </tr>
              ) : (
                contributions.map((contribution) => (
                  <tr key={contribution.id}>
                    <td>
                      <div>
                        <p className="font-medium text-foreground">
                          {contribution.contract?.raison_sociale || 'N/A'}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {contribution.contract?.contract_number}
                        </p>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm">
                        <p>{format(new Date(contribution.period_start), 'dd MMM yyyy', { locale: fr })}</p>
                        <p className="text-muted-foreground">
                          au {format(new Date(contribution.period_end), 'dd MMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </td>
                    <td className="font-medium">{formatCurrency(contribution.amount)}</td>
                    <td className="font-medium text-green-600">
                      {formatCurrency(contribution.paid_amount)}
                    </td>
                    <td>{getStatusBadge(contribution.payment_status)}</td>
                    <td className="font-mono text-sm">
                      {contribution.payment_reference || '-'}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(contribution.payment_status === 'paye' || contribution.payment_status === 'partiel') && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewHistory(contribution)}
                              title="Voir l'historique des paiements"
                            >
                              <History className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadReceipt(contribution)}
                              title="Télécharger le reçu"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {contribution.payment_status !== 'paye' && (
                          <Button
                            size="sm"
                            onClick={() => openPaymentDialog(contribution)}
                          >
                            Payer
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enregistrer un paiement</DialogTitle>
          </DialogHeader>
          {selectedContribution && (
            <div className="space-y-4 mt-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Contrat</p>
                <p className="font-medium">{selectedContribution.contract?.raison_sociale}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Montant dû: </span>
                    <span className="font-medium">{formatCurrency(selectedContribution.amount)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Déjà payé: </span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(selectedContribution.paid_amount)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="input-group">
                <Label className="input-label">Montant du paiement (KMF)</Label>
                <Input
                  type="number"
                  value={paymentData.paid_amount}
                  onChange={(e) => setPaymentData({ ...paymentData, paid_amount: e.target.value })}
                />
              </div>
              <div className="input-group">
                <Label className="input-label">Référence de paiement</Label>
                <Input
                  placeholder="Ex: VIR-2024-001"
                  value={paymentData.payment_reference}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_reference: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handlePayment} disabled={!paymentData.paid_amount}>
                  Confirmer le paiement
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PDF Preview */}
      <PDFPreview
        isOpen={pdfPreview.isOpen}
        onClose={pdfPreview.closePreview}
        pdfDataUrl={pdfPreview.pdfDataUrl}
        fileName={pdfPreview.fileName}
        title={pdfPreview.title}
        isLoading={pdfPreview.isLoading}
      />

      {/* Payment History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Historique des paiements</DialogTitle>
          </DialogHeader>
          {selectedContribution && (
            <div className="space-y-4 mt-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Contrat</p>
                <p className="font-medium">{selectedContribution.contract?.raison_sociale}</p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Montant total: </span>
                    <span className="font-medium">{formatCurrency(selectedContribution.amount)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payé: </span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(selectedContribution.paid_amount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reste: </span>
                    <span className="font-medium text-orange-600">
                      {formatCurrency(Math.max(0, selectedContribution.amount - selectedContribution.paid_amount))}
                    </span>
                  </div>
                </div>
              </div>

              {isLoadingHistory ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : paymentHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun paiement enregistré
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Référence</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentHistory.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {format(new Date(payment.payment_date), 'dd MMM yyyy HH:mm', { locale: fr })}
                          </TableCell>
                          <TableCell className="font-medium text-green-600">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {payment.payment_reference || '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {payment.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={() => setIsHistoryOpen(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

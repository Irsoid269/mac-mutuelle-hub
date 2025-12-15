import { useState } from 'react';
import { Pencil, Trash2, Plus, Check, X, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useReimbursementCeilings, ReimbursementCeiling } from '@/hooks/useReimbursementCeilings';

export function ReimbursementCeilingsTab() {
  const { ceilings, isLoading, updateCeiling, createCeiling, deleteCeiling } = useReimbursementCeilings();
  const [editingCeiling, setEditingCeiling] = useState<ReimbursementCeiling | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [newCeiling, setNewCeiling] = useState({
    care_type: '',
    reimbursement_rate: 80,
    ceiling_amount: 50000,
    is_active: true,
    description: '',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-KM', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(amount) + ' KMF';
  };

  const handleSaveEdit = () => {
    if (editingCeiling) {
      updateCeiling.mutate(editingCeiling);
      setEditingCeiling(null);
    }
  };

  const handleCreate = () => {
    createCeiling.mutate(newCeiling);
    setIsCreateDialogOpen(false);
    setNewCeiling({
      care_type: '',
      reimbursement_rate: 80,
      ceiling_amount: 50000,
      is_active: true,
      description: '',
    });
  };

  const handleDelete = (id: string) => {
    deleteCeiling.mutate(id);
    setDeleteConfirmId(null);
  };

  const handleToggleActive = (ceiling: ReimbursementCeiling) => {
    updateCeiling.mutate({ id: ceiling.id, is_active: !ceiling.is_active });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="form-section">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="form-section-title flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Barèmes de remboursement
            </h3>
            <p className="text-sm text-muted-foreground">
              Configurez les taux et plafonds de remboursement par type de soin
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Ajouter un barème
          </Button>
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Type de soin</TableHead>
                <TableHead className="text-center">Taux (%)</TableHead>
                <TableHead className="text-right">Plafond</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Actif</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ceilings.map((ceiling) => (
                <TableRow key={ceiling.id}>
                  <TableCell className="font-medium">{ceiling.care_type}</TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {ceiling.reimbursement_rate}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(ceiling.ceiling_amount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                    {ceiling.description || '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={ceiling.is_active}
                      onCheckedChange={() => handleToggleActive(ceiling)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingCeiling(ceiling)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirmId(ceiling.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {ceilings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucun barème configuré
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Comment fonctionne le calcul ?</h4>
          <p className="text-sm text-muted-foreground">
            Le montant approuvé = Montant réclamé × Taux (%), plafonné au montant maximum défini.
            <br />
            <span className="text-xs">
              Exemple : Pour une consultation de 20 000 FC avec un taux de 80% et un plafond de 15 000 FC,
              le calcul donne 16 000 FC mais le plafond limite à 15 000 FC.
            </span>
          </p>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingCeiling} onOpenChange={() => setEditingCeiling(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le barème</DialogTitle>
          </DialogHeader>
          {editingCeiling && (
            <div className="space-y-4 py-4">
              <div className="input-group">
                <Label className="input-label">Type de soin</Label>
                <Input value={editingCeiling.care_type} disabled />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <Label className="input-label">Taux de remboursement (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={editingCeiling.reimbursement_rate}
                    onChange={(e) =>
                      setEditingCeiling({
                        ...editingCeiling,
                        reimbursement_rate: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="input-group">
                  <Label className="input-label">Plafond (FC)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editingCeiling.ceiling_amount}
                    onChange={(e) =>
                      setEditingCeiling({
                        ...editingCeiling,
                        ceiling_amount: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="input-group">
                <Label className="input-label">Description</Label>
                <Input
                  value={editingCeiling.description || ''}
                  onChange={(e) =>
                    setEditingCeiling({
                      ...editingCeiling,
                      description: e.target.value,
                    })
                  }
                  placeholder="Description du barème..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCeiling(null)}>
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateCeiling.isPending}>
              <Check className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un barème</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="input-group">
              <Label className="input-label">Type de soin *</Label>
              <Input
                value={newCeiling.care_type}
                onChange={(e) =>
                  setNewCeiling({ ...newCeiling, care_type: e.target.value })
                }
                placeholder="Ex: Kinésithérapie"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="input-group">
                <Label className="input-label">Taux de remboursement (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={newCeiling.reimbursement_rate}
                  onChange={(e) =>
                    setNewCeiling({
                      ...newCeiling,
                      reimbursement_rate: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="input-group">
                <Label className="input-label">Plafond (FC)</Label>
                <Input
                  type="number"
                  min={0}
                  value={newCeiling.ceiling_amount}
                  onChange={(e) =>
                    setNewCeiling({
                      ...newCeiling,
                      ceiling_amount: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="input-group">
              <Label className="input-label">Description</Label>
              <Input
                value={newCeiling.description}
                onChange={(e) =>
                  setNewCeiling({ ...newCeiling, description: e.target.value })
                }
                placeholder="Description du barème..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newCeiling.care_type || createCeiling.isPending}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce barème ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le barème sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

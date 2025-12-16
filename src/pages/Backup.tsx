import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Database, 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  FileJson,
  Calendar,
  HardDrive
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const TABLES_TO_BACKUP = [
  'contracts',
  'insured',
  'beneficiaries',
  'contributions',
  'contribution_payments',
  'contribution_formulas',
  'reimbursements',
  'reimbursement_ceilings',
  'healthcare_providers',
  'care_authorizations',
  'health_declarations',
  'documents',
  'settings',
  'profiles',
  'user_roles',
  'audit_logs'
];

interface BackupData {
  version: string;
  created_at: string;
  created_by: string;
  tables: Record<string, unknown[]>;
}

export default function Backup() {
  const { isAdmin, profile } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Accès Restreint</h2>
            <p className="text-muted-foreground">
              Seuls les administrateurs peuvent accéder à cette fonctionnalité.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const backupData: BackupData = {
        version: '1.0',
        created_at: new Date().toISOString(),
        created_by: profile ? `${profile.first_name} ${profile.last_name}` : 'Admin',
        tables: {}
      };

      // Fetch data from each table
      for (const tableName of TABLES_TO_BACKUP) {
        try {
          const { data, error } = await supabase
            .from(tableName as any)
            .select('*');

          if (error) {
            console.warn(`Erreur lors de l'export de ${tableName}:`, error.message);
            backupData.tables[tableName] = [];
          } else {
            backupData.tables[tableName] = data || [];
          }
        } catch (err) {
          console.warn(`Table ${tableName} non accessible`);
          backupData.tables[tableName] = [];
        }
      }

      // Create and download the backup file
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.href = url;
      link.download = `mac-assurance-backup-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setLastBackup(new Date().toLocaleString('fr-FR'));
      toast.success('Backup créé avec succès', {
        description: `${Object.keys(backupData.tables).length} tables exportées`
      });
    } catch (error) {
      console.error('Erreur lors du backup:', error);
      toast.error('Erreur lors de la création du backup');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.json')) {
        toast.error('Format invalide', {
          description: 'Veuillez sélectionner un fichier JSON'
        });
        return;
      }
      setImportFile(file);
    }
  };

  const handleRestore = async () => {
    if (!importFile) {
      toast.error('Aucun fichier sélectionné');
      return;
    }

    setIsImporting(true);
    try {
      const content = await importFile.text();
      const backupData: BackupData = JSON.parse(content);

      // Validate backup format
      if (!backupData.version || !backupData.tables) {
        throw new Error('Format de backup invalide');
      }

      let restoredTables = 0;
      let errors = 0;

      // Restore each table
      for (const [tableName, rows] of Object.entries(backupData.tables)) {
        if (!TABLES_TO_BACKUP.includes(tableName)) continue;
        if (!Array.isArray(rows) || rows.length === 0) continue;

        try {
          // Upsert data (insert or update on conflict)
          const { error } = await supabase
            .from(tableName as any)
            .upsert(rows as any[], { 
              onConflict: 'id',
              ignoreDuplicates: false 
            });

          if (error) {
            console.error(`Erreur restauration ${tableName}:`, error);
            errors++;
          } else {
            restoredTables++;
          }
        } catch (err) {
          console.error(`Erreur table ${tableName}:`, err);
          errors++;
        }
      }

      if (errors > 0) {
        toast.warning('Restauration partielle', {
          description: `${restoredTables} tables restaurées, ${errors} erreurs`
        });
      } else {
        toast.success('Restauration terminée', {
          description: `${restoredTables} tables restaurées avec succès`
        });
      }

      setImportFile(null);
      // Reset file input
      const fileInput = document.getElementById('backup-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Erreur lors de la restauration:', error);
      toast.error('Erreur lors de la restauration', {
        description: error instanceof Error ? error.message : 'Format de fichier invalide'
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Database className="w-7 h-7 text-primary" />
          Sauvegarde & Restauration
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez les sauvegardes de la base de données
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Créer un Backup
            </CardTitle>
            <CardDescription>
              Exportez toutes les données de l'application dans un fichier JSON sécurisé
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <HardDrive className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Tables incluses:</span>
                <span className="font-medium">{TABLES_TO_BACKUP.length}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FileJson className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Format:</span>
                <span className="font-medium">JSON</span>
              </div>
              {lastBackup && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Dernier backup:</span>
                  <span className="font-medium">{lastBackup}</span>
                </div>
              )}
            </div>

            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              className="w-full"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Export en cours...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger le Backup
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Import Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Restaurer un Backup
            </CardTitle>
            <CardDescription>
              Restaurez les données à partir d'un fichier de sauvegarde précédent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="backup-file">Fichier de backup</Label>
              <Input
                id="backup-file"
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                disabled={isImporting}
              />
              {importFile && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  {importFile.name}
                </p>
              )}
            </div>

            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">Attention</p>
                  <p className="text-muted-foreground mt-1">
                    La restauration remplacera les données existantes. 
                    Assurez-vous d'avoir un backup récent avant de continuer.
                  </p>
                </div>
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline"
                  disabled={!importFile || isImporting}
                  className="w-full"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Restauration en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Restaurer les données
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la restauration</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action va restaurer les données depuis le fichier de backup.
                    Les données existantes seront mises à jour ou remplacées.
                    Cette action ne peut pas être annulée.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRestore}>
                    Confirmer la restauration
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tables sauvegardées</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {TABLES_TO_BACKUP.map((table) => (
              <div 
                key={table}
                className="bg-muted/50 rounded px-3 py-2 text-sm font-mono"
              >
                {table}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

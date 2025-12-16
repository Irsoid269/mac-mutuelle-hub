import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Database, 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  FileJson,
  Calendar,
  HardDrive,
  Clock,
  History,
  Settings2,
  Trash2,
  XCircle
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

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

interface BackupHistory {
  id: string;
  backup_type: string;
  status: string;
  tables_count: number;
  total_rows: number;
  file_size: number;
  backup_data: unknown;
  error_message: string | null;
  created_at: string;
}

interface BackupSettings {
  id: string;
  is_enabled: boolean;
  schedule_time: string;
  retention_days: number;
  last_backup_at: string | null;
}

export default function Backup() {
  const { isAdmin, profile, user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([]);
  const [backupSettings, setBackupSettings] = useState<BackupSettings | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Fetch backup history and settings
  useEffect(() => {
    if (isAdmin) {
      fetchBackupHistory();
      fetchBackupSettings();
    }
  }, [isAdmin]);

  const fetchBackupHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('backup_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setBackupHistory(data || []);
    } catch (error) {
      console.error('Error fetching backup history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchBackupSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('backup_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setBackupSettings(data);
    } catch (error) {
      console.error('Error fetching backup settings:', error);
    }
  };

  const updateBackupSettings = async (updates: Partial<BackupSettings>) => {
    if (!backupSettings) return;
    
    setIsSavingSettings(true);
    try {
      const { error } = await supabase
        .from('backup_settings')
        .update({
          ...updates,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', backupSettings.id);

      if (error) throw error;
      
      setBackupSettings({ ...backupSettings, ...updates });
      toast.success('Paramètres sauvegardés');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSavingSettings(false);
    }
  };

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

      let totalRows = 0;

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
            totalRows += (data || []).length;
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

      // Save to history
      await supabase.from('backup_history').insert({
        backup_type: 'manual',
        status: 'completed',
        tables_count: Object.keys(backupData.tables).length,
        total_rows: totalRows,
        file_size: blob.size,
        created_by: user?.id
      });

      fetchBackupHistory();
      toast.success('Backup créé avec succès', {
        description: `${Object.keys(backupData.tables).length} tables, ${totalRows} lignes exportées`
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

  const downloadHistoryBackup = (backup: BackupHistory) => {
    if (!backup.backup_data) {
      toast.error('Données de backup non disponibles');
      return;
    }

    const blob = new Blob([JSON.stringify(backup.backup_data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mac-assurance-backup-${backup.created_at.replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
              Exportez toutes les données dans un fichier JSON
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <HardDrive className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Tables:</span>
                <span className="font-medium">{TABLES_TO_BACKUP.length}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FileJson className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Format:</span>
                <span className="font-medium">JSON</span>
              </div>
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
              Restaurez les données depuis un fichier de sauvegarde
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

            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  La restauration remplacera les données existantes.
                </p>
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
                      Restauration...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Restaurer
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
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRestore}>
                    Confirmer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Backup Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            Backup Automatique Quotidien
          </CardTitle>
          <CardDescription>
            Configurez les sauvegardes automatiques planifiées
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {backupSettings ? (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-backup">Activer les backups automatiques</Label>
                  <p className="text-sm text-muted-foreground">
                    Un backup sera créé automatiquement chaque jour
                  </p>
                </div>
                <Switch
                  id="auto-backup"
                  checked={backupSettings.is_enabled}
                  onCheckedChange={(checked) => updateBackupSettings({ is_enabled: checked })}
                  disabled={isSavingSettings}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="schedule-time" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Heure du backup
                  </Label>
                  <Input
                    id="schedule-time"
                    type="time"
                    value={backupSettings.schedule_time?.slice(0, 5) || '02:00'}
                    onChange={(e) => updateBackupSettings({ schedule_time: e.target.value + ':00' })}
                    disabled={isSavingSettings || !backupSettings.is_enabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retention-days" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Rétention (jours)
                  </Label>
                  <Input
                    id="retention-days"
                    type="number"
                    min={1}
                    max={365}
                    value={backupSettings.retention_days}
                    onChange={(e) => updateBackupSettings({ retention_days: parseInt(e.target.value) || 30 })}
                    disabled={isSavingSettings || !backupSettings.is_enabled}
                  />
                </div>
              </div>

              {backupSettings.last_backup_at && (
                <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-muted-foreground">Dernier backup automatique:</span>
                  <span className="font-medium">
                    {format(new Date(backupSettings.last_backup_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                  </span>
                </div>
              )}

              {backupSettings.is_enabled && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> Les backups automatiques nécessitent que le cron job soit configuré 
                    dans votre instance Supabase pour appeler l'edge function <code className="bg-muted px-1 rounded">scheduled-backup</code> quotidiennement.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Historique des Backups
          </CardTitle>
          <CardDescription>
            Les 20 derniers backups effectués
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : backupHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun backup effectué
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Tables</TableHead>
                    <TableHead>Lignes</TableHead>
                    <TableHead>Taille</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backupHistory.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell className="font-medium">
                        {format(new Date(backup.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={backup.backup_type === 'scheduled' ? 'secondary' : 'outline'}>
                          {backup.backup_type === 'scheduled' ? 'Auto' : 'Manuel'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {backup.status === 'completed' ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Terminé
                          </Badge>
                        ) : backup.status === 'failed' ? (
                          <Badge variant="destructive">
                            <XCircle className="w-3 h-3 mr-1" />
                            Échoué
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            En cours
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{backup.tables_count}</TableCell>
                      <TableCell>{backup.total_rows?.toLocaleString()}</TableCell>
                      <TableCell>{formatFileSize(backup.file_size || 0)}</TableCell>
                      <TableCell className="text-right">
                        {backup.backup_data && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadHistoryBackup(backup)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

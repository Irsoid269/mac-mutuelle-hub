import { useState } from 'react';
import { Search, Download, FileText, File, Folder, MoreHorizontal, Eye, Trash2, Image, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useDocumentsData } from '@/hooks/useDocumentsData';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

const categories = [
  { value: 'all', label: 'Tous' },
  { value: 'souscription', label: 'Souscriptions' },
  { value: 'remboursement', label: 'Remboursements' },
  { value: 'prise_en_charge', label: 'Prises en charge' },
  { value: 'quittance', label: 'Quittances' },
  { value: 'justificatif', label: 'Justificatifs' },
  { value: 'autre', label: 'Autres' },
];

const getTypeIcon = (mimeType: string | null) => {
  if (!mimeType) return File;
  if (mimeType.includes('pdf')) return FileText;
  if (mimeType.includes('image')) return Image;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
  return File;
};

const getTypeColor = (mimeType: string | null) => {
  if (!mimeType) return 'text-muted-foreground bg-muted';
  if (mimeType.includes('pdf')) return 'text-destructive bg-destructive/10';
  if (mimeType.includes('image')) return 'text-primary bg-primary/10';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'text-success bg-success/10';
  return 'text-muted-foreground bg-muted';
};

export default function Documents() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const {
    documents,
    stats,
    isLoading,
    formatFileSize,
    getDocumentTypeLabel,
    downloadDocument,
    deleteDocument,
  } = useDocumentsData(searchTerm, selectedCategory);

  const handleDownload = async (doc: any) => {
    try {
      await downloadDocument(doc);
      toast.success('Téléchargement lancé', {
        description: `${doc.name} est en cours de téléchargement.`,
      });
    } catch (error) {
      toast.error('Erreur de téléchargement', {
        description: 'Impossible de télécharger ce document.',
      });
    }
  };

  const handleDelete = async (doc: any) => {
    try {
      await deleteDocument(doc.id);
      toast.success('Document supprimé', {
        description: `${doc.name} a été supprimé.`,
      });
    } catch (error) {
      toast.error('Erreur', {
        description: 'Impossible de supprimer ce document.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion des Documents</h1>
          <p className="page-subtitle">
            {stats.total} documents archivés
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card p-4 rounded-xl border border-border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un document..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { key: 'souscription', label: 'Souscriptions', count: stats.souscription },
          { key: 'remboursement', label: 'Remboursements', count: stats.remboursement },
          { key: 'prise_en_charge', label: 'Prises en charge', count: stats.prise_en_charge },
          { key: 'quittance', label: 'Quittances', count: stats.quittance },
          { key: 'justificatif', label: 'Justificatifs', count: stats.justificatif },
          { key: 'autre', label: 'Autres', count: stats.autre },
        ].map((cat) => (
          <div
            key={cat.key}
            className={cn(
              'bg-card p-4 rounded-xl border border-border cursor-pointer transition-all hover:shadow-md',
              selectedCategory === cat.key && 'ring-2 ring-primary'
            )}
            onClick={() => setSelectedCategory(cat.key)}
          >
            <Folder className="w-8 h-8 text-primary mb-2" />
            <p className="text-sm font-medium text-foreground">{cat.label}</p>
            <p className="text-xs text-muted-foreground">{cat.count} fichiers</p>
          </div>
        ))}
      </div>

      {/* Documents List */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Catégorie</th>
                <th>Taille</th>
                <th>Date création</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucun document trouvé
                  </td>
                </tr>
              ) : (
                documents.map((doc) => {
                  const Icon = getTypeIcon(doc.mime_type);
                  const colorClass = getTypeColor(doc.mime_type);

                  return (
                    <tr key={doc.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={cn('p-2 rounded-lg', colorClass)}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="font-medium text-foreground">{doc.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          {getDocumentTypeLabel(doc.document_type)}
                        </span>
                      </td>
                      <td className="text-muted-foreground">{formatFileSize(doc.file_size)}</td>
                      <td>{format(new Date(doc.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</td>
                      <td className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2" onClick={() => handleDownload(doc)}>
                              <Eye className="w-4 h-4" />
                              Visualiser
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2" onClick={() => handleDownload(doc)}>
                              <Download className="w-4 h-4" />
                              Télécharger
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDelete(doc)}>
                              <Trash2 className="w-4 h-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

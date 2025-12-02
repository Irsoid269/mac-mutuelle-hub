import { useState } from 'react';
import { Search, Download, FileText, File, Folder, MoreHorizontal, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'excel' | 'word' | 'image';
  category: string;
  size: string;
  createdAt: Date;
  createdBy: string;
}

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Fiche_Souscription_MSF25-0001.pdf',
    type: 'pdf',
    category: 'Souscriptions',
    size: '245 KB',
    createdAt: new Date('2025-01-15'),
    createdBy: 'Admin',
  },
  {
    id: '2',
    name: 'Remboursement_RMB-2025-0001.pdf',
    type: 'pdf',
    category: 'Remboursements',
    size: '128 KB',
    createdAt: new Date('2025-03-01'),
    createdBy: 'Agent Ahmed',
  },
  {
    id: '3',
    name: 'Export_Assures_Mars2025.xlsx',
    type: 'excel',
    category: 'Exports',
    size: '1.2 MB',
    createdAt: new Date('2025-03-25'),
    createdBy: 'Admin',
  },
  {
    id: '4',
    name: 'Justificatif_Ordonnance_001.jpg',
    type: 'image',
    category: 'Justificatifs',
    size: '856 KB',
    createdAt: new Date('2025-02-20'),
    createdBy: 'Mohamed ABDALLAH',
  },
  {
    id: '5',
    name: 'Contrat_UICN_2025.pdf',
    type: 'pdf',
    category: 'Contrats',
    size: '2.1 MB',
    createdAt: new Date('2025-01-10'),
    createdBy: 'Admin',
  },
  {
    id: '6',
    name: 'Rapport_Mensuel_Fevrier.pdf',
    type: 'pdf',
    category: 'Rapports',
    size: '567 KB',
    createdAt: new Date('2025-03-01'),
    createdBy: 'Admin',
  },
];

const categories = ['Tous', 'Souscriptions', 'Remboursements', 'Contrats', 'Justificatifs', 'Exports', 'Rapports'];

const typeIcons = {
  pdf: FileText,
  excel: File,
  word: File,
  image: File,
};

const typeColors = {
  pdf: 'text-destructive bg-destructive/10',
  excel: 'text-success bg-success/10',
  word: 'text-info bg-info/10',
  image: 'text-primary bg-primary/10',
};

export default function Documents() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');

  const filteredDocuments = mockDocuments.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'Tous' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion des Documents</h1>
          <p className="page-subtitle">
            {mockDocuments.length} documents archivés
          </p>
        </div>
        <Button className="gap-2">
          <Download className="w-4 h-4" />
          Tout télécharger
        </Button>
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
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="transition-all"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.slice(1).map((cat) => {
          const count = mockDocuments.filter((d) => d.category === cat).length;
          return (
            <div
              key={cat}
              className={cn(
                'bg-card p-4 rounded-xl border border-border cursor-pointer transition-all hover:shadow-md',
                selectedCategory === cat && 'ring-2 ring-primary'
              )}
              onClick={() => setSelectedCategory(cat)}
            >
              <Folder className="w-8 h-8 text-primary mb-2" />
              <p className="text-sm font-medium text-foreground">{cat}</p>
              <p className="text-xs text-muted-foreground">{count} fichiers</p>
            </div>
          );
        })}
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
                <th>Créé par</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((doc) => {
                const Icon = typeIcons[doc.type];
                const colorClass = typeColors[doc.type];

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
                        {doc.category}
                      </span>
                    </td>
                    <td className="text-muted-foreground">{doc.size}</td>
                    <td>{doc.createdAt.toLocaleDateString('fr-FR')}</td>
                    <td>{doc.createdBy}</td>
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
                            Visualiser
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Download className="w-4 h-4" />
                            Télécharger
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-destructive">
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

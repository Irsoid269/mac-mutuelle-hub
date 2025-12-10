import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Helper to get last table Y position
const getLastTableY = (doc: jsPDF): number => {
  return (doc as any).lastAutoTable?.finalY || 0;
};

// MAC ASSURANCES Logo as base64 (simplified version for PDF)
const MAC_LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABkCAYAAADDhn8LAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFzklEQVR4nO2dW3LbMAwApXT3v3N7gnZy/7vpCdqeoJ2coJ2coE5O0E5O0E5O0MkJmskJOl0vdhIllCXZJgFSst8XzIwtSgQIgKQoy/Lq6uqKEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEkGOj+nv78w+ybQMhhJyY7RsIIeRkbN5ACCEnYvMGQgg5AZs3EELIEdn8/INsX0MIIUdi8wZCCDkCmzcQQsiR2LyBEEKOwOYNhBByBDZvIISQI7B5AyGEHIHNGwgh5EhsCIZNTU7J5g2EEHIENTO2QITQwgHUe4MIoYUDqPcGEUILB1DvDSKEFg6g3htECC0cQL03iBBaOIB6bxAhtHAA9d4gQmjhAOq9QYTQwgHUe4MIoYUDqPcGEUILB1DvDSKEFg6g3htECC0cQL03iBBaOIB6bxAhtHAA9d4gQmjhAOq9QYTQwgHUe4MIoYUDqPcGEUILB1DvDSKEFg6g3htECC0cQL03iBBaOIB6bxAhtHAA9d4gQmjhAOq9QYTQwgHUe4MIoYUDqPcGEUILB1DvDSKEFg6g3htECC0cQL03iBBaOIB6bxAhtHAA9d4gQmjhAOq9QYTQwgHUe4MIoYUDqPcGEUILB1DvDSKEFg6g3htECC0cQP/9f28IIeRIbN5ACCFHYPMGQgg5Aps3EELIEdi8gRBCjsDmDYQQcgQ2byCEkCOweQMhhByBzRsIIeQIbN5ACCFHYPMGQgg5Aps3EELIEdi8gRBCjsDmDYQQcgQ2byCEkCOweQMhhByJzRsIIeRIbN5ACCFHYvMGQgg5Eps3EELIkdi8gRBCjsTmDYQQciQ2byCEkCOxeQMhhByJzRsIIeRIbN5ACCFH4uoN//77/xchDJAQwEJRCGEkFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQxkJRCGEsFIUQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIcTxP+QHRJ2sTp0fAAAAAElFTkSuQmCC';

// Brand colors as tuples for TypeScript
const COLORS = {
  primary: [0, 102, 153] as [number, number, number],
  secondary: [0, 51, 102] as [number, number, number],
  accent: [255, 153, 0] as [number, number, number],
  text: [51, 51, 51] as [number, number, number],
  lightGray: [245, 245, 245] as [number, number, number],
  mediumGray: [200, 200, 200] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-KM', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount) + ' KMF';
};

// Format date
const formatDate = (date: string | Date): string => {
  return format(new Date(date), 'dd/MM/yyyy', { locale: fr });
};

// Add header with logo
const addHeader = (doc: jsPDF, title: string): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Background gradient effect
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Accent line
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 45, pageWidth, 3, 'F');
  
  // Company name (instead of logo for reliability)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text('MAC ASSURANCES', 15, 25);
  
  // Tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Mutuelle d\'Assurance des Comores', 15, 35);
  
  // Document title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth - 15, 25, { align: 'right' });
  
  // Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Édité le: ${formatDate(new Date())}`, pageWidth - 15, 35, { align: 'right' });
  
  return 55;
};

// Add footer
const addFooter = (doc: jsPDF): void => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Footer line
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(15, pageHeight - 25, pageWidth - 15, pageHeight - 25);
  
  // Footer text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.text);
  doc.text('MAC ASSURANCES - Mutuelle d\'Assurance des Comores', 15, pageHeight - 18);
  doc.text('Moroni, Union des Comores | Tél: +269 773 00 00 | Email: contact@mac-assurances.km', 15, pageHeight - 12);
  
  // Page number
  doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pageWidth - 15, pageHeight - 15, { align: 'right' });
};

// Add section title
const addSectionTitle = (doc: jsPDF, title: string, y: number): number => {
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(15, y, doc.internal.pageSize.getWidth() - 30, 10, 2, 2, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  doc.text(title, 20, y + 7);
  
  return y + 15;
};

// Generate reimbursement PDF
export interface ReimbursementPDFData {
  reimbursement_number: string;
  insured: {
    first_name: string;
    last_name: string;
    matricule: string;
  };
  provider?: {
    name: string;
    provider_type: string;
    is_conventioned: boolean;
  };
  care_type: string;
  medical_date: string;
  claimed_amount: number;
  approved_amount?: number;
  paid_amount?: number;
  status: string;
  notes?: string;
  created_at: string;
  validated_at?: string;
  paid_at?: string;
}

export const generateReimbursementPDF = (data: ReimbursementPDFData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let y = addHeader(doc, 'FICHE DE REMBOURSEMENT');
  
  // Reference number box
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(pageWidth - 80, y, 65, 20, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.primary);
  doc.text('N° Dossier:', pageWidth - 75, y + 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);
  doc.text(data.reimbursement_number, pageWidth - 75, y + 16);
  
  y += 30;
  
  // Insured information section
  y = addSectionTitle(doc, 'INFORMATIONS DE L\'ASSURÉ', y);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.text);
  
  const col1 = 20;
  const col2 = 110;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Nom complet:', col1, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.insured.first_name} ${data.insured.last_name}`, col1 + 35, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Matricule:', col2, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.insured.matricule, col2 + 30, y);
  
  y += 15;
  
  // Provider information section
  y = addSectionTitle(doc, 'PRESTATAIRE DE SOINS', y);
  
  if (data.provider) {
    doc.setFont('helvetica', 'bold');
    doc.text('Établissement:', col1, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.provider.name, col1 + 35, y);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Type:', col2, y);
    doc.setFont('helvetica', 'normal');
    const providerTypeLabels: Record<string, string> = {
      hopital: 'Hôpital',
      clinique: 'Clinique',
      laboratoire: 'Laboratoire',
      pharmacie: 'Pharmacie',
      medecin: 'Médecin',
      autre: 'Autre',
    };
    doc.text(providerTypeLabels[data.provider.provider_type] || data.provider.provider_type, col2 + 20, y);
    
    y += 8;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Conventionné:', col1, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.provider.is_conventioned ? 'Oui' : 'Non', col1 + 35, y);
  } else {
    doc.setFont('helvetica', 'italic');
    doc.text('Non spécifié', col1, y);
  }
  
  y += 15;
  
  // Care details section
  y = addSectionTitle(doc, 'DÉTAILS DES SOINS', y);
  
  const careTypeLabels: Record<string, string> = {
    consultation: 'Consultation',
    hospitalisation: 'Hospitalisation',
    pharmacie: 'Pharmacie',
    analyses: 'Analyses médicales',
    radiologie: 'Radiologie',
    autre: 'Autre',
  };
  
  doc.setFont('helvetica', 'bold');
  doc.text('Type de soin:', col1, y);
  doc.setFont('helvetica', 'normal');
  doc.text(careTypeLabels[data.care_type] || data.care_type, col1 + 35, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Date des soins:', col2, y);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(data.medical_date), col2 + 35, y);
  
  y += 15;
  
  // Financial section
  y = addSectionTitle(doc, 'INFORMATIONS FINANCIÈRES', y);
  
  // Financial table
  autoTable(doc, {
    startY: y,
    head: [['Description', 'Montant']],
    body: [
      ['Montant réclamé', formatCurrency(data.claimed_amount)],
      ['Montant approuvé', data.approved_amount ? formatCurrency(data.approved_amount) : 'En attente'],
      ['Montant payé', data.paid_amount ? formatCurrency(data.paid_amount) : 'En attente'],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 60, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 20, right: 20 },
  });
  
  y = getLastTableY(doc) + 15;
  
  // Status section
  y = addSectionTitle(doc, 'STATUT DU DOSSIER', y);
  
  const statusLabels: Record<string, string> = {
    soumis: 'Soumis',
    verification: 'En vérification',
    valide: 'Validé',
    paye: 'Payé',
    rejete: 'Rejeté',
  };
  
  const statusColors: Record<string, [number, number, number]> = {
    soumis: [255, 193, 7],
    verification: [33, 150, 243],
    valide: [76, 175, 80],
    paye: [0, 102, 153],
    rejete: [244, 67, 54],
  };
  
  const statusColor = statusColors[data.status] || [128, 128, 128] as [number, number, number];
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(20, y, 50, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(statusLabels[data.status] || data.status, 25, y + 7);
  
  y += 15;
  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'normal');
  
  doc.text(`Date de soumission: ${formatDate(data.created_at)}`, col1, y);
  if (data.validated_at) {
    doc.text(`Date de validation: ${formatDate(data.validated_at)}`, col2, y);
  }
  y += 8;
  if (data.paid_at) {
    doc.text(`Date de paiement: ${formatDate(data.paid_at)}`, col1, y);
  }
  
  if (data.notes) {
    y += 15;
    y = addSectionTitle(doc, 'OBSERVATIONS', y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const splitNotes = doc.splitTextToSize(data.notes, pageWidth - 40);
    doc.text(splitNotes, 20, y);
  }
  
  addFooter(doc);
  
  doc.save(`Remboursement_${data.reimbursement_number}.pdf`);
};

// Generate subscription PDF
export interface SubscriptionPDFData {
  contract_number: string;
  client_code: string;
  raison_sociale: string;
  status: string;
  start_date: string;
  created_at: string;
  address?: string;
  phone?: string;
  email?: string;
  insured?: {
    first_name: string;
    last_name: string;
    matricule: string;
    birth_date: string;
    gender: string;
    marital_status: string;
    phone?: string;
    email?: string;
    job_title?: string;
    employer?: string;
  }[];
  beneficiaries?: {
    first_name: string;
    last_name: string;
    relationship: string;
    birth_date: string;
    gender: string;
  }[];
}

export const generateSubscriptionPDF = (data: SubscriptionPDFData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let y = addHeader(doc, 'ATTESTATION DE SOUSCRIPTION');
  
  // Contract number box
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(pageWidth - 80, y, 65, 20, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.primary);
  doc.text('N° Contrat:', pageWidth - 75, y + 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);
  doc.text(data.contract_number, pageWidth - 75, y + 16);
  
  y += 30;
  
  // Client information
  y = addSectionTitle(doc, 'INFORMATIONS DU SOUSCRIPTEUR', y);
  
  const col1 = 20;
  const col2 = 110;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.text);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Raison sociale:', col1, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.raison_sociale, col1 + 35, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Code client:', col2, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.client_code, col2 + 30, y);
  
  y += 8;
  
  if (data.address) {
    doc.setFont('helvetica', 'bold');
    doc.text('Adresse:', col1, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.address, col1 + 25, y);
    y += 8;
  }
  
  if (data.phone || data.email) {
    if (data.phone) {
      doc.setFont('helvetica', 'bold');
      doc.text('Téléphone:', col1, y);
      doc.setFont('helvetica', 'normal');
      doc.text(data.phone, col1 + 28, y);
    }
    if (data.email) {
      doc.setFont('helvetica', 'bold');
      doc.text('Email:', col2, y);
      doc.setFont('helvetica', 'normal');
      doc.text(data.email, col2 + 18, y);
    }
    y += 8;
  }
  
  y += 10;
  
  // Contract status
  const statusLabels: Record<string, string> = {
    en_attente: 'En attente',
    validee: 'Validée',
    rejetee: 'Rejetée',
    reserve_medicale: 'Réserve médicale',
  };
  
  const statusColors: Record<string, [number, number, number]> = {
    en_attente: [255, 193, 7],
    validee: [76, 175, 80],
    rejetee: [244, 67, 54],
    reserve_medicale: [255, 152, 0],
  };
  
  doc.setFont('helvetica', 'bold');
  doc.text('Statut:', col1, y);
  const contractStatusColor = statusColors[data.status] || [128, 128, 128] as [number, number, number];
  doc.setFillColor(contractStatusColor[0], contractStatusColor[1], contractStatusColor[2]);
  doc.roundedRect(col1 + 20, y - 5, 40, 8, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(statusLabels[data.status] || data.status, col1 + 25, y);
  
  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Date d\'effet:', col2, y);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(data.start_date), col2 + 30, y);
  
  y += 15;
  
  // Insured persons
  if (data.insured && data.insured.length > 0) {
    y = addSectionTitle(doc, 'ASSURÉS', y);
    
    const genderLabels: Record<string, string> = { M: 'Masculin', F: 'Féminin' };
    const maritalLabels: Record<string, string> = {
      marie: 'Marié(e)',
      celibataire: 'Célibataire',
      veuf: 'Veuf(ve)',
      divorce: 'Divorcé(e)',
      separe: 'Séparé(e)',
    };
    
    const insuredData = data.insured.map((ins, index) => [
      index === 0 ? 'Principal' : `Assuré ${index + 1}`,
      `${ins.first_name} ${ins.last_name}`,
      ins.matricule,
      formatDate(ins.birth_date),
      genderLabels[ins.gender] || ins.gender,
    ]);
    
    autoTable(doc, {
      startY: y,
      head: [['Type', 'Nom complet', 'Matricule', 'Date naissance', 'Genre']],
      body: insuredData,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      margin: { left: 15, right: 15 },
    });
    
    y = getLastTableY(doc) + 10;
  }
  
  // Beneficiaries
  if (data.beneficiaries && data.beneficiaries.length > 0) {
    y = addSectionTitle(doc, 'AYANTS DROIT', y);
    
    const relationLabels: Record<string, string> = {
      conjoint: 'Conjoint(e)',
      enfant: 'Enfant',
      parent: 'Parent',
      autre: 'Autre',
    };
    
    const beneficiaryData = data.beneficiaries.map((ben) => [
      `${ben.first_name} ${ben.last_name}`,
      relationLabels[ben.relationship] || ben.relationship,
      formatDate(ben.birth_date),
      ben.gender === 'M' ? 'Masculin' : 'Féminin',
    ]);
    
    autoTable(doc, {
      startY: y,
      head: [['Nom complet', 'Lien de parenté', 'Date naissance', 'Genre']],
      body: beneficiaryData,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.secondary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      margin: { left: 15, right: 15 },
    });
    
    y = getLastTableY(doc) + 10;
  }
  
  // Signature section
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Fait à Moroni, le ${formatDate(new Date())}`, col2, y);
  
  y += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('Signature et cachet', col2, y);
  doc.text('MAC ASSURANCES', col2, y + 8);
  
  // Stamp box
  doc.setDrawColor(...COLORS.mediumGray);
  doc.setLineWidth(0.5);
  doc.roundedRect(col2, y + 12, 60, 30, 3, 3, 'S');
  
  addFooter(doc);
  
  doc.save(`Souscription_${data.contract_number}.pdf`);
};

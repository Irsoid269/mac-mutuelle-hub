import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Helper to get last table Y position
const getLastTableY = (doc: jsPDF): number => {
  return (doc as any).lastAutoTable?.finalY || 0;
};

// MAC ASSURANCES Brand colors (from logo: Blue #1A9BD7, Yellow #FFE500, Gray #8C8C8C)
const COLORS = {
  primary: [26, 155, 215] as [number, number, number],      // MAC Blue
  primaryDark: [20, 120, 170] as [number, number, number],  // Darker blue for contrast
  secondary: [140, 140, 140] as [number, number, number],   // MAC Gray
  accent: [255, 229, 0] as [number, number, number],        // MAC Yellow
  text: [51, 51, 51] as [number, number, number],
  textLight: [100, 100, 100] as [number, number, number],
  lightGray: [248, 250, 252] as [number, number, number],
  mediumGray: [229, 231, 235] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
  warning: [245, 158, 11] as [number, number, number],
  error: [239, 68, 68] as [number, number, number],
};

// Format currency - using simple formatting for PDF compatibility
const formatCurrency = (amount: number): string => {
  // Use simple space separator for thousands (PDF compatible)
  const formatted = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return formatted + ' KMF';
};

// Format date
const formatDate = (date: string | Date): string => {
  return format(new Date(date), 'dd/MM/yyyy', { locale: fr });
};

// Store logo as base64 - will be loaded dynamically
let logoBase64: string | null = null;
let logoLoaded = false;

// Pre-load logo - call this once at app startup or before generating PDFs
export const preloadLogo = async (): Promise<void> => {
  if (logoLoaded) return;
  
  try {
    const response = await fetch('/mac-logo.png');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        logoBase64 = reader.result as string;
        logoLoaded = true;
        resolve();
      };
      reader.onerror = () => {
        logoLoaded = true;
        resolve();
      };
      reader.readAsDataURL(blob);
    });
  } catch {
    logoLoaded = true;
  }
};

// Ensure logo is loaded before generating PDF
const ensureLogo = async (): Promise<void> => {
  if (!logoLoaded) {
    await preloadLogo();
  }
};

// Professional header with logo image
const addHeader = (doc: jsPDF, title: string, subtitle?: string): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Top accent bar (yellow)
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 0, pageWidth, 4, 'F');
  
  // Main header background (white with subtle blue gradient effect)
  doc.setFillColor(...COLORS.white);
  doc.rect(0, 4, pageWidth, 38, 'F');
  
  // Bottom border (blue)
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 42, pageWidth, 2, 'F');
  
  // Add logo if available
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 10, 8, 32, 28);
    } catch {
      // Fallback to text if image fails
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(26);
      doc.setTextColor(...COLORS.primary);
      doc.text('MAC', 15, 24);
    }
  } else {
    // Fallback to text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(...COLORS.primary);
    doc.text('MAC', 15, 24);
  }
  
  // Company name and tagline next to logo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.primary);
  doc.text('MAC ASSURANCES', 48, 18);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textLight);
  doc.text("Mutuelle d'Assurance des Comores", 48, 26);
  doc.text('Le contrat de confiance', 48, 33);
  
  // Document title box on the right
  const titleBoxWidth = 80;
  const titleBoxX = pageWidth - titleBoxWidth - 10;
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(titleBoxX, 8, titleBoxWidth, 30, 3, 3, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  doc.text(title, titleBoxX + titleBoxWidth / 2, 18, { align: 'center' });
  
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.text);
    doc.text(subtitle, titleBoxX + titleBoxWidth / 2, 26, { align: 'center' });
  }
  
  // Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textLight);
  doc.text(`Édité le: ${formatDate(new Date())}`, titleBoxX + titleBoxWidth / 2, 34, { align: 'center' });
  
  return 52;
};

// Professional footer
const addFooter = (doc: jsPDF): void => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Footer background
  doc.setFillColor(...COLORS.lightGray);
  doc.rect(0, pageHeight - 28, pageWidth, 28, 'F');
  
  // Top accent line
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, pageHeight - 28, pageWidth, 1, 'F');
  
  // Company info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.primary);
  doc.text('MAC ASSURANCES', 15, pageHeight - 20);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textLight);
  doc.text('Mutuelle d\'Assurance des Comores', 15, pageHeight - 14);
  doc.text('Avenue de Strasbourg, Moroni-Bacha, Union des Comores', 15, pageHeight - 9);
  
  // Contact info (center)
  doc.setTextColor(...COLORS.text);
  doc.text('Tél: +269 773 00 00', pageWidth / 2, pageHeight - 14, { align: 'center' });
  doc.text('Email: mac.assurances@gmail.com', pageWidth / 2, pageHeight - 9, { align: 'center' });
  
  // Website and page number (right)
  doc.setTextColor(...COLORS.primary);
  doc.text('www.macassurances.com', pageWidth - 15, pageHeight - 14, { align: 'right' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pageWidth - 15, pageHeight - 8, { align: 'right' });
  
  // Yellow accent at very bottom
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, pageHeight - 3, pageWidth, 3, 'F');
};

// Professional section title
const addSectionTitle = (doc: jsPDF, title: string, y: number): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Left accent bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(15, y, 4, 12, 'F');
  
  // Background
  doc.setFillColor(...COLORS.lightGray);
  doc.rect(19, y, pageWidth - 34, 12, 'F');
  
  // Title text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  doc.text(title.toUpperCase(), 24, y + 8);
  
  return y + 18;
};

// Add info row helper
const addInfoRow = (doc: jsPDF, label: string, value: string, x: number, y: number, labelWidth: number = 45): void => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textLight);
  doc.text(label + ' :', x, y);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);
  doc.text(value || '—', x + labelWidth, y);
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

export const generateReimbursementPDF = async (
  data: ReimbursementPDFData,
  options: { preview?: boolean } = {}
): Promise<{ dataUrl: string; fileName: string } | void> => {
  await ensureLogo();
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let y = addHeader(doc, 'FICHE DE', 'REMBOURSEMENT');
  
  // Reference number box with accent
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(pageWidth - 85, y, 70, 22, 3, 3, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('N° Dossier', pageWidth - 50, y + 8, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(data.reimbursement_number, pageWidth - 50, y + 17, { align: 'center' });
  
  y += 32;
  
  // Insured information section
  y = addSectionTitle(doc, 'Informations de l\'assuré', y);
  
  const col1 = 20;
  const col2 = 115;
  
  addInfoRow(doc, 'Nom complet', `${data.insured.first_name} ${data.insured.last_name}`, col1, y, 35);
  addInfoRow(doc, 'Matricule', data.insured.matricule, col2, y, 30);
  
  y += 15;
  
  // Provider information section
  y = addSectionTitle(doc, 'Prestataire de soins', y);
  
  if (data.provider) {
    const providerTypeLabels: Record<string, string> = {
      hopital: 'Hôpital',
      clinique: 'Clinique',
      laboratoire: 'Laboratoire',
      pharmacie: 'Pharmacie',
      medecin: 'Médecin',
      autre: 'Autre',
    };
    
    addInfoRow(doc, 'Établissement', data.provider.name, col1, y, 35);
    addInfoRow(doc, 'Type', providerTypeLabels[data.provider.provider_type] || data.provider.provider_type, col2, y, 20);
    
    y += 8;
    
    // Conventioned badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.textLight);
    doc.text('Conventionné :', col1, y);
    
    if (data.provider.is_conventioned) {
      doc.setFillColor(...COLORS.success);
    } else {
      doc.setFillColor(...COLORS.error);
    }
    doc.roundedRect(col1 + 38, y - 4, 20, 6, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(data.provider.is_conventioned ? 'Oui' : 'Non', col1 + 48, y, { align: 'center' });
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.textLight);
    doc.text('Non spécifié', col1, y);
  }
  
  y += 15;
  
  // Care details section
  y = addSectionTitle(doc, 'Détails des soins', y);
  
  const careTypeLabels: Record<string, string> = {
    consultation: 'Consultation',
    hospitalisation: 'Hospitalisation',
    pharmacie: 'Pharmacie',
    analyses: 'Analyses médicales',
    radiologie: 'Radiologie',
    autre: 'Autre',
  };
  
  addInfoRow(doc, 'Type de soin', careTypeLabels[data.care_type] || data.care_type, col1, y, 35);
  addInfoRow(doc, 'Date des soins', formatDate(data.medical_date), col2, y, 35);
  
  y += 15;
  
  // Financial section
  y = addSectionTitle(doc, 'Informations financières', y);
  
  // Financial table with improved styling
  autoTable(doc, {
    startY: y,
    head: [['Description', 'Montant']],
    body: [
      ['Montant réclamé', formatCurrency(data.claimed_amount)],
      ['Montant approuvé', data.approved_amount != null ? formatCurrency(data.approved_amount) : '—'],
      ['Montant payé', data.paid_amount != null ? formatCurrency(data.paid_amount) : '—'],
    ],
    theme: 'plain',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    styles: {
      cellPadding: 6,
      lineColor: COLORS.mediumGray,
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 100, fontStyle: 'normal' },
      1: { cellWidth: 60, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 20, right: 20 },
  });
  
  y = getLastTableY(doc) + 15;
  
  // Status section
  y = addSectionTitle(doc, 'Statut du dossier', y);
  
  const statusLabels: Record<string, string> = {
    soumis: 'Soumis',
    verification: 'En vérification',
    valide: 'Validé',
    paye: 'Payé',
    rejete: 'Rejeté',
  };
  
  const statusColors: Record<string, [number, number, number]> = {
    soumis: COLORS.warning,
    verification: COLORS.primary,
    valide: COLORS.success,
    paye: [34, 197, 94], // Green for paid
    rejete: COLORS.error,
  };
  
  const statusColor = statusColors[data.status] || COLORS.secondary;
  const statusLabel = statusLabels[data.status] || data.status;
  
  // Status badge - larger and more prominent
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(20, y, 65, 14, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(statusLabel.toUpperCase(), 52.5, y + 9.5, { align: 'center' });
  
  // Add status description based on status
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  
  let statusDescription = '';
  if (data.status === 'paye') {
    statusDescription = 'Ce remboursement a été réglé.';
  } else if (data.status === 'rejete') {
    statusDescription = 'Cette demande a été rejetée.';
  } else if (data.status === 'valide') {
    statusDescription = 'Approuvé, en attente de paiement.';
  } else if (data.status === 'verification') {
    statusDescription = 'Dossier en cours d\'analyse.';
  } else if (data.status === 'soumis') {
    statusDescription = 'Demande en attente de traitement.';
  }
  
  if (statusDescription) {
    doc.text(statusDescription, 95, y + 9);
  }
  
  y += 22;
  
  // Dates info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  
  addInfoRow(doc, 'Date de soumission', formatDate(data.created_at), col1, y, 45);
  if (data.validated_at) {
    addInfoRow(doc, 'Date de validation', formatDate(data.validated_at), col2, y, 40);
  }
  y += 8;
  if (data.paid_at) {
    addInfoRow(doc, 'Date de paiement', formatDate(data.paid_at), col1, y, 45);
  }
  
  if (data.notes) {
    y += 15;
    y = addSectionTitle(doc, 'Observations', y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);
    const splitNotes = doc.splitTextToSize(data.notes, pageWidth - 40);
    doc.text(splitNotes, 20, y);
  }
  
  addFooter(doc);
  
  const fileName = `Remboursement_${data.reimbursement_number}.pdf`;
  
  if (options.preview) {
    const dataUrl = doc.output('dataurlstring');
    return { dataUrl, fileName };
  }
  
  doc.save(fileName);
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

export const generateSubscriptionPDF = async (
  data: SubscriptionPDFData,
  options: { preview?: boolean } = {}
): Promise<{ dataUrl: string; fileName: string } | void> => {
  await ensureLogo();
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let y = addHeader(doc, 'ATTESTATION', 'DE SOUSCRIPTION');
  
  // Contract number box with accent
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(pageWidth - 85, y, 70, 22, 3, 3, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('N° Contrat', pageWidth - 50, y + 8, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(data.contract_number, pageWidth - 50, y + 17, { align: 'center' });
  
  y += 32;
  
  // Client information
  y = addSectionTitle(doc, 'Informations du souscripteur', y);
  
  const col1 = 20;
  const col2 = 115;
  
  addInfoRow(doc, 'Raison sociale', data.raison_sociale, col1, y, 38);
  addInfoRow(doc, 'Code client', data.client_code, col2, y, 30);
  
  y += 8;
  
  if (data.address) {
    addInfoRow(doc, 'Adresse', data.address, col1, y, 25);
    y += 8;
  }
  
  if (data.phone || data.email) {
    if (data.phone) {
      addInfoRow(doc, 'Téléphone', data.phone, col1, y, 30);
    }
    if (data.email) {
      addInfoRow(doc, 'Email', data.email, col2, y, 18);
    }
    y += 8;
  }
  
  // Status and date
  y += 5;
  const statusLabels: Record<string, string> = {
    en_attente: 'En attente',
    validee: 'Validée',
    rejetee: 'Rejetée',
    reserve_medicale: 'Réserve médicale',
  };
  
  const statusColors: Record<string, [number, number, number]> = {
    en_attente: COLORS.warning,
    validee: COLORS.success,
    rejetee: COLORS.error,
    reserve_medicale: [255, 152, 0],
  };
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textLight);
  doc.text('Statut :', col1, y);
  
  const contractStatusColor = statusColors[data.status] || COLORS.secondary;
  doc.setFillColor(contractStatusColor[0], contractStatusColor[1], contractStatusColor[2]);
  doc.roundedRect(col1 + 22, y - 4, 40, 7, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(statusLabels[data.status] || data.status, col1 + 42, y, { align: 'center' });
  
  addInfoRow(doc, 'Date d\'effet', formatDate(data.start_date), col2, y, 30);
  
  y += 15;
  
  // Insured persons
  if (data.insured && data.insured.length > 0) {
    y = addSectionTitle(doc, 'Assurés', y);
    
    const genderLabels: Record<string, string> = { M: 'Masculin', F: 'Féminin' };
    
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
      theme: 'plain',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: COLORS.lightGray,
      },
      styles: {
        fontSize: 9,
        cellPadding: 5,
        lineColor: COLORS.mediumGray,
        lineWidth: 0.1,
      },
      margin: { left: 15, right: 15 },
    });
    
    y = getLastTableY(doc) + 12;
  }
  
  // Beneficiaries
  if (data.beneficiaries && data.beneficiaries.length > 0) {
    y = addSectionTitle(doc, 'Ayants droit', y);
    
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
      theme: 'plain',
      headStyles: {
        fillColor: COLORS.primaryDark,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: COLORS.lightGray,
      },
      styles: {
        fontSize: 9,
        cellPadding: 5,
        lineColor: COLORS.mediumGray,
        lineWidth: 0.1,
      },
      margin: { left: 15, right: 15 },
    });
    
    y = getLastTableY(doc) + 12;
  }
  
  // Signature section
  y += 10;
  
  // Signature box
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(pageWidth - 95, y, 80, 45, 3, 3, 'F');
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  doc.text(`Fait à Moroni, le ${formatDate(new Date())}`, pageWidth - 55, y + 10, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Signature et cachet', pageWidth - 55, y + 20, { align: 'center' });
  doc.setTextColor(...COLORS.primary);
  doc.text('MAC ASSURANCES', pageWidth - 55, y + 28, { align: 'center' });
  
  addFooter(doc);
  
  const fileName = `Souscription_${data.contract_number}.pdf`;
  
  if (options.preview) {
    const dataUrl = doc.output('dataurlstring');
    return { dataUrl, fileName };
  }
  
  doc.save(fileName);
};

// ================== FICHE DE SOUSCRIPTION FAMILIALE ==================

export interface FicheSubscriptionPDFData {
  // Contractant
  client_code: string;
  contract_number: string;
  raison_sociale: string;
  address?: string;
  
  // Assuré principal
  insured: {
    last_name: string;
    first_name: string;
    maiden_name?: string;
    birth_date: string;
    birth_place?: string;
    address?: string;
    service_entry_date?: string;
    job_title?: string;
    work_location?: string;
    phone?: string;
    fax?: string;
    email?: string;
    insurance_start_date?: string;
    marital_status: string;
    gender: string;
  };
  
  // Conjoint
  spouse?: {
    last_name: string;
    first_name: string;
    birth_date: string;
    birth_place?: string;
    address?: string;
    service_entry_date?: string;
    job_title?: string;
    work_location?: string;
    insurance_start_date?: string;
  };
  
  // Famille
  family_members: {
    last_name: string;
    first_name: string;
    birth_date: string;
    relationship: string;
    age?: string;
    gender: string;
  }[];
  
  // Déclarations de santé
  health_declarations: {
    person_name: string;
    gender: string;
    taille?: string;
    poids?: string;
    tension?: string;
    questions: {
      question: string;
      answer: string;
    }[];
  }[];
  
  // Lieu et date de signature
  signature_location?: string;
  signature_date?: string;
}

export const generateFicheSubscriptionPDF = async (
  data: FicheSubscriptionPDFData,
  options: { preview?: boolean } = {}
): Promise<{ dataUrl: string; fileName: string } | void> => {
  await ensureLogo();
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // ===== PAGE 1 =====
  // Professional Header
  // Top accent bar (yellow)
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 0, pageWidth, 5, 'F');
  
  // Main header background
  doc.setFillColor(...COLORS.white);
  doc.rect(0, 5, pageWidth, 45, 'F');
  
  // Bottom border (blue)
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 50, pageWidth, 2, 'F');
  
  // Add logo if available
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 10, 10, 35, 32);
    } catch {
      // Fallback to text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.setTextColor(...COLORS.primary);
      doc.text('MAC', 15, 28);
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(...COLORS.primary);
    doc.text('MAC', 15, 28);
  }
  
  // Company name next to logo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.primary);
  doc.text('MAC ASSURANCES', 52, 22);
  
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.secondary);
  
  // Tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textLight);
  doc.text("Mutuelle d'Assurance des Comores", 52, 30);
  doc.text('Avenue de Strasbourg, Moroni-Bacha', 52, 38);
  
  // Contact info (right side)
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(8);
  doc.text('www.macassurances.com', pageWidth - 15, 30, { align: 'right' });
  doc.text('mac.assurances@gmail.com', pageWidth - 15, 36, { align: 'right' });
  doc.text('Tél: +269 773 00 00', pageWidth - 15, 42, { align: 'right' });
  
  // 10 ans badge
  doc.setFillColor(...COLORS.primary);
  doc.circle(pageWidth - 35, 24, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('10', pageWidth - 38, 23);
  doc.setFontSize(7);
  doc.text('ans', pageWidth - 38, 28);
  
  let y = 60;
  
  // Title
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(30, y, pageWidth - 60, 20, 3, 3, 'F');
  doc.setTextColor(...COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('FORMULAIRE DE SOUSCRIPTION', pageWidth / 2, y + 9, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.text);
  doc.text('Assurance Maladie Familiale', pageWidth / 2, y + 16, { align: 'center' });
  
  y += 30;
  
  // LE CONTRACTANT section
  y = addSectionTitle(doc, 'Le contractant', y);
  
  doc.setTextColor(...COLORS.text);
  
  // Client and contract info in a nice box
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(15, y, pageWidth - 30, 25, 2, 2, 'F');
  
  addInfoRow(doc, 'Code Client', data.client_code, 20, y + 8, 30);
  addInfoRow(doc, 'N° Contrat SCM', data.contract_number, 110, y + 8, 40);
  addInfoRow(doc, 'Raison Sociale', data.raison_sociale, 20, y + 18, 35);
  if (data.address) {
    addInfoRow(doc, 'Adresse', data.address, 110, y + 18, 25);
  }
  
  y += 35;
  
  // BULLETIN INDIVIDUEL DE SOUSCRIPTION
  y = addSectionTitle(doc, 'Bulletin individuel de souscription', y);
  
  // 1. Assuré
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  doc.text('1. Assuré principal', 20, y);
  y += 10;
  
  const lineHeight = 7;
  const col1 = 20;
  
  addInfoRow(doc, 'Nom', data.insured.last_name, col1, y, 35);
  addInfoRow(doc, 'Prénom', data.insured.first_name, 110, y, 25);
  y += lineHeight;
  
  if (data.insured.maiden_name) {
    addInfoRow(doc, 'Nom de jeune fille', data.insured.maiden_name, col1, y, 50);
    y += lineHeight;
  }
  
  addInfoRow(doc, 'Né(e) le', data.insured.birth_date ? formatDate(data.insured.birth_date) : '', col1, y, 25);
  addInfoRow(doc, 'à', data.insured.birth_place || '', 75, y, 8);
  y += lineHeight;
  
  addInfoRow(doc, 'Adresse', data.insured.address || '', col1, y, 25);
  y += lineHeight;
  
  addInfoRow(doc, 'Emploi', data.insured.job_title || '', col1, y, 25);
  addInfoRow(doc, 'Lieu de travail', data.insured.work_location || '', 110, y, 40);
  y += lineHeight;
  
  addInfoRow(doc, 'Téléphone', data.insured.phone || '', col1, y, 30);
  addInfoRow(doc, 'Email', data.insured.email || '', 110, y, 20);
  y += lineHeight;
  
  addInfoRow(doc, 'Date entrée assurance', data.insured.insurance_start_date ? formatDate(data.insured.insurance_start_date) : '', col1, y, 52);
  y += lineHeight + 5;
  
  // Situation familiale avec checkboxes
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textLight);
  doc.text('Situation Familiale :', 20, y);
  
  const drawCheckbox = (x: number, yPos: number, checked: boolean, label: string) => {
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.5);
    doc.rect(x, yPos - 3.5, 4, 4);
    if (checked) {
      doc.setFillColor(...COLORS.primary);
      doc.rect(x + 0.5, yPos - 3, 3, 3, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(9);
    doc.text(label, x + 6, yPos);
  };
  
  y += 8;
  drawCheckbox(25, y, data.insured.marital_status === 'marie', 'Marié(e)');
  drawCheckbox(60, y, data.insured.marital_status === 'celibataire', 'Célibataire');
  drawCheckbox(105, y, data.insured.marital_status === 'veuf', 'Veuf(ve)');
  drawCheckbox(140, y, data.insured.marital_status === 'divorce', 'Divorcé(e)');
  
  // 2. Conjoint section
  if (data.spouse) {
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.primary);
    doc.text('2. Conjoint(e)', 20, y);
    y += 10;
    
    addInfoRow(doc, 'Nom', data.spouse.last_name, col1, y, 35);
    addInfoRow(doc, 'Prénom', data.spouse.first_name, 110, y, 25);
    y += lineHeight;
    
    addInfoRow(doc, 'Né(e) le', data.spouse.birth_date ? formatDate(data.spouse.birth_date) : '', col1, y, 25);
    addInfoRow(doc, 'à', data.spouse.birth_place || '', 75, y, 8);
    y += lineHeight;
    
    addInfoRow(doc, 'Emploi', data.spouse.job_title || '', col1, y, 25);
    addInfoRow(doc, 'Lieu de travail', data.spouse.work_location || '', 110, y, 40);
    y += lineHeight;
  }
  
  // Add footer on page 1
  addFooter(doc);
  
  // ===== PAGE 2 - Membres de famille =====
  doc.addPage();
  y = addHeader(doc, 'FORMULAIRE', 'DE SOUSCRIPTION');
  
  // Section title
  y = addSectionTitle(doc, '3. Membres de la famille pris en charge', y);
  
  if (data.family_members && data.family_members.length > 0) {
    const relationLabels: Record<string, string> = {
      conjoint: 'Conjoint(e)',
      enfant: 'Enfant',
      parent: 'Parent',
      autre: 'Autre',
    };
    
    const familyData = data.family_members.map((member) => {
      const age = member.birth_date ? Math.floor((new Date().getTime() - new Date(member.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : '';
      return [
        member.last_name,
        member.first_name,
        member.birth_date ? formatDate(member.birth_date) : '',
        relationLabels[member.relationship] || member.relationship,
        age.toString(),
        member.gender === 'M' ? 'M' : 'F',
      ];
    });
    
    autoTable(doc, {
      startY: y,
      head: [['Nom', 'Prénom', 'Date de naissance', 'Parenté', 'Âge', 'Sexe']],
      body: familyData,
      theme: 'plain',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: COLORS.lightGray,
      },
      styles: {
        fontSize: 9,
        cellPadding: 5,
        lineColor: COLORS.mediumGray,
        lineWidth: 0.1,
      },
      margin: { left: 15, right: 15 },
    });
    
    y = getLastTableY(doc) + 15;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.textLight);
    doc.text('Aucun membre de famille enregistré', 20, y);
    y += 15;
  }
  
  addFooter(doc);
  
  // ===== PAGE 3 - Déclarations de santé =====
  doc.addPage();
  y = addHeader(doc, 'QUESTIONNAIRE', 'DE SANTÉ');
  
  y = addSectionTitle(doc, 'Déclarations de santé', y);
  
  // Health questions table
  const healthQuestions = [
    'Taille (cm)',
    'Poids (kg)',
    'Tension artérielle',
    'Êtes-vous actuellement en bonne santé ?',
    'Avez-vous un défaut de constitution, une infirmité ou une maladie chronique ?',
    'Si oui, préciser la nature',
    'Avez-vous dans le passé été atteint d\'affection pulmonaire, nerveuse, cardiaque, rénale ?',
    'Si oui, préciser à quel âge et donner des détails',
    'Préciser les maladies antérieures',
    'Pour les Femmes : Problèmes liés à votre état ?',
    'Vos couches sont-elles normales ?',
    'Autres cas particuliers à signaler ?',
  ];
  
  // Prepare columns: Questions + family members
  const headers: string[] = ['Questions', 'Assuré'];
  if (data.spouse) headers.push('Conjoint');
  data.family_members.slice(0, 3).forEach((_, i) => headers.push(`Enfant ${i + 1}`));
  
  const healthRows = healthQuestions.map(q => {
    const row: string[] = [q];
    for (let i = 1; i < headers.length; i++) {
      row.push('');
    }
    return row;
  });
  
  autoTable(doc, {
    startY: y,
    head: [headers],
    body: healthRows,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      cellPadding: 3,
    },
    styles: {
      fontSize: 7,
      cellPadding: 4,
      minCellHeight: 8,
      lineColor: COLORS.mediumGray,
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    margin: { left: 10, right: 10 },
  });
  
  y = getLastTableY(doc) + 10;
  
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textLight);
  doc.text('* Tout trait tiré en travers d\'une case ne constitue pas une réponse valide.', 20, y);
  
  addFooter(doc);
  
  // ===== PAGE 4 - Engagement et signature =====
  doc.addPage();
  y = addHeader(doc, 'ENGAGEMENT', 'ET SIGNATURE');
  
  y = addSectionTitle(doc, 'Engagement du souscripteur', y);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.text);
  
  const engagementText = "Je soussigné(e), déclare que toutes les réponses ci-dessus sont exactes et sincères. Je certifie avoir signalé toutes les maladies et infirmités actuelles ou antérieures dont j'ai pu avoir connaissance, pour moi-même et ma famille. J'accepte que le présent document serve de base aux garanties du contrat.";
  const splitEngagement = doc.splitTextToSize(engagementText, pageWidth - 40);
  doc.text(splitEngagement, 20, y);
  y += splitEngagement.length * 5 + 10;
  
  // Warning box
  doc.setFillColor(255, 245, 245);
  doc.setDrawColor(...COLORS.error);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, y, pageWidth - 30, 25, 2, 2, 'FD');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.error);
  doc.text('ATTENTION', 20, y + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.text);
  const warningText = "Toute fausse déclaration intentionnelle, toute réticence entraîne la nullité du contrat conformément à l'article 18 du code des Assurances, les primes échues restant acquises à la compagnie.";
  const splitWarning = doc.splitTextToSize(warningText, pageWidth - 50);
  doc.text(splitWarning, 20, y + 15);
  
  y += 40;
  
  // Signature section
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.text);
  doc.text(`Fait à ${data.signature_location || 'Moroni'} le ${data.signature_date ? formatDate(data.signature_date) : '........................'}`, 20, y);
  
  y += 15;
  
  // Signature boxes
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Signature de l\'assuré(e)', 25, y);
  doc.text('Lu et approuvé', 35, y + 8);
  
  // Signature box for insured
  doc.setDrawColor(...COLORS.mediumGray);
  doc.setLineWidth(0.5);
  doc.roundedRect(20, y + 12, 75, 40, 3, 3, 'S');
  
  y += 65;
  
  // Section réservée à l'assureur
  y = addSectionTitle(doc, 'Partie réservée à l\'assureur et à son médecin conseil', y);
  
  autoTable(doc, {
    startY: y,
    head: [['Acceptation simple', 'Réserves / Exclusions']],
    body: [['', '']],
    theme: 'plain',
    headStyles: {
      fillColor: COLORS.primaryDark,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    styles: {
      fontSize: 10,
      cellPadding: 20,
      minCellHeight: 40,
      lineColor: COLORS.mediumGray,
      lineWidth: 0.3,
    },
    margin: { left: 20, right: 20 },
  });
  
  y = getLastTableY(doc) + 15;
  
  // Cachet assureur
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(pageWidth - 95, y, 80, 45, 3, 3, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  doc.text('Signature et cachet', pageWidth - 55, y + 12, { align: 'center' });
  doc.setTextColor(...COLORS.primary);
  doc.text('MAC ASSURANCES', pageWidth - 55, y + 22, { align: 'center' });
  
  addFooter(doc);
  
  const fileName = `Fiche_Souscription_${data.contract_number}.pdf`;
  
  if (options.preview) {
    const dataUrl = doc.output('dataurlstring');
    return { dataUrl, fileName };
  }
  
  doc.save(fileName);
};

// Monthly summary PDF interface
export interface MonthlySummaryPDFData {
  month: string; // Format: "YYYY-MM"
  reimbursements: {
    reimbursement_number: string;
    insured_name: string;
    care_type: string;
    medical_date: string;
    claimed_amount: number;
    approved_amount?: number;
    paid_amount?: number;
    status: string;
  }[];
  stats: {
    total: number;
    soumis: number;
    verification: number;
    valide: number;
    paye: number;
    rejete: number;
    totalClaimed: number;
    totalApproved: number;
    totalPaid: number;
  };
}

export const generateMonthlySummaryPDF = async (
  data: MonthlySummaryPDFData,
  options: { preview?: boolean } = {}
): Promise<{ dataUrl: string; fileName: string } | void> => {
  await ensureLogo();
  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Parse month for display
  const [year, monthNum] = data.month.split('-');
  const monthDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
  const monthLabel = format(monthDate, 'MMMM yyyy', { locale: fr });
  
  let y = addHeader(doc, 'RÉCAPITULATIF', `Remboursements - ${monthLabel}`);
  
  // Period box
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(pageWidth - 100, y, 85, 20, 3, 3, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('Période', pageWidth - 57.5, y + 7, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(monthLabel.toUpperCase(), pageWidth - 57.5, y + 15, { align: 'center' });
  
  y += 28;
  
  // Statistics cards
  const cardWidth = 42;
  const cardSpacing = 5;
  const startX = 15;
  
  const statsCards = [
    { label: 'Total', value: data.stats.total.toString(), color: COLORS.primary },
    { label: 'Soumis', value: data.stats.soumis.toString(), color: COLORS.warning },
    { label: 'Vérification', value: data.stats.verification.toString(), color: COLORS.primary },
    { label: 'Validés', value: data.stats.valide.toString(), color: COLORS.success },
    { label: 'Payés', value: data.stats.paye.toString(), color: [34, 197, 94] as [number, number, number] },
    { label: 'Rejetés', value: data.stats.rejete.toString(), color: COLORS.error },
  ];
  
  statsCards.forEach((card, index) => {
    const x = startX + (cardWidth + cardSpacing) * index;
    
    // Card background
    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(x, y, cardWidth, 22, 2, 2, 'F');
    
    // Top accent
    doc.setFillColor(card.color[0], card.color[1], card.color[2]);
    doc.rect(x, y, cardWidth, 3, 'F');
    
    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textLight);
    doc.text(card.label, x + cardWidth / 2, y + 10, { align: 'center' });
    
    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(card.color[0], card.color[1], card.color[2]);
    doc.text(card.value, x + cardWidth / 2, y + 19, { align: 'center' });
  });
  
  y += 30;
  
  // Financial summary
  const financeStartX = pageWidth - 95;
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(financeStartX, y - 25, 80, 22, 2, 2, 'F');
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textLight);
  doc.text('Total payé ce mois', financeStartX + 40, y - 18, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.success);
  doc.text(formatCurrency(data.stats.totalPaid), financeStartX + 40, y - 9, { align: 'center' });
  
  y += 5;
  
  // Reimbursements table
  y = addSectionTitle(doc, 'Liste des remboursements', y);
  
  const statusLabels: Record<string, string> = {
    soumis: 'Soumis',
    verification: 'Vérification',
    valide: 'Validé',
    paye: 'Payé',
    rejete: 'Rejeté',
  };
  
  const careTypeLabels: Record<string, string> = {
    consultation: 'Consultation',
    hospitalisation: 'Hospitalisation',
    pharmacie: 'Pharmacie',
    analyses: 'Analyses',
    radiologie: 'Radiologie',
    autre: 'Autre',
  };
  
  const tableData = data.reimbursements.map(r => [
    r.reimbursement_number,
    r.insured_name,
    careTypeLabels[r.care_type] || r.care_type,
    formatDate(r.medical_date),
    formatCurrency(r.claimed_amount),
    r.approved_amount != null ? formatCurrency(r.approved_amount) : '—',
    r.paid_amount != null ? formatCurrency(r.paid_amount) : '—',
    statusLabels[r.status] || r.status,
  ]);
  
  autoTable(doc, {
    startY: y,
    head: [['N° Dossier', 'Assuré', 'Type de soin', 'Date soins', 'Réclamé', 'Approuvé', 'Payé', 'Statut']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    styles: {
      cellPadding: 4,
      lineColor: COLORS.mediumGray,
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 45 },
      2: { cellWidth: 30 },
      3: { cellWidth: 25 },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
      6: { cellWidth: 30, halign: 'right' },
      7: { cellWidth: 25, halign: 'center' },
    },
    margin: { left: 15, right: 15 },
    didParseCell: (hookData) => {
      // Color status cells
      if (hookData.section === 'body' && hookData.column.index === 7) {
        const cellValue = hookData.cell.raw as string;
        if (cellValue === 'Payé') {
          hookData.cell.styles.textColor = [34, 197, 94];
          hookData.cell.styles.fontStyle = 'bold';
        } else if (cellValue === 'Rejeté') {
          hookData.cell.styles.textColor = COLORS.error as any;
          hookData.cell.styles.fontStyle = 'bold';
        } else if (cellValue === 'Validé') {
          hookData.cell.styles.textColor = COLORS.success as any;
        }
      }
    },
  });
  
  y = getLastTableY(doc) + 15;
  
  // Totals summary
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(pageWidth - 160, y, 145, 30, 3, 3, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  doc.text('TOTAUX', pageWidth - 150, y + 10);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textLight);
  doc.text('Réclamé:', pageWidth - 120, y + 10);
  doc.text('Approuvé:', pageWidth - 120, y + 18);
  doc.text('Payé:', pageWidth - 120, y + 26);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text(formatCurrency(data.stats.totalClaimed), pageWidth - 80, y + 10);
  doc.text(formatCurrency(data.stats.totalApproved), pageWidth - 80, y + 18);
  doc.setTextColor(...COLORS.success);
  doc.text(formatCurrency(data.stats.totalPaid), pageWidth - 80, y + 26);
  
  addFooter(doc);
  
  const fileName = `Recapitulatif_Remboursements_${data.month}.pdf`;
  
  if (options.preview) {
    const dataUrl = doc.output('dataurlstring');
    return { dataUrl, fileName };
  }
  
  doc.save(fileName);
};

// ===== RÉCAPITULATIF DES SOUSCRIPTIONS =====
export interface SubscriptionSummaryPDFData {
  contracts: {
    contract_number: string;
    client_code: string;
    raison_sociale: string;
    status: string;
    start_date: string;
    created_at: string;
    insured_count: number;
  }[];
  stats: {
    total: number;
    en_attente: number;
    validee: number;
    rejetee: number;
    reserve_medicale: number;
  };
}

export const generateSubscriptionSummaryPDF = async (
  data: SubscriptionSummaryPDFData,
  options: { preview?: boolean } = {}
): Promise<{ dataUrl: string; fileName: string } | void> => {
  await ensureLogo();
  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let y = addHeader(doc, 'RÉCAPITULATIF', 'DES SOUSCRIPTIONS');
  
  // Date box
  const today = new Date();
  const dateLabel = format(today, 'dd MMMM yyyy', { locale: fr });
  
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(pageWidth - 95, y, 80, 22, 3, 3, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Date d\'édition', pageWidth - 55, y + 8, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(dateLabel.toUpperCase(), pageWidth - 55, y + 17, { align: 'center' });
  
  y += 30;
  
  // Statistics cards
  const cardWidth = 50;
  const cardSpacing = 8;
  const startX = 15;
  
  const statsCards = [
    { label: 'Total', value: data.stats.total.toString(), color: COLORS.primary },
    { label: 'En attente', value: data.stats.en_attente.toString(), color: COLORS.warning },
    { label: 'Validées', value: data.stats.validee.toString(), color: COLORS.success },
    { label: 'Rejetées', value: data.stats.rejetee.toString(), color: COLORS.error },
    { label: 'Réserve médicale', value: data.stats.reserve_medicale.toString(), color: [245, 158, 11] as [number, number, number] },
  ];
  
  statsCards.forEach((card, index) => {
    const x = startX + (cardWidth + cardSpacing) * index;
    
    // Card background
    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(x, y, cardWidth, 24, 2, 2, 'F');
    
    // Top accent
    doc.setFillColor(card.color[0], card.color[1], card.color[2]);
    doc.rect(x, y, cardWidth, 3, 'F');
    
    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textLight);
    doc.text(card.label, x + cardWidth / 2, y + 11, { align: 'center' });
    
    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(card.color[0], card.color[1], card.color[2]);
    doc.text(card.value, x + cardWidth / 2, y + 21, { align: 'center' });
  });
  
  y += 35;
  
  // Subscriptions table
  y = addSectionTitle(doc, 'Liste des souscriptions', y);
  
  const statusLabels: Record<string, string> = {
    en_attente: 'En attente',
    validee: 'Validée',
    rejetee: 'Rejetée',
    reserve_medicale: 'Réserve médicale',
  };
  
  const tableData = data.contracts.map(c => [
    c.contract_number,
    c.client_code,
    c.raison_sociale,
    c.insured_count.toString(),
    formatDate(c.start_date),
    formatDate(c.created_at),
    statusLabels[c.status] || c.status,
  ]);
  
  autoTable(doc, {
    startY: y,
    head: [['N° Contrat', 'Code Client', 'Raison Sociale', 'Nb Assurés', 'Date début', 'Date création', 'Statut']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    styles: {
      cellPadding: 5,
      lineColor: COLORS.mediumGray,
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 35, halign: 'center' },
      2: { cellWidth: 70 },
      3: { cellWidth: 30, halign: 'center' },
      4: { cellWidth: 35, halign: 'center' },
      5: { cellWidth: 35, halign: 'center' },
      6: { cellWidth: 40, halign: 'center' },
    },
    margin: { left: 15, right: 15 },
    didParseCell: (hookData) => {
      // Color status cells
      if (hookData.section === 'body' && hookData.column.index === 6) {
        const cellValue = hookData.cell.raw as string;
        if (cellValue === 'Validée') {
          hookData.cell.styles.textColor = COLORS.success as any;
          hookData.cell.styles.fontStyle = 'bold';
        } else if (cellValue === 'Rejetée') {
          hookData.cell.styles.textColor = COLORS.error as any;
          hookData.cell.styles.fontStyle = 'bold';
        } else if (cellValue === 'En attente') {
          hookData.cell.styles.textColor = COLORS.warning as any;
        } else if (cellValue === 'Réserve médicale') {
          hookData.cell.styles.textColor = [245, 158, 11] as any;
          hookData.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });
  
  addFooter(doc);
  
  const fileName = `Recapitulatif_Souscriptions_${format(today, 'yyyy-MM-dd')}.pdf`;
  
  if (options.preview) {
    const dataUrl = doc.output('dataurlstring');
    return { dataUrl, fileName };
  }
  
  doc.save(fileName);
};

// ===== RÉCAPITULATIF DES ASSURÉS =====
export interface InsuredSummaryPDFData {
  insured: {
    matricule: string;
    first_name: string;
    last_name: string;
    gender: string;
    birth_date: string;
    phone?: string;
    email?: string;
    employer?: string;
    job_title?: string;
    status: string;
    has_paid_contribution: boolean;
    contract_number?: string;
  }[];
  stats: {
    total: number;
    male: number;
    female: number;
    with_paid_contribution: number;
    without_paid_contribution: number;
  };
}

export const generateInsuredSummaryPDF = async (
  data: InsuredSummaryPDFData,
  options: { preview?: boolean } = {}
): Promise<{ dataUrl: string; fileName: string } | void> => {
  await ensureLogo();
  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let y = addHeader(doc, 'RÉCAPITULATIF', 'DES ASSURÉS');
  
  // Date box
  const today = new Date();
  const dateLabel = format(today, 'dd MMMM yyyy', { locale: fr });
  
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(pageWidth - 95, y, 80, 22, 3, 3, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Date d\'édition', pageWidth - 55, y + 8, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(dateLabel.toUpperCase(), pageWidth - 55, y + 17, { align: 'center' });
  
  y += 30;
  
  // Statistics cards
  const cardWidth = 50;
  const cardSpacing = 8;
  const startX = 15;
  
  const statsCards = [
    { label: 'Total Assurés', value: data.stats.total.toString(), color: COLORS.primary },
    { label: 'Hommes', value: data.stats.male.toString(), color: [59, 130, 246] as [number, number, number] },
    { label: 'Femmes', value: data.stats.female.toString(), color: [236, 72, 153] as [number, number, number] },
    { label: 'Cotisation payée', value: data.stats.with_paid_contribution.toString(), color: COLORS.success },
    { label: 'Non payée', value: data.stats.without_paid_contribution.toString(), color: COLORS.warning },
  ];
  
  statsCards.forEach((card, index) => {
    const x = startX + (cardWidth + cardSpacing) * index;
    
    // Card background
    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(x, y, cardWidth, 24, 2, 2, 'F');
    
    // Top accent
    doc.setFillColor(card.color[0], card.color[1], card.color[2]);
    doc.rect(x, y, cardWidth, 3, 'F');
    
    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textLight);
    doc.text(card.label, x + cardWidth / 2, y + 11, { align: 'center' });
    
    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(card.color[0], card.color[1], card.color[2]);
    doc.text(card.value, x + cardWidth / 2, y + 21, { align: 'center' });
  });
  
  y += 35;
  
  // Insured table
  y = addSectionTitle(doc, 'Liste des assurés', y);
  
  const tableData = data.insured.map(i => [
    i.matricule,
    `${i.first_name} ${i.last_name}`,
    i.gender === 'M' ? 'M' : 'F',
    formatDate(i.birth_date),
    i.phone || '—',
    i.employer || '—',
    i.job_title || '—',
    i.contract_number || '—',
    i.has_paid_contribution ? 'Payée' : 'Non payée',
  ]);
  
  autoTable(doc, {
    startY: y,
    head: [['Matricule', 'Nom Complet', 'Genre', 'Naissance', 'Téléphone', 'Employeur', 'Poste', 'N° Contrat', 'Cotisation']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    styles: {
      cellPadding: 4,
      lineColor: COLORS.mediumGray,
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 45 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 30 },
      5: { cellWidth: 40 },
      6: { cellWidth: 35 },
      7: { cellWidth: 35 },
      8: { cellWidth: 25, halign: 'center' },
    },
    margin: { left: 15, right: 15 },
    didParseCell: (hookData) => {
      // Color cotisation cells
      if (hookData.section === 'body' && hookData.column.index === 8) {
        const cellValue = hookData.cell.raw as string;
        if (cellValue === 'Payée') {
          hookData.cell.styles.textColor = COLORS.success as any;
          hookData.cell.styles.fontStyle = 'bold';
        } else if (cellValue === 'Non payée') {
          hookData.cell.styles.textColor = COLORS.warning as any;
        }
      }
    },
  });
  
  addFooter(doc);
  
  const fileName = `Recapitulatif_Assures_${format(today, 'yyyy-MM-dd')}.pdf`;
  
  if (options.preview) {
    const dataUrl = doc.output('dataurlstring');
    return { dataUrl, fileName };
  }
  
  doc.save(fileName);
};

// Generate contribution receipt PDF
export interface ContributionReceiptPDFData {
  contract: {
    contract_number: string;
    raison_sociale: string;
    client_code: string;
  };
  period_start: string;
  period_end: string;
  amount: number;
  paid_amount: number;
  payment_date: string | null;
  payment_reference: string | null;
  payment_status: string;
}

export const generateContributionReceiptPDF = async (
  data: ContributionReceiptPDFData,
  options: { preview?: boolean } = {}
): Promise<{ dataUrl: string; fileName: string } | void> => {
  await ensureLogo();
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let y = addHeader(doc, 'REÇU', 'DE PAIEMENT');
  
  // Receipt number box
  const receiptNumber = `REC-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(pageWidth - 85, y, 70, 22, 3, 3, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('N° Reçu', pageWidth - 50, y + 8, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(receiptNumber, pageWidth - 50, y + 17, { align: 'center' });
  
  y += 32;
  
  const col1 = 20;
  const col2 = pageWidth / 2 + 10;
  
  // Contract information
  y = addSectionTitle(doc, 'Informations du contrat', y);
  
  addInfoRow(doc, 'Raison sociale', data.contract.raison_sociale, col1, y, 35);
  addInfoRow(doc, 'N° Contrat', data.contract.contract_number, col2, y, 30);
  
  y += 8;
  addInfoRow(doc, 'Code Client', data.contract.client_code, col1, y, 35);
  
  y += 15;
  
  // Period information
  y = addSectionTitle(doc, 'Période de cotisation', y);
  
  addInfoRow(doc, 'Début', formatDate(data.period_start), col1, y, 35);
  addInfoRow(doc, 'Fin', formatDate(data.period_end), col2, y, 30);
  
  y += 15;
  
  // Payment details
  y = addSectionTitle(doc, 'Détails du paiement', y);
  
  // Payment table
  autoTable(doc, {
    startY: y,
    head: [['Description', 'Montant']],
    body: [
      ['Montant de la cotisation', formatCurrency(data.amount)],
      ['Montant payé', formatCurrency(data.paid_amount)],
      ['Reste à payer', formatCurrency(Math.max(0, data.amount - data.paid_amount))],
    ],
    theme: 'plain',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    styles: {
      cellPadding: 6,
      lineColor: COLORS.mediumGray,
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 100, fontStyle: 'normal' },
      1: { cellWidth: 60, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 20, right: 20 },
  });
  
  y = getLastTableY(doc) + 15;
  
  // Payment info
  if (data.payment_reference) {
    addInfoRow(doc, 'Référence de paiement', data.payment_reference, col1, y, 50);
    y += 8;
  }
  if (data.payment_date) {
    addInfoRow(doc, 'Date de paiement', formatDate(data.payment_date), col1, y, 50);
  }
  
  y += 20;
  
  // Status badge
  const statusLabels: Record<string, string> = {
    paye: 'PAYÉ',
    partiel: 'PARTIEL',
    en_attente: 'EN ATTENTE',
  };
  
  const statusColors: Record<string, [number, number, number]> = {
    paye: COLORS.success,
    partiel: COLORS.warning,
    en_attente: COLORS.secondary,
  };
  
  const statusLabel = statusLabels[data.payment_status] || data.payment_status.toUpperCase();
  const statusColor = statusColors[data.payment_status] || COLORS.secondary;
  
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(pageWidth / 2 - 35, y, 70, 16, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(statusLabel, pageWidth / 2, y + 11, { align: 'center' });
  
  y += 30;
  
  // Signature section
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  doc.text('Ce reçu atteste du paiement effectué pour la cotisation mentionnée ci-dessus.', 20, y);
  
  y += 15;
  
  // Signature box
  doc.setDrawColor(...COLORS.mediumGray);
  doc.setLineWidth(0.5);
  doc.rect(pageWidth - 90, y, 70, 30);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textLight);
  doc.text('Cachet et signature', pageWidth - 55, y + 35, { align: 'center' });
  
  addFooter(doc);
  
  const fileName = `Recu_${data.contract.contract_number}_${format(new Date(data.period_start), 'yyyyMM')}.pdf`;
  
  if (options.preview) {
    const dataUrl = doc.output('dataurlstring');
    return { dataUrl, fileName };
  }
  
  doc.save(fileName);
};

// Generate Insured Card PDF (ID Card format)
export interface InsuredCardPDFData {
  matricule: string;
  first_name: string;
  last_name: string;
  gender: string;
  birth_date: string;
  birth_place?: string;
  phone?: string;
  email?: string;
  employer?: string;
  job_title?: string;
  insurance_start_date: string;
  insurance_end_date?: string;
  status: string;
  contract?: {
    contract_number: string;
    raison_sociale: string;
  };
  photo_url?: string;
}

export const generateInsuredCardPDF = async (
  data: InsuredCardPDFData,
  options: { preview?: boolean } = {}
): Promise<{ dataUrl: string; fileName: string } | void> => {
  await ensureLogo();
  
  // Card dimensions (credit card ratio: 85.6mm x 53.98mm)
  // Scaled up for better print quality and readability
  const cardWidth = 200;
  const cardHeight = 126;
  
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [cardHeight + 30, cardWidth + 30],
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Center the card
  const cardX = (pageWidth - cardWidth) / 2;
  const cardY = (pageHeight - cardHeight) / 2;
  
  // ============ CARD BACKGROUND WITH GRADIENT EFFECT ============
  // Main card background - white
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 6, 6, 'F');
  
  // Subtle gradient effect with overlapping shapes
  doc.setFillColor(248, 252, 255);
  doc.roundedRect(cardX, cardY + cardHeight * 0.6, cardWidth, cardHeight * 0.4, 0, 0, 'F');
  
  // Card border with shadow effect
  doc.setDrawColor(200, 220, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(cardX + 0.5, cardY + 0.5, cardWidth, cardHeight, 6, 6, 'S');
  
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(1);
  doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 6, 6, 'S');
  
  // ============ TOP HEADER SECTION ============
  // Yellow accent stripe at very top
  doc.setFillColor(...COLORS.accent);
  doc.roundedRect(cardX, cardY, cardWidth, 4, 6, 6, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(cardX, cardY + 2, cardWidth, 2, 'F');
  
  // White header band (for better logo visibility)
  doc.setFillColor(255, 255, 255);
  doc.rect(cardX, cardY + 4, cardWidth, 30, 'F');
  
  // Blue accent line under header
  doc.setFillColor(...COLORS.primary);
  doc.rect(cardX, cardY + 34, cardWidth, 2, 'F');
  
  // Left decorative blue stripe
  doc.setFillColor(...COLORS.primary);
  doc.rect(cardX, cardY + 4, 4, 30, 'F');
  
  // ============ LOGO AND COMPANY INFO ============
  let logoEndX = cardX + 12;
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', cardX + 10, cardY + 8, 24, 21);
      logoEndX = cardX + 38;
    } catch {
      // Fallback handled below
    }
  }
  
  // Company name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.primary);
  doc.text('MAC ASSURANCES', logoEndX + 4, cardY + 17);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textLight);
  doc.text("Mutuelle d'Assurance des Comores", logoEndX + 4, cardY + 25);
  
  // Card type badge on right
  doc.setFillColor(...COLORS.accent);
  doc.roundedRect(cardX + cardWidth - 58, cardY + 10, 50, 18, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.text);
  doc.text("CARTE D'ASSURÉ", cardX + cardWidth - 33, cardY + 18, { align: 'center' });
  doc.setFontSize(7);
  doc.text('PRINCIPAL', cardX + cardWidth - 33, cardY + 25, { align: 'center' });
  
  // ============ MAIN CONTENT AREA ============
  const contentY = cardY + 40;
  const col1X = cardX + 12;
  const col2X = cardX + cardWidth * 0.55;
  
  // ============ PHOTO SECTION ============
  const photoSize = 36;
  const photoX = cardX + cardWidth - photoSize - 15;
  const photoY = contentY + 2;
  
  // Photo frame with gradient border
  doc.setFillColor(240, 248, 255);
  doc.roundedRect(photoX - 2, photoY - 2, photoSize + 4, photoSize + 4, 4, 4, 'F');
  
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.8);
  doc.roundedRect(photoX - 2, photoY - 2, photoSize + 4, photoSize + 4, 4, 4, 'S');
  
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(photoX, photoY, photoSize, photoSize, 3, 3, 'F');
  
  // Initials with better styling
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...COLORS.primary);
  doc.text(
    `${data.first_name[0]}${data.last_name[0]}`,
    photoX + photoSize / 2,
    photoY + photoSize / 2 + 5,
    { align: 'center' }
  );
  
  // ============ MATRICULE (PROMINENT) ============
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(col1X - 4, contentY - 2, 100, 16, 3, 3, 'F');
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.3);
  doc.roundedRect(col1X - 4, contentY - 2, 100, 16, 3, 3, 'S');
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.primary);
  doc.text('N° MATRICULE', col1X, contentY + 3);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.text);
  doc.text(data.matricule, col1X, contentY + 11);
  
  // ============ FULL NAME ============
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textLight);
  doc.text('NOM COMPLET', col1X, contentY + 22);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.text);
  const fullName = `${data.first_name.toUpperCase()} ${data.last_name.toUpperCase()}`;
  doc.text(fullName.length > 26 ? fullName.substring(0, 26) + '...' : fullName, col1X, contentY + 29);
  
  // ============ BIRTH DATE & GENDER ============
  // Birth date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textLight);
  doc.text('DATE DE NAISSANCE', col1X, contentY + 40);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.text);
  doc.text(formatDate(data.birth_date), col1X, contentY + 47);
  
  // Gender
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textLight);
  doc.text('SEXE', col1X + 50, contentY + 40);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.text);
  doc.text(data.gender === 'M' ? 'Masculin' : 'Féminin', col1X + 50, contentY + 47);
  
  // ============ EMPLOYER ============
  if (data.employer) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.textLight);
    doc.text('EMPLOYEUR', col1X, contentY + 56);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);
    const employer = data.employer.length > 40 ? data.employer.substring(0, 40) + '...' : data.employer;
    doc.text(employer, col1X, contentY + 63);
  }
  
  // ============ CONTRACT NUMBER ============
  if (data.contract) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.textLight);
    doc.text('N° CONTRAT', photoX - 2, photoY + photoSize + 10);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);
    const contractNum = data.contract.contract_number.length > 22 
      ? data.contract.contract_number.substring(0, 22) + '...' 
      : data.contract.contract_number;
    doc.text(contractNum, photoX - 2, photoY + photoSize + 17);
  }
  
  // ============ BOTTOM VALIDITY SECTION ============
  const bottomY = cardY + cardHeight - 24;
  
  // Bottom band with gradient
  doc.setFillColor(245, 247, 250);
  doc.rect(cardX, bottomY, cardWidth, 24, 'F');
  
  // Thin accent line
  doc.setFillColor(...COLORS.primary);
  doc.rect(cardX, bottomY, cardWidth, 1, 'F');
  
  // Validity dates with icons
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textLight);
  doc.text('VALABLE DU', col1X, bottomY + 7);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);
  doc.text(formatDate(data.insurance_start_date), col1X, bottomY + 14);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textLight);
  doc.text('AU', col1X + 55, bottomY + 7);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);
  doc.text(data.insurance_end_date ? formatDate(data.insurance_end_date) : 'Indéterminé', col1X + 55, bottomY + 14);
  
  // ============ STATUS BADGE ============
  const statusLabels: Record<string, string> = {
    en_attente: 'EN ATTENTE',
    validee: 'ACTIF',
    rejetee: 'INACTIF',
    reserve_medicale: 'RÉSERVE',
  };
  
  const statusColors: Record<string, [number, number, number]> = {
    en_attente: COLORS.warning,
    validee: COLORS.success,
    rejetee: COLORS.error,
    reserve_medicale: COLORS.warning,
  };
  
  const statusColor = statusColors[data.status] || COLORS.secondary;
  const statusLabel = statusLabels[data.status] || data.status.toUpperCase();
  
  // Status badge with shadow effect
  doc.setFillColor(statusColor[0] - 20, statusColor[1] - 20, statusColor[2] - 20);
  doc.roundedRect(cardX + cardWidth - 52, bottomY + 5.5, 42, 14, 4, 4, 'F');
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(cardX + cardWidth - 53, bottomY + 5, 42, 14, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(statusLabel, cardX + cardWidth - 32, bottomY + 13.5, { align: 'center' });
  
  // ============ CONTACT INFO FOOTER ============
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.textLight);
  doc.text('MAC ASSURANCES • Tél: +269 773 00 00 • contact@macassurances.com • www.macassurances.com', cardX + cardWidth / 2, bottomY + 21, { align: 'center' });
  
  const fileName = `Carte_Assure_${data.matricule}.pdf`;
  
  if (options.preview) {
    const dataUrl = doc.output('dataurlstring');
    return { dataUrl, fileName };
  }
  
  doc.save(fileName);
};

// Helper function to load image as base64
const loadImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

// Generate Beneficiary Card PDF
export const generateBeneficiaryCardPDF = async (beneficiary: {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: 'M' | 'F';
  relationship: string;
  insured?: {
    first_name: string;
    last_name: string;
    matricule: string;
    insurance_start_date: string;
    insurance_end_date?: string | null;
    contract?: {
      raison_sociale: string;
      contract_number: string;
    };
  };
}): Promise<string> => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [90, 140],
  });
  
  const logoBase64 = await loadImageAsBase64('/mac-logo.png');
  
  // Card dimensions
  const cardWidth = 130;
  const cardHeight = 80;
  const cardX = 5;
  const cardY = 5;
  
  // Background
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 6, 6, 'F');
  
  // Border
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 6, 6, 'S');
  
  // Yellow accent stripe at very top
  doc.setFillColor(...COLORS.accent);
  doc.roundedRect(cardX, cardY, cardWidth, 4, 6, 6, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(cardX, cardY + 2, cardWidth, 2, 'F');
  
  // White header band
  doc.setFillColor(255, 255, 255);
  doc.rect(cardX, cardY + 4, cardWidth, 30, 'F');
  
  // Blue accent line under header
  doc.setFillColor(...COLORS.primary);
  doc.rect(cardX, cardY + 34, cardWidth, 2, 'F');
  
  // Left decorative blue stripe
  doc.setFillColor(...COLORS.primary);
  doc.rect(cardX, cardY + 4, 4, 30, 'F');
  
  // Logo and company info
  let logoEndX = cardX + 12;
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', cardX + 10, cardY + 8, 24, 21);
      logoEndX = cardX + 38;
    } catch {
      // Fallback handled below
    }
  }
  
  // Company name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.primary);
  doc.text('MAC ASSURANCES', logoEndX + 4, cardY + 17);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textLight);
  doc.text("Mutuelle d'Assurance des Comores", logoEndX + 4, cardY + 25);
  
  // Card type badge - different color for beneficiary
  doc.setFillColor(100, 200, 100); // Green for beneficiary
  doc.roundedRect(cardX + cardWidth - 58, cardY + 10, 50, 18, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("CARTE D'ASSURÉ", cardX + cardWidth - 33, cardY + 18, { align: 'center' });
  doc.setFontSize(7);
  doc.text('AYANT DROIT', cardX + cardWidth - 33, cardY + 25, { align: 'center' });
  
  // Main content area
  const contentY = cardY + 40;
  
  const relationshipLabels: Record<string, string> = {
    conjoint: 'Conjoint(e)',
    enfant: 'Enfant',
    parent: 'Parent',
    autre: 'Autre',
  };
  
  // Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.text);
  doc.text(`${beneficiary.first_name} ${beneficiary.last_name}`.toUpperCase(), cardX + 10, contentY + 4);
  
  // Relationship badge
  doc.setFillColor(...COLORS.accent);
  const relText = relationshipLabels[beneficiary.relationship] || beneficiary.relationship;
  doc.roundedRect(cardX + 10, contentY + 7, 30, 6, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.text);
  doc.text(relText, cardX + 25, contentY + 11, { align: 'center' });
  
  // Principal insured reference
  if (beneficiary.insured) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.textLight);
    doc.text(`Assuré principal: ${beneficiary.insured.first_name} ${beneficiary.insured.last_name}`, cardX + 10, contentY + 18);
    doc.text(`Matricule: ${beneficiary.insured.matricule}`, cardX + 10, contentY + 23);
  }
  
  // Right side info
  const rightX = cardX + cardWidth - 55;
  
  // Birth date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.textLight);
  doc.text('Né(e) le', rightX, contentY + 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.text);
  const birthDate = new Date(beneficiary.birth_date);
  doc.text(birthDate.toLocaleDateString('fr-FR'), rightX, contentY + 9);
  
  // Gender
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.textLight);
  doc.text('Sexe', rightX + 30, contentY + 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.text);
  doc.text(beneficiary.gender === 'M' ? 'Masculin' : 'Féminin', rightX + 30, contentY + 9);
  
  // Validity dates
  if (beneficiary.insured?.insurance_start_date) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.textLight);
    doc.text('Validité', rightX, contentY + 18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.text);
    const startDate = new Date(beneficiary.insured.insurance_start_date);
    const endDate = beneficiary.insured.insurance_end_date 
      ? new Date(beneficiary.insured.insurance_end_date) 
      : new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate());
    doc.text(`${startDate.toLocaleDateString('fr-FR')} - ${endDate.toLocaleDateString('fr-FR')}`, rightX, contentY + 23);
  }
  
  // Bottom bar
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(cardX, cardY + cardHeight - 8, cardWidth, 8, 0, 0, 'F');
  doc.roundedRect(cardX, cardY + cardHeight - 6, cardWidth, 6, 6, 6, 'F');
  
  // Company info in footer
  if (beneficiary.insured?.contract) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(255, 255, 255);
    doc.text(beneficiary.insured.contract.raison_sociale, cardX + 10, cardY + cardHeight - 2);
    doc.text(`Contrat: ${beneficiary.insured.contract.contract_number}`, cardX + cardWidth - 10, cardY + cardHeight - 2, { align: 'right' });
  }
  
  return doc.output('dataurlstring');
};

import { useState } from 'react';
import { Download, X, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PDFPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  pdfDataUrl: string | null;
  fileName: string;
  title?: string;
  isLoading?: boolean;
}

export function PDFPreview({
  isOpen,
  onClose,
  pdfDataUrl,
  fileName,
  title = 'Aperçu du document',
  isLoading = false,
}: PDFPreviewProps) {
  const [zoom, setZoom] = useState(100);

  const handleDownload = () => {
    if (!pdfDataUrl) return;
    
    const link = document.createElement('a');
    link.href = pdfDataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium min-w-[50px] text-center">
                  {zoom}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
              <Button onClick={handleDownload} disabled={!pdfDataUrl || isLoading} className="gap-2">
                <Download className="w-4 h-4" />
                Télécharger
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto bg-muted/50 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Génération du document...</p>
              </div>
            </div>
          ) : pdfDataUrl ? (
            <div className="flex justify-center">
              <iframe
                src={pdfDataUrl}
                className="bg-white shadow-lg rounded-lg border border-border"
                style={{
                  width: `${(210 * zoom) / 100 * 3}px`,
                  height: `${(297 * zoom) / 100 * 3}px`,
                  maxWidth: '100%',
                }}
                title="Aperçu PDF"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Aucun document à afficher
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to manage PDF preview state
export function usePDFPreview() {
  const [isOpen, setIsOpen] = useState(false);
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('document.pdf');
  const [title, setTitle] = useState('Aperçu du document');
  const [isLoading, setIsLoading] = useState(false);

  const openPreview = async (
    generatePDF: () => Promise<{ dataUrl: string; fileName: string }>,
    previewTitle?: string
  ) => {
    setIsLoading(true);
    setIsOpen(true);
    if (previewTitle) setTitle(previewTitle);
    
    try {
      const { dataUrl, fileName: name } = await generatePDF();
      setPdfDataUrl(dataUrl);
      setFileName(name);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setPdfDataUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  const closePreview = () => {
    setIsOpen(false);
    // Clean up after a short delay
    setTimeout(() => {
      setPdfDataUrl(null);
    }, 300);
  };

  return {
    isOpen,
    pdfDataUrl,
    fileName,
    title,
    isLoading,
    openPreview,
    closePreview,
  };
}

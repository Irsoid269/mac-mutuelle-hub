import { useEffect, useRef, useState } from 'react';
import { Download, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

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

  useEffect(() => {
    if (isOpen) setZoom(100);
  }, [isOpen]);

  const iframeSrc = pdfDataUrl ? `${pdfDataUrl}#zoom=${zoom}` : undefined;

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
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
              <DialogDescription className="sr-only">
                Prévisualisation du document PDF avec options de zoom et téléchargement
              </DialogDescription>
            </div>
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
            <div className="flex justify-center items-start h-full">
              <iframe
                src={iframeSrc}
                title="Aperçu PDF"
                className="w-full h-[75vh] bg-background shadow-lg rounded-lg border border-border"
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
  const blobUrlRef = useRef<string | null>(null);

  const revokeBlobUrl = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  };

  const openPreview = async (
    generatePDF: () => Promise<{ dataUrl: string; fileName: string }>,
    previewTitle?: string
  ) => {
    setIsLoading(true);
    setIsOpen(true);
    if (previewTitle) setTitle(previewTitle);

    // Clean previous blob URL if any
    revokeBlobUrl();
    setPdfDataUrl(null);

    try {
      const { dataUrl, fileName: name } = await generatePDF();

      // Use Blob URL for more reliable rendering (data URLs can be huge and render blank)
      let previewUrl = dataUrl;
      if (dataUrl.startsWith('data:application/pdf')) {
        try {
          const blob = await fetch(dataUrl).then((r) => r.blob());
          previewUrl = URL.createObjectURL(blob);
          blobUrlRef.current = previewUrl;
        } catch {
          // Fallback to data URL
          previewUrl = dataUrl;
        }
      }

      setPdfDataUrl(previewUrl);
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
      revokeBlobUrl();
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

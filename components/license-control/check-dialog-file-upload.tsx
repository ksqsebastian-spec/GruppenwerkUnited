'use client';

import { useRef } from 'react';
import { toast } from 'sonner';
import { FileText, ImageIcon, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormLabel } from '@/components/ui/form';

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

interface CheckDialogFileUploadProps {
  selectedFile: File | null;
  onFileSelected: (file: File | null) => void;
}

/**
 * Optionaler Führerschein-Scan-Upload mit Format- und Größenvalidierung.
 */
export function CheckDialogFileUpload({
  selectedFile,
  onFileSelected,
}: CheckDialogFileUploadProps): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE_BYTES) {
      toast.error('Die Datei ist zu groß. Maximal 10 MB erlaubt.');
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Ungültiges Dateiformat. Erlaubt: PDF, JPG, PNG, WEBP.');
      return;
    }
    onFileSelected(file);
  };

  const handleRemoveFile = (): void => {
    onFileSelected(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <FormLabel>Führerschein-Scan (optional)</FormLabel>
      {selectedFile ? (
        <div className="flex items-center gap-2 rounded-md border p-3 bg-muted/50">
          {selectedFile.type.startsWith('image/') ? (
            <ImageIcon className="h-5 w-5 text-blue-500" />
          ) : (
            <FileText className="h-5 w-5 text-red-500" />
          )}
          <span className="flex-1 text-sm truncate">{selectedFile.name}</span>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={handleRemoveFile}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className="flex items-center justify-center gap-2 rounded-md border border-dashed p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Klicken zum Hochladen (PDF, JPG, PNG)</span>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}

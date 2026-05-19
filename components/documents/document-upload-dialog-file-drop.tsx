'use client';

import { useRef } from 'react';
import { toast } from 'sonner';
import { FileText, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface DocumentUploadFileDropProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  onSuggestName?: (name: string) => void;
}

/**
 * Datei-Drop-Bereich mit Validierung (PDF/JPG/PNG/WEBP, max. 10 MB).
 */
export function DocumentUploadFileDrop({
  file,
  onFileChange,
  onSuggestName,
}: DocumentUploadFileDropProps): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      toast.error('Ungültiges Dateiformat. Erlaubt: PDF, JPG, PNG, WEBP.');
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error('Die Datei ist zu groß. Maximal 10 MB erlaubt.');
      return;
    }

    onFileChange(selectedFile);

    if (onSuggestName) {
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
      onSuggestName(nameWithoutExt);
    }
  };

  const handleRemoveFile = (): void => {
    onFileChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Datei *</label>
      {file ? (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <FileText className="h-8 w-8 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={handleRemoveFile}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Klicken zum Auswählen</p>
          <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, WEBP - Max. 10 MB</p>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

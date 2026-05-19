'use client';

import { useRef } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UvvCheckDialogFileUploadProps {
  selectedFile: File | null;
  onFileSelected: (file: File | null) => void;
  onValidationError: (message: string) => void;
}

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Sektion zum Hochladen des unterschriebenen UVV-Nachweises.
 */
export function UvvCheckDialogFileUpload({
  selectedFile,
  onFileSelected,
  onValidationError,
}: UvvCheckDialogFileUploadProps): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      onValidationError('Ungültiges Dateiformat. Erlaubt: PDF, JPG, PNG, WEBP.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      onValidationError('Die Datei ist zu groß. Maximal 10 MB erlaubt.');
      return;
    }
    onFileSelected(file);
  };

  const handleRemoveFile = (): void => {
    onFileSelected(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h4 className="font-medium">Unterschriebenes Dokument hochladen</h4>
      <p className="text-sm text-muted-foreground">
        Lade das unterschriebene und eingescannte Dokument hoch (optional).
      </p>

      {selectedFile ? (
        <div className="flex items-center justify-between p-3 bg-muted rounded-md">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
            <span className="text-xs text-muted-foreground">
              ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={handleRemoveFile}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleFileSelect}
            className="hidden"
            id="uvv-document-upload"
          />
          <label htmlFor="uvv-document-upload">
            <Button type="button" variant="outline" className="w-full" asChild>
              <span>
                <Upload className="mr-2 h-4 w-4" />
                Dokument auswählen
              </span>
            </Button>
          </label>
        </div>
      )}
    </div>
  );
}

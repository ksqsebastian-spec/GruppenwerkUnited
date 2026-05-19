'use client';

import { useRef } from 'react';
import { toast } from 'sonner';
import { FileText, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface CostFormReceiptUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

/**
 * Beleg-Upload-Karte für die Kostenerfassung.
 */
export function CostFormReceiptUpload({ file, onFileChange }: CostFormReceiptUploadProps): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (!ALLOWED_FILE_TYPES.includes(selected.type)) {
      toast.error('Ungültiges Dateiformat. Erlaubt: PDF, JPG, PNG, WEBP.');
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      toast.error('Die Datei ist zu groß. Maximal 10 MB erlaubt.');
      return;
    }
    onFileChange(selected);
  };

  const handleRemoveFile = (): void => {
    onFileChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Beleg</CardTitle>
      </CardHeader>
      <CardContent>
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
            <p className="text-sm text-muted-foreground">Beleg hochladen (optional)</p>
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
      </CardContent>
    </Card>
  );
}

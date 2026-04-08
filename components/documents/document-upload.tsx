'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Loader2, Upload, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUploadDocument, useDocumentTypes } from '@/hooks/use-documents';
import type { DocumentEntityType } from '@/types';

/**
 * Erlaubte Dateitypen
 */
const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

/**
 * Max. Dateigröße: 10 MB
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Formatiert Dateigröße
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

interface DocumentUploadProps {
  /** Entity-Typ für das Dokument */
  entityType: DocumentEntityType;
  /** ID der Entity */
  entityId: string;
  /** Optionaler Callback nach erfolgreichem Upload */
  onSuccess?: () => void;
  /** Optionaler Callback zum Abbrechen */
  onCancel?: () => void;
}

/**
 * Formular zum Hochladen von Dokumenten für verschiedene Entity-Typen
 */
export function DocumentUpload({
  entityType,
  entityId,
  onSuccess,
  onCancel,
}: DocumentUploadProps): JSX.Element {
  const router = useRouter();
  const { data: documentTypes } = useDocumentTypes();
  const uploadMutation = useUploadDocument();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentTypeId, setDocumentTypeId] = useState('');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      // Dateiname als Vorschlag für Dokumentname
      if (!name) {
        setName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  }, [name]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  });

  const handleSubmit = async (): Promise<void> => {
    if (!selectedFile || !documentTypeId || !name) {
      return;
    }

    await uploadMutation.mutateAsync({
      entityType,
      entityId,
      document_type_id: documentTypeId,
      name,
      notes: notes || null,
      file: selectedFile,
    });

    if (onSuccess) {
      onSuccess();
    } else {
      router.back();
    }
  };

  const handleCancel = (): void => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  const removeFile = (): void => {
    setSelectedFile(null);
  };

  const isValid = selectedFile && documentTypeId && name;
  const isLoading = uploadMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Datei-Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Datei auswählen</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedFile ? (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <File className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={removeFile}>
                <X className="h-4 w-4" />
                <span className="sr-only">Datei entfernen</span>
              </Button>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-colors hover:border-primary
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted'}
              `}
            >
              <input {...getInputProps()} />
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              {isDragActive ? (
                <p className="text-primary">Datei hier ablegen...</p>
              ) : (
                <>
                  <p className="font-medium">
                    Datei hier ablegen oder klicken zum Auswählen
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    PDF, JPG, PNG, WEBP (max. 10 MB)
                  </p>
                </>
              )}
            </div>
          )}

          {/* Fehlermeldungen */}
          {fileRejections.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {fileRejections[0].errors.map((error) => (
                <p key={error.code}>
                  {error.code === 'file-too-large'
                    ? 'Die Datei ist zu groß. Maximal 10 MB erlaubt.'
                    : error.code === 'file-invalid-type'
                    ? 'Ungültiges Dateiformat. Erlaubt: PDF, JPG, PNG, WEBP.'
                    : error.message}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadaten */}
      <Card>
        <CardHeader>
          <CardTitle>Dokumentdetails</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="documentType">Dokumenttyp *</Label>
            <Select value={documentTypeId} onValueChange={setDocumentTypeId}>
              <SelectTrigger id="documentType">
                <SelectValue placeholder="Dokumenttyp auswählen" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes?.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Dokumentname *</Label>
            <Input
              id="name"
              placeholder="z.B. Reparaturrechnung"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              placeholder="Zusätzliche Informationen..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Aktionen */}
      <div className="flex items-center gap-4">
        <Button
          onClick={handleSubmit}
          disabled={!isValid || isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Dokument hochladen
        </Button>
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
        >
          Abbrechen
        </Button>
      </div>
    </div>
  );
}

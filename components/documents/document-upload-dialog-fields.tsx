'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DocumentEntityType } from '@/types';

export interface DocumentTypeOption {
  id: string;
  name: string;
}

export interface EntityOption {
  value: string;
  label: string;
}

export interface UploadFormData {
  entityType: DocumentEntityType;
  entityId: string;
  documentTypeId: string;
  name: string;
  notes?: string;
}

const entityTypeOptions: { value: DocumentEntityType; label: string }[] = [
  { value: 'vehicle', label: 'Fahrzeug' },
  { value: 'damage', label: 'Schaden' },
  { value: 'appointment', label: 'Termin' },
  { value: 'driver', label: 'Fahrer' },
];

interface DocumentUploadFieldsProps {
  form: UseFormReturn<UploadFormData>;
  selectedEntityType: DocumentEntityType | undefined;
  entityOptions: EntityOption[];
  documentTypes: DocumentTypeOption[] | undefined;
  onEntityTypeChange: () => void;
}

/**
 * Formularfelder für den Dokument-Upload-Dialog.
 */
export function DocumentUploadFields({
  form,
  selectedEntityType,
  entityOptions,
  documentTypes,
  onEntityTypeChange,
}: DocumentUploadFieldsProps): React.JSX.Element {
  return (
    <>
      <FormField
        control={form.control}
        name="entityType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Herkunft *</FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                onEntityTypeChange();
              }}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Herkunft auswählen" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {entityTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {selectedEntityType && (
        <FormField
          control={form.control}
          name="entityId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eintrag *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Eintrag auswählen" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {entityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="documentTypeId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Dokumenttyp *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Dokumenttyp auswählen" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {documentTypes?.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Dokumentname *</FormLabel>
            <FormControl>
              <Input placeholder="z.B. TÜV-Bescheinigung 2024" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notizen</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Optionale Notizen zum Dokument..."
                className="min-h-[80px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

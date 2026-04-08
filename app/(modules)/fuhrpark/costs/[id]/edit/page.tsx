'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Upload, X, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useVehicles } from '@/hooks/use-vehicles';
import { useCost, useCostTypes, useUpdateCost } from '@/hooks/use-costs';
import { costSchema, type CostFormData } from '@/lib/validations/cost';
import { supabase } from '@/lib/supabase/client';

/** Erlaubte Dateitypen für Belege */
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Seite zum Bearbeiten eines Kosteneintrags
 */
export default function EditCostPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const costId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: cost, isLoading: costLoading, error: costError, refetch } = useCost(costId);
  const { data: vehicles } = useVehicles({ status: 'active' });
  const { data: costTypes } = useCostTypes();
  const updateMutation = useUpdateCost();

  // State für Beleg-Upload
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [existingReceipt, setExistingReceipt] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<CostFormData>({
    resolver: zodResolver(costSchema),
    defaultValues: {
      vehicle_id: '',
      cost_type_id: '',
      date: '',
      amount: undefined,
      description: '',
      mileage_at_cost: undefined,
      notes: '',
    },
  });

  // Formular mit vorhandenen Daten füllen
  useEffect(() => {
    if (cost) {
      form.reset({
        vehicle_id: cost.vehicle_id,
        cost_type_id: cost.cost_type_id,
        date: cost.date,
        amount: cost.amount,
        description: cost.description ?? '',
        mileage_at_cost: cost.mileage_at_cost ?? undefined,
        notes: cost.notes ?? '',
      });
      setExistingReceipt(cost.receipt_path ?? null);
    }
  }, [cost, form]);

  /**
   * Validiert und setzt die ausgewählte Datei
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Dateityp prüfen
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error('Ungültiges Dateiformat. Erlaubt: PDF, JPG, PNG, WEBP.');
      return;
    }

    // Dateigröße prüfen
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Die Datei ist zu groß. Maximal 10 MB erlaubt.');
      return;
    }

    setReceiptFile(file);
    setExistingReceipt(null);
  };

  /**
   * Entfernt die ausgewählte/vorhandene Datei
   */
  const handleRemoveFile = (): void => {
    setReceiptFile(null);
    setExistingReceipt(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Lädt Beleg hoch und gibt den Pfad zurück
   */
  const uploadReceipt = async (file: File, vehicleId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `receipts/${vehicleId}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('documents')
      .upload(fileName, file);

    if (error) {
      console.error('Fehler beim Hochladen des Belegs:', error);
      throw new Error('Beleg konnte nicht hochgeladen werden');
    }

    return fileName;
  };

  const onSubmit = async (data: CostFormData): Promise<void> => {
    try {
      setIsUploading(true);
      let receiptPath: string | null | undefined = existingReceipt;

      // Neuen Beleg hochladen falls vorhanden
      if (receiptFile) {
        receiptPath = await uploadReceipt(receiptFile, data.vehicle_id);
      }

      // Kosten aktualisieren
      await updateMutation.mutateAsync({
        id: costId,
        data: {
          ...data,
          receipt_path: receiptPath,
        },
      });

      router.push(`/fuhrpark/costs/${costId}`);
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const isLoading = updateMutation.isPending || isUploading;

  if (costLoading) {
    return (
      <>
        <LoadingSpinner text="Kosteneintrag wird geladen..." />
      </>
    );
  }

  if (costError || !cost) {
    return (
      <>
        <ErrorState
          message="Kosteneintrag konnte nicht geladen werden"
          onRetry={refetch}
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Kosteneintrag bearbeiten"
          description={`${cost.cost_type?.name ?? 'Kosten'} für ${cost.vehicle?.license_plate ?? 'Fahrzeug'}`}
          backHref={`/fuhrpark/costs/${costId}`}
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Kosten-Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="vehicle_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fahrzeug *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Fahrzeug auswählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vehicles?.map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              {vehicle.license_plate} - {vehicle.brand} {vehicle.model}
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
                  name="cost_type_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kostenart *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Kostenart auswählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {costTypes?.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.icon ? `${type.icon} ` : ''}{type.name}
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
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Datum *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Betrag *</FormLabel>
                      <FormControl>
                        <CurrencyInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="0,00"
                          suffix="€"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mileage_at_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kilometerstand</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="Aktueller Kilometerstand"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseInt(e.target.value, 10) : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Wird automatisch aktualisiert
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Beschreibung</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="z.B. Super E10 bei Shell Tankstelle"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Beleg hochladen */}
            <Card>
              <CardHeader>
                <CardTitle>Beleg</CardTitle>
              </CardHeader>
              <CardContent>
                {receiptFile || existingReceipt ? (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {receiptFile?.name ?? 'Vorhandener Beleg'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {receiptFile
                          ? `${(receiptFile.size / 1024).toFixed(1)} KB`
                          : 'Bereits hochgeladen'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Beleg hochladen (optional)
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, JPG, PNG, WEBP - Max. 10 MB
                    </p>
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

            {/* Notizen */}
            <Card>
              <CardHeader>
                <CardTitle>Notizen</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Zusätzliche Informationen..."
                          className="min-h-[100px]"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Aktionen */}
            <div className="flex items-center gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Speichern
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Abbrechen
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}

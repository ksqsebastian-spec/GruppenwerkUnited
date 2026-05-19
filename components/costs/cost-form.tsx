'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useVehicles } from '@/hooks/use-vehicles';
import { useCreateCost, useCostTypes } from '@/hooks/use-costs';
import { costSchema, type CostFormData } from '@/lib/validations/cost';
import { CostFormFields } from './cost-form-fields';
import { CostFormReceiptUpload } from './cost-form-receipt-upload';

/**
 * Formular zum Erfassen von Kosten
 */
export function CostForm(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  const preselectedVehicleId = searchParams.get('vehicleId');

  const { data: vehicles } = useVehicles({ status: 'active' });
  const { data: costTypes } = useCostTypes();
  const createMutation = useCreateCost();

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<CostFormData>({
    resolver: zodResolver(costSchema),
    defaultValues: {
      vehicle_id: preselectedVehicleId ?? '',
      cost_type_id: '',
      date: new Date().toISOString().split('T')[0],
      amount: undefined,
      description: '',
      mileage_at_cost: undefined,
      notes: '',
    },
  });

  const { clear: clearAutoSave } = useAutoSave({
    key: 'cost-form-new',
    data: form.watch(),
    onRestore: (data) => form.reset(data),
  });

  useEffect(() => {
    if (createMutation.isSuccess) clearAutoSave();
  }, [createMutation.isSuccess, clearAutoSave]);

  const onSubmit = async (data: CostFormData): Promise<void> => {
    try {
      setIsUploading(true);
      await createMutation.mutateAsync({ ...data, receipt_path: undefined });
      router.push('/fuhrpark/costs');
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const isLoading = createMutation.isPending || isUploading;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Kosten erfassen</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <CostFormFields form={form} vehicles={vehicles} costTypes={costTypes} />
          </CardContent>
        </Card>

        <CostFormReceiptUpload file={receiptFile} onFileChange={setReceiptFile} />

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

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kosten erfassen
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
            Abbrechen
          </Button>
        </div>
      </form>
    </Form>
  );
}

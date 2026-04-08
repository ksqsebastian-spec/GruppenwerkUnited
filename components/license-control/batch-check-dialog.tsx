'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Loader2, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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

import {
  quickLicenseCheckSchema,
  type QuickLicenseCheckFormData,
} from '@/lib/validations/license-control';
import { calculateNextCheckDue } from '@/lib/database/license-control';
import {
  useLicenseInspectors,
  useLicenseSettings,
  useLicenseEmployees,
  useCreateBatchLicenseChecks,
} from '@/hooks/use-license-control';

/**
 * Dialog für Sammelkontrolle mehrerer Mitarbeiter
 * Enthält eigenen Trigger-Button und lädt Mitarbeiter intern
 */
export function BatchCheckDialog(): JSX.Element {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: employees = [] } = useLicenseEmployees({ status: 'active' });
  const { data: inspectors = [] } = useLicenseInspectors('active');
  const { data: settings } = useLicenseSettings();
  const createBatchCheck = useCreateBatchLicenseChecks();

  const form = useForm<QuickLicenseCheckFormData>({
    resolver: zodResolver(quickLicenseCheckSchema),
    defaultValues: {
      checked_by_id: '',
      license_verified: false,
      notes: '',
    },
  });

  // Formular und Auswahl zurücksetzen wenn Dialog geöffnet wird
  useEffect(() => {
    if (open) {
      form.reset({
        checked_by_id: '',
        license_verified: false,
        notes: '',
      });
      // Standardmäßig alle überfälligen und bald fälligen auswählen
      const defaultSelected = employees
        .filter((e) => e.check_status === 'overdue' || e.check_status === 'due_soon')
        .map((e) => e.id);
      setSelectedIds(defaultSelected);
    }
  }, [open, employees, form]);

  const handleToggleEmployee = (id: string): void => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (): void => {
    if (selectedIds.length === employees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(employees.map((e) => e.id));
    }
  };

  const handleSubmit = async (data: QuickLicenseCheckFormData): Promise<void> => {
    if (selectedIds.length === 0) return;

    const today = format(new Date(), 'yyyy-MM-dd');
    const intervalMonths = settings?.check_interval_months ?? 6;
    const nextCheckDue = calculateNextCheckDue(today, intervalMonths);

    await createBatchCheck.mutateAsync({
      employeeIds: selectedIds,
      checkData: {
        check_date: today,
        checked_by_id: data.checked_by_id,
        license_verified: data.license_verified,
        next_check_due: nextCheckDue,
        notes: data.notes || null,
      },
    });

    setOpen(false);
  };

  // Zähle fällige Kontrollen für Button-Badge
  const dueCount = employees.filter(
    (e) => e.check_status === 'overdue' || e.check_status === 'due_soon'
  ).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Users className="mr-2 h-4 w-4" />
          Sammelkontrolle
          {dueCount > 0 && (
            <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
              {dueCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Sammelkontrolle durchführen</DialogTitle>
          <DialogDescription>
            Führe Kontrollen für mehrere Mitarbeiter gleichzeitig durch
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Mitarbeiter-Auswahl */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel>Mitarbeiter auswählen</FormLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedIds.length === employees.length
                    ? 'Alle abwählen'
                    : 'Alle auswählen'}
                </Button>
              </div>
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                {employees.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground text-center">
                    Keine Mitarbeiter vorhanden
                  </p>
                ) : (
                  employees.map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center space-x-3 p-3 border-b last:border-b-0 hover:bg-muted/50"
                    >
                      <Checkbox
                        id={employee.id}
                        checked={selectedIds.includes(employee.id)}
                        onCheckedChange={() => handleToggleEmployee(employee.id)}
                      />
                      <label
                        htmlFor={employee.id}
                        className="flex-1 text-sm font-medium cursor-pointer"
                      >
                        {employee.last_name}, {employee.first_name}
                        {employee.check_status === 'overdue' && (
                          <span className="ml-2 text-red-600 text-xs">(überfällig)</span>
                        )}
                        {employee.check_status === 'due_soon' && (
                          <span className="ml-2 text-orange-600 text-xs">(bald fällig)</span>
                        )}
                      </label>
                    </div>
                  ))
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedIds.length} von {employees.length} ausgewählt
              </p>
            </div>

            <FormField
              control={form.control}
              name="checked_by_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prüfer *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Prüfer auswählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {inspectors.map((inspector) => (
                        <SelectItem key={inspector.id} value={inspector.id}>
                          {inspector.name}
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
              name="license_verified"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Führerscheine im Original vorgelegt</FormLabel>
                    <FormDescription>
                      Gilt für alle ausgewählten Mitarbeiter
                    </FormDescription>
                  </div>
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
                      placeholder="Optionale Anmerkungen (gilt für alle Kontrollen)..."
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={createBatchCheck.isPending || selectedIds.length === 0}
              >
                {createBatchCheck.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Speichern...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    {selectedIds.length} Kontrollen speichern
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

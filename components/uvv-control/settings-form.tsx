'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUvvSettings, useUpdateUvvSettings } from '@/hooks/use-uvv-control';
import { uvvSettingsSchema, type UvvSettingsFormData } from '@/lib/validations/uvv-control';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Formular für UVV-Einstellungen
 */
export function SettingsForm(): React.JSX.Element {
  const { data: settings, isLoading } = useUvvSettings();
  const updateSettings = useUpdateUvvSettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UvvSettingsFormData>({
    resolver: zodResolver(uvvSettingsSchema),
    defaultValues: {
      check_interval_months: 12,
      warning_days_before: 30,
      default_topics: '',
    },
  });

  // Formular mit geladenen Daten befüllen
  useEffect(() => {
    if (settings) {
      reset({
        check_interval_months: settings.check_interval_months,
        warning_days_before: settings.warning_days_before,
        default_topics: settings.default_topics ?? '',
      });
    }
  }, [settings, reset]);

  const onSubmit = async (data: UvvSettingsFormData): Promise<void> => {
    await updateSettings.mutateAsync(data);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Allgemeine Einstellungen</CardTitle>
        <CardDescription>
          Konfiguriere das Intervall und die Warnzeit für UVV-Unterweisungen
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="check_interval_months">
                Unterweisungs-Intervall (Monate)
              </Label>
              <Input
                id="check_interval_months"
                type="number"
                min={1}
                max={24}
                {...register('check_interval_months', { valueAsNumber: true })}
              />
              {errors.check_interval_months && (
                <p className="text-sm text-destructive">
                  {errors.check_interval_months.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Wie oft muss jeder Fahrer unterwiesen werden? (Standard: 12 Monate)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="warning_days_before">
                Warnzeit (Tage vor Fälligkeit)
              </Label>
              <Input
                id="warning_days_before"
                type="number"
                min={0}
                max={90}
                {...register('warning_days_before', { valueAsNumber: true })}
              />
              {errors.warning_days_before && (
                <p className="text-sm text-destructive">
                  {errors.warning_days_before.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Wie viele Tage vorher soll eine Warnung angezeigt werden?
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_topics">Standard-Themen</Label>
            <Textarea
              id="default_topics"
              placeholder="Verkehrssicherheit, Verkehrsregeln, Unfallverhalten..."
              rows={4}
              {...register('default_topics')}
            />
            {errors.default_topics && (
              <p className="text-sm text-destructive">
                {errors.default_topics.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Diese Themen werden im PDF als Standard angezeigt. Trenne mehrere
              Themen mit Kommas.
            </p>
          </div>

          <Button
            type="submit"
            disabled={!isDirty || updateSettings.isPending}
          >
            {updateSettings.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Einstellungen speichern
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

'use client';

import type { UseFormReturn } from 'react-hook-form';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { UvvCheckFormData } from '@/lib/validations/uvv-control';

interface Instructor {
  id: string;
  name: string;
}

interface UvvCheckDialogFieldsProps {
  form: UseFormReturn<UvvCheckFormData>;
  instructors: Instructor[] | undefined;
  intervalMonths: number;
  onCheckDateChange: (date: Date | undefined) => void;
}

/**
 * Formularfelder für die UVV-Unterweisung (Datum, Unterweisender, Themen, Fälligkeit, Notizen).
 */
export function UvvCheckDialogFields({
  form,
  instructors,
  intervalMonths,
  onCheckDateChange,
}: UvvCheckDialogFieldsProps): React.JSX.Element {
  return (
    <>
      <FormField
        control={form.control}
        name="check_date"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Datum der Unterweisung *</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                  >
                    {field.value ? (
                      format(new Date(field.value), 'dd.MM.yyyy', { locale: de })
                    ) : (
                      <span>Datum wählen</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value ? new Date(field.value) : undefined}
                  onSelect={onCheckDateChange}
                  disabled={(date) => date > new Date()}
                  locale={de}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="instructed_by_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Unterweisender *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Unterweisenden auswählen" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {instructors?.map((instructor) => (
                  <SelectItem key={instructor.id} value={instructor.id}>
                    {instructor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>Person, die die Unterweisung durchgeführt hat</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="topics"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Themen</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Behandelte Themen der Unterweisung..."
                className="min-h-[100px]"
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            <FormDescription>Themen, die in der Unterweisung behandelt wurden</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="next_check_due"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Nächste Unterweisung fällig am *</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                  >
                    {field.value ? (
                      format(new Date(field.value), 'dd.MM.yyyy', { locale: de })
                    ) : (
                      <span>Datum wählen</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value ? new Date(field.value) : undefined}
                  onSelect={(date) => date && field.onChange(format(date, 'yyyy-MM-dd'))}
                  disabled={(date) => date < new Date()}
                  locale={de}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormDescription>
              Wird automatisch berechnet ({intervalMonths} Monate nach Unterweisung)
            </FormDescription>
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
              <Textarea placeholder="Optionale Anmerkungen..." {...field} value={field.value ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

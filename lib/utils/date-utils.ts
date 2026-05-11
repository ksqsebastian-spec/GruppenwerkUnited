import { addMonths, format } from 'date-fns';

export function calculateNextCheckDue(checkDate: string, intervalMonths: number): string {
  return format(addMonths(new Date(checkDate), intervalMonths), 'yyyy-MM-dd');
}

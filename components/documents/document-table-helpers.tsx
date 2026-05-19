import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  AlertTriangle,
  Calendar,
  Car,
  ClipboardCheck,
  Contact,
  FileText,
  Image as ImageIcon,
  Shield,
  Users,
} from 'lucide-react';
import type { Document, DocumentEntityType } from '@/types';

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getEntityIcon(entityType: DocumentEntityType): React.JSX.Element {
  switch (entityType) {
    case 'vehicle':
      return <Car className="h-4 w-4" />;
    case 'damage':
      return <AlertTriangle className="h-4 w-4" />;
    case 'appointment':
      return <Calendar className="h-4 w-4" />;
    case 'driver':
      return <Users className="h-4 w-4" />;
    case 'license_check_employee':
      return <Contact className="h-4 w-4" />;
    case 'license_check':
      return <ClipboardCheck className="h-4 w-4" />;
    case 'uvv_check':
      return <Shield className="h-4 w-4" />;
  }
}

export function getEntityLabel(entityType: DocumentEntityType): string {
  switch (entityType) {
    case 'vehicle':
      return 'Fahrzeug';
    case 'damage':
      return 'Schaden';
    case 'appointment':
      return 'Termin';
    case 'driver':
      return 'Fahrer';
    case 'license_check_employee':
      return 'FS-Mitarbeiter';
    case 'license_check':
      return 'FS-Kontrolle';
    case 'uvv_check':
      return 'UVV-Unterweisung';
  }
}

export function getEntityUrl(doc: Document): string | null {
  switch (doc.entity_type) {
    case 'vehicle':
      return doc.vehicle_id ? `/fuhrpark/vehicles/${doc.vehicle_id}` : null;
    case 'damage':
      return doc.damage_id ? `/fuhrpark/damages/${doc.damage_id}` : null;
    case 'appointment':
      return doc.appointment_id ? `/fuhrpark/appointments/${doc.appointment_id}` : null;
    case 'driver':
      return doc.driver_id ? `/fuhrpark/drivers/${doc.driver_id}` : null;
    case 'license_check_employee':
      return doc.license_check_employee_id
        ? `/fuhrpark/license-control/employees/${doc.license_check_employee_id}`
        : null;
    case 'license_check':
      return doc.license_check?.employee_id
        ? `/fuhrpark/license-control/employees/${doc.license_check.employee_id}`
        : null;
    case 'uvv_check':
      return doc.uvv_check?.driver_id ? `/fuhrpark/uvv/drivers/${doc.uvv_check.driver_id}` : null;
  }
}

export function getEntityDescription(doc: Document): string {
  switch (doc.entity_type) {
    case 'vehicle':
      return doc.vehicle?.license_plate ?? '-';
    case 'damage':
      return doc.damage?.description?.substring(0, 30) ?? '-';
    case 'appointment':
      return doc.appointment?.due_date
        ? format(new Date(doc.appointment.due_date), 'dd.MM.yyyy', { locale: de })
        : '-';
    case 'driver':
      return doc.driver ? `${doc.driver.first_name} ${doc.driver.last_name}` : '-';
    case 'license_check_employee':
      return doc.license_check_employee
        ? `${doc.license_check_employee.first_name} ${doc.license_check_employee.last_name}`
        : '-';
    case 'license_check':
      return doc.license_check?.check_date
        ? format(new Date(doc.license_check.check_date), 'dd.MM.yyyy', { locale: de })
        : '-';
    case 'uvv_check':
      return doc.uvv_check?.check_date
        ? format(new Date(doc.uvv_check.check_date), 'dd.MM.yyyy', { locale: de })
        : '-';
  }
}

export function getFileIcon(mimeType: string): React.JSX.Element {
  if (mimeType.startsWith('image/')) {
    return <ImageIcon className="h-5 w-5 text-blue-500" />;
  }
  return <FileText className="h-5 w-5 text-red-500" />;
}

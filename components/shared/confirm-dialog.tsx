'use client';

import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmDialogProps {
  /** Ob der Dialog geöffnet ist */
  open: boolean;
  /** Callback wenn der Dialog geschlossen wird */
  onOpenChange: (open: boolean) => void;
  /** Titel des Dialogs */
  title: string;
  /** Beschreibung/Frage */
  description: string;
  /** Text für Bestätigen-Button */
  confirmText?: string;
  /** Text für Abbrechen-Button */
  cancelText?: string;
  /** Callback bei Bestätigung */
  onConfirm: () => void | Promise<void>;
  /** Ist die Aktion destruktiv (roter Button) */
  destructive?: boolean;
  /** Variante für Styling (destructive = roter Button) */
  variant?: 'default' | 'destructive';
  /** Zeigt Ladeindikator an */
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Bestätigen',
  cancelText = 'Abbrechen',
  onConfirm,
  destructive = false,
  variant,
  isLoading = false,
}: ConfirmDialogProps): JSX.Element {
  const isDestructive = destructive || variant === 'destructive';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={isDestructive ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

import { redirect } from 'next/navigation';

/**
 * ROI-Modul Einstiegsseite - leitet zur Dashboard-Übersicht weiter
 */
export default function RoiIndexPage(): never {
  redirect('/roi/dashboard');
}

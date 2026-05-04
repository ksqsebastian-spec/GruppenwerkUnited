import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { buildExportPayload } from '@/lib/export/full-export';

/**
 * GET /api/data-export
 * Gibt den vollständigen Daten-Export des eingeloggten Accounts als JSON zurück.
 * Wird vom DataExportButton client-seitig aufgerufen.
 */
export async function GET(): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  try {
    const payload = await buildExportPayload(session);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Fehler beim Erstellen des Daten-Exports:', error);
    return NextResponse.json(
      { error: 'Daten-Export konnte nicht erstellt werden' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';

/**
 * Webhook-Endpoint für Supabase Database Webhooks
 *
 * Empfängt Benachrichtigungen bei Datenbankänderungen
 * Kann genutzt werden für:
 * - Audit-Logging
 * - Externe Benachrichtigungen
 * - Cache-Invalidierung
 * - Integration mit anderen Systemen
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Webhook-Secret prüfen
    const headersList = await headers();
    const signature = headersList.get('x-supabase-signature');
    const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;

    // Signature validieren wenn Secret konfiguriert
    if (webhookSecret && signature) {
      const body = await request.text();
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        return NextResponse.json(
          { error: 'Ungültige Signatur' },
          { status: 401 }
        );
      }

      // Body erneut parsen (wurde bereits gelesen)
      const payload = JSON.parse(body);
      return processWebhook(payload);
    }

    // Ohne Secret: Body direkt parsen
    const payload = await request.json();
    return processWebhook(payload);
  } catch (error) {
    console.error('Webhook-Fehler:', error);
    return NextResponse.json(
      { error: 'Verarbeitung fehlgeschlagen' },
      { status: 500 }
    );
  }
}

/**
 * Verarbeitet den Webhook-Payload
 */
async function processWebhook(
  payload: {
    type: 'INSERT' | 'UPDATE' | 'DELETE';
    table: string;
    record: Record<string, unknown>;
    old_record?: Record<string, unknown>;
    schema: string;
  }
): Promise<NextResponse> {
  const { type, table, record, old_record } = payload;

  console.log(`Webhook empfangen: ${type} auf ${table}`);

  // Aktionen basierend auf Tabelle und Ereignistyp
  switch (table) {
    case 'damages':
      if (type === 'INSERT') {
        // Neuer Schaden gemeldet
        console.log('Neuer Schaden gemeldet:', record.id);
        // Hier könnte man eine Benachrichtigung senden
      }
      break;

    case 'appointments':
      if (type === 'UPDATE') {
        // Termin-Status geändert
        const newStatus = record.status;
        const oldStatus = old_record?.status;
        if (newStatus !== oldStatus) {
          console.log(`Termin ${record.id}: Status von ${oldStatus} zu ${newStatus}`);
        }
      }
      break;

    case 'vehicles':
      if (type === 'INSERT') {
        // Neues Fahrzeug angelegt
        console.log('Neues Fahrzeug:', record.license_plate);
      }
      break;

    default:
      // Andere Tabellen - nur loggen
      console.log(`Unbehandelte Tabelle: ${table}`);
  }

  return NextResponse.json({
    received: true,
    processed: true,
    timestamp: new Date().toISOString(),
  });
}

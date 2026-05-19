'use client';

import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fuelTypeLabels, formatMileage, formatCurrency } from './vehicle-detail-helpers';
import type { Vehicle } from '@/types';

interface VehicleDetailsTabProps {
  vehicle: Vehicle;
}

function DetailRow({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="flex justify-between border-b pb-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export function VehicleDetailsTab({ vehicle }: VehicleDetailsTabProps): React.JSX.Element {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Fahrzeugdaten */}
      <Card>
        <CardHeader>
          <CardTitle>Fahrzeugdaten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <DetailRow label="Kennzeichen" value={vehicle.license_plate} />
          <DetailRow label="Marke" value={vehicle.brand} />
          <DetailRow label="Modell" value={vehicle.model} />
          <DetailRow label="Baujahr" value={vehicle.year.toString()} />
          <DetailRow label="VIN" value={vehicle.vin ?? '-'} />
          <DetailRow
            label="Kraftstoff"
            value={fuelTypeLabels[vehicle.fuel_type] ?? vehicle.fuel_type}
          />
          <DetailRow label="Kilometerstand" value={formatMileage(vehicle.mileage)} />
        </CardContent>
      </Card>

      {/* Kauf/Leasing */}
      <Card>
        <CardHeader>
          <CardTitle>Kauf / Leasing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <DetailRow label="Art" value={vehicle.is_leased ? 'Leasing' : 'Kauf'} />
          {vehicle.is_leased ? (
            <>
              <DetailRow label="Leasinggeber" value={vehicle.leasing_company ?? '-'} />
              <DetailRow
                label="Leasingende"
                value={
                  vehicle.leasing_end_date
                    ? format(new Date(vehicle.leasing_end_date), 'dd.MM.yyyy', { locale: de })
                    : '-'
                }
              />
              <DetailRow label="Monatliche Rate" value={formatCurrency(vehicle.leasing_rate)} />
              <DetailRow label="Vertragsnummer" value={vehicle.leasing_contract_number ?? '-'} />
            </>
          ) : (
            <>
              <DetailRow
                label="Kaufdatum"
                value={
                  vehicle.purchase_date
                    ? format(new Date(vehicle.purchase_date), 'dd.MM.yyyy', { locale: de })
                    : '-'
                }
              />
              <DetailRow label="Kaufpreis" value={formatCurrency(vehicle.purchase_price)} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Halter & Nutzer */}
      <Card>
        <CardHeader>
          <CardTitle>Halter & Nutzer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <DetailRow label="Fahrzeughalter" value={vehicle.holder ?? '-'} />
          <DetailRow label="Hauptnutzer" value={vehicle.user_name ?? '-'} />
        </CardContent>
      </Card>

      {/* Versicherung */}
      <Card>
        <CardHeader>
          <CardTitle>Versicherung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <DetailRow label="Versicherung" value={vehicle.insurance_company ?? '-'} />
          <DetailRow label="Vertragsnummer" value={vehicle.insurance_number ?? '-'} />
        </CardContent>
      </Card>

      {/* Notizen */}
      <Card>
        <CardHeader>
          <CardTitle>Notizen</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {vehicle.notes ?? 'Keine Notizen vorhanden.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

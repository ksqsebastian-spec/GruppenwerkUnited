'use client';

import { Building, Fuel, Gauge, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { fuelTypeLabels, formatMileage, type TuvStatus } from './vehicle-detail-helpers';
import type { Vehicle } from '@/types';

interface VehicleInfoCardsProps {
  vehicle: Vehicle;
  tuvStatus: TuvStatus;
}

export function VehicleInfoCards({ vehicle, tuvStatus }: VehicleInfoCardsProps): React.JSX.Element {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Gauge className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Kilometerstand</p>
              <p className="text-lg font-medium">{formatMileage(vehicle.mileage)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Fuel className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Kraftstoff</p>
              <p className="text-lg font-medium">
                {fuelTypeLabels[vehicle.fuel_type] ?? vehicle.fuel_type}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Building className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Firma</p>
              <p className="text-lg font-medium">{vehicle.company?.name ?? '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={tuvStatus.status !== 'ok' ? 'border-yellow-500' : ''}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Shield
              className={`h-5 w-5 ${
                tuvStatus.status === 'overdue'
                  ? 'text-red-600'
                  : tuvStatus.status === 'warning'
                    ? 'text-yellow-600'
                    : 'text-muted-foreground'
              }`}
            />
            <div>
              <p className="text-sm text-muted-foreground">TÜV</p>
              <p
                className={`text-lg font-medium ${
                  tuvStatus.status === 'overdue'
                    ? 'text-red-600'
                    : tuvStatus.status === 'warning'
                      ? 'text-yellow-600'
                      : ''
                }`}
              >
                {tuvStatus.label}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

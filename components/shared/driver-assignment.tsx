'use client';

import { useState } from 'react';
import { Loader2, Plus, Trash2, Star, StarOff, User, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import {
  useVehicleDrivers,
  useDriverVehicles,
  useAssignDriver,
  useUnassignDriver,
  useSetPrimaryDriver,
} from '@/hooks/use-vehicle-drivers';
import { useDrivers } from '@/hooks/use-drivers';
import { useVehicles } from '@/hooks/use-vehicles';
import type { VehicleDriver, Driver, Vehicle } from '@/types';

interface AssignDriverToVehicleProps {
  vehicleId: string;
  vehiclePlate: string;
}

interface AssignVehicleToDriverProps {
  driverId: string;
  driverName: string;
}

/**
 * Komponente zum Zuweisen von Fahrern zu einem Fahrzeug
 */
export function AssignDriverToVehicle({ vehicleId, vehiclePlate }: AssignDriverToVehicleProps): React.JSX.Element {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; assignment: VehicleDriver | null }>({
    open: false,
    assignment: null,
  });

  const { data: assignments, isLoading } = useVehicleDrivers(vehicleId);
  const { data: allDrivers } = useDrivers({ status: 'active' });
  const assignMutation = useAssignDriver();
  const unassignMutation = useUnassignDriver();
  const setPrimaryMutation = useSetPrimaryDriver();

  // Filtere bereits zugewiesene Fahrer aus
  const assignedDriverIds = assignments?.map((a) => a.driver_id) ?? [];
  const availableDrivers = allDrivers?.filter((d) => !assignedDriverIds.includes(d.id)) ?? [];

  const handleAssign = async (): Promise<void> => {
    if (!selectedDriverId) return;

    await assignMutation.mutateAsync({
      vehicle_id: vehicleId,
      driver_id: selectedDriverId,
      is_primary: isPrimary,
    });

    setSelectedDriverId('');
    setIsPrimary(false);
  };

  const handleUnassign = async (): Promise<void> => {
    if (!deleteConfirm.assignment) return;

    await unassignMutation.mutateAsync({
      vehicleId,
      driverId: deleteConfirm.assignment.driver_id,
    });

    setDeleteConfirm({ open: false, assignment: null });
  };

  const handleSetPrimary = async (driverId: string): Promise<void> => {
    await setPrimaryMutation.mutateAsync({ vehicleId, driverId });
  };

  if (isLoading) {
    return <LoadingSpinner text="Zuweisungen werden geladen..." />;
  }

  return (
    <div className="space-y-6">
      {/* Neue Zuweisung */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fahrer zuweisen</CardTitle>
          <CardDescription>
            Weise dem Fahrzeug {vehiclePlate} einen Fahrer zu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Fahrer auswählen</Label>
            <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
              <SelectTrigger>
                <SelectValue placeholder="Fahrer auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {availableDrivers.length === 0 ? (
                  <SelectItem value="_none" disabled>
                    Keine verfügbaren Fahrer
                  </SelectItem>
                ) : (
                  availableDrivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.first_name} {driver.last_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_primary"
              checked={isPrimary}
              onCheckedChange={(checked) => setIsPrimary(checked === true)}
            />
            <Label htmlFor="is_primary" className="cursor-pointer">
              Als Hauptfahrer setzen
            </Label>
          </div>

          <Button
            onClick={handleAssign}
            disabled={!selectedDriverId || assignMutation.isPending}
            className="w-full"
          >
            {assignMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Fahrer zuweisen
          </Button>
        </CardContent>
      </Card>

      {/* Aktuelle Zuweisungen */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Zugewiesene Fahrer</CardTitle>
          <CardDescription>
            {assignments?.length ?? 0} Fahrer zugewiesen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!assignments || assignments.length === 0 ? (
            <EmptyState
              icon={<User className="h-8 w-8 text-muted-foreground" />}
              title="Keine Fahrer zugewiesen"
              description="Diesem Fahrzeug sind noch keine Fahrer zugewiesen."
            />
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {assignment.driver?.first_name} {assignment.driver?.last_name}
                      </p>
                      {assignment.driver?.email && (
                        <p className="text-sm text-muted-foreground">
                          {assignment.driver.email}
                        </p>
                      )}
                    </div>
                    {assignment.is_primary && (
                      <Badge variant="default">Hauptfahrer</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!assignment.is_primary && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSetPrimary(assignment.driver_id)}
                        disabled={setPrimaryMutation.isPending}
                        title="Als Hauptfahrer setzen"
                      >
                        <StarOff className="h-4 w-4" />
                      </Button>
                    )}
                    {assignment.is_primary && (
                      <Button variant="ghost" size="icon" disabled title="Ist Hauptfahrer">
                        <Star className="h-4 w-4 text-yellow-500" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteConfirm({ open: true, assignment })}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bestätigungsdialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, assignment: deleteConfirm.assignment })}
        title="Zuweisung entfernen"
        description={`Möchtest du die Zuweisung von ${deleteConfirm.assignment?.driver?.first_name} ${deleteConfirm.assignment?.driver?.last_name} wirklich entfernen?`}
        confirmText="Entfernen"
        onConfirm={handleUnassign}
        variant="destructive"
        isLoading={unassignMutation.isPending}
      />
    </div>
  );
}

/**
 * Komponente zum Zuweisen von Fahrzeugen zu einem Fahrer
 */
export function AssignVehicleToDriver({ driverId, driverName }: AssignVehicleToDriverProps): React.JSX.Element {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; assignment: VehicleDriver | null }>({
    open: false,
    assignment: null,
  });

  const { data: assignments, isLoading } = useDriverVehicles(driverId);
  const { data: allVehicles } = useVehicles({ status: 'active' });
  const assignMutation = useAssignDriver();
  const unassignMutation = useUnassignDriver();
  const setPrimaryMutation = useSetPrimaryDriver();

  // Filtere bereits zugewiesene Fahrzeuge aus
  const assignedVehicleIds = assignments?.map((a) => a.vehicle_id) ?? [];
  const availableVehicles = allVehicles?.filter((v) => !assignedVehicleIds.includes(v.id)) ?? [];

  const handleAssign = async (): Promise<void> => {
    if (!selectedVehicleId) return;

    await assignMutation.mutateAsync({
      vehicle_id: selectedVehicleId,
      driver_id: driverId,
      is_primary: isPrimary,
    });

    setSelectedVehicleId('');
    setIsPrimary(false);
  };

  const handleUnassign = async (): Promise<void> => {
    if (!deleteConfirm.assignment) return;

    await unassignMutation.mutateAsync({
      vehicleId: deleteConfirm.assignment.vehicle_id,
      driverId,
    });

    setDeleteConfirm({ open: false, assignment: null });
  };

  const handleSetPrimary = async (vehicleId: string): Promise<void> => {
    await setPrimaryMutation.mutateAsync({ vehicleId, driverId });
  };

  if (isLoading) {
    return <LoadingSpinner text="Zuweisungen werden geladen..." />;
  }

  return (
    <div className="space-y-6">
      {/* Neue Zuweisung */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fahrzeug zuweisen</CardTitle>
          <CardDescription>
            Weise {driverName} ein Fahrzeug zu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Fahrzeug auswählen</Label>
            <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
              <SelectTrigger>
                <SelectValue placeholder="Fahrzeug auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {availableVehicles.length === 0 ? (
                  <SelectItem value="_none" disabled>
                    Keine verfügbaren Fahrzeuge
                  </SelectItem>
                ) : (
                  availableVehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.license_plate} - {vehicle.brand} {vehicle.model}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_primary_vehicle"
              checked={isPrimary}
              onCheckedChange={(checked) => setIsPrimary(checked === true)}
            />
            <Label htmlFor="is_primary_vehicle" className="cursor-pointer">
              Als Hauptfahrer für dieses Fahrzeug setzen
            </Label>
          </div>

          <Button
            onClick={handleAssign}
            disabled={!selectedVehicleId || assignMutation.isPending}
            className="w-full"
          >
            {assignMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Fahrzeug zuweisen
          </Button>
        </CardContent>
      </Card>

      {/* Aktuelle Zuweisungen */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Zugewiesene Fahrzeuge</CardTitle>
          <CardDescription>
            {assignments?.length ?? 0} Fahrzeuge zugewiesen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!assignments || assignments.length === 0 ? (
            <EmptyState
              icon={<Car className="h-8 w-8 text-muted-foreground" />}
              title="Keine Fahrzeuge zugewiesen"
              description="Diesem Fahrer sind noch keine Fahrzeuge zugewiesen."
            />
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                      <Car className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {assignment.vehicle?.license_plate}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {assignment.vehicle?.brand} {assignment.vehicle?.model}
                      </p>
                    </div>
                    {assignment.is_primary && (
                      <Badge variant="default">Hauptfahrer</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!assignment.is_primary && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSetPrimary(assignment.vehicle_id)}
                        disabled={setPrimaryMutation.isPending}
                        title="Als Hauptfahrer setzen"
                      >
                        <StarOff className="h-4 w-4" />
                      </Button>
                    )}
                    {assignment.is_primary && (
                      <Button variant="ghost" size="icon" disabled title="Ist Hauptfahrer">
                        <Star className="h-4 w-4 text-yellow-500" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteConfirm({ open: true, assignment })}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bestätigungsdialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, assignment: deleteConfirm.assignment })}
        title="Zuweisung entfernen"
        description={`Möchtest du die Zuweisung zum Fahrzeug ${deleteConfirm.assignment?.vehicle?.license_plate} wirklich entfernen?`}
        confirmText="Entfernen"
        onConfirm={handleUnassign}
        variant="destructive"
        isLoading={unassignMutation.isPending}
      />
    </div>
  );
}

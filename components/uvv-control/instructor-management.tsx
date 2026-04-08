'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Archive, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import {
  useUvvInstructors,
  useCreateUvvInstructor,
  useUpdateUvvInstructor,
  useArchiveUvvInstructor,
} from '@/hooks/use-uvv-control';
import { uvvInstructorSchema, type UvvInstructorFormData } from '@/lib/validations/uvv-control';
import { Skeleton } from '@/components/ui/skeleton';
import type { UvvInstructor } from '@/types';

/**
 * Formular für Unterweisende
 */
function InstructorForm({
  instructor,
  onSuccess,
}: {
  instructor?: UvvInstructor;
  onSuccess: () => void;
}): React.JSX.Element {
  const createInstructor = useCreateUvvInstructor();
  const updateInstructor = useUpdateUvvInstructor();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UvvInstructorFormData>({
    resolver: zodResolver(uvvInstructorSchema),
    defaultValues: instructor
      ? {
          name: instructor.name,
          email: instructor.email ?? '',
          status: instructor.status,
        }
      : {
          name: '',
          email: '',
          status: 'active',
        },
  });

  const onSubmit = async (data: UvvInstructorFormData): Promise<void> => {
    if (instructor) {
      await updateInstructor.mutateAsync({ id: instructor.id, ...data });
    } else {
      await createInstructor.mutateAsync(data);
      reset();
    }
    onSuccess();
  };

  const isPending = createInstructor.isPending || updateInstructor.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          placeholder="Max Mustermann"
          {...register('name')}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-Mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="max@example.com"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {instructor ? 'Speichern' : 'Anlegen'}
      </Button>
    </form>
  );
}

/**
 * Verwaltung der Unterweisenden
 */
export function InstructorManagement(): React.JSX.Element {
  const { data: instructors, isLoading } = useUvvInstructors();
  const archiveInstructor = useArchiveUvvInstructor();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<UvvInstructor | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const handleArchive = async (id: string): Promise<void> => {
    await archiveInstructor.mutateAsync(id);
    setArchivingId(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const activeInstructors = instructors?.filter((i) => i.status === 'active') ?? [];
  const archivedInstructors = instructors?.filter((i) => i.status === 'archived') ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Unterweisende</CardTitle>
          <CardDescription>
            Verwalte die Personen, die UVV-Unterweisungen durchführen dürfen
          </CardDescription>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neuer Unterweisender
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuen Unterweisenden anlegen</DialogTitle>
              <DialogDescription>
                Lege eine neue Person an, die Unterweisungen durchführen darf.
              </DialogDescription>
            </DialogHeader>
            <InstructorForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {activeInstructors.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Noch keine Unterweisenden angelegt. Lege mindestens einen an, um
            Unterweisungen durchführen zu können.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeInstructors.map((instructor) => (
                <TableRow key={instructor.id}>
                  <TableCell className="font-medium">{instructor.name}</TableCell>
                  <TableCell>{instructor.email ?? '-'}</TableCell>
                  <TableCell>
                    <Badge variant="success">Aktiv</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Dialog
                        open={editingInstructor?.id === instructor.id}
                        onOpenChange={(open) =>
                          setEditingInstructor(open ? instructor : null)
                        }
                      >
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Bearbeiten</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Unterweisenden bearbeiten</DialogTitle>
                          </DialogHeader>
                          <InstructorForm
                            instructor={instructor}
                            onSuccess={() => setEditingInstructor(null)}
                          />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setArchivingId(instructor.id)}
                      >
                        <Archive className="h-4 w-4" />
                        <span className="sr-only">Archivieren</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {archivedInstructors.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Archivierte Unterweisende ({archivedInstructors.length})
            </h4>
            <div className="text-sm text-muted-foreground">
              {archivedInstructors.map((i) => i.name).join(', ')}
            </div>
          </div>
        )}
      </CardContent>

      {/* Archivieren Bestätigung */}
      <ConfirmDialog
        open={archivingId !== null}
        onOpenChange={(open) => !open && setArchivingId(null)}
        title="Unterweisenden archivieren"
        description={`Möchtest du "${activeInstructors.find((i) => i.id === archivingId)?.name ?? ''}" wirklich archivieren? Diese Person kann dann keine neuen Unterweisungen mehr durchführen.`}
        confirmText="Archivieren"
        onConfirm={async () => { if (archivingId) await handleArchive(archivingId); }}
        isLoading={archiveInstructor.isPending}
      />
    </Card>
  );
}

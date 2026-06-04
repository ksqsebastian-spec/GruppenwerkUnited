'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit, Mail, Phone, MapPin, FileText, MessageSquare, Sparkles, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ErrorState } from '@/components/shared/error-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { KundeStatusBadge } from '@/components/kunden/kunde-status-badge';
import { KundeFormDialog } from '@/components/kunden/kunde-form-dialog';
import { KundenDateienPanel } from '@/components/kunden/kunden-dateien-panel';
import { KundenKommentarePanel } from '@/components/kunden/kunden-kommentare-panel';
import { KundenPromptRunner } from '@/components/kunden/kunden-prompt-runner';
import { useKunde, useDeleteKunde } from '@/hooks/use-kunden';

interface KundeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function KundeDetailPage({ params }: KundeDetailPageProps): React.JSX.Element {
  const { id } = use(params);
  const router = useRouter();
  const [bearbeiten, setBearbeiten] = useState(false);
  const [loeschenOffen, setLoeschenOffen] = useState(false);

  const { data: kunde, isLoading, error } = useKunde(id);
  const remove = useDeleteKunde();

  const handleDelete = async (): Promise<void> => {
    try {
      await remove.mutateAsync(id);
      router.push('/kunden');
    } catch {
      // Toast vom Hook
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <LoadingSpinner text="Kunde wird geladen…" />
      </div>
    );
  }

  if (error || !kunde) {
    return (
      <div className="container mx-auto px-4 py-6">
        <ErrorState message="Kunde konnte nicht geladen werden" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader
        title={kunde.firmenname}
        backHref="/kunden"
        actions={
          <div className="flex items-center gap-2">
            <KundeStatusBadge status={kunde.status} />
            <Button variant="outline" onClick={() => setBearbeiten(true)}>
              <Edit className="mr-2 h-4 w-4" /> Bearbeiten
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setLoeschenOffen(true)} aria-label="Kunde löschen">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        }
      />

      <Card className="my-6">
        <CardHeader>
          <CardTitle>Stammdaten</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Stamm label="Ansprechpartner" value={kunde.ansprechpartner} />
          <Stamm label="E-Mail" value={kunde.email} icon={<Mail className="h-4 w-4 text-muted-foreground" />} />
          <Stamm label="Telefon" value={kunde.telefon} icon={<Phone className="h-4 w-4 text-muted-foreground" />} />
          <Stamm label="Adresse" value={kunde.adresse} icon={<MapPin className="h-4 w-4 text-muted-foreground" />} />
          {kunde.notizen && (
            <div className="md:col-span-2">
              <p className="text-xs font-medium text-muted-foreground">Notizen</p>
              <p className="whitespace-pre-wrap text-sm">{kunde.notizen}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="prompts">
        <TabsList>
          <TabsTrigger value="prompts">
            <Sparkles className="mr-2 h-4 w-4" /> Dokument erstellen
          </TabsTrigger>
          <TabsTrigger value="dateien">
            <FileText className="mr-2 h-4 w-4" /> Dateien
          </TabsTrigger>
          <TabsTrigger value="kommentare">
            <MessageSquare className="mr-2 h-4 w-4" /> Kommentare
          </TabsTrigger>
        </TabsList>
        <TabsContent value="prompts" className="pt-4">
          <KundenPromptRunner customerId={id} kundenname={kunde.firmenname} />
        </TabsContent>
        <TabsContent value="dateien" className="pt-4">
          <KundenDateienPanel customerId={id} />
        </TabsContent>
        <TabsContent value="kommentare" className="pt-4">
          <KundenKommentarePanel customerId={id} />
        </TabsContent>
      </Tabs>

      <KundeFormDialog open={bearbeiten} onOpenChange={setBearbeiten} kunde={kunde} />

      <ConfirmDialog
        open={loeschenOffen}
        onOpenChange={setLoeschenOffen}
        title="Kunden löschen?"
        description={`„${kunde.firmenname}" wird mit allen Kommentaren und Dateien unwiderruflich entfernt.`}
        confirmText="Löschen"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}

function Stamm({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | null;
  icon?: React.ReactNode;
}): React.JSX.Element {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 flex items-center gap-2 text-sm">
        {icon}
        {value ?? '—'}
      </p>
    </div>
  );
}

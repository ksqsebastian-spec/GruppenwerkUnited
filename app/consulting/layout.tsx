import { AppLayout } from '@/components/layout/app-layout';

export default function ConsultingLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return <AppLayout>{children}</AppLayout>;
}

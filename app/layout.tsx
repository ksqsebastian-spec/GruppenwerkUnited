import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'Werkbank – Gruppenwerk',
  description: 'Interne Tool-Plattform der Gruppenwerk-Holding',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html lang="de">
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
            }}
          />
        </Providers>
      </body>
    </html>
  );
}

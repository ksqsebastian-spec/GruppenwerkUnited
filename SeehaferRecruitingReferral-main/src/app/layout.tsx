import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fachkräfte-Empfehlung | Seehafer Elemente",
  description:
    "Empfiehl potenzielle Mitarbeiter an Seehafer Elemente und verdiene 1.000 € Prämie nach bestandener Probezeit.",
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">
        <main className="mx-auto max-w-[480px] px-4 py-6 sm:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}

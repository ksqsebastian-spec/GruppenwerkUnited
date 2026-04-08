import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Empfehlungsprogramm | Seehafer Elemente",
  description:
    "Empfiehl Seehafer Elemente weiter und verdiene eine Provision bei jedem Auftrag.",
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

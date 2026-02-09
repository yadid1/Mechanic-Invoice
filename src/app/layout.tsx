import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alamillas Carburetors - Invoice System",
  description: "Invoice and receipt management for Alamillas Carburetors",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <header className="bg-primary text-white shadow-lg">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Alamillas Carburetors</h1>
              <p className="text-sm text-blue-200">920 W 1st St, Santa Ana, CA 92703 &bull; (714) 667-5228</p>
            </div>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}

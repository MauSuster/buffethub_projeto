import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "BuffetHub",
  description: "Encontre e contrate o buffet ideal para o seu evento.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased">
        <header className="bg-[#2f5d8a] text-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-xl font-bold">
              Buffet<span className="text-[#e8a33d]">Hub</span>
            </Link>
            <nav className="text-sm">
              <Link href="/" className="hover:underline">Buscar buffets</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">
          <Suspense fallback={<p className="text-slate-500">Carregando...</p>}>{children}</Suspense>
        </main>
        <footer className="py-6 text-center text-xs text-slate-500">BuffetHub · Grupo CTRL+ALT+DEL · FECAP</footer>
      </body>
    </html>
  );
}

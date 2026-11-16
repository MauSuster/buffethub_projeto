import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Cabecalho } from "@/components/layout/cabecalho";
import { Rodape } from "@/components/layout/rodape";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = {
  title: { default: "BuffetHub – encontre o buffet ideal para o seu evento", template: "%s · BuffetHub" },
  description: "Pesquise, compare e contrate buffets para casamentos, aniversários, formaturas e eventos corporativos.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={jakarta.variable}>
      <body className="flex min-h-screen flex-col">
        <Cabecalho />
        <main className="flex-1">{children}</main>
        <Rodape />
      </body>
    </html>
  );
}

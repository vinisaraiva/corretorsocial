import type { Metadata } from "next";
import { Inter, League_Spartan } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const leagueSpartan = League_Spartan({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Corretor Social",
    template: "%s | Corretor Social",
  },
  description:
    "Marketing automatizado para corretores de imóveis: crie e publique campanhas a partir do link do imóvel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${leagueSpartan.variable}`}>
      <body>{children}</body>
    </html>
  );
}

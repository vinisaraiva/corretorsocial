import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, League_Spartan } from "next/font/google";
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

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-editorial",
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
    <html
      lang="pt-BR"
      className={`${inter.variable} ${leagueSpartan.variable} ${cormorantGaramond.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}

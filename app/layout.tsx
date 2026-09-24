import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

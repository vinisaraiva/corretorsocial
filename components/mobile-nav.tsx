"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Home, Megaphone, Menu, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Início", icon: Home },
  { href: "/imoveis", label: "Imóveis", icon: Building2 },
  { href: "/imoveis/novo", label: "Novo", icon: Plus },
  { href: "/campanhas", label: "Campanhas", icon: Megaphone },
  { href: "/configuracoes", label: "Mais", icon: Menu },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-[#E4E7EC] bg-white px-1 py-1.5 lg:hidden">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-semibold",
              active ? "text-[#176B5B]" : "text-[#667085]",
            )}
          >
            <Icon size={20} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

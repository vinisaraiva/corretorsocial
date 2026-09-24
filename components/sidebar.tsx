"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  CalendarDays,
  Home,
  Megaphone,
  Plus,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signout } from "@/app/login/actions";

const items = [
  { href: "/", label: "Início", icon: Home },
  { href: "/imoveis", label: "Imóveis", icon: Building2 },
  { href: "/campanhas", label: "Campanhas", icon: Megaphone },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
  { href: "/resultados", label: "Resultados", icon: BarChart3 },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-[238px] shrink-0 border-r border-[#E4E7EC] bg-white px-4 py-5 lg:flex lg:flex-col">
      <Link href="/" className="mb-8 px-2">
        <div className="text-lg font-extrabold tracking-tight text-[#18202A]">
          Corretor <span className="text-[#176B5B]">Social</span>
        </div>
        <div className="mt-1 text-xs text-[#667085]">Marketing imobiliário</div>
      </Link>

      <Link
        href="/imoveis/novo"
        className="mb-6 flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-[#176B5B] px-4 text-sm font-bold text-white hover:bg-[#105548]"
      >
        <Plus size={18} />
        Novo imóvel
      </Link>

      <nav className="space-y-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-sm font-semibold transition",
                active
                  ? "bg-[#E9F4F1] text-[#176B5B]"
                  : "text-[#475467] hover:bg-[#F7F8FA] hover:text-[#18202A]",
              )}
            >
              <Icon size={19} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2">
        <div className="rounded-xl border border-[#E4E7EC] bg-[#F9FAFB] p-3">
          <div className="text-xs font-semibold text-[#667085]">Plano atual</div>
          <div className="mt-1 text-sm font-bold">Corretor</div>
          <div className="mt-1 text-sm text-[#176B5B]">R$ 89,90/mês</div>
        </div>

        <form action={signout}>
          <button
            type="submit"
            className="flex min-h-11 w-full items-center gap-3 rounded-[10px] px-3 text-sm font-semibold text-[#667085] transition hover:bg-[#F7F8FA] hover:text-[#B42318]"
          >
            <LogOut size={18} />
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}

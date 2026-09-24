import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  Settings,
  UserRoundCog,
  LogOut,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { signout } from "@/app/login/actions";

const links = [
  {
    href: "/calendario",
    title: "Calendário",
    description: "Veja as próximas publicações agendadas.",
    icon: CalendarDays,
  },
  {
    href: "/resultados",
    title: "Resultados",
    description: "Acompanhe publicações e cliques no WhatsApp.",
    icon: BarChart3,
  },
  {
    href: "/configuracoes",
    title: "Configurações",
    description: "Perfil, marca, redes e preferências.",
    icon: Settings,
  },
  {
    href: "/onboarding?mode=review",
    title: "Configuração guiada",
    description: "Revise seus dados passo a passo.",
    icon: UserRoundCog,
  },
];

export default function MorePage() {
  return (
    <AppShell
      title="Mais"
      description="Acesse calendário, resultados e configurações."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {links.map(({ href, title, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="app-card flex min-h-24 items-center gap-4 p-4 transition hover:border-[#98A2B3]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E9F4F1] text-[#176B5B]">
              <Icon size={21} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-extrabold">{title}</span>
              <span className="mt-1 block text-sm text-[#667085]">
                {description}
              </span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-[#98A2B3]" />
          </Link>
        ))}

        <form action={signout} className="sm:col-span-2">
          <button
            type="submit"
            className="app-card flex min-h-16 w-full items-center gap-4 p-4 text-left text-[#B42318]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEF3F2]">
              <LogOut size={20} />
            </span>
            <span className="font-extrabold">Sair da conta</span>
          </button>
        </form>
      </div>
    </AppShell>
  );
}

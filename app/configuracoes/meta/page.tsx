import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import {
  META_OAUTH_PENDING_COOKIE,
  listMetaPages,
  metaPageCanPublish,
} from "@/lib/meta";
import { readPendingMetaOAuth } from "@/lib/meta-oauth-session";
import { completeMetaConnection } from "./actions";

export const dynamic = "force-dynamic";

export default async function MetaConnectionPage() {
  const cookieStore = await cookies();
  const pendingValue = cookieStore.get(META_OAUTH_PENDING_COOKIE)?.value;

  if (!pendingValue) {
    redirect("/configuracoes?meta=expired");
  }

  let pages: Awaited<ReturnType<typeof listMetaPages>>;

  try {
    const pending = readPendingMetaOAuth(pendingValue);
    pages = (await listMetaPages(pending.accessToken)).filter(metaPageCanPublish);
  } catch (error) {
    console.error("Could not list Meta Pages", error);
    redirect("/configuracoes?meta=failed");
  }

  return (
    <AppShell
      title="Qual Página você usa?"
      description="Encontramos mais de uma Página disponível. Escolha onde o Corretor Social deve publicar."
    >
      <section className="app-card p-5 sm:p-6">
        <div className="space-y-3">
          {pages.map((page) => {
            return (
              <form
                key={page.id}
                action={completeMetaConnection}
                className="flex flex-col gap-4 rounded-xl border border-[#E4E7EC] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <input type="hidden" name="page_id" value={page.id} />
                <div>
                  <div className="font-extrabold">{page.name}</div>
                  <div className="mt-1 text-sm text-[#667085]">
                    Página do Facebook
                  </div>
                </div>
                <div className="w-full sm:w-auto">
                  <button
                    type="submit"
                    className="app-button-primary w-full sm:w-auto"
                  >
                    Usar esta Página
                  </button>
                </div>
              </form>
            );
          })}
        </div>

        {pages.length === 0 ? (
          <div className="rounded-xl border border-[#FDA29B] bg-[#FFFBFA] p-4 text-sm text-[#912018]">
            Não encontramos mais uma Página disponível para concluir esta
            conexão. Volte às configurações e tente conectar novamente.
          </div>
        ) : null}

        <div className="mt-5">
          <Link
            href="/configuracoes"
            className="text-sm font-bold text-[#176B5B]"
          >
            Voltar às configurações
          </Link>
        </div>
      </section>
    </AppShell>
  );
}

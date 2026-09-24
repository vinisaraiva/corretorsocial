import Link from "next/link";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    success?: string;
    next?: string;
  }>;
}) {
  const params = await searchParams;
  const next = params.next?.startsWith("/") ? params.next : "/";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-7 text-center">
          <div className="text-xl font-extrabold tracking-tight">
            Corretor <span className="text-[#176B5B]">Social</span>
          </div>
          <p className="mt-2 text-sm text-[#667085]">
            Marketing imobiliário sem complicação.
          </p>
        </div>

        <section className="app-card p-5 sm:p-7">
          <h1 className="text-2xl font-extrabold">Entrar</h1>
          <p className="mt-2 text-sm text-[#667085]">
            Acesse seus imóveis e campanhas.
          </p>

          {params.error && (
            <div className="mt-5 rounded-xl bg-[#FEF3F2] p-4 text-sm font-semibold leading-6 text-[#B42318]">
              {params.error}
            </div>
          )}

          {params.success && (
            <div className="mt-5 rounded-xl bg-[#ECFDF3] p-4 text-sm font-semibold text-[#067647]">
              {params.success}
            </div>
          )}

          <form className="mt-6 space-y-4">
            <input type="hidden" name="next" value={next} />

            <label className="block text-sm font-bold">
              E-mail
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                className="app-input mt-2"
                placeholder="voce@exemplo.com.br"
              />
            </label>

            <label className="block text-sm font-bold">
              Senha
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="app-input mt-2"
                placeholder="Sua senha"
              />
            </label>

            <button formAction={login} className="app-button-primary w-full">
              Entrar
            </button>
          </form>

          <div className="mt-6 border-t border-[#E4E7EC] pt-5 text-center">
            <p className="text-sm text-[#667085]">Ainda não tem uma conta?</p>
            <Link
              href="/cadastro"
              className="app-button-secondary mt-3 flex w-full items-center justify-center"
            >
              Criar conta
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

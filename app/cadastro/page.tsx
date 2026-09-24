import Link from "next/link";
import { resendConfirmation, signup } from "@/app/login/actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-7 text-center">
          <div className="text-xl font-extrabold tracking-tight">
            Corretor <span className="text-[#176B5B]">Social</span>
          </div>
          <p className="mt-2 text-sm text-[#667085]">
            Crie sua conta em poucos segundos.
          </p>
        </div>

        <section className="app-card p-5 sm:p-7">
          <h1 className="text-2xl font-extrabold">Criar conta</h1>
          <p className="mt-2 text-sm text-[#667085]">
            Depois você confirma o e-mail e faz a configuração profissional.
          </p>

          {params.error && (
            <div className="mt-5 rounded-xl bg-[#FEF3F2] p-4 text-sm font-semibold leading-6 text-[#B42318]">
              {params.error}
            </div>
          )}

          {params.success && (
            <div className="mt-5 rounded-xl bg-[#ECFDF3] p-4 text-sm font-semibold leading-6 text-[#067647]">
              {params.success}
            </div>
          )}

          <form className="mt-6 space-y-4">
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
                autoComplete="new-password"
                minLength={8}
                required
                className="app-input mt-2"
                placeholder="Mínimo de 8 caracteres"
              />
            </label>

            <label className="block text-sm font-bold">
              Confirmar senha
              <input
                name="password_confirmation"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                className="app-input mt-2"
                placeholder="Digite a senha novamente"
              />
            </label>

            <button formAction={signup} className="app-button-primary w-full">
              Criar minha conta
            </button>
          </form>

          <div className="mt-6 rounded-xl bg-[#F9FAFB] p-4">
            <p className="text-sm font-bold">Já criou a conta e não encontrou o e-mail?</p>
            <p className="mt-1 text-xs leading-5 text-[#667085]">
              Aguarde pelo menos 1 minuto entre reenvios e verifique também o spam.
            </p>
            <form className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                name="email"
                type="email"
                required
                className="app-input"
                placeholder="Seu e-mail"
              />
              <button
                formAction={resendConfirmation}
                className="app-button-secondary shrink-0"
              >
                Reenviar
              </button>
            </form>
          </div>

          <div className="mt-6 border-t border-[#E4E7EC] pt-5 text-center">
            <Link href="/login" className="text-sm font-bold text-[#176B5B]">
              Já tenho conta — entrar
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

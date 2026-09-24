import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-5">
      <div className="app-card max-w-md p-8 text-center">
        <div className="text-sm font-bold text-[#176B5B]">404</div>
        <h1 className="mt-2 text-2xl font-extrabold">Página não encontrada</h1>
        <p className="mt-2 text-sm text-[#667085]">O endereço pode ter mudado ou não existir.</p>
        <Link href="/" className="app-button-primary mt-6 inline-flex items-center justify-center">Voltar ao início</Link>
      </div>
    </main>
  );
}

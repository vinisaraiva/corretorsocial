"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Corretor Social UI error", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-5">
      <section className="app-card max-w-lg p-7 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#FEF3F2] font-bold text-[#B42318]">
          !
        </div>
        <h1 className="mt-4 text-xl font-extrabold">
          Não conseguimos abrir esta tela
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#667085]">
          Seus dados não foram apagados. Tente novamente e, se o problema
          continuar, você poderá falar com o suporte.
        </p>
        <button onClick={reset} className="app-button-primary mt-6">
          Tentar novamente
        </button>
      </section>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Upload } from "lucide-react";

const networks = ["Instagram", "Facebook", "TikTok", "Google Business"];

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [connected, setConnected] = useState<string[]>(["Instagram", "Facebook"]);
  const [form, setForm] = useState({
    name: "",
    creci: "",
    whatsapp: "",
    site: "",
    city: "Porto Seguro - BA",
    color: "#176B5B",
  });

  const progress = (step / 4) * 100;

  function next() {
    if (step < 4) setStep((current) => current + 1);
    else router.push("/");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-7">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-bold">Configuração inicial</span>
          <span className="text-[#667085]">{step} de 4</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#EAECF0]">
          <div
            className="h-full rounded-full bg-[#176B5B] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <section className="app-card p-5 sm:p-7">
        {step === 1 && (
          <>
            <h1 className="text-2xl font-extrabold">Como você aparece para seus clientes?</h1>
            <p className="mt-2 text-sm text-[#667085]">
              Essas informações serão usadas automaticamente nos seus criativos.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                ["name", "Nome profissional", "João Silva"],
                ["creci", "CRECI", "CRECI 12345-BA"],
                ["whatsapp", "WhatsApp", "(73) 99999-9999"],
                ["site", "Seu site", "seusite.com.br"],
              ].map(([key, label, placeholder]) => (
                <label key={key} className="text-sm font-bold">
                  {label}
                  <input
                    value={form[key as keyof typeof form]}
                    onChange={(event) =>
                      setForm({ ...form, [key]: event.target.value })
                    }
                    placeholder={placeholder}
                    className="app-input mt-2"
                  />
                </label>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-2xl font-extrabold">Sua marca</h1>
            <p className="mt-2 text-sm text-[#667085]">
              Não tem logo ou cores definidas? Tudo bem. Podemos começar com um visual neutro.
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <button
                type="button"
                className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#98A2B3] bg-[#F9FAFB] p-4 text-sm font-bold"
              >
                <Upload size={24} className="text-[#176B5B]" />
                Enviar logo
                <span className="text-xs font-normal text-[#667085]">PNG ou JPG</span>
              </button>
              <label className="text-sm font-bold">
                Cor principal
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#E4E7EC] p-4">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(event) => setForm({ ...form, color: event.target.value })}
                    className="h-12 w-14 cursor-pointer rounded border-0 bg-transparent"
                  />
                  <div>
                    <div className="font-bold">{form.color.toUpperCase()}</div>
                    <div className="text-xs font-normal text-[#667085]">
                      Você poderá mudar depois.
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-2xl font-extrabold">Onde você trabalha?</h1>
            <p className="mt-2 text-sm text-[#667085]">
              Isso ajuda a IA a escrever conteúdos mais relevantes para sua região.
            </p>
            <label className="mt-6 block text-sm font-bold">
              Cidade ou região principal
              <input
                value={form.city}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
                className="app-input mt-2"
              />
            </label>
            <label className="mt-4 block text-sm font-bold">
              Bairros ou regiões atendidas
              <input
                placeholder="Ex.: Taperapuã, Centro, Arraial d'Ajuda"
                className="app-input mt-2"
              />
            </label>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="text-2xl font-extrabold">Conecte suas redes</h1>
            <p className="mt-2 text-sm text-[#667085]">
              Nesta demonstração a conexão é simulada. Na versão real, você autorizará cada conta com segurança.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {networks.map((network) => {
                const isConnected = connected.includes(network);
                return (
                  <button
                    key={network}
                    type="button"
                    onClick={() =>
                      setConnected((current) =>
                        isConnected
                          ? current.filter((item) => item !== network)
                          : [...current, network],
                      )
                    }
                    className="flex min-h-16 items-center justify-between rounded-xl border border-[#E4E7EC] bg-white px-4 text-left"
                  >
                    <span className="font-bold">{network}</span>
                    <span
                      className={
                        isConnected
                          ? "inline-flex items-center gap-1 text-sm font-bold text-[#067647]"
                          : "text-sm font-bold text-[#176B5B]"
                      }
                    >
                      {isConnected ? <><Check size={16} /> Conectado</> : "Conectar"}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 rounded-xl bg-[#E9F4F1] p-4 text-sm text-[#176B5B]">
              <strong>Tudo pronto.</strong> Agora vamos divulgar seu primeiro imóvel.
            </div>
          </>
        )}

        <div className="mt-7 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((current) => Math.max(1, current - 1))}
            className="app-button-secondary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={18} />
            Voltar
          </button>
          <button
            type="button"
            onClick={next}
            className="app-button-primary inline-flex items-center gap-2"
          >
            {step === 4 ? "Começar" : "Continuar"}
            <ChevronRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
}

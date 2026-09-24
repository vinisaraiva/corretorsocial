"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { LogoUploader } from "@/components/logo-uploader";
import { createClient } from "@/lib/supabase/client";

type InitialProfile = {
  professionalName?: string;
  creci?: string;
  whatsapp?: string;
  website?: string;
  city?: string;
  serviceRegions?: string[];
  primaryColor?: string;
  logoUrl?: string | null;
};

const networks = ["Instagram", "Facebook", "TikTok", "Google Business"];

export function OnboardingFlow({
  reviewMode = false,
  initialProfile,
}: {
  reviewMode?: boolean;
  initialProfile?: InitialProfile;
}) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [form, setForm] = useState({
    name: initialProfile?.professionalName ?? "",
    creci: initialProfile?.creci ?? "",
    whatsapp: initialProfile?.whatsapp ?? "",
    site: initialProfile?.website ?? "",
    city: initialProfile?.city ?? "Porto Seguro - BA",
    color: initialProfile?.primaryColor ?? "#176B5B",
  });
  const [regions, setRegions] = useState(
    initialProfile?.serviceRegions?.join(", ") ?? "",
  );

  const progress = (step / 4) * 100;

  async function next() {
    if (step < 4) {
      setSaveError("");
      setStep((current) => current + 1);
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      const supabase = createClient();

      const timeout = new Promise<never>((_, reject) => {
        window.setTimeout(
          () => reject(new Error("O salvamento demorou mais que o esperado. Tente novamente.")),
          15_000,
        );
      });

      const save = (async () => {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error("Sua sessão expirou. Entre novamente.");
        }

        const { error } = await supabase
          .from("profiles")
          .update({
            professional_name: form.name.trim(),
            creci: form.creci.trim() || null,
            whatsapp: form.whatsapp.trim() || null,
            website: form.site.trim() || null,
            city: form.city.trim() || null,
            service_regions: regions
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            primary_color: form.color,
            onboarding_completed: true,
          })
          .eq("user_id", user.id);

        if (error) {
          throw new Error("Não foi possível salvar sua configuração.");
        }
      })();

      await Promise.race([save, timeout]);

      router.replace(reviewMode ? "/configuracoes" : "/");
      router.refresh();
    } catch (caught) {
      setSaveError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível salvar sua configuração.",
      );
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-7">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-bold">
            {reviewMode ? "Revisar configuração" : "Configuração inicial"}
          </span>
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
            <h1 className="text-2xl font-extrabold">
              Como você aparece para seus clientes?
            </h1>
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
              Não tem logo ou cores definidas? Tudo bem. Podemos começar com um
              visual neutro.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <LogoUploader initialUrl={initialProfile?.logoUrl} />

              <label className="text-sm font-bold">
                Cor principal
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#E4E7EC] p-4">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(event) =>
                      setForm({ ...form, color: event.target.value })
                    }
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
              Isso ajuda a IA a escrever conteúdos mais relevantes para sua
              região.
            </p>

            <label className="mt-6 block text-sm font-bold">
              Cidade ou região principal
              <input
                value={form.city}
                onChange={(event) =>
                  setForm({ ...form, city: event.target.value })
                }
                className="app-input mt-2"
              />
            </label>

            <label className="mt-4 block text-sm font-bold">
              Bairros ou regiões atendidas
              <input
                value={regions}
                onChange={(event) => setRegions(event.target.value)}
                placeholder="Ex.: Taperapuã, Centro, Arraial d'Ajuda"
                className="app-input mt-2"
              />
            </label>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="text-2xl font-extrabold">Suas redes sociais</h1>
            <p className="mt-2 text-sm text-[#667085]">
              As integrações OAuth serão ativadas na próxima etapa do
              desenvolvimento. Nenhuma conta será marcada como conectada antes
              da autorização real.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {networks.map((network) => (
                <div
                  key={network}
                  className="flex min-h-16 items-center justify-between rounded-xl border border-[#E4E7EC] bg-white px-4"
                >
                  <span className="font-bold">{network}</span>
                  <span className="rounded-full bg-[#F2F4F7] px-3 py-1 text-xs font-bold text-[#667085]">
                    A conectar
                  </span>
                </div>
              ))}
            </div>

            {saveError && (
              <div className="mt-6 rounded-xl bg-[#FEF3F2] p-4 text-sm font-semibold leading-6 text-[#B42318]">
                {saveError}
              </div>
            )}

            <div className="mt-6 flex items-start gap-3 rounded-xl bg-[#E9F4F1] p-4 text-sm text-[#176B5B]">
              <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
              <div>
                <strong>
                  {reviewMode ? "Alterações prontas." : "Perfil pronto."}
                </strong>{" "}
                {reviewMode
                  ? "Salve para aplicar os novos dados às próximas campanhas."
                  : "Depois você poderá conectar as redes sem preencher tudo novamente."}
              </div>
            </div>
          </>
        )}

        <div className="mt-7 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={step === 1 || saving}
            onClick={() => setStep((current) => Math.max(1, current - 1))}
            className="app-button-secondary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={18} />
            Voltar
          </button>

          <button
            type="button"
            onClick={next}
            disabled={saving}
            className="app-button-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "Salvando..."
              : step === 4
                ? reviewMode
                  ? "Salvar alterações"
                  : "Começar"
                : "Continuar"}
            {!saving && <ChevronRight size={18} />}
          </button>
        </div>
      </section>
    </div>
  );
}

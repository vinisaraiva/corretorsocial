"use client";

import { useState } from "react";
import { Check, Save } from "lucide-react";

export function SettingsForm() {
  const [saved, setSaved] = useState(false);
  const [review, setReview] = useState(true);

  return (
    <div className="space-y-5">
      {saved && (
        <div className="flex items-center gap-2 rounded-xl bg-[#ECFDF3] p-4 text-sm font-bold text-[#067647]">
          <Check size={18} />
          Configurações salvas nesta demonstração.
        </div>
      )}

      <Section title="Perfil profissional" description="Como você aparece nos criativos e publicações.">
        <Grid>
          <Field label="Nome profissional" defaultValue="João Silva" />
          <Field label="CRECI" defaultValue="CRECI 12345-BA" />
          <Field label="Imobiliária (opcional)" placeholder="Nome da imobiliária" />
          <Field label="E-mail" defaultValue="joao@exemplo.com.br" />
        </Grid>
      </Section>

      <Section title="Contato" description="O WhatsApp será o principal destino dos interessados.">
        <Grid>
          <Field label="WhatsApp" defaultValue="(73) 99999-9999" />
          <Field label="Telefone" defaultValue="(73) 99999-9999" />
          <Field label="Site" defaultValue="meusite.com.br" />
          <Field label="Endereço (opcional)" placeholder="Seu escritório" />
        </Grid>
      </Section>

      <Section title="Marca" description="Aplicada automaticamente aos seus criativos.">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold">
            Cor principal
            <div className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-[#E4E7EC] px-3">
              <input type="color" defaultValue="#176B5B" className="h-8 w-10 border-0 bg-transparent" />
              <span>#176B5B</span>
            </div>
          </label>
          <label className="text-sm font-bold">
            Cor secundária
            <div className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-[#E4E7EC] px-3">
              <input type="color" defaultValue="#18202A" className="h-8 w-10 border-0 bg-transparent" />
              <span>#18202A</span>
            </div>
          </label>
        </div>
      </Section>

      <Section title="Redes conectadas" description="Você poderá reconectar uma rede se a autorização expirar.">
        <div className="grid gap-3 sm:grid-cols-2">
          {["Instagram", "Facebook", "TikTok", "Google Business"].map((network) => (
            <div key={network} className="flex min-h-14 items-center justify-between rounded-xl border border-[#E4E7EC] px-4">
              <strong>{network}</strong>
              <span className="text-sm font-bold text-[#067647]">Conectado</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Preferências" description="Você pode manter tudo no automático e alterar apenas quando quiser.">
        <div className="flex min-h-16 items-center justify-between gap-5 rounded-xl border border-[#E4E7EC] p-4">
          <div>
            <div className="font-bold">Revisar antes de publicar</div>
            <div className="mt-1 text-sm text-[#667085]">Recomendado enquanto você conhece a plataforma.</div>
          </div>
          <button
            type="button"
            aria-pressed={review}
            onClick={() => setReview((value) => !value)}
            className={`h-7 w-12 rounded-full p-1 transition ${
              review ? "bg-[#176B5B]" : "bg-[#D0D5DD]"
            }`}
          >
            <span className={`block h-5 w-5 rounded-full bg-white transition ${
              review ? "translate-x-5" : "translate-x-0"
            }`} />
          </button>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="CTA padrão" defaultValue="Fale comigo no WhatsApp" />
          <label className="text-sm font-bold">
            Tom de comunicação
            <select className="app-input mt-2">
              <option>Profissional</option>
              <option>Amigável</option>
              <option>Sofisticado</option>
              <option>Direto</option>
            </select>
          </label>
        </div>
      </Section>

      <div className="flex justify-end">
        <button onClick={() => setSaved(true)} className="app-button-primary inline-flex items-center gap-2">
          <Save size={18} />
          Salvar configurações
        </button>
      </div>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="app-card p-5 sm:p-6">
      <h2 className="text-lg font-extrabold">{title}</h2>
      <p className="mt-1 text-sm text-[#667085]">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}
function Field({ label, defaultValue, placeholder }: { label: string; defaultValue?: string; placeholder?: string }) {
  return (
    <label className="text-sm font-bold">
      {label}
      <input className="app-input mt-2" defaultValue={defaultValue} placeholder={placeholder} />
    </label>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import {
  CalendarClock,
  Check,
  ChevronDown,
  MessageCircle,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { properties } from "@/data/mock";
import { formatBRL } from "@/lib/utils";
import type { SocialChannel } from "@/types";

const channels: { id: SocialChannel; label: string }[] = [
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "tiktok", label: "TikTok" },
  { id: "google", label: "Google" },
];

const styles = [
  ["Essencial", "Limpo e universal"],
  ["Destaque", "Fotografia em primeiro plano"],
  ["Oportunidade", "Preço e condição em evidência"],
  ["Alto padrão", "Minimalista e sofisticado"],
] as const;

export function CampaignBuilder() {
  const property = properties[0];
  const [channel, setChannel] = useState<SocialChannel>("instagram");
  const [adjusting, setAdjusting] = useState(false);
  const [style, setStyle] = useState("Destaque");
  const [published, setPublished] = useState(false);
  const [staging, setStaging] = useState(false);
  const [stagingGenerated, setStagingGenerated] = useState(false);

  const copy = {
    instagram: "Viva a poucos passos da praia. Um apartamento amplo, com 3 quartos e tudo o que você precisa para aproveitar Porto Seguro.",
    facebook: "Apartamento à venda em Taperapuã, Porto Seguro, com 118 m², 3 quartos, 2 suítes, varanda e área de lazer.",
    tiktok: "Quanto custa morar a 300 metros da praia em Porto Seguro? Conheça este apartamento em Taperapuã.",
    google: "Apartamento à venda em Taperapuã, Porto Seguro. 3 quartos, 2 suítes, 118 m² e excelente localização.",
  }[channel];

  return (
    <div className="space-y-5">
      {published && (
        <div className="flex items-center gap-2 rounded-xl bg-[#ECFDF3] p-4 text-sm font-bold text-[#067647]">
          <Check size={18} />
          Demonstração: campanha enviada para publicação em todas as redes.
        </div>
      )}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="app-card p-4 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-[#176B5B]">Campanha pronta</div>
              <h2 className="mt-1 text-xl font-extrabold">{property.title}</h2>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#E9F4F1] px-3 py-1.5 text-xs font-bold text-[#176B5B]">
              <Sparkles size={14} />
              Estilo {style}
            </span>
          </div>

          <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
            {channels.map((item) => (
              <button
                key={item.id}
                onClick={() => setChannel(item.id)}
                className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-bold ${
                  channel === item.id
                    ? "bg-[#176B5B] text-white"
                    : "border border-[#E4E7EC] bg-white text-[#475467]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mx-auto max-w-[430px] overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white">
            <div className="relative aspect-[4/5]">
              <Image src={property.image} alt={property.title} fill className="object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-5 pt-20 text-white">
                <div className="text-xs font-bold uppercase tracking-wider">Taperapuã · Porto Seguro</div>
                <div className="mt-2 text-2xl font-black">A 300 m da praia</div>
                <div className="mt-2 text-sm font-semibold">3 quartos · 2 suítes · 118 m²</div>
                <div className="mt-3 text-xl font-black">{formatBRL(property.price)}</div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm leading-6 text-[#475467]">{copy}</p>
              <p className="mt-3 text-sm font-bold text-[#176B5B]">#PortoSeguro #Imóveis #Taperapuã</p>
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#F9FAFB] p-3 text-sm font-bold">
                <MessageCircle size={18} className="text-[#176B5B]" />
                Fale comigo no WhatsApp
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-3">
          <div className="app-card p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-[#667085]">Argumento principal</div>
            <p className="mt-2 font-extrabold">Morar a poucos passos da praia</p>
            <p className="mt-1 text-sm text-[#667085]">Escolhido automaticamente a partir das informações do imóvel.</p>
          </div>

          <button
            onClick={() => setStaging(true)}
            className="app-card flex w-full items-center justify-between p-4 text-left"
          >
            <div>
              <div className="flex items-center gap-2 font-extrabold">
                <WandSparkles size={18} className="text-[#176B5B]" />
                Mobiliar com IA
              </div>
              <div className="mt-1 text-xs text-[#667085]">Premium · 1 crédito por imagem</div>
            </div>
            <ChevronDown size={18} className="text-[#667085]" />
          </button>

          <button onClick={() => setAdjusting((value) => !value)} className="app-button-secondary w-full">
            Ajustar campanha
          </button>
          <button className="app-button-secondary flex w-full items-center justify-center gap-2">
            <CalendarClock size={18} />
            Agendar
          </button>
          <button onClick={() => setPublished(true)} className="app-button-primary w-full">
            Publicar em todas
          </button>
        </aside>
      </section>

      {adjusting && (
        <section className="app-card p-5 sm:p-6">
          <h3 className="text-lg font-extrabold">Ajustar campanha</h3>
          <p className="mt-1 text-sm text-[#667085]">Só mexa no que quiser. A versão recomendada já está pronta.</p>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <label className="text-sm font-bold">Headline<input className="app-input mt-2" defaultValue="A 300 m da praia" /></label>
            <label className="text-sm font-bold">CTA<input className="app-input mt-2" defaultValue="Fale comigo no WhatsApp" /></label>
          </div>
          <div className="mt-5">
            <div className="mb-3 text-sm font-bold">Estilo visual</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {styles.map(([name, description]) => (
                <button
                  key={name}
                  onClick={() => setStyle(name)}
                  className={`rounded-xl border p-4 text-left ${
                    style === name ? "border-[#176B5B] bg-[#E9F4F1]" : "border-[#E4E7EC] bg-white"
                  }`}
                >
                  <div className="font-extrabold">{name}</div>
                  <div className="mt-1 text-xs text-[#667085]">{description}</div>
                  {style === name && <div className="mt-3 text-xs font-bold text-[#176B5B]">Recomendado</div>}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {staging && (
        <section className="app-card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-[#176B5B]">Premium</div>
              <h3 className="mt-1 text-lg font-extrabold">Ambientação virtual</h3>
              <p className="mt-1 text-sm text-[#667085]">Escolha um estilo. A foto original sempre será preservada.</p>
            </div>
            <button onClick={() => setStaging(false)} className="text-sm font-bold text-[#667085]">Fechar</button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 text-xs font-bold text-[#667085]">ORIGINAL</div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                <Image src={property.image} alt="Foto original do imóvel" fill className="object-cover" />
              </div>
            </div>
            <div>
              <div className="mb-2 text-xs font-bold text-[#667085]">AMBIENTAÇÃO VIRTUAL</div>
              <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-[#F2F4F7]">
                {stagingGenerated ? (
                  <>
                    <Image src={property.image} alt="Simulação de ambientação virtual" fill className="object-cover opacity-90" />
                    <div className="absolute inset-x-3 bottom-3 rounded-lg bg-white/95 p-2 text-center text-xs font-bold">
                      Ambientação virtual gerada por IA
                    </div>
                  </>
                ) : (
                  <span className="px-5 text-center text-sm text-[#667085]">A prévia aparecerá aqui.</span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {["Moderno", "Minimalista", "Clássico", "Praiano"].map((item) => (
              <button key={item} className="min-h-10 rounded-full border border-[#E4E7EC] bg-white px-4 text-sm font-bold">{item}</button>
            ))}
          </div>
          <button onClick={() => setStagingGenerated(true)} className="app-button-primary mt-5">
            Gerar ambientação · 1 crédito
          </button>
        </section>
      )}
    </div>
  );
}

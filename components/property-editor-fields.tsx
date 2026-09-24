"use client";

import type { Dispatch, SetStateAction } from "react";
import type { PropertyDraftInput } from "@/app/imoveis/novo/actions";

export function PropertyEditorFields({
  draft,
  highlightsText,
  setDraft,
  setHighlightsText,
  onDone,
}: {
  draft: PropertyDraftInput;
  highlightsText: string;
  setDraft: Dispatch<SetStateAction<PropertyDraftInput>>;
  setHighlightsText: Dispatch<SetStateAction<string>>;
  onDone?: () => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-bold sm:col-span-2">
        Finalidade
        <select
          value={draft.purpose}
          onChange={(event) =>
            setDraft({
              ...draft,
              purpose: event.target.value as "Venda" | "Aluguel",
            })
          }
          className="app-input mt-2"
        >
          <option value="Venda">Venda</option>
          <option value="Aluguel">Aluguel</option>
        </select>
      </label>

      <Field
        label="Título"
        value={draft.title}
        onChange={(value) => setDraft({ ...draft, title: value })}
      />
      <NumberField
        label="Preço"
        value={draft.price}
        onChange={(value) => setDraft({ ...draft, price: value })}
      />
      <Field
        label="Bairro"
        value={draft.neighborhood}
        onChange={(value) => setDraft({ ...draft, neighborhood: value })}
      />
      <Field
        label="Cidade"
        value={draft.city}
        onChange={(value) => setDraft({ ...draft, city: value })}
      />
      <Field
        label="Estado"
        value={draft.state ?? ""}
        onChange={(value) => setDraft({ ...draft, state: value })}
      />
      <NumberField
        label="Área (m²)"
        value={draft.area}
        onChange={(value) => setDraft({ ...draft, area: value })}
      />
      <NumberField
        label="Quartos"
        value={draft.bedrooms}
        onChange={(value) => setDraft({ ...draft, bedrooms: value })}
      />
      <NumberField
        label="Suítes"
        value={draft.suites}
        onChange={(value) => setDraft({ ...draft, suites: value })}
      />
      <NumberField
        label="Banheiros"
        value={draft.bathrooms}
        onChange={(value) => setDraft({ ...draft, bathrooms: value })}
      />
      <NumberField
        label="Vagas"
        value={draft.parking}
        onChange={(value) => setDraft({ ...draft, parking: value })}
      />

      <label className="text-sm font-bold sm:col-span-2">
        Diferenciais
        <input
          value={highlightsText}
          onChange={(event) => setHighlightsText(event.target.value)}
          placeholder="Ex.: perto da praia, varanda, piscina"
          className="app-input mt-2"
        />
        <span className="mt-1 block text-xs font-normal text-[#667085]">
          Separe por vírgulas.
        </span>
      </label>

      <label className="text-sm font-bold sm:col-span-2">
        Descrição
        <textarea
          value={draft.description}
          onChange={(event) =>
            setDraft({ ...draft, description: event.target.value })
          }
          rows={5}
          className="app-input mt-2 min-h-32 py-3"
        />
      </label>

      {onDone && (
        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={onDone}
            className="app-button-primary"
          >
            Aplicar alterações
          </button>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm font-bold">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="app-input mt-2"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="text-sm font-bold">
      {label}
      <input
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="app-input mt-2"
      />
    </label>
  );
}

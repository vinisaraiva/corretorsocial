"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  Sparkles,
  Star,
} from "lucide-react";
import {
  queuePropertyMediaAnalysis,
  type PropertyDraftInput,
} from "@/app/imoveis/novo/actions";
import {
  removePropertyMedia,
  reorderPropertyMedia,
  setPropertyCover,
  updateProperty,
} from "@/app/imoveis/actions";
import { PropertyEditorFields } from "@/components/property-editor-fields";
import { ConfirmDestructiveAction } from "@/components/confirm-destructive-action";
import { uploadPropertyPhotos } from "@/lib/supabase/uploads";
import type { PropertyMedia } from "@/types";

function roomLabel(tags?: string[]) {
  const room = tags?.find((tag) => tag.startsWith("room:"))?.slice(5);

  const labels: Record<string, string> = {
    exterior: "Exterior",
    living_room: "Sala",
    kitchen: "Cozinha",
    bedroom: "Quarto",
    bathroom: "Banheiro",
    balcony: "Varanda",
    leisure: "Lazer",
    pool: "Piscina",
    view: "Vista",
    floorplan: "Planta",
    other: "Outro",
  };

  return room ? labels[room] ?? room : null;
}

export function EditPropertyForm({
  propertyId,
  initialDraft,
  initialMedia,
  initialCoverManuallySelected,
}: {
  propertyId: string;
  initialDraft: PropertyDraftInput;
  initialMedia: PropertyMedia[];
  initialCoverManuallySelected: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(initialDraft);
  const [highlightsText, setHighlightsText] = useState(
    initialDraft.highlights.join(", "),
  );
  const [media, setMedia] = useState(initialMedia);
  const [coverManuallySelected, setCoverManuallySelected] = useState(
    initialCoverManuallySelected,
  );
  const [saving, setSaving] = useState(false);
  const [galleryWorking, setGalleryWorking] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setMedia(initialMedia);
  }, [initialMedia]);

  useEffect(() => {
    setCoverManuallySelected(initialCoverManuallySelected);
  }, [initialCoverManuallySelected]);

  const recommendedId = useMemo(() => {
    const scored = media
      .filter(
        (item) =>
          item.id &&
          item.aiScore !== null &&
          item.aiScore !== undefined &&
          Number.isFinite(item.aiScore),
      )
      .sort((a, b) => Number(b.aiScore ?? 0) - Number(a.aiScore ?? 0));

    return scored[0]?.id;
  }, [media]);

  async function saveDetails() {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await updateProperty(propertyId, {
        ...draft,
        highlights: highlightsText
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      setMessage("Informações do imóvel atualizadas.");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível atualizar o imóvel.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function addPhotos(files: FileList | null) {
    const selected = Array.from(files ?? []);
    if (selected.length === 0) return;

    const remaining = 20 - media.length;

    if (remaining <= 0) {
      setError("Este imóvel já possui o limite de 20 fotos.");
      return;
    }

    setGalleryWorking("upload");
    setError("");
    setMessage("");

    try {
      await uploadPropertyPhotos(propertyId, selected.slice(0, remaining));

      try {
        await queuePropertyMediaAnalysis(propertyId);
      } catch {
        // The deterministic gallery continues to work if AI is unavailable.
      }

      setMessage(
        selected.length > remaining
          ? `Foram adicionadas ${remaining} fotos. O limite total é de 20.`
          : "Fotos adicionadas à galeria.",
      );
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível adicionar as fotos.",
      );
    } finally {
      setGalleryWorking(null);
    }
  }

  async function chooseCover(mediaId: string) {
    setGalleryWorking(`cover:${mediaId}`);
    setError("");
    setMessage("");

    try {
      await setPropertyCover(propertyId, mediaId);
      setMedia((current) =>
        current.map((item) => ({
          ...item,
          isCover: item.id === mediaId,
        })),
      );
      setCoverManuallySelected(true);
      setMessage("Foto de capa fixada manualmente.");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível alterar a capa.",
      );
    } finally {
      setGalleryWorking(null);
    }
  }

  async function movePhoto(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= media.length) return;

    const next = [...media];
    [next[index], next[target]] = [next[target], next[index]];

    const ids = next
      .map((item) => item.id)
      .filter((id): id is string => Boolean(id));

    if (ids.length !== next.length) {
      setError("Não foi possível identificar todas as fotos da galeria.");
      return;
    }

    setGalleryWorking(`move:${media[index].id}`);
    setError("");
    setMessage("");

    try {
      await reorderPropertyMedia(propertyId, ids);
      setMedia(
        next.map((item, newIndex) => ({
          ...item,
          sortOrder: newIndex,
        })),
      );
      setMessage("Ordem das fotos atualizada.");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível alterar a ordem das fotos.",
      );
    } finally {
      setGalleryWorking(null);
    }
  }

  async function removePhoto(mediaId: string) {
    setGalleryWorking(`remove:${mediaId}`);
    setError("");
    setMessage("");

    try {
      const removed = media.find((item) => item.id === mediaId);
      await removePropertyMedia(propertyId, mediaId);

      setMedia((current) => {
        const next = current.filter((item) => item.id !== mediaId);

        if (removed?.isCover && next.length > 0) {
          return next.map((item, index) => ({
            ...item,
            isCover: index === 0,
            sortOrder: index,
          }));
        }

        return next.map((item, index) => ({
          ...item,
          sortOrder: index,
        }));
      });

      if (removed?.isCover) {
        setCoverManuallySelected(false);
      }
      setMessage("Foto removida.");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível remover a foto.",
      );
    } finally {
      setGalleryWorking(null);
    }
  }

  return (
    <div className="space-y-5">
      {message && (
        <div className="flex items-center gap-2 rounded-xl bg-[#ECFDF3] p-4 text-sm font-semibold text-[#067647]">
          <CheckCircle2 size={17} />
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-[#FEF3F2] p-4 text-sm font-semibold text-[#B42318]">
          {error}
        </div>
      )}

      <section className="app-card p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-extrabold">Informações do imóvel</h2>
          <p className="mt-1 text-sm text-[#667085]">
            Alterações aqui serão usadas em novas campanhas.
          </p>
        </div>

        <PropertyEditorFields
          draft={draft}
          highlightsText={highlightsText}
          setDraft={setDraft}
          setHighlightsText={setHighlightsText}
        />

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={() => void saveDetails()}
            className="app-button-primary inline-flex items-center gap-2"
          >
            {saving && <LoaderCircle size={17} className="animate-spin" />}
            Salvar informações
          </button>
        </div>
      </section>

      <section className="app-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold">Galeria</h2>
            <p className="mt-1 text-sm text-[#667085]">
              {media.length}/20 fotos ·{" "}
              {coverManuallySelected
                ? "capa fixada manualmente"
                : "capa em modo automático"}.
            </p>
          </div>

          <label
            className={`app-button-secondary inline-flex cursor-pointer items-center gap-2 text-sm ${
              media.length >= 20 || galleryWorking === "upload"
                ? "pointer-events-none opacity-50"
                : ""
            }`}
          >
            {galleryWorking === "upload" ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <ImagePlus size={17} />
            )}
            Adicionar fotos
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              disabled={media.length >= 20 || galleryWorking === "upload"}
              onChange={(event) => {
                void addPhotos(event.target.files);
                event.currentTarget.value = "";
              }}
            />
          </label>
        </div>

        {media.length === 0 ? (
          <div className="mt-5 rounded-xl bg-[#F9FAFB] p-8 text-center text-sm text-[#667085]">
            Este imóvel ainda não possui fotos.
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {media.map((item, index) => {
              const itemId = item.id;
              const isRecommended = itemId && itemId === recommendedId;
              const room = roomLabel(item.aiTags);
              const busy =
                Boolean(itemId) &&
                Boolean(galleryWorking?.endsWith(itemId as string));

              return (
                <article
                  key={itemId ?? item.url}
                  className="overflow-hidden rounded-xl border border-[#E4E7EC] bg-white"
                >
                  <div className="relative aspect-[4/3] bg-[#EAECF0]">
                    <img
                      src={item.url}
                      alt={`Foto ${index + 1} do imóvel`}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />

                    <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
                      {item.isCover && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-black text-[#176B5B] shadow">
                          <Star size={11} fill="currentColor" />
                          CAPA
                        </span>
                      )}
                      {isRecommended && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#18202A]/90 px-2.5 py-1 text-[10px] font-black text-white shadow">
                          <Sparkles size={11} />
                          SUGESTÃO IA
                        </span>
                      )}
                    </div>

                    <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-[10px] font-bold text-white">
                      {index + 1}
                    </span>
                  </div>

                  <div className="p-3">
                    <div className="flex min-h-5 flex-wrap items-center gap-2 text-xs text-[#667085]">
                      {room && <span>{room}</span>}
                      {item.aiScore !== null &&
                        item.aiScore !== undefined && (
                          <span>· Capa IA {Math.round(item.aiScore)}/100</span>
                        )}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={
                          !itemId ||
                          busy ||
                          (item.isCover && coverManuallySelected)
                        }
                        onClick={() => itemId && void chooseCover(itemId)}
                        className="app-button-secondary min-h-9 px-2 text-xs"
                      >
                        {item.isCover
                          ? coverManuallySelected
                            ? "Capa fixada"
                            : "Fixar esta capa"
                          : "Definir capa"}
                      </button>

                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          aria-label="Mover foto para trás"
                          disabled={!itemId || index === 0 || busy}
                          onClick={() => void movePhoto(index, -1)}
                          className="flex min-h-9 items-center justify-center rounded-lg border border-[#E4E7EC] disabled:opacity-40"
                        >
                          <ArrowLeft size={15} />
                        </button>
                        <button
                          type="button"
                          aria-label="Mover foto para frente"
                          disabled={
                            !itemId || index === media.length - 1 || busy
                          }
                          onClick={() => void movePhoto(index, 1)}
                          className="flex min-h-9 items-center justify-center rounded-lg border border-[#E4E7EC] disabled:opacity-40"
                        >
                          <ArrowRight size={15} />
                        </button>
                      </div>
                    </div>

                    {itemId && (
                      <div className="mt-2">
                        <ConfirmDestructiveAction
                          triggerLabel="Remover foto"
                          title="Remover esta foto?"
                          description="A foto será retirada da galeria do imóvel. Campanhas já salvas que dependam desta mídia poderão usar uma alternativa disponível."
                          confirmLabel="Remover foto"
                          onConfirm={() => removePhoto(itemId)}
                        />
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-5 rounded-xl bg-[#F9FAFB] p-4 text-xs leading-5 text-[#667085]">
          <strong className="text-[#475467]">Sobre a sugestão da IA:</strong>{" "}
          quando houver análise visual, a maior nota aparece como recomendação.
          Ela nunca troca automaticamente uma capa fixada manualmente.
        </div>
      </section>
    </div>
  );
}

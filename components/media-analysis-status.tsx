"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle, TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type JobStatus =
  | "queued"
  | "processing"
  | "retrying"
  | "completed"
  | "failed"
  | "cancelled";

export function MediaAnalysisStatus({ jobId }: { jobId?: string | null }) {
  const router = useRouter();
  const refreshed = useRef(false);
  const lastTriggeredStatus = useRef<JobStatus | null>(null);
  const [status, setStatus] = useState<JobStatus | null>(
    jobId ? "queued" : null,
  );

  useEffect(() => {
    if (!jobId) return;

    let stopped = false;
    let timer: number | undefined;
    const supabase = createClient();

    const poll = async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("status")
        .eq("id", jobId)
        .maybeSingle();

      if (stopped) return;

      if (error || !data) {
        setStatus(null);
        return;
      }

      const next = data.status as JobStatus;
      setStatus(next);

      if (
        (next === "queued" || next === "retrying") &&
        lastTriggeredStatus.current !== next
      ) {
        lastTriggeredStatus.current = next;

        void supabase.functions
          .invoke("media-analysis", {
            body: {
              job_id: jobId,
            },
          })
          .catch(() => {
            // Polling continues; a later retry can trigger the function again.
          });
      }

      if (next === "completed") {
        if (!refreshed.current) {
          refreshed.current = true;
          router.refresh();
        }
        return;
      }

      if (next === "failed" || next === "cancelled") return;

      timer = window.setTimeout(poll, 2500);
    };

    void poll();

    return () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [jobId, router]);

  if (!jobId || !status) return null;

  if (status === "completed") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-[#ECFDF3] p-3 text-sm font-semibold text-[#067647]">
        <CheckCircle2 size={17} />
        Fotos analisadas. A seleção automática foi atualizada.
      </div>
    );
  }

  if (status === "failed" || status === "cancelled") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-[#FFFAEB] p-3 text-sm font-semibold text-[#B54708]">
        <TriangleAlert size={17} />
        A análise avançada não concluiu. A campanha continua usando a seleção
        automática básica.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl bg-[#F2F4F7] p-3 text-sm font-semibold text-[#475467]">
      <LoaderCircle size={17} className="animate-spin text-[#176B5B]" />
      Analisando as fotos em segundo plano. Você já pode revisar a campanha.
    </div>
  );
}

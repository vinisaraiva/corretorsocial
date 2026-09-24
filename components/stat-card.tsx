import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  helper,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  helper?: string;
}) {
  return (
    <div className="app-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#667085]">{label}</p>
          <p className="mt-2 text-2xl font-extrabold tracking-tight">{value}</p>
          {helper && <p className="mt-1 text-xs text-[#667085]">{helper}</p>}
        </div>
        <div className="rounded-lg bg-[#E9F4F1] p-2 text-[#176B5B]">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

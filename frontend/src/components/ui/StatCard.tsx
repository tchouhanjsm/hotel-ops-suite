import type { LucideIcon } from "lucide-react";

type Props = {
  label: string;
  value: string | number;
  detail?: string;
  icon: LucideIcon;
  tone?: "neutral" | "success" | "info" | "warning" | "error";
};

const tones = {
  neutral: "bg-gray-100 text-gray-600",
  success: "bg-[var(--hos-green-soft)] text-[var(--hos-green)]",
  info: "bg-[var(--hos-blue-soft)] text-[var(--hos-blue)]",
  warning: "bg-[var(--hos-amber-soft)] text-[var(--hos-amber)]",
  error: "bg-[var(--hos-red-soft)] text-[var(--hos-red)]",
};

export default function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral",
}: Props) {
  return (
    <div className="hos-card hos-stat-card">
      <div className="flex items-center justify-between gap-3">
        <div className="hos-stat-label">{label}</div>

        <div className={`hos-stat-icon ${tones[tone]}`}>
          <Icon size={19} strokeWidth={1.9} />
        </div>
      </div>

      <div className="hos-stat-value">{value}</div>

      {detail && <div className="hos-stat-detail">{detail}</div>}
    </div>
  );
}

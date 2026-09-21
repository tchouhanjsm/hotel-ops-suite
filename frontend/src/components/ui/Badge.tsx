import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  variant?: "neutral" | "success" | "info" | "warning" | "error";
};

export default function Badge({ children, variant = "neutral" }: Props) {
  return <span className={`hos-badge hos-badge-${variant}`}>{children}</span>;
}

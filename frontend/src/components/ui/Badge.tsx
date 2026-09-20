import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  variant?: "neutral" | "success" | "info" | "warning" | "error";
};

export default function Badge({ children, variant = "neutral" }: Props) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

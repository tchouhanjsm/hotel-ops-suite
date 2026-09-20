import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  variant?: "info" | "success" | "warning" | "error";
};

export default function Alert({ children, variant = "error" }: Props) {
  return <div className={`alert alert-${variant}`}>{children}</div>;
}

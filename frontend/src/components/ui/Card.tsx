import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  solid?: boolean;
};

export default function Card({
  children,
  className = "",
  solid = false,
}: Props) {
  return (
    <div className={`${solid ? "hos-card-solid" : "hos-card"} ${className}`}>
      {children}
    </div>
  );
}

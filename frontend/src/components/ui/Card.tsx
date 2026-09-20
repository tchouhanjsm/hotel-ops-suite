import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: Props) {
  return (
    <div className={`card border bg-base-100 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

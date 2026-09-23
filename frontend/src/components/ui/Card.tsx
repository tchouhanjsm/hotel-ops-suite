import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  solid?: boolean;
};

export default function Card({
  children,
  className = "",
  solid = false,
  ...props
}: Props) {
  return (
    <div
      {...props}
      className={`${solid ? "hos-card-solid" : "hos-card"} ${className}`}
    >
      {children}
    </div>
  );
}

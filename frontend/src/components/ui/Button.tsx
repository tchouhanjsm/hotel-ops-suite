import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: Props) {
  const classes = [
    "hos-btn",
    size === "sm" ? "hos-btn-sm" : "hos-btn-md",
    variant === "primary" && "hos-btn-primary",
    variant === "secondary" && "hos-btn-secondary",
    variant === "ghost" && "hos-btn-ghost",
    variant === "danger" && "hos-btn-danger",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

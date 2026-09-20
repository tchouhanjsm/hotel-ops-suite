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
    "btn",
    variant === "primary" && "btn-neutral",
    variant === "secondary" && "btn-outline",
    variant === "ghost" && "btn-ghost",
    variant === "danger" && "btn-error",
    size === "sm" && "btn-sm",
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

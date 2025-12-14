"use client";

import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { Loader } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  isLoading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  className = "",
  disabled,
  isLoading,
  ...props
}: PropsWithChildren<ButtonProps>) {
  const baseStyle =
    "px-6 py-3 rounded-full font-semibold tracking-tight transition-all duration-200 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary:
      "bg-[var(--color-brand-primary)] text-white shadow-[var(--shadow-brand)] hover:bg-[var(--color-brand-hover)] focus-visible:ring-[var(--color-brand-light)]",
    secondary:
      "bg-white text-[var(--color-text-primary)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface)] focus-visible:ring-[var(--color-brand-light)]",
    outline:
      "bg-transparent border border-white/60 text-white hover:bg-white/10 focus-visible:ring-white/60",
    ghost:
      "bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/70 focus-visible:ring-[var(--color-border)]",
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      disabled={isDisabled}
      className={`${baseStyle} ${variants[variant]} ${className} ${
        isDisabled ? "cursor-not-allowed opacity-70" : ""
      }`}
      {...props}
    >
      {isLoading && <Loader className="w-4 h-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

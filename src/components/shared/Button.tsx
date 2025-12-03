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
    "px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2";
  const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary:
      "bg-gray-900 text-white hover:bg-gray-800 shadow-sm hover:shadow-md disabled:bg-gray-400",
    secondary:
      "bg-white text-gray-900 border border-gray-200 hover:border-gray-900 hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-400",
    outline: "bg-transparent border border-white text-white hover:bg-white/10",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      disabled={isDisabled}
      className={`${baseStyle} ${variants[variant]} ${className} ${
        isDisabled ? "cursor-not-allowed" : ""
      }`}
      {...props}
    >
      {isLoading && <Loader className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

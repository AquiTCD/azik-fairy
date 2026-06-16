"use client";

import React from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface GameButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANT: Record<ButtonVariant, string> = {
  primary:   "bg-green-500 text-black border-2 border-green-500 hover:bg-black hover:text-green-500 focus:ring-green-400",
  secondary: "bg-zinc-800 text-green-400 border-2 border-green-500 hover:bg-green-500 hover:text-black focus:ring-green-400",
  danger:    "bg-transparent text-red-500 border-2 border-red-500 hover:bg-red-500 hover:text-white focus:ring-red-400",
  ghost:     "bg-zinc-900 text-green-400 border border-green-700 hover:bg-green-500 hover:text-black focus:ring-green-400",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  md: "px-6 py-2.5 text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  lg: "px-6 py-3 text-base shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
};

export default function GameButton({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...props
}: GameButtonProps) {
  return (
    <button
      className={`font-pixel font-bold tracking-wider rounded cursor-pointer transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-zinc-950 ${VARIANT[variant]} ${SIZE[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

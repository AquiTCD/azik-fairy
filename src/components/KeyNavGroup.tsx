"use client";

import React, { useRef, useEffect } from "react";

interface KeyNavGroupProps {
  children: React.ReactNode;
  className?: string;
}

// Wraps interactive children and provides up/down arrow key navigation.
// Focuses the first element on mount.
export default function KeyNavGroup({ children, className = "" }: KeyNavGroupProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      ref.current?.querySelector<HTMLElement>("button:not([disabled]), a[href]")?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const items = Array.from(
      ref.current?.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]") ?? []
    );
    const idx = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") {
      items[(idx + 1) % items.length]?.focus();
    } else {
      items[(idx - 1 + items.length) % items.length]?.focus();
    }
  };

  return (
    <div ref={ref} onKeyDown={handleKeyDown} className={className}>
      {children}
    </div>
  );
}

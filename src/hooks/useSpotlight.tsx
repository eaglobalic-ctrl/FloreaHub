"use client";
import { useRef } from "react";

export function useSpotlight<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  const onMouseMove = (e: React.MouseEvent<T>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    ref.current!.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    ref.current!.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  };

  return { ref, onMouseMove };
}

export function SpotlightOverlay({ color = "rgba(181,41,78,0.12)", size = 200 }: { color?: string; size?: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 opacity-0 group-hover/spot:opacity-100 transition-opacity duration-300 rounded-[inherit]"
      style={{
        background: `radial-gradient(${size}px circle at var(--spot-x, 50%) var(--spot-y, 50%), ${color}, transparent 70%)`,
      }}
    />
  );
}

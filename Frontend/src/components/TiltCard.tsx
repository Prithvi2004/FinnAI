import React, { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
}

export const TiltCard = ({ children, className = "" }: TiltCardProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={`group relative rounded-2xl bg-charcoal-900 border border-charcoal-800/50 shadow-xl overflow-hidden ${className}`}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-500 group-hover:opacity-100 z-0"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              600px circle at ${mouseX}px ${mouseY}px,
              rgba(184, 154, 122, 0.15),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative z-10 w-full h-full flex flex-col pointer-events-auto">
        {children}
      </div>
    </div>
  );
};

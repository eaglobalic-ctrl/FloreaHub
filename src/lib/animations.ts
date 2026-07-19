const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

export const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5 } },
};

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

export const staggerFast = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE } },
};

export const slideLeft = {
  hidden: { opacity: 0, x: -30 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE } },
};

export const slideRight = {
  hidden: { opacity: 0, x: 30 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE } },
};

export const floatAnim = {
  initial: { y: 0 },
  animate: {
    y: [-8, 0, -8],
    transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" as const },
  },
};

export const popIn = {
  hidden: { opacity: 0, scale: 0.7 },
  show: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 22 } },
};

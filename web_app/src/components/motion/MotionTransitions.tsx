"use client";

import React from "react";
import { motion, HTMLMotionProps, Variants } from "framer-motion";

export const defaultEase = [0.22, 1, 0.36, 1] as const;

export const pageFadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: defaultEase,
      staggerChildren: 0.07,
      delayChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.25, ease: "easeInOut" },
  },
};

export const riseScrollVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: defaultEase,
    },
  },
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.48,
      ease: defaultEase,
    },
  },
};

export interface MotionPageProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
}

/**
 * Top-level page entrance animation wrapper.
 * Fades and smoothly rises into position on mount.
 */
export function MotionPage({ children, className = "", ...props }: MotionPageProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={pageFadeUpVariants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export interface MotionSectionProps extends HTMLMotionProps<"section"> {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  viewportMargin?: string;
  amount?: number;
}

/**
 * Rise-into-position scroll animation wrapper for major page sections.
 * Automatically animates into view as the user scrolls into it.
 */
export function MotionSection({
  children,
  className = "",
  delay = 0,
  viewportMargin = "-50px",
  amount = 0.12,
  ...props
}: MotionSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: viewportMargin, amount }}
      transition={{ duration: 0.55, ease: defaultEase, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.section>
  );
}

export interface MotionCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hoverEffect?: boolean;
}

/**
 * Rise-into-position card element with optional subtle lift on hover.
 */
export function MotionCard({
  children,
  className = "",
  delay = 0,
  hoverEffect = false,
  ...props
}: MotionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5, ease: defaultEase, delay }}
      whileHover={hoverEffect ? { y: -3, transition: { duration: 0.2 } } : undefined}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export interface RiseInProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
  direction?: "up" | "down" | "left" | "right";
  duration?: number;
  once?: boolean;
  threshold?: number;
}

/**
 * Universal Rise-Into-Position element with configurable distance and scroll threshold.
 */
export function RiseIn({
  children,
  className = "",
  delay = 0,
  distance = 24,
  direction = "up",
  duration = 0.5,
  once = true,
  threshold = 0.1,
  ...props
}: RiseInProps) {
  const getInitialOffset = () => {
    switch (direction) {
      case "up":
        return { y: distance, x: 0 };
      case "down":
        return { y: -distance, x: 0 };
      case "left":
        return { x: distance, y: 0 };
      case "right":
        return { x: -distance, y: 0 };
      default:
        return { y: distance, x: 0 };
    }
  };

  const offset = getInitialOffset();

  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount: threshold }}
      transition={{ duration, ease: defaultEase, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export interface MotionGridProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
}

/**
 * Stagger grid container that progressively reveals its child MotionCards/items.
 */
export function MotionGrid({ children, className = "", ...props }: MotionGridProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={staggerContainerVariants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

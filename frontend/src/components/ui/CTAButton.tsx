'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CTAButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary';
  children: React.ReactNode;
}

export const CTAButton: React.FC<CTAButtonProps> = ({ 
  variant = 'primary', 
  children, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "relative overflow-hidden rounded-full font-medium transition-all duration-300 flex items-center justify-center backdrop-blur-md";
  
  const variants = {
    primary: "bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/40 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]",
    secondary: "bg-black/40 text-zinc-300 border border-zinc-700/50 hover:bg-black/60 hover:text-white hover:border-zinc-500 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]",
    tertiary: "bg-transparent text-zinc-400 border border-transparent hover:text-white hover:bg-white/5",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} px-6 py-3 ${variants[variant]} ${className}`}
      {...props}
    >
      {/* Shimmer effect overlay */}
      <span className="absolute inset-0 w-full h-full -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
      <span className="relative flex items-center gap-2">{children}</span>
    </motion.button>
  );
};

import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';

interface GlassButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  ...props
}) => {
  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base font-medium',
  };

  const variants = {
    primary:
      'bg-[#E60B18] text-white shadow-[0_0_20px_rgba(230,11,24,0.4)] hover:bg-[#FF2A38] hover:shadow-[0_0_30px_rgba(230,11,24,0.6)] border border-[#FF2A38]/50',
    secondary:
      'bg-white/[0.06] backdrop-blur-md border border-white/[0.15] text-white hover:bg-white/[0.12] hover:border-white/[0.3] shadow-[0_4px_20px_rgba(0,0,0,0.2)]',
    ghost:
      'bg-transparent text-zinc-400 hover:text-white hover:bg-white/[0.05]',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'rounded-full inline-flex items-center justify-center gap-2 transition-colors cursor-pointer font-sans tracking-wide transform-gpu select-none',
        sizes[size],
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
};
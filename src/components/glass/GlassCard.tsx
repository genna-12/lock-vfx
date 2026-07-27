import React from 'react';
import { cn } from '../../utils/cn';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'low' | 'medium' | 'high';
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  variant = 'medium',
  hoverEffect = true,
  ...props
}) => {
  const variants = {
    low: 'bg-white/[0.02] backdrop-blur-sm md:backdrop-blur-md border border-white/[0.06]',
    medium: 'bg-white/[0.05] backdrop-blur-md md:backdrop-blur-xl border border-white/[0.12] shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]',
    high: 'bg-white/[0.08] backdrop-blur-lg md:backdrop-blur-2xl border border-white/[0.2] shadow-[0_12px_40px_0_rgba(0,0,0,0.5)]',
  };

  return (
    <div
      className={cn(
        'rounded-2xl transition-all duration-300 transform-gpu relative overflow-hidden',
        variants[variant],
        hoverEffect && [
          'hover:-translate-y-1 hover:scale-[1.005]',
          'hover:border-[#E60B18]/40',
          'hover:shadow-[0_0_25px_-5px_rgba(230,11,24,0.2)]',
        ],
        className
      )}
      {...props}
    >
      {/* Riflesso di luce superiore "Rim Light" */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      {children}
    </div>
  );
};
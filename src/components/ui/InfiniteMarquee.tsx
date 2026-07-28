import React from 'react';

interface MarqueeProps {
  children: React.ReactNode;
  speed?: number; // In secondi
}

export const InfiniteMarquee: React.FC<MarqueeProps> = ({ children, speed = 25 }) => {
  return (
    <div className="relative w-full overflow-hidden flex select-none py-4 mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <div
        className="flex gap-8 shrink-0 items-center animate-marquee"
        style={{ animationDuration: `${speed}s` }}
      >
        {children}
      </div>
      <div
        aria-hidden="true"
        className="flex gap-8 shrink-0 items-center animate-marquee"
        style={{ animationDuration: `${speed}s` }}
      >
        {children}
      </div>
    </div>
  );
};
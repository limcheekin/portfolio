import React, { useState, useEffect } from 'react';
import { VALUE_PROPS } from '../constants';

const Banner: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsExiting(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % VALUE_PROPS.length);
        setIsExiting(false);
      }, 800);
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-auto overflow-hidden bg-transparent flex items-start">
      <div className="relative z-10 w-full px-0">
        {VALUE_PROPS.map((prop, idx) => (
          <div
            key={idx}
            role={idx === currentIndex ? "status" : undefined}
            aria-live={idx === currentIndex ? "polite" : undefined}
            aria-hidden={idx !== currentIndex}
            className={`transition-all duration-700 ease-out transform ${
              idx === currentIndex
                ? (isExiting ? 'opacity-0 translate-x-8 blur-sm' : 'opacity-100 translate-x-0 blur-0')
                : 'absolute inset-0 opacity-0 pointer-events-none'
            }`}
          >
            <div className="font-display font-bold leading-[1.1] tracking-tight m-0">
              <div className="text-2xl md:text-3xl lg:text-4xl text-slate-300">
                I help <span className="text-white relative inline-block">
                  {prop.target}
                  <div className="absolute -bottom-1 left-0 w-full h-px bg-blue-500/40" />
                </span>
              </div>

              <div className="text-3xl md:text-4xl lg:text-5xl text-emerald-400 py-0">
                {prop.benefit}
              </div>

              <div className="text-2xl md:text-3xl lg:text-4xl text-slate-300 flex items-baseline flex-wrap gap-x-3">
                <span>without</span>
                <span className="text-rose-400 font-light italic opacity-95">
                  {prop.negative}.
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Banner;

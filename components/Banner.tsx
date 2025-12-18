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

  const prop = VALUE_PROPS[currentIndex];

  return (
    // align to top (items-start) and occupy full viewport height
    <div className="relative w-full h-auto overflow-hidden bg-transparent flex items-start">
      {/* remove vertical padding on container */}
      <div className="relative z-10 w-full px-0">
        <div className={`transition-all duration-700 ease-out transform ${isExiting ? 'opacity-0 translate-x-8 blur-sm' : 'opacity-100 translate-x-0 blur-0'}`}>
          {/* remove default margins on h2 and tighten leading */}
          <h2 className="font-display font-bold leading-[1.1] tracking-tight m-0">
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
          </h2>
        </div>
      </div>

      {/* Navigation buttons 
      <div className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 flex flex-col space-y-10 z-20">
        {VALUE_PROPS.map((_, idx) => (
          <button 
            key={idx}
            onClick={() => {
                if (idx === currentIndex) return;
                setIsExiting(true);
                setTimeout(() => {
                  setCurrentIndex(idx);
                  setIsExiting(false);
                }, 400);
            }}
            className="group relative flex items-center"
          >
            <div className={`h-1 transition-all duration-700 rounded-full ${idx === currentIndex ? 'w-8 bg-blue-500' : 'w-1.5 bg-white/10 hover:bg-white/30'}`} />
            {idx === currentIndex && (
                <span className="absolute right-10 text-[10px] font-bold text-blue-500 tracking-widest whitespace-nowrap">
                    0{idx + 1} / 0{VALUE_PROPS.length}
                </span>
            )}
          </button>
        ))}
      </div>
      */}
    </div>
  );
};

export default Banner;


import React, { useEffect, useRef, useState } from 'react';
import { BulbIcon } from './icons.tsx';

interface GeodleInputProps {
  value: string;
  onChange: (val: string) => void;
  onGuess: (name: string) => void;
  onGetHint: () => void;
  isLoading: boolean;
  isHintLoading: boolean;
  currentHint: string | null;
}

const GeodleInput: React.FC<GeodleInputProps> = ({ 
  value, 
  onChange, 
  onGuess, 
  onGetHint, 
  isLoading, 
  isHintLoading, 
  currentHint 
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (inputRef.current && !isLoading && !isHintLoading) { // Removed document.activeElement check
      inputRef.current.focus();
    }
  }, [isLoading, isHintLoading]); // Removed 'value' from dependency array

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGuess(value);
  };

  return (
    <div className="w-full bg-white/98 backdrop-blur-3xl border-t border-zinc-200 p-5 pb-10 sm:p-7 sm:pb-12 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] flex flex-col items-center gap-5">
      {currentHint && (
        <div className="w-full max-w-sm animate-fade-in">
          <div className="bg-emerald-50/50 border border-emerald-100 p-4 px-6 rounded-full flex items-center gap-4">
            <BulbIcon className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-[12px] font-medium italic text-emerald-800 leading-tight">"{currentHint}"</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type country name..."
            className="w-full bg-zinc-50 border-2 px-7 py-5 rounded-full text-lg font-bold tracking-tight outline-none border-transparent focus:border-black focus:bg-white text-black shadow-inner"
            disabled={isLoading || isHintLoading}
            autoComplete="off"
            autoFocus
            inputMode="text"
            enterKeyHint="go"
            tabIndex={0} // Added tabIndex for explicit focusability
          />
          <p className="text-[10px] text-zinc-500 mt-2 text-center">Distance calculated from geographical centers.</p>
        </div>
        
        <div className="flex gap-3">
           <button 
             type="button"
             onPointerDown={onGetHint}
             disabled={!isOnline}
             className="flex-shrink-0 bg-zinc-50 text-zinc-500 w-16 h-16 rounded-full flex items-center justify-center border border-zinc-200 shadow-sm disabled:opacity-30"
           >
             <BulbIcon className="w-8 h-8 text-black" />
           </button>
           <button 
            type="submit"
            disabled={!value.trim() || isLoading}
            className="flex-grow bg-black text-white h-16 rounded-full font-black tracking-[0.3em] uppercase text-[11px] shadow-xl active:scale-95 disabled:opacity-30"
          >
            {isLoading ? 'Traveling...' : 'Cast Guess'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GeodleInput;

import React, { useState, useEffect, useRef } from 'react';
import { SparkleIcon } from './icons.tsx';

interface ColordleInputProps {
  onGuess: (name: string) => void;
  onGetHint: () => void;
  isLoading: boolean;
  isHintLoading: boolean;
  currentHint: string | null;
  hasError?: boolean;
}

const ColordleInput: React.FC<ColordleInputProps> = ({ 
  onGuess, 
  onGetHint, 
  isLoading, 
  isHintLoading, 
  currentHint, 
  hasError 
}) => {
  const [value, setValue] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hasError) {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [hasError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isLoading) return;
    onGuess(value.trim());
    setValue('');
  };

  return (
    <div className="w-full bg-white/98 backdrop-blur-3xl border-t border-zinc-200 p-4 pb-8 sm:p-6 sm:pb-10 rounded-t-[2.5rem] shadow-[0_-15px_40px_rgba(0,0,0,0.08)] flex flex-col items-center gap-4">
      
      {currentHint && (
        <div className="w-full max-w-sm animate-fade-in">
          <div className="bg-zinc-50 border border-zinc-100 p-3 px-5 rounded-full flex items-start gap-3 shadow-inner">
            <SparkleIcon className="w-3.5 h-3.5 text-zinc-400 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] font-medium italic text-zinc-600 leading-tight">
              "{currentHint}"
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-3">
        <div className={`relative transition-all duration-300 ${shake ? 'animate-shake' : ''}`}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Name the color..."
            className={`w-full bg-zinc-50 border-2 px-6 py-4 rounded-full text-base font-bold tracking-tight outline-none transition-all placeholder:text-zinc-400 text-black shadow-inner
              ${hasError ? 'border-red-500 bg-red-50/50' : 'border-transparent focus:border-black focus:bg-white'}
            `}
            disabled={isLoading || isHintLoading}
            autoComplete="off"
          />
          {isLoading && (
            <div className="absolute right-6 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-zinc-200 border-t-black rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
           <button 
             type="button"
             onClick={onGetHint}
             disabled={isLoading || isHintLoading}
             className="flex-shrink-0 bg-zinc-50 text-zinc-500 w-14 h-14 rounded-full flex items-center justify-center border border-zinc-200 active:scale-90 transition-all disabled:opacity-30"
             title="Get a poetic hint"
           >
             {isHintLoading ? (
               <div className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin"></div>
             ) : (
               <SparkleIcon className="w-4 h-4" />
             )}
           </button>

           <button 
            type="submit"
            disabled={!value.trim() || isLoading || isHintLoading}
            className="flex-grow bg-black text-white h-14 rounded-full font-black tracking-[0.3em] uppercase text-[11px] shadow-lg active:scale-95 transition-all disabled:opacity-30"
          >
            {isLoading ? 'Searching...' : 'Guess Color'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ColordleInput;

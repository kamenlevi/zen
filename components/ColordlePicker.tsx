
import React from 'react';
import { rgbToHex } from '../services/colorService.ts';

interface ColordlePickerProps {
  red: number;
  green: number;
  blue: number;
  onChange: (r: number, g: number, b: number) => void;
  onGuess: () => void;
}

const ColordlePicker: React.FC<ColordlePickerProps> = ({ red, green, blue, onChange, onGuess }) => {
  const hex = rgbToHex(red, green, blue);

  const Slider = ({ value, color, label, onValChange }: { value: number, color: string, label: string, onValChange: (v: number) => void }) => (
    <div className="flex items-center gap-4 w-full group">
      <span className={`w-4 text-[10px] font-black ${color} opacity-70 group-hover:opacity-100 transition-opacity`}>{label}</span>
      <input 
        type="range" 
        min="0" 
        max="255" 
        value={value} 
        onChange={(e) => onValChange(parseInt(e.target.value))}
        className={`flex-grow h-1.5 rounded-full appearance-none cursor-pointer bg-zinc-300 accent-zinc-900`}
      />
      <span className="w-8 text-[10px] font-mono font-bold text-zinc-600 tabular-nums text-right">{value}</span>
    </div>
  );

  return (
    <div className="w-full bg-zinc-100/95 backdrop-blur-2xl border-t border-zinc-200 p-8 pt-6 rounded-t-[2.5rem] shadow-[0_-15px_40px_rgba(0,0,0,0.1)] flex flex-col items-center gap-8">
      <div className="flex items-center justify-between w-full max-w-xs">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Your Selection</span>
          <span className="text-2xl font-black tracking-tighter text-black">{hex}</span>
        </div>
        <div 
          className="w-14 h-14 rounded-2xl shadow-xl border-4 border-white transition-transform duration-300"
          style={{ backgroundColor: hex }}
        ></div>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <Slider value={red} color="text-red-600" label="R" onValChange={(v) => onChange(v, green, blue)} />
        <Slider value={green} color="text-emerald-600" label="G" onValChange={(v) => onChange(red, v, blue)} />
        <Slider value={blue} color="text-blue-600" label="B" onValChange={(v) => onChange(red, green, v)} />
      </div>

      <button 
        onClick={onGuess}
        className="w-full max-w-xs bg-black text-white py-5 rounded-[2rem] font-bold tracking-[0.3em] uppercase text-[11px] shadow-2xl active:scale-95 transition-all"
      >
        Make Guess
      </button>
    </div>
  );
};

export default ColordlePicker;

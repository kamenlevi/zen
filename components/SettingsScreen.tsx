
import React from 'react';
import { GameSettings } from '../types.ts';

interface SettingsScreenProps {
  context: 'global' | 'sudoku' | 'wordle' | 'colordle' | 'geodle';
  settings: GameSettings;
  onSettingsChange: (newSettings: Partial<GameSettings>) => void;
  onBack: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ context, settings, onSettingsChange, onBack }) => {
  const Toggle = ({ label, desc, value, onChange }: { label: string, desc: string, value: boolean, onChange: (v: boolean) => void }) => (
    <label className="flex flex-col p-3 sm:p-5 bg-white rounded-[1.8rem] sm:rounded-[2.2rem] border border-zinc-100 shadow-sm active:scale-[0.98] transition-all cursor-pointer group">
      <div className="flex items-center justify-between w-full mb-0.5">
        <span className="text-[12px] sm:text-[14px] font-black uppercase tracking-widest text-zinc-900 leading-none">{label}</span>
        <div 
          onPointerDown={(e) => { e.preventDefault(); onChange(!value); }}
          className={`w-10 h-5 sm:w-11 sm:h-5.5 rounded-full transition-colors relative ${value ? 'bg-black' : 'bg-zinc-200'}`}
        >
          <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-transform ${value ? 'translate-x-5 sm:translate-x-5.5' : ''}`}></div>
        </div>
      </div>
      <p className="text-[8px] sm:text-[9.5px] text-zinc-400 font-medium leading-tight pr-2">{desc}</p>
    </label>
  );

  const Section = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="w-full space-y-2 sm:space-y-4 pt-1 sm:pt-4">
      <h3 className="text-[9px] sm:text-[10px] font-black text-zinc-900 uppercase tracking-[0.5em] px-2 border-l-[3px] border-black ml-1">{title}</h3>
      <div className="space-y-1.5 sm:space-y-3">{children}</div>
    </div>
  );

  return (
    <div className="h-full flex flex-col p-4 sm:p-8 font-sans max-w-xl mx-auto bg-zinc-50/20">
      <header className="py-1 flex-shrink-0 border-b border-zinc-50 mb-2 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-zinc-900 leading-none uppercase">Settings</h1>
        <p className="text-zinc-400 font-bold uppercase tracking-[0.4em] text-[7px] sm:text-[9px] mt-0.5">Zen • {context}</p>
      </header>

      <main className="flex-grow space-y-4 sm:space-y-12 overflow-y-auto no-scrollbar pb-32 sm:pb-40">
        {(context === 'global' || context === 'sudoku') && (
          <Section title="Sudoku">
            <Toggle label="Mistakes" desc="Red flags for errors." value={settings.sudoku.highlightMistakes} onChange={(v) => onSettingsChange({ sudoku: { ...settings.sudoku, highlightMistakes: v } })} />
            <Toggle label="Timer" desc="Show clock." value={settings.sudoku.timerVisible} onChange={(v) => onSettingsChange({ sudoku: { ...settings.sudoku, timerVisible: v } })} />
            <Toggle label="Related" desc="Visual guides." value={settings.sudoku.highlightRelated} onChange={(v) => onSettingsChange({ sudoku: { ...settings.sudoku, highlightRelated: v } })} />
          </Section>
        )}
        {(context === 'global' || context === 'wordle') && (
          <Section title="Wordle">
            <Toggle label="Feedback" desc="Key colors." value={settings.wordle.showKeyboardFeedback} onChange={(v) => onSettingsChange({ wordle: { ...settings.wordle, showKeyboardFeedback: v } })} />
            <Toggle label="Contrast" desc="Visual mode." value={settings.wordle.highContrast} onChange={(v) => onSettingsChange({ wordle: { ...settings.wordle, highContrast: v } })} />
          </Section>
        )}
        {(context === 'global' || context === 'colordle') && (
          <Section title="Colordle">
            <Toggle label="Codes" desc="Show hex values." value={settings.colordle.showHexCodes} onChange={(v) => onSettingsChange({ colordle: { ...settings.colordle, showHexCodes: v } })} />
            <Toggle label="Vibrate" desc="Tactile feel." value={settings.colordle.vibrationFeedback} onChange={(v) => onSettingsChange({ colordle: { ...settings.colordle, vibrationFeedback: v } })} />
          </Section>
        )}
        <Section title="Core">
          <Toggle label="Motion" desc="Animations." value={settings.global.animations} onChange={(v) => onSettingsChange({ global: { ...settings.global, animations: v } })} />
          <Toggle label="Haptics" desc="Device pulses." value={settings.global.haptics} onChange={(v) => onSettingsChange({ global: { ...settings.global, haptics: v } })} />
        </Section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-5 sm:p-8 bg-gradient-to-t from-white via-white/95 to-transparent pt-8">
        <button onPointerDown={onBack} className="w-full max-w-xs mx-auto block bg-black text-white font-black py-4 sm:py-5 rounded-full shadow-xl uppercase tracking-[0.4em] text-[9px] sm:text-[10px] active:scale-95 transition-all">Back</button>
      </footer>
    </div>
  );
};

export default SettingsScreen;

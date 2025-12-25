
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
    <label className="flex flex-col p-8 bg-white rounded-[3rem] border border-zinc-100 shadow-sm active:scale-[0.99] transition-all cursor-pointer group">
      <div className="flex items-center justify-between w-full mb-2">
        <span className="text-[17px] font-black uppercase tracking-widest text-zinc-900 leading-none">{label}</span>
        <div 
          onClick={(e) => { e.preventDefault(); onChange(!value); }}
          className={`w-14 h-7 rounded-full transition-colors relative ${value ? 'bg-black' : 'bg-zinc-200'}`}
        >
          <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${value ? 'translate-x-7' : ''}`}></div>
        </div>
      </div>
      <p className="text-[11px] text-zinc-400 font-medium leading-tight pr-8">{desc}</p>
    </label>
  );

  const Section = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="w-full space-y-8 pt-8">
      <h3 className="text-[13px] font-black text-zinc-900 uppercase tracking-[0.6em] px-4 border-l-[6px] border-black ml-1">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );

  return (
    <div className="h-full flex flex-col p-10 font-sans max-w-xl mx-auto bg-zinc-50/20">
      <header className="py-12 flex-shrink-0 border-b border-zinc-100 mb-12">
        <h1 className="text-7xl font-black tracking-tighter text-zinc-900 leading-none uppercase">Settings</h1>
        <p className="text-zinc-400 font-bold uppercase tracking-[0.4em] text-[11px] mt-4">Personalize your Zen • {context}</p>
      </header>

      <main className="flex-grow space-y-24 overflow-y-auto no-scrollbar pb-64">
        {/* SUDOKU SECTION */}
        {(context === 'global' || context === 'sudoku') && (
          <Section title="Sudoku Master">
            <Toggle 
              label="Highlight Mistakes" 
              desc="Flags incorrect placements immediately in bright red. Toggle off for pure challenge."
              value={settings.sudoku.highlightMistakes} 
              onChange={(v) => onSettingsChange({ sudoku: { ...settings.sudoku, highlightMistakes: v } })} 
            />
            <Toggle 
              label="Active Timer" 
              desc="Shows your session clock in the game header."
              value={settings.sudoku.timerVisible} 
              onChange={(v) => onSettingsChange({ sudoku: { ...settings.sudoku, timerVisible: v } })} 
            />
            <Toggle 
              label="Highlight Related" 
              desc="Visual aid for the row, column, and block relative to your selection."
              value={settings.sudoku.highlightRelated} 
              onChange={(v) => onSettingsChange({ sudoku: { ...settings.sudoku, highlightRelated: v } })} 
            />
            <Toggle 
              label="Same Value Match" 
              desc="Highlight every cell on the board matching your selected number."
              value={settings.sudoku.highlightSameValue} 
              onChange={(v) => onSettingsChange({ sudoku: { ...settings.sudoku, highlightSameValue: v } })} 
            />
            <Toggle 
              label="AI Hints Access" 
              desc="Enables the intelligent hint button for master-level grids."
              value={settings.sudoku.showHints} 
              onChange={(v) => onSettingsChange({ sudoku: { ...settings.sudoku, showHints: v } })} 
            />
          </Section>
        )}

        {/* WORDLE SECTION */}
        {(context === 'global' || context === 'wordle') && (
          <Section title="Wordle Linguist">
            <Toggle 
              label="Dynamic Keys" 
              desc="Feedback colors on the virtual keyboard update as you play."
              value={settings.wordle.showKeyboardFeedback} 
              onChange={(v) => onSettingsChange({ wordle: { ...settings.wordle, showKeyboardFeedback: v } })} 
            />
            <Toggle 
              label="Hard Mode" 
              desc="Enforces strict guessing rules: revealed hints MUST be used."
              value={settings.wordle.hardMode} 
              onChange={(v) => onSettingsChange({ wordle: { ...settings.wordle, hardMode: v } })} 
            />
            <Toggle 
              label="High Contrast" 
              desc="Optimizes colors for various visual conditions."
              value={settings.wordle.highContrast} 
              onChange={(v) => onSettingsChange({ wordle: { ...settings.wordle, highContrast: v } })} 
            />
          </Section>
        )}

        {/* COLORDLE SECTION */}
        {(context === 'global' || context === 'colordle') && (
          <Section title="Colordle Artist">
            <Toggle 
              label="Reveal Hex Codes" 
              desc="Display the raw hex values for every guess in the history list."
              value={settings.colordle.showHexCodes} 
              onChange={(v) => onSettingsChange({ colordle: { ...settings.colordle, showHexCodes: v } })} 
            />
            <Toggle 
              label="Poetic Hints" 
              desc="Permit AI hints when color names are extremely niche."
              value={settings.colordle.allowHints} 
              onChange={(v) => onSettingsChange({ colordle: { ...settings.colordle, allowHints: v } })} 
            />
            <Toggle 
              label="Guess Vibration" 
              desc="Tacit haptic pulse when your similarity score is calculated."
              value={settings.colordle.vibrationFeedback} 
              onChange={(v) => onSettingsChange({ colordle: { ...settings.colordle, vibrationFeedback: v } })} 
            />
          </Section>
        )}

        {/* GEODLE SECTION */}
        {(context === 'global' || context === 'geodle') && (
          <Section title="Geodle Nomad">
            <Toggle 
              label="Globe Auto-Focus" 
              desc="The 3D globe rotates toward your last guess immediately."
              value={settings.geodle.autoRotateGlobe} 
              onChange={(v) => onSettingsChange({ geodle: { ...settings.geodle, autoRotateGlobe: v } })} 
            />
            <Toggle 
              label="Metric Distances" 
              desc="Use KM instead of Miles for proximity sensing."
              value={settings.geodle.metricUnits} 
              onChange={(v) => onSettingsChange({ geodle: { ...settings.geodle, metricUnits: v } })} 
            />
            <Toggle 
              label="Raw Coordinates" 
              desc="Display exact latitude/longitude for all submitted countries."
              value={settings.geodle.showCoordinates} 
              onChange={(v) => onSettingsChange({ geodle: { ...settings.geodle, showCoordinates: v } })} 
            />
          </Section>
        )}

        <Section title="System Core">
          <Toggle 
            label="Motion & FX" 
            desc="Enable fluid layout transitions and pop-in animations."
            value={settings.global.animations} 
            onChange={(v) => onSettingsChange({ global: { ...settings.global, animations: v } })} 
          />
          <Toggle 
            label="Global Haptics" 
            desc="System-wide tactile feedback for all key actions."
            value={settings.global.haptics} 
            onChange={(v) => onSettingsChange({ global: { ...settings.global, haptics: v } })} 
          />
          <button className="w-full py-8 mt-12 text-red-600 font-black uppercase tracking-[0.4em] text-[13px] bg-red-50/50 border border-red-100 rounded-[3rem] active:bg-red-100 transition-colors shadow-sm">Reset Settings</button>
        </Section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-12 bg-gradient-to-t from-white via-white/95 to-transparent pt-24">
        <button onClick={onBack} className="w-full max-w-xl mx-auto block bg-black text-white font-black py-8 rounded-full shadow-2xl uppercase tracking-[0.4em] text-[13px] active:scale-95 transition-all">Back to Menu</button>
      </footer>
    </div>
  );
};

export default SettingsScreen;


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
    <label className="flex flex-col p-6 bg-white rounded-[2.2rem] border border-zinc-100 shadow-sm active:scale-[0.99] transition-all cursor-pointer group">
      <div className="flex items-center justify-between w-full mb-1">
        <span className="text-[14px] font-black uppercase tracking-widest text-zinc-900">{label}</span>
        <div 
          onClick={(e) => { e.preventDefault(); onChange(!value); }}
          className={`w-14 h-7 rounded-full transition-colors relative ${value ? 'bg-black' : 'bg-zinc-200'}`}
        >
          <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${value ? 'translate-x-7' : ''}`}></div>
        </div>
      </div>
      <p className="text-[11px] text-zinc-400 font-medium leading-relaxed pr-12">{desc}</p>
    </label>
  );

  const Section = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="w-full space-y-4">
      <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.5em] px-6">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );

  return (
    <div className="h-full flex flex-col p-10 font-sans max-w-xl mx-auto bg-zinc-50/50">
      <header className="py-12 flex-shrink-0 border-b border-zinc-100 mb-8">
        <h1 className="text-7xl font-black tracking-tighter text-zinc-900 leading-none capitalize">{context}</h1>
        <p className="text-zinc-400 font-bold uppercase tracking-[0.4em] text-[10px] mt-4">CUSTOMIZE YOUR ZEN</p>
      </header>

      <main className="flex-grow space-y-12 overflow-y-auto no-scrollbar pb-36">
        {(context === 'global' || context === 'sudoku') && (
          <Section title="Sudoku Dynamics">
            <Toggle 
              label="Highlight Related" 
              desc="Visually emphasizes rows, columns, and 3x3 blocks that intersect your selected cell, helping you focus on possible numbers."
              value={settings.sudoku.highlightRelated} 
              onChange={(v) => onSettingsChange({ sudoku: { ...settings.sudoku, highlightRelated: v } })} 
            />
            <Toggle 
              label="Highlight Matching" 
              desc="Instantly dims other numbers to highlight all instances of the number currently selected, making pattern spotting easier."
              value={settings.sudoku.highlightSameValue} 
              onChange={(v) => onSettingsChange({ sudoku: { ...settings.sudoku, highlightSameValue: v } })} 
            />
            <Toggle 
              label="Live Error Check" 
              desc="Immediately flags incorrect placements with a subtle red tint. Turn off for a classic, unassisted mental challenge."
              value={settings.sudoku.errorFeedback === 'immediate'} 
              onChange={(v) => onSettingsChange({ sudoku: { ...settings.sudoku, errorFeedback: v ? 'immediate' : 'manual' } })} 
            />
          </Section>
        )}

        {(context === 'global' || context === 'wordle') && (
          <Section title="Wordle Rules">
            <Toggle 
              label="Hard Mode" 
              desc="Enforces strict guessing rules: any revealed hints (green or yellow letters) MUST be used in all following attempts."
              value={settings.wordle.hardMode} 
              onChange={(v) => onSettingsChange({ wordle: { ...settings.wordle, hardMode: v } })} 
            />
            <Toggle 
              label="High Contrast" 
              desc="Replaces standard feedback colors with high-visibility orange and blue tones for better accessibility and clarity."
              value={settings.wordle.highContrast} 
              onChange={(v) => onSettingsChange({ wordle: { ...settings.wordle, highContrast: v } })} 
            />
          </Section>
        )}

        {(context === 'global' || context === 'colordle') && (
          <Section title="Colordle Assistance">
            <Toggle 
              label="Semantic Hints" 
              desc="Enables AI-powered descriptions that evoke the 'feeling' of the target color through metaphors instead of RGB values."
              value={settings.colordle.allowHints} 
              onChange={(v) => onSettingsChange({ colordle: { ...settings.colordle, allowHints: v } })} 
            />
            <Toggle 
              label="Haptic Logic" 
              desc="Provides subtle physical vibration feedback on supported devices when your guess moves closer to the hidden hue."
              value={settings.colordle.vibrationFeedback} 
              onChange={(v) => onSettingsChange({ colordle: { ...settings.colordle, vibrationFeedback: v } })} 
            />
          </Section>
        )}

        {(context === 'global' || context === 'geodle') && (
          <Section title="Geodle Navigation">
            <Toggle 
              label="Metric Units" 
              desc="Display distances in Kilometers (KM). When off, standard nautical miles are used for a more classic navigational feel."
              value={settings.geodle.metricUnits} 
              onChange={(v) => onSettingsChange({ geodle: { ...settings.geodle, metricUnits: v } })} 
            />
            <Toggle 
              label="Show Coordinates" 
              desc="Reveals exact latitude and longitude of guessed centroids. Adds a layer of complexity for advanced geography enthusiasts."
              value={settings.geodle.showCoordinates} 
              onChange={(v) => onSettingsChange({ geodle: { ...settings.geodle, showCoordinates: v } })} 
            />
          </Section>
        )}

        <Section title="System">
          <Toggle 
            label="UI Animations" 
            desc="Toggles fluid motion transitions and game logic animations. Disabling can slightly improve performance on older devices."
            value={settings.global.animations} 
            onChange={(v) => onSettingsChange({ global: { ...settings.global, animations: v } })} 
          />
          <button className="w-full py-6 text-red-500 font-bold uppercase tracking-widest text-[11px] bg-red-50/50 border border-red-100 rounded-[2.5rem] active:bg-red-100 transition-colors">Wipe History & Stats</button>
        </Section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-white via-white/80 to-transparent pt-16">
        <button onClick={onBack} className="w-full max-w-xl mx-auto block bg-black text-white font-black py-7 rounded-[2.5rem] shadow-2xl uppercase tracking-[0.4em] text-[11px] active:scale-95 transition-all">Save & Exit</button>
      </footer>
    </div>
  );
};

export default SettingsScreen;

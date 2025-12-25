
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Difficulty, BoardState, Grid, Move, CompletedGame, InProgressGame, WordleStatus,
  ColordleMove, WordleMove, WordleInputMove, GeodleMove, GameSettings
} from './types.ts';
import { GoogleGenAI } from "@google/genai";
import { generateSudoku } from './services/sudokuService.ts';
import { generateWordleWord, getWordFeedback, isValidWord } from './services/wordleService.ts';
import { getRandomNicheColor, getSemanticCloseness, getColorHint } from './services/colorService.ts';
import { getRandomCountry, validateAndGetLocation, getGeoHint } from './services/geoService.ts';
import { formatTime } from './utils/time.ts';
import Board from './components/Board.tsx';
import StaticNumberPad from './components/StaticNumberPad.tsx';
import WordleBoard from './components/WordleBoard.tsx';
import WordleKeyboard from './components/WordleKeyboard.tsx';
import ColordleBoard from './components/ColordleBoard.tsx';
import ColordleInput from './components/ColordleInput.tsx';
import GeodleBoard from './components/GeodleBoard.tsx';
import GeodleInput from './components/GeodleInput.tsx';
import DifficultySelector from './components/DifficultySelector.tsx';
import PauseMenu from './components/PauseMenu.tsx';
import HistoryScreen from './components/HistoryScreen.tsx';
import SettingsScreen from './components/SettingsScreen.tsx';
import StatisticsModal from './components/StatisticsModal.tsx';
import { ClockIcon, PauseIcon, ChevronLeftIcon, SettingsIcon } from './components/icons.tsx';

type View = 'hub' | 'sudoku-menu' | 'wordle-menu' | 'colordle-menu' | 'geodle-menu' | 'sudoku-game' | 'wordle-game' | 'colordle-game' | 'geodle-game' | 'history' | 'settings';

const MAX_WORDLE_GUESSES = 6;

const DEFAULT_SETTINGS: GameSettings = {
  sudoku: { highlightRelated: true, highlightSameValue: true, errorFeedback: 'immediate' },
  wordle: { hardMode: false, highContrast: false },
  colordle: { allowHints: true, vibrationFeedback: true },
  geodle: { metricUnits: true, showCoordinates: false },
  global: { animations: true, sounds: true }
};

const App: React.FC = () => {
  const [view, setView] = useState<View>('hub');
  const [activeGameType, setActiveGameType] = useState<'sudoku' | 'wordle' | 'colordle' | 'geodle' | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  
  // Sudoku State
  const [boardState, setBoardState] = useState<BoardState | null>(null);
  const [undoStack, setUndoStack] = useState<BoardState[]>([]);
  const [redoStack, setRedoStack] = useState<BoardState[]>([]);
  const [initialPuzzle, setInitialPuzzle] = useState<Grid | null>(null);
  const [solution, setSolution] = useState<Grid | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [highlightedValue, setHighlightedValue] = useState<number | null>(null);
  
  // Wordle State
  const [targetWord, setTargetWord] = useState<string>('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [wordleResults, setWordleResults] = useState<WordleStatus[][]>([]);
  const [keyStatus, setKeyStatus] = useState<Record<string, WordleStatus>>({});
  const [isWordleValidating, setIsWordleValidating] = useState(false);
  const [wordleShakeTrigger, setWordleShakeTrigger] = useState(0);
  const [wordExplanation, setWordExplanation] = useState<string>('');
  
  // Colordle State
  const [targetColor, setTargetColor] = useState<string>('');
  const [targetColorName, setTargetColorName] = useState<string>('');
  const [colordleGuesses, setColordleGuesses] = useState<ColordleMove[]>([]);
  const [colordleHint, setColordleHint] = useState<string | null>(null);
  const [isColorLoading, setIsColorLoading] = useState(false);

  // Geodle State
  const [targetCountry, setTargetCountry] = useState<string>('');
  const [geodleGuesses, setGeodleGuesses] = useState<GeodleMove[]>([]);
  const [geodleHint, setGeodleHint] = useState<string | null>(null);
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [isGeoHintLoading, setIsGeoHintLoading] = useState(false);
  
  // Global Session State
  const [isWon, setIsWon] = useState(false);
  const [isLost, setIsLost] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  
  const [selectedHistoryGame, setSelectedHistoryGame] = useState<CompletedGame | InProgressGame | null>(null);

  // Persistence Load
  useEffect(() => {
    try {
      const saved = localStorage.getItem('zen_settings');
      if (saved) setSettings(JSON.parse(saved));
    } catch (e) {}
  }, []);

  const handleGameOver = useCallback((won: boolean, finalMoves: Move[], explanation?: string) => {
    if (explanation) setWordExplanation(explanation);
    setIsWon(won);
    setIsLost(!won);
    
    const gameId = `${activeGameType}-${difficulty}-${startTime}`;
    const finished: CompletedGame = { 
      id: gameId, 
      gameType: activeGameType!, 
      difficulty: difficulty!, 
      startTime: startTime!, 
      endTime: Date.now(), 
      puzzle: activeGameType === 'sudoku' ? initialPuzzle! : (activeGameType === 'wordle' ? targetWord : (activeGameType === 'colordle' ? targetColor : targetCountry)), 
      solution: activeGameType === 'sudoku' ? solution! : (activeGameType === 'wordle' ? targetWord : (activeGameType === 'colordle' ? targetColor : targetCountry)), 
      moves: finalMoves,
      explanation: explanation
    };

    try {
      const hist = JSON.parse(localStorage.getItem(`zen_${activeGameType}_history`) || '[]');
      localStorage.setItem(`zen_${activeGameType}_history`, JSON.stringify([...hist, finished]));
    } catch (e) {}
  }, [activeGameType, difficulty, startTime, initialPuzzle, targetWord, targetColor, targetCountry, solution]);

  const fetchWordExplanation = async (word: string) => {
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === 'undefined') return "";
    const ai = new GoogleGenAI({ apiKey });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Simple definition for "${word}". One short sentence.`,
      });
      return response.text?.trim() || "";
    } catch (e) { return ""; }
  };

  // --- SUDOKU HANDLERS ---
  const handleSudokuInput = useCallback((num: number) => {
    if (!selectedCell || !boardState || !solution || isPaused || isWon || isLost) return;
    const { row, col } = selectedCell;
    if (boardState[row][col].readonly) return;
    setUndoStack(prev => [...prev, boardState.map(r => r.map(c => ({ ...c })))]);
    setRedoStack([]);
    const newBoard = boardState.map(r => r.map(c => ({ ...c })));
    newBoard[row][col].value = num;
    if (settings.sudoku.errorFeedback === 'immediate') newBoard[row][col].isError = solution[row][col] !== num;
    setBoardState(newBoard);
    setHighlightedValue(num);
    const newMove: Move = { type: 'cell', row, col, value: num, timestamp: Date.now() };
    const nextHistory = [...moveHistory, newMove];
    setMoveHistory(nextHistory);
    
    if (newBoard.every((r, ri) => r.every((c, ci) => c.value === solution[ri][ci]))) {
      setTimeout(() => handleGameOver(true, nextHistory), 600);
    }
  }, [selectedCell, boardState, solution, isPaused, isWon, isLost, settings.sudoku.errorFeedback, handleGameOver, moveHistory]);

  const handleSudokuErase = useCallback(() => {
    if (!selectedCell || !boardState || isPaused || isWon || isLost) return;
    const { row, col } = selectedCell;
    if (boardState[row][col].readonly) return;
    setUndoStack(prev => [...prev, boardState.map(r => r.map(c => ({ ...c })))]);
    const newBoard = boardState.map(r => r.map(c => ({ ...c })));
    newBoard[row][col].value = 0;
    setBoardState(newBoard);
    setMoveHistory(prev => [...prev, { type: 'cell', row, col, value: 0, timestamp: Date.now() }]);
  }, [selectedCell, boardState, isPaused, isWon, isLost]);

  // --- WORDLE HANDLERS ---
  const handleWordleSubmit = useCallback(async () => {
    if (currentGuess.length !== 5 || isPaused || isWon || isLost || isWordleValidating) return;
    setIsWordleValidating(true);
    const wordToValidate = currentGuess.toUpperCase();
    
    try {
      const valid = await isValidWord(wordToValidate);
      if (!valid) { 
        setIsWordleValidating(false);
        setWordleShakeTrigger(p => p + 1); 
        return; 
      }
      const feedback = getWordFeedback(wordToValidate, targetWord);
      const newResults = [...wordleResults, feedback];
      const newGuesses = [...guesses, wordToValidate];
      setCurrentGuess(''); 
      setWordleResults(newResults);
      setGuesses(newGuesses);
      const newKeys = { ...keyStatus };
      feedback.forEach((s, idx) => {
        const char = wordToValidate[idx];
        if (s === 'correct' || (s === 'present' && newKeys[char] !== 'correct')) newKeys[char] = s;
        else if (!newKeys[char]) newKeys[char] = s;
      });
      setKeyStatus(newKeys);
      const newMove: WordleMove = { type: 'wordle-guess', word: wordToValidate, timestamp: Date.now() };
      const nextHistory = [...moveHistory, newMove];
      setMoveHistory(nextHistory);
      const win = wordToValidate === targetWord;
      const loss = !win && newGuesses.length >= MAX_WORDLE_GUESSES;
      if (win || loss) {
        const explanation = await fetchWordExplanation(targetWord);
        setIsWordleValidating(false);
        setTimeout(() => handleGameOver(win, nextHistory, explanation), 800);
      } else {
        setIsWordleValidating(false);
      }
    } catch (err) { setIsWordleValidating(false); }
  }, [currentGuess, targetWord, wordleResults, guesses, isPaused, isWon, isLost, keyStatus, moveHistory, handleGameOver, isWordleValidating]);

  // --- COLORDLE HANDLERS ---
  const handleColordleSubmit = useCallback(async (name: string) => {
    if (!name.trim() || isColorLoading || isPaused || isWon || isLost) return;
    setIsColorLoading(true);
    try {
      const r = await getSemanticCloseness(name, targetColorName);
      setIsColorLoading(false);
      if (!r.isValid) return;
      const move: ColordleMove = { type: 'color-guess', guessName: name, guessHex: r.hex, percentage: r.percentage, timestamp: Date.now() };
      setColordleGuesses(p => [...p, move]);
      setMoveHistory(p => [...p, move]);
      if (r.percentage >= 99.5) handleGameOver(true, [...moveHistory, move]);
    } catch (e) { setIsColorLoading(false); }
  }, [targetColorName, isColorLoading, isPaused, isWon, isLost, moveHistory, handleGameOver]);

  // --- GEODLE HANDLERS ---
  const handleGeodleSubmit = useCallback(async (name: string) => {
    if (!name.trim() || isGeoLoading || isPaused || isWon || isLost) return;
    setIsGeoLoading(true);
    try {
      const r = await validateAndGetLocation(name, targetCountry);
      setIsGeoLoading(false);
      if (!r.isValid) return;
      const move: GeodleMove = { type: 'geo-guess', guessName: r.canonicalName, distance: r.distance, direction: r.direction, percentage: r.percentage, timestamp: Date.now(), lat: r.lat, lng: r.lng };
      setGeodleGuesses(p => [...p, move]);
      setMoveHistory(p => [...p, move]);
      if (r.percentage >= 99.5) handleGameOver(true, [...moveHistory, move]);
    } catch (e) { setIsGeoLoading(false); }
  }, [targetCountry, isGeoLoading, isPaused, isWon, isLost, moveHistory, handleGameOver]);

  // Global Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedHistoryGame) { 
          setSelectedHistoryGame(null); 
          return; 
        }
        if (view.includes('-game')) {
          if (isWon || isLost) {
            setView('hub');
            setIsPaused(false);
            setActiveGameType(null);
            return;
          }
          // Correct toggle behavior for Escape key
          setIsPaused(prev => !prev);
          return;
        }
        if (view !== 'hub') {
          setView('hub');
          setIsPaused(false);
          setActiveGameType(null);
          return;
        }
      }

      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        if (e.key === 'Enter') {
          const val = (document.activeElement as HTMLInputElement).value;
          if (view === 'colordle-game') handleColordleSubmit(val);
          if (view === 'geodle-game') handleGeodleSubmit(val);
        }
        return;
      }

      if (isPaused || isWon || isLost || isWordleValidating) return;
      if (view === 'sudoku-game') {
        if (e.key >= '1' && e.key <= '9') handleSudokuInput(parseInt(e.key));
        if (e.key === 'Backspace') handleSudokuErase();
      } else if (view === 'wordle-game') {
        if (/^[a-zA-Z]$/.test(e.key) && currentGuess.length < 5) {
          const next = currentGuess + e.key.toUpperCase();
          setCurrentGuess(next);
          setMoveHistory(prev => [...prev, { type: 'wordle-input', text: next, timestamp: Date.now() }]);
        }
        if (e.key === 'Backspace') {
          const next = currentGuess.slice(0, -1);
          setCurrentGuess(next);
          setMoveHistory(prev => [...prev, { type: 'wordle-input', text: next, timestamp: Date.now() }]);
        }
        if (e.key === 'Enter') handleWordleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, isPaused, isWon, isLost, isWordleValidating, currentGuess, handleSudokuInput, handleSudokuErase, handleWordleSubmit, handleColordleSubmit, handleGeodleSubmit, activeGameType, selectedHistoryGame]);

  useEffect(() => {
    let interval: number | undefined;
    if (view.includes('-game') && !isWon && !isLost && !isPaused) {
      interval = window.setInterval(() => { setElapsedTime(prev => prev + 1); }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [view, isWon, isLost, isPaused]);

  const resetGameState = (targetView: View) => {
    setIsWon(false); setIsLost(false); setIsPaused(false); setElapsedTime(0); setStartTime(Date.now());
    setMoveHistory([]); setView(targetView); setCurrentGuess(''); setKeyStatus({}); setWordleResults([]); 
    setGuesses([]); setWordExplanation(''); setIsWordleValidating(false); setSelectedCell(null);
    setColordleGuesses([]); setColordleHint(null); setGeodleGuesses([]); setGeodleHint(null);
  };

  const startSudoku = (l: Difficulty) => { 
    const { puzzle, solution } = generateSudoku(l); 
    setDifficulty(l); setActiveGameType('sudoku'); setInitialPuzzle(puzzle); setSolution(solution); 
    setBoardState(puzzle.map(r => r.map(v => ({ value: v, readonly: v !== 0 })))); resetGameState('sudoku-game'); 
  };
  const startWordle = (l: Difficulty) => { setDifficulty(l); setActiveGameType('wordle'); setTargetWord(generateWordleWord(l)); resetGameState('wordle-game'); };
  const startColordle = (l: Difficulty) => { const c = getRandomNicheColor(l); setDifficulty(l); setActiveGameType('colordle'); setTargetColor(c.hex); setTargetColorName(c.name); resetGameState('colordle-game'); };
  const startGeodle = (l: Difficulty) => { const c = getRandomCountry(l); setDifficulty(l); setActiveGameType('geodle'); setTargetCountry(c); resetGameState('geodle-game'); };

  return (
    <div className="app-container relative bg-zinc-100 overflow-hidden font-sans">
      <div className="absolute inset-0 z-0 bg-white flex flex-col items-center justify-center p-8 transition-opacity" style={{ opacity: view === 'hub' ? 1 : 0.4 }}>
        <h1 className="text-[min(15vw,100px)] font-black tracking-tighter text-black leading-none mb-12 animate-fade-in">ZEN</h1>
        <div className="w-full max-w-xs space-y-4">
          <button onClick={() => { setActiveGameType('sudoku'); setView('sudoku-menu'); }} className="w-full py-6 bg-black text-white rounded-full font-black uppercase tracking-[0.2em] text-[13px] shadow-xl active:scale-95 transition-all">SUDOKU</button>
          <button onClick={() => { setActiveGameType('wordle'); setView('wordle-menu'); }} className="w-full py-6 bg-white text-black rounded-full font-black uppercase tracking-[0.2em] text-[13px] border-2 border-black active:scale-95 transition-all">WORDLE</button>
          <button onClick={() => { setActiveGameType('colordle'); setView('colordle-menu'); }} className="w-full py-6 bg-black text-white rounded-full font-black uppercase tracking-[0.2em] text-[13px] shadow-xl active:scale-95 transition-all">COLORDLE</button>
          <button onClick={() => { setActiveGameType('geodle'); setView('geodle-menu'); }} className="w-full py-6 bg-white text-black rounded-full font-black uppercase tracking-[0.2em] text-[13px] border-2 border-black active:scale-95 transition-all">GEODLE</button>
        </div>
        <div className="mt-12 flex gap-8">
          <button onClick={() => { setActiveGameType(null); setView('history'); }} className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 bg-zinc-50 rounded-full flex items-center justify-center border border-zinc-200 group-active:scale-90 transition-transform"><ClockIcon /></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">History</span>
          </button>
          <button onClick={() => { setActiveGameType(null); setView('settings'); }} className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 bg-zinc-50 rounded-full flex items-center justify-center border border-zinc-200 group-active:scale-90 transition-transform"><SettingsIcon className="w-6 h-6 text-zinc-400" /></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Settings</span>
          </button>
        </div>
      </div>

      {view !== 'hub' && (
        <div className="absolute inset-0 bg-white shadow-[0_-20px_60px_rgba(0,0,0,0.15)] rounded-t-[3.5rem] border-t border-zinc-200 z-50 overflow-y-auto no-scrollbar animate-fade-in">
          {view.includes('-menu') && (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
              <h2 className="text-7xl font-black tracking-tighter mb-4 uppercase text-black">{activeGameType}</h2>
              <DifficultySelector onSelectDifficulty={activeGameType === 'sudoku' ? startSudoku : activeGameType === 'wordle' ? startWordle : activeGameType === 'colordle' ? startColordle : startGeodle} />
              
              <div className="flex gap-4 mt-12 w-full max-w-xs">
                <button onClick={() => setView('history')} className="flex-1 py-5 bg-zinc-100 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 active:scale-95 transition-all">History</button>
                <button onClick={() => setView('settings')} className="flex-1 py-5 bg-zinc-100 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 active:scale-95 transition-all">Settings</button>
              </div>
              <button onClick={() => setView('hub')} className="mt-6 py-6 w-full max-w-xs bg-black text-white rounded-full text-[10px] font-black uppercase tracking-[0.4em] shadow-xl active:scale-95 transition-all">Back to Menu</button>
            </div>
          )}

          {view === 'history' && (
            <HistoryScreen 
              category={activeGameType || 'sudoku'} 
              setCategory={(c) => setActiveGameType(c)} 
              onBack={() => setView('hub')} 
              onOpenStats={(g) => setSelectedHistoryGame(g)}
            />
          )}

          {view === 'settings' && (
            <SettingsScreen 
              context={activeGameType || 'global'} 
              settings={settings} 
              onSettingsChange={(s) => setSettings(prev => ({ ...prev, ...s }))} 
              onBack={() => setView('hub')}
            />
          )}

          {view.includes('-game') && (
            <div className="h-full flex flex-col">
              <header className="px-5 py-4 sm:px-8 sm:py-6 mt-2 flex items-center justify-between flex-shrink-0 z-[70]">
                <button onClick={() => setView('hub')} className="p-2 sm:p-3 bg-zinc-50 rounded-full border border-zinc-100 active:scale-90 transition-transform"><ChevronLeftIcon className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-400" /></button>
                <div className="flex flex-col items-center">
                  <span className="text-[8px] sm:text-[9px] uppercase font-black tracking-[0.4em] text-zinc-400 mb-0.5">{difficulty} • {activeGameType}</span>
                  <div className="flex items-center space-x-1 text-black"><ClockIcon className="w-3 sm:w-3.5 h-3 sm:h-3.5" /><span className="text-lg sm:text-xl tabular-nums font-black tracking-tighter">{formatTime(elapsedTime)}</span></div>
                </div>
                <button onClick={() => setIsPaused(p => !p)} className="p-2 sm:p-3 bg-zinc-50 rounded-full border border-zinc-100 active:scale-90 transition-transform"><PauseIcon className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-900" /></button>
              </header>

              <main className="flex-grow flex flex-col items-center justify-center px-4 relative pb-40 sm:pb-48">
                {view === 'sudoku-game' && boardState && <Board boardState={boardState} selectedCell={selectedCell} onCellSelect={(r, c) => setSelectedCell({row: r, col: c})} highlightedValue={highlightedValue} />}
                {view === 'wordle-game' && <div className={wordleShakeTrigger > 0 ? 'animate-shake' : ''}><WordleBoard guesses={guesses} results={wordleResults} currentGuess={currentGuess} wordLength={5} maxGuesses={MAX_WORDLE_GUESSES} /></div>}
                {view === 'colordle-game' && <div className="w-full flex flex-col items-center gap-6 sm:gap-10"><div className="w-32 h-32 sm:w-48 sm:h-48 rounded-[2.5rem] sm:rounded-[3.5rem] bg-zinc-100 flex items-center justify-center text-4xl font-black text-zinc-300 border-[6px] sm:border-[8px] border-zinc-50 shadow-inner">?</div><ColordleBoard guesses={colordleGuesses} /></div>}
                {view === 'geodle-game' && <div className="w-full flex flex-col items-center gap-6 sm:gap-10"><div className="w-32 h-32 sm:w-48 sm:h-48 rounded-[2.5rem] sm:rounded-[3.5rem] bg-zinc-100 flex items-center justify-center text-4xl font-black text-zinc-300 border-[6px] sm:border-[8px] border-zinc-50 shadow-inner"><svg className="w-12 h-12 sm:w-16 sm:h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg></div><GeodleBoard guesses={geodleGuesses} /></div>}
              </main>

              {view === 'sudoku-game' && <footer className="fixed bottom-0 left-0 right-0 px-4 pb-8 sm:pb-10 bg-white border-t border-zinc-100 pt-3 sm:pt-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]"><StaticNumberPad onNumberSelect={handleSudokuInput} onErase={handleSudokuErase} show={!!selectedCell} /></footer>}
              {view === 'wordle-game' && <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-white border-t border-zinc-100 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]"><WordleKeyboard onKey={k => {
                const next = currentGuess + k;
                setCurrentGuess(next);
                setMoveHistory(prev => [...prev, { type: 'wordle-input', text: next, timestamp: Date.now() }]);
              }} onDelete={() => {
                const next = currentGuess.slice(0, -1);
                setCurrentGuess(next);
                setMoveHistory(prev => [...prev, { type: 'wordle-input', text: next, timestamp: Date.now() }]);
              }} onEnter={handleWordleSubmit} keyStatus={keyStatus} validating={isWordleValidating} /></div>}
              {view === 'colordle-game' && <div className="fixed bottom-0 left-0 right-0 z-[65]"><ColordleInput onGuess={handleColordleSubmit} onGetHint={async () => { const h = await getColorHint(targetColorName); setColordleHint(h); }} isLoading={isColorLoading} isHintLoading={false} currentHint={colordleHint} /></div>}
              {view === 'geodle-game' && <div className="fixed bottom-0 left-0 right-0 z-[65]"><GeodleInput onGuess={handleGeodleSubmit} onGetHint={async () => { setIsGeoHintLoading(true); const h = await getGeoHint(targetCountry); setIsGeoHintLoading(false); setGeodleHint(h); }} isLoading={isGeoLoading} isHintLoading={isGeoHintLoading} currentHint={geodleHint} /></div>}

              {isPaused && (
                <PauseMenu 
                  onResume={() => setIsPaused(false)} 
                  onExit={() => { 
                    setIsPaused(false); 
                    setView(`${activeGameType}-menu` as View); 
                  }} 
                  onRestart={() => { 
                    setIsPaused(false); 
                    resetGameState(`${activeGameType}-game` as View); 
                    if (activeGameType === 'sudoku') startSudoku(difficulty!); 
                    else if (activeGameType === 'wordle') startWordle(difficulty!); 
                    else if (activeGameType === 'colordle') startColordle(difficulty!); 
                    else startGeodle(difficulty!); 
                  }} 
                  gameType={activeGameType!} 
                />
              )}

              {(isWon || isLost) && (
                <div className="fixed inset-0 z-[120] bg-white/98 backdrop-blur-3xl flex items-center justify-center p-8 animate-pop-in">
                  <div className="text-center w-full max-sm:max-w-xs">
                    <h2 className="text-6xl sm:text-7xl font-black mb-4 uppercase tracking-tighter">{isWon ? 'SOLVED' : 'FAILED'}</h2>
                    <div className="bg-zinc-50 rounded-[2.5rem] sm:rounded-[3.5rem] p-8 sm:p-10 border border-zinc-100 mb-8 sm:mb-10">
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Target</p>
                      <p className="text-2xl sm:text-3xl font-black uppercase tracking-tight truncate px-4">{activeGameType === 'sudoku' ? 'GRID' : (activeGameType === 'wordle' ? targetWord : (activeGameType === 'colordle' ? targetColorName : targetCountry))}</p>
                      {wordExplanation && <p className="mt-3 text-[12px] sm:text-[13px] font-medium text-zinc-600 leading-tight italic">"{wordExplanation}"</p>}
                      <div className="mt-6 pt-6 border-t border-zinc-200 grid grid-cols-2 gap-4">
                        <div><p className="text-[8px] font-bold text-zinc-400 uppercase">Time</p><p className="text-xl sm:text-2xl font-black tabular-nums">{formatTime(elapsedTime)}</p></div>
                        <div><p className="text-[8px] font-bold text-zinc-400 uppercase">Status</p><p className={`text-xl sm:text-2xl font-black ${isWon ? 'text-emerald-500' : 'text-red-500'}`}>{isWon ? 'WIN' : 'LOSS'}</p></div>
                      </div>
                    </div>
                    <button onClick={() => setView('hub')} className="w-full bg-black text-white py-6 rounded-full font-black uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all text-[10px]">Back to Menu</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {selectedHistoryGame && (
        <StatisticsModal 
          game={selectedHistoryGame} 
          onClose={() => setSelectedHistoryGame(null)} 
        />
      )}
    </div>
  );
};

export default App;

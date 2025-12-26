
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Difficulty, BoardState, Grid, Move, CompletedGame, InProgressGame, WordleStatus,
  ColordleMove, WordleMove, GeodleMove, GameSettings
} from './types.ts';
import { GoogleGenAI } from "@google/genai";
import { generateSudoku } from './services/sudokuService.ts';
import { generateDynamicWord, getWordFeedback, isValidWord } from './services/wordleService.ts';
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
import StatisticsModal from './components/StatisticsModal.tsx';
import SettingsScreen from './components/SettingsScreen.tsx';
import { ClockIcon, PauseIcon, ChevronLeftIcon, SettingsIcon, SparkleIcon } from './components/icons.tsx';

type View = 'hub' | 'sudoku-menu' | 'wordle-menu' | 'colordle-menu' | 'geodle-menu' | 'sudoku-game' | 'wordle-game' | 'colordle-game' | 'geodle-game' | 'history' | 'settings';

const MAX_WORDLE_GUESSES = 6;

const DEFAULT_SETTINGS: GameSettings = {
  sudoku: { 
    highlightRelated: true, 
    highlightSameValue: true, 
    highlightMistakes: true,
    showHints: true,
    timerVisible: true
  },
  wordle: { 
    hardMode: false, 
    highContrast: false,
    showKeyboardFeedback: true
  },
  colordle: { 
    allowHints: true, 
    vibrationFeedback: true,
    showHexCodes: false
  },
  geodle: { 
    metricUnits: true, 
    showCoordinates: false,
    autoRotateGlobe: true
  },
  global: { 
    animations: true, 
    sounds: true,
    haptics: true
  }
};

const App: React.FC = () => {
  const [view, setView] = useState<View>('hub');
  const [activeGameType, setActiveGameType] = useState<'sudoku' | 'wordle' | 'colordle' | 'geodle' | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  
  const [boardState, setBoardState] = useState<BoardState | null>(null);
  const [sudokuHistory, setSudokuHistory] = useState<BoardState[]>([]);
  const [sudokuRedoStack, setSudokuRedoStack] = useState<BoardState[]>([]);
  const [initialPuzzle, setInitialPuzzle] = useState<Grid | null>(null);
  const [solution, setSolution] = useState<Grid | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [highlightedValue, setHighlightedValue] = useState<number | null>(null);
  
  const [targetWord, setTargetWord] = useState<string>('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [wordleResults, setWordleResults] = useState<WordleStatus[][]>([]);
  const [keyStatus, setKeyStatus] = useState<Record<string, WordleStatus>>({});
  const [isWordleValidating, setIsWordleValidating] = useState(false);
  const [isWordleLoading, setIsWordleLoading] = useState(false);
  const [wordleShakeTrigger, setWordleShakeTrigger] = useState(0);
  
  const [targetColor, setTargetColor] = useState<string>('');
  const [targetColorName, setTargetColorName] = useState<string>('');
  const [colordleGuesses, setColordleGuesses] = useState<ColordleMove[]>([]);
  const [colordleHint, setColordleHint] = useState<string | null>(null);
  const [isColorLoading, setIsColorLoading] = useState(false);
  const [isColorHintLoading, setIsColorHintLoading] = useState(false);

  const [targetCountry, setTargetCountry] = useState<string>('');
  const [geodleGuesses, setGeodleGuesses] = useState<GeodleMove[]>([]);
  const [geodleHint, setGeodleHint] = useState<string | null>(null);
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [isGeoHintLoading, setIsGeoHintLoading] = useState(false);
  
  const [isWon, setIsWon] = useState(false);
  const [isLost, setIsLost] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  
  const [selectedHistoryGame, setSelectedHistoryGame] = useState<CompletedGame | InProgressGame | null>(null);

  const [swipeY, setSwipeY] = useState(0);
  const touchStartY = useRef<number | null>(null);
  const isSwiping = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem('zen_settings');
    if (saved) { try { setSettings(JSON.parse(saved)); } catch (e) {} }
  }, []);

  const handleSettingsChange = (newSettings: Partial<GameSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('zen_settings', JSON.stringify(updated));
  };

  const handleGameOver = useCallback((won: boolean, finalMoves: Move[], explanation?: string) => {
    setIsWon(won);
    setIsLost(!won);
    const finished: CompletedGame = { 
      id: `${activeGameType}-${difficulty}-${startTime}`, 
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
      localStorage.removeItem(`zen_${activeGameType}_progress`);
    } catch (e) {}
  }, [activeGameType, difficulty, startTime, initialPuzzle, targetWord, targetColor, targetCountry, solution]);

  const handleSudokuInput = useCallback((num: number) => {
    if (!selectedCell || !boardState || !solution || isPaused || isWon || isLost) return;
    const { row, col } = selectedCell;
    if (boardState[row][col].readonly) return;
    
    setSudokuHistory(prev => [...prev, boardState.map(r => r.map(c => ({ ...c })))]);
    setSudokuRedoStack([]);

    const newBoard = boardState.map(r => r.map(c => ({ ...c })));
    newBoard[row][col].value = num;
    newBoard[row][col].isError = settings.sudoku.highlightMistakes && solution[row][col] !== num;
    setBoardState(newBoard);
    setHighlightedValue(num);
    
    setSelectedCell(null);

    const nextHistory = [...moveHistory, { type: 'cell', row, col, value: num, timestamp: Date.now() } as Move];
    setMoveHistory(nextHistory);
    
    if (newBoard.every((r, ri) => r.every((c, ci) => c.value === solution[ri][ci]))) {
      setTimeout(() => handleGameOver(true, nextHistory), 600);
    }
  }, [selectedCell, boardState, solution, isPaused, isWon, isLost, handleGameOver, moveHistory, settings.sudoku.highlightMistakes]);

  const handleSudokuUndo = useCallback(() => {
    if (sudokuHistory.length === 0 || !boardState) return;
    const previous = sudokuHistory[sudokuHistory.length - 1];
    setSudokuRedoStack(prev => [...prev, boardState.map(r => r.map(c => ({ ...c })))]);
    setSudokuHistory(prev => prev.slice(0, -1));
    setBoardState(previous);
    setSelectedCell(null);
  }, [sudokuHistory, boardState]);

  const handleSudokuRedo = useCallback(() => {
    if (sudokuRedoStack.length === 0 || !boardState) return;
    const next = sudokuRedoStack[sudokuRedoStack.length - 1];
    setSudokuHistory(prev => [...prev, boardState.map(r => r.map(c => ({ ...c })))]);
    setSudokuRedoStack(prev => prev.slice(0, -1));
    setBoardState(next);
    setSelectedCell(null);
  }, [sudokuRedoStack, boardState]);

  const handleSudokuReset = useCallback(() => {
    if (!initialPuzzle) return;
    setSudokuHistory([]);
    setSudokuRedoStack([]);
    setBoardState(initialPuzzle.map(r => r.map(v => ({ value: v, readonly: v !== 0 }))));
    setSelectedCell(null);
  }, [initialPuzzle]);

  const handleWordleSubmit = useCallback(async () => {
    if (currentGuess.length !== 5 || isPaused || isWon || isLost || isWordleValidating) return;
    setIsWordleValidating(true);
    const wordToValidate = currentGuess.toUpperCase();
    try {
      const valid = await isValidWord(wordToValidate);
      if (!valid) { 
        setIsWordleValidating(false);
        setWordleShakeTrigger(p => p + 1); 
        setTimeout(() => setWordleShakeTrigger(0), 500);
        return; 
      }
      const feedback = getWordFeedback(wordToValidate, targetWord);
      const newGuesses = [...guesses, wordToValidate];
      setGuesses(newGuesses);
      setWordleResults(prev => [...prev, feedback]);
      setCurrentGuess(''); 
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
      if (win || newGuesses.length >= MAX_WORDLE_GUESSES) {
        setIsWordleValidating(false);
        setTimeout(() => handleGameOver(win, nextHistory), 800);
      } else {
        setIsWordleValidating(false);
      }
    } catch (err) { setIsWordleValidating(false); }
  }, [currentGuess, targetWord, guesses, isPaused, isWon, isLost, keyStatus, moveHistory, handleGameOver, isWordleValidating]);

  const handleColordleSubmit = useCallback(async (guess: string) => {
    if (!guess || isPaused || isWon || isLost || isColorLoading) return;
    setIsColorLoading(true);
    try {
      const result = await getSemanticCloseness(guess, targetColorName);
      const newMove: ColordleMove = {
        type: 'color-guess', guessName: result.correctedName || guess, guessHex: result.hex,
        percentage: result.percentage, timestamp: Date.now()
      };
      const nextGuesses = [...colordleGuesses, newMove];
      setColordleGuesses(nextGuesses);
      const nextHistory = [...moveHistory, newMove];
      setMoveHistory(nextHistory);
      setCurrentGuess('');
      if (result.percentage >= 98) setTimeout(() => handleGameOver(true, nextHistory), 600);
    } finally { setIsColorLoading(false); }
  }, [isPaused, isWon, isLost, isColorLoading, targetColorName, colordleGuesses, moveHistory, handleGameOver]);

  const handleGeodleSubmit = useCallback(async (guess: string) => {
    if (!guess || isPaused || isWon || isLost || isGeoLoading) return;
    setIsGeoLoading(true);
    try {
      const result = await validateAndGetLocation(guess, targetCountry);
      if (!result.isValid) { setIsGeoLoading(false); return; }
      const newMove: GeodleMove = {
        type: 'geo-guess', guessName: result.canonicalName, distance: result.distance,
        direction: result.direction, percentage: result.percentage,
        timestamp: Date.now(), lat: result.lat, lng: result.lng
      };
      const nextGuesses = [...geodleGuesses, newMove];
      setGeodleGuesses(nextGuesses);
      const nextHistory = [...moveHistory, newMove];
      setMoveHistory(nextHistory);
      setCurrentGuess('');
      if (result.percentage >= 99.5) setTimeout(() => handleGameOver(true, nextHistory), 600);
    } finally { setIsGeoLoading(false); }
  }, [isPaused, isWon, isLost, isGeoLoading, targetCountry, geodleGuesses, moveHistory, handleGameOver]);

  const handleBack = useCallback(() => {
    if (selectedHistoryGame) {
      setSelectedHistoryGame(null);
      return;
    }
    if (isPaused) {
      setIsPaused(false);
      return;
    }
    if (view === 'hub') return;
    if (view === 'history' || view === 'settings') {
      if (activeGameType) setView(`${activeGameType}-menu` as View);
      else setView('hub');
      return;
    }
    if (view.includes('-game')) {
      setIsPaused(true);
      return;
    }
    if (view.includes('-menu')) {
      setView('hub');
      setActiveGameType(null);
      return;
    }
  }, [view, isPaused, activeGameType, selectedHistoryGame]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (view === 'hub' || isPaused || isWon || isLost) return;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;
    if (deltaY > 0) {
      setSwipeY(deltaY);
      isSwiping.current = true;
    }
  };

  const handleTouchEnd = () => {
    if (swipeY > 180) {
      handleBack();
    }
    setSwipeY(0);
    touchStartY.current = null;
    isSwiping.current = false;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) {
           (document.activeElement as HTMLElement).blur();
        }
        handleBack();
        return;
      }
      if (isPaused || isWon || isLost || isWordleValidating) return;

      if (view === 'sudoku-game') {
        if (e.key >= '1' && e.key <= '9') handleSudokuInput(parseInt(e.key));
        if (e.key === 'Backspace') {
           if (!selectedCell || !boardState) return;
           const { row, col } = selectedCell;
           if (boardState[row][col].readonly) return;
           const newBoard = boardState.map(r => r.map(c => ({ ...c })));
           newBoard[row][col].value = 0;
           setBoardState(newBoard);
        }
      } else if (view === 'wordle-game') {
        if (/^[a-zA-Z]$/.test(e.key) && currentGuess.length < 5) setCurrentGuess(p => p + e.key.toUpperCase());
        if (e.key === 'Backspace') setCurrentGuess(p => p.slice(0, -1));
        if (e.key === 'Enter') handleWordleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, isPaused, isWon, isLost, isWordleValidating, currentGuess, handleSudokuInput, handleWordleSubmit, handleColordleSubmit, handleGeodleSubmit, selectedHistoryGame, selectedCell, boardState, handleBack]);

  useEffect(() => {
    let interval: number | undefined;
    if (view.includes('-game') && !isWon && !isLost && !isPaused) interval = window.setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    return () => { if (interval) clearInterval(interval); };
  }, [view, isWon, isLost, isPaused]);

  const resetGameState = (targetView: View) => {
    setIsWon(false); setIsLost(false); setIsPaused(false); setElapsedTime(0); setStartTime(Date.now());
    setMoveHistory([]); setView(targetView); setCurrentGuess(''); setKeyStatus({}); setWordleResults([]); 
    setGuesses([]); setColordleGuesses([]); setGeodleGuesses([]);
    setColordleHint(null); setGeodleHint(null); setSudokuHistory([]); setSudokuRedoStack([]);
  };

  const startSudoku = (l: Difficulty) => { 
    const { puzzle, solution } = generateSudoku(l); 
    setDifficulty(l); setActiveGameType('sudoku'); setInitialPuzzle(puzzle); setSolution(solution); 
    setBoardState(puzzle.map(r => r.map(v => ({ value: v, readonly: v !== 0 })))); resetGameState('sudoku-game'); 
  };
  const startWordle = async (l: Difficulty) => { setDifficulty(l); setActiveGameType('wordle'); setIsWordleLoading(true); setView('wordle-game'); try { const word = await generateDynamicWord(l); setTargetWord(word); resetGameState('wordle-game'); } finally { setIsWordleLoading(false); } };
  const startColordle = (l: Difficulty) => { const c = getRandomNicheColor(l); setDifficulty(l); setActiveGameType('colordle'); setTargetColor(c.hex); setTargetColorName(c.name); resetGameState('colordle-game'); };
  const startGeodle = (l: Difficulty) => { const c = getRandomCountry(l); setDifficulty(l); setActiveGameType('geodle'); setTargetCountry(c); resetGameState('geodle-game'); };

  const HubButton = ({ type }: { type: string }) => (
    <button 
      onClick={() => { setActiveGameType(type as any); setView(`${type}-menu` as any); }}
      className={`w-full py-6 rounded-full flex items-center justify-center transition-all duration-300 transform active:scale-95 hover:shadow-2xl bg-black text-white border border-zinc-100 shadow-xl group`}
    >
      <span className="text-[12px] font-black uppercase tracking-[0.4em] opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all">{type}</span>
    </button>
  );

  return (
    <div className="app-container relative bg-zinc-50 overflow-hidden font-sans safe-pt safe-pb">
      {/* Background Hub visible during swipe */}
      <div className="absolute inset-0 z-0 bg-white flex flex-col items-center justify-center p-8 overflow-y-auto no-scrollbar">
        <h1 className="text-[min(14vw,80px)] font-black tracking-tighter text-black leading-none mb-6 mt-4 drop-shadow-sm">ZEN</h1>
        <div className="w-full max-w-xs space-y-4">
          <HubButton type="sudoku" />
          <HubButton type="wordle" />
          <HubButton type="colordle" />
          <HubButton type="geodle" />
          
          <div className="flex gap-3 pt-4 pb-8">
            <button 
              onClick={() => { setView('history'); }} 
              className="flex-1 py-5 rounded-3xl bg-zinc-100 border border-zinc-200 flex items-center justify-center gap-3 active:scale-95 transition-all shadow-md group pointer-events-auto"
            >
              <ClockIcon className="w-4 h-4 text-black" />
              <span className="text-[10px] font-black uppercase tracking-widest text-black">History</span>
            </button>
            <button 
              onClick={() => { setView('settings'); }} 
              className="flex-1 py-5 rounded-3xl bg-zinc-100 border border-zinc-200 flex items-center justify-center gap-3 active:scale-95 transition-all shadow-md group pointer-events-auto"
            >
              <SettingsIcon className="w-4 h-4 text-black" />
              <span className="text-[10px] font-black uppercase tracking-widest text-black">Settings</span>
            </button>
          </div>
        </div>
      </div>

      {view !== 'hub' && (
        <div 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ 
            transform: `translateY(${swipeY}px)`,
            transition: swipeY === 0 ? 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
            borderRadius: swipeY > 0 ? '40px' : '0px'
          }}
          className="absolute inset-0 bg-white shadow-2xl z-50 overflow-y-auto no-scrollbar animate-fade-in flex flex-col"
        >
          {view.includes('-menu') && (
            <div className="h-full flex flex-col items-center justify-center relative p-8">
              <div className="w-full max-w-xs flex flex-col items-center text-center animate-fade-in">
                <h2 className="text-[min(12vw,72px)] font-black tracking-tighter mb-8 uppercase text-black leading-none">{activeGameType}</h2>
                <div className="w-full mb-10">
                  <DifficultySelector onSelectDifficulty={activeGameType === 'sudoku' ? startSudoku : activeGameType === 'wordle' ? startWordle : activeGameType === 'colordle' ? startColordle : startGeodle} />
                </div>
                <div className="w-full flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button onClick={() => setView('history')} className="flex-1 bg-zinc-50 text-zinc-600 py-5 rounded-3xl flex items-center justify-center gap-3 active:scale-95 transition-all border border-zinc-100 shadow-sm group">
                      <ClockIcon className="w-4 h-4 text-black" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-black">History</span>
                    </button>
                    <button onClick={() => setView('settings')} className="flex-1 bg-zinc-50 text-zinc-600 py-5 rounded-3xl flex items-center justify-center gap-3 active:scale-95 transition-all border border-zinc-100 shadow-sm group">
                      <SettingsIcon className="w-4 h-4 text-black" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-black">Settings</span>
                    </button>
                  </div>
                  <button 
                    onClick={() => { setView('hub'); setActiveGameType(null); }} 
                    className="py-5 w-full bg-zinc-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.4em] active:scale-95 transition-all shadow-xl"
                  >
                    Home Page
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === 'history' && <HistoryScreen category={activeGameType || 'sudoku'} setCategory={(c) => setActiveGameType(c)} onBack={handleBack} onOpenStats={(g) => setSelectedHistoryGame(g)} onContinueGame={(g) => { setView(`${g.gameType}-game` as View); setActiveGameType(g.gameType); }} />}
          {view === 'settings' && <SettingsScreen context={activeGameType || 'global'} settings={settings} onSettingsChange={handleSettingsChange} onBack={handleBack} />}

          {view.includes('-game') && (
            <div className="h-full flex flex-col relative justify-between overflow-hidden">
              <header className="px-5 py-4 flex items-center justify-between flex-shrink-0 z-[70]">
                <button onClick={handleBack} className="w-12 h-12 bg-black rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-xl">
                  <ChevronLeftIcon className="w-5 h-5 text-white" />
                </button>
                <div className="flex flex-col items-center">
                  <h2 className="text-3xl sm:text-5xl font-black tracking-tighter text-black uppercase leading-none">{activeGameType}</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-[10px] sm:text-[13px] uppercase font-black tracking-[0.3em] text-zinc-400">{difficulty}</span>
                    {settings.sudoku.timerVisible && (
                      <div className="flex items-center space-x-1 text-zinc-900 ml-2">
                        <ClockIcon className="w-3 h-3 text-black opacity-40" />
                        <span className="text-[13px] tabular-nums font-black tracking-tighter">{formatTime(elapsedTime)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => setIsPaused(p => !p)} className="w-12 h-12 bg-zinc-50 rounded-full border border-zinc-100 flex items-center justify-center active:scale-90 transition-transform shadow-sm">
                  <PauseIcon className="w-5 h-5 text-black" />
                </button>
              </header>

              <main className="flex-grow flex flex-col items-center justify-center relative overflow-hidden py-4">
                {isWordleLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-[80] bg-white/95 backdrop-blur-md">
                    <div className="w-10 h-10 border-4 border-zinc-100 border-t-black rounded-full animate-spin mb-4"></div>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400">Loading Session</p>
                  </div>
                )}
                {view === 'sudoku-game' && boardState && <div className="w-full scale-[1.05] sm:scale-100"><Board boardState={boardState} selectedCell={selectedCell} onCellSelect={(r, c) => setSelectedCell({row: r, col: c})} highlightedValue={highlightedValue} /></div>}
                {view === 'wordle-game' && !isWordleLoading && <div className={`${wordleShakeTrigger > 0 ? 'animate-shake' : ''} w-full flex-grow flex items-center justify-center`}><WordleBoard guesses={guesses} results={wordleResults} currentGuess={currentGuess} wordLength={5} maxGuesses={MAX_WORDLE_GUESSES} /></div>}
                {view === 'colordle-game' && <div className="w-full flex flex-col items-center gap-6"><div className="w-32 h-32 rounded-full bg-zinc-50 flex items-center justify-center text-3xl font-black text-zinc-200 border-[6px] border-white shadow-xl">?</div><ColordleBoard guesses={colordleGuesses} /></div>}
                {view === 'geodle-game' && <div className="w-full flex flex-col items-center gap-6"><div className="w-32 h-32 rounded-full bg-zinc-50 flex items-center justify-center text-3xl font-black text-zinc-200 border-[6px] border-white shadow-xl">?</div><GeodleBoard guesses={geodleGuesses} /></div>}
              </main>

              <div className="flex-shrink-0 w-full">
                {view === 'sudoku-game' && <footer className="px-4 pb-8 bg-white border-t border-zinc-100 pt-6 ios-bottom-bar shadow-[0_-15px_30px_rgba(0,0,0,0.02)]"><StaticNumberPad onNumberSelect={handleSudokuInput} onErase={() => handleSudokuInput(0)} onUndo={handleSudokuUndo} onRedo={handleSudokuRedo} onReset={handleSudokuReset} show={!!selectedCell} canUndo={sudokuHistory.length > 0} canRedo={sudokuRedoStack.length > 0} /></footer>}
                {view === 'wordle-game' && !isWordleLoading && <div className="pb-10 bg-white border-t border-zinc-100 pt-4 ios-bottom-bar shadow-[0_-15px_30px_rgba(0,0,0,0.02)]"><WordleKeyboard onKey={k => setCurrentGuess(p => p + k)} onDelete={() => setCurrentGuess(p => p.slice(0, -1))} onEnter={handleWordleSubmit} keyStatus={keyStatus} validating={isWordleValidating} /></div>}
                {view === 'colordle-game' && <div className="z-[65] ios-bottom-bar bg-white pt-4 shadow-[0_-15px_30px_rgba(0,0,0,0.02)]"><ColordleInput value={currentGuess} onChange={setCurrentGuess} onGuess={handleColordleSubmit} onGetHint={async () => { setIsColorHintLoading(true); const h = await getColorHint(targetColorName); setColordleHint(h); setIsColorHintLoading(false); }} isLoading={isColorLoading} isHintLoading={isColorHintLoading} currentHint={colordleHint} /></div>}
                {view === 'geodle-game' && <div className="z-[65] ios-bottom-bar bg-white pt-4 shadow-[0_-15px_30px_rgba(0,0,0,0.02)]"><GeodleInput value={currentGuess} onChange={setCurrentGuess} onGuess={handleGeodleSubmit} onGetHint={async () => { setIsGeoHintLoading(true); const h = await getGeoHint(targetCountry); setIsGeoHintLoading(false); setGeodleHint(h); }} isLoading={isGeoLoading} isHintLoading={isGeoHintLoading} currentHint={geodleHint} /></div>}
              </div>

              {isPaused && <PauseMenu onResume={() => setIsPaused(false)} onExit={() => { setView('hub'); setActiveGameType(null); }} onRestart={() => resetGameState(`${activeGameType}-game` as View)} gameType={activeGameType!} />}
            </div>
          )}
        </div>
      )}
      {selectedHistoryGame && <StatisticsModal game={selectedHistoryGame} onClose={() => setSelectedHistoryGame(null)} />}
    </div>
  );
};

export default App;

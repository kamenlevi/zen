
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Difficulty, BoardState, Grid, Move, CompletedGame, InProgressGame, WordleStatus,
  ColordleMove, WordleMove, GeodleMove, GameSettings
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
import HistoryScreen from './components/HistoryScreen.tsx';
import SettingsScreen from './components/SettingsScreen.tsx';
import StatisticsModal from './components/StatisticsModal.tsx';
import { ClockIcon, PauseIcon, ResetIcon, UndoIcon, RedoIcon, SparkleIcon } from './components/icons.tsx';

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
  
  // Game states
  const [boardState, setBoardState] = useState<BoardState | null>(null);
  const [undoStack, setUndoStack] = useState<BoardState[]>([]);
  const [redoStack, setRedoStack] = useState<BoardState[]>([]);
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
  const [wordleShakeTrigger, setWordleShakeTrigger] = useState(0);
  const [wordExplanation, setWordExplanation] = useState<string>('');
  
  const [targetColor, setTargetColor] = useState<string>('');
  const [targetColorName, setTargetColorName] = useState<string>('');
  const [colordleGuesses, setColordleGuesses] = useState<ColordleMove[]>([]);
  const [colordleHint, setColordleHint] = useState<string | null>(null);

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
  
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<CompletedGame | InProgressGame | null>(null);
  const lastAutoSave = useRef<number>(0);

  // Persistence
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('zen_settings');
      if (savedSettings) setSettings(JSON.parse(savedSettings));
    } catch (e) { console.error(e); }
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
      const progs: InProgressGame[] = JSON.parse(localStorage.getItem(`zen_${activeGameType}_progress`) || '[]');
      localStorage.setItem(`zen_${activeGameType}_progress`, JSON.stringify(progs.filter(p => p.id !== gameId)));
    } catch (e) { console.error("History save failed", e); }
  }, [activeGameType, difficulty, startTime, initialPuzzle, targetWord, targetColor, targetCountry, solution]);

  const fetchWordExplanation = async (word: string) => {
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === 'undefined') return "";
    const ai = new GoogleGenAI({ apiKey });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide a single, very simple sentence defining "${word}". Use plain, everyday language. No intro text.`,
      });
      return response.text.trim();
    } catch (e) {
      console.error(e);
      return "";
    }
  };

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
    
    const isSolved = newBoard.every((r, ri) => r.every((c, ci) => c.value === solution[ri][ci]));
    if (isSolved) {
      setTimeout(() => handleGameOver(true, nextHistory), 600);
    }
  }, [selectedCell, boardState, solution, isPaused, isWon, isLost, settings.sudoku.errorFeedback, handleGameOver, moveHistory]);

  const handleSudokuErase = useCallback(() => {
    if (!selectedCell || !boardState || isPaused || isWon || isLost) return;
    const { row, col } = selectedCell;
    if (boardState[row][col].readonly) return;
    setUndoStack(prev => [...prev, boardState.map(r => r.map(c => ({ ...c })))]);
    setRedoStack([]);
    const newBoard = boardState.map(r => r.map(c => ({ ...c })));
    newBoard[row][col].value = 0;
    newBoard[row][col].isError = false;
    setBoardState(newBoard);
    setHighlightedValue(0);
    const newMove: Move = { type: 'cell', row, col, value: 0, timestamp: Date.now() };
    setMoveHistory(prev => [...prev, newMove]);
  }, [selectedCell, boardState, isPaused, isWon, isLost]);

  const undoSudoku = useCallback(() => {
    if (undoStack.length === 0 || isPaused || isWon || isLost) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, boardState!.map(r => r.map(c => ({ ...c })))]);
    setUndoStack(prev => prev.slice(0, -1));
    setBoardState(previous);
    if (selectedCell) setHighlightedValue(previous[selectedCell.row][selectedCell.col].value);
  }, [undoStack, boardState, isPaused, isWon, isLost, selectedCell]);

  const redoSudoku = useCallback(() => {
    if (redoStack.length === 0 || isPaused || isWon || isLost) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, boardState!.map(r => r.map(c => ({ ...c })))]);
    setRedoStack(prev => prev.slice(0, -1));
    setBoardState(next);
    if (selectedCell) setHighlightedValue(next[selectedCell.row][selectedCell.col].value);
  }, [redoStack, boardState, isPaused, isWon, isLost, selectedCell]);

  const resetSudoku = useCallback(() => {
    if (!initialPuzzle || isWon || isLost) return;
    setUndoStack([]); setRedoStack([]);
    setBoardState(initialPuzzle.map(r => r.map(v => ({ value: v, readonly: v !== 0 }))));
    // Fix: Cast the reset object to Move to satisfy TypeScript union requirements
    setMoveHistory(prev => [...prev, { type: 'reset' as any, timestamp: Date.now() } as Move]);
    setSelectedCell(null); setHighlightedValue(null);
  }, [initialPuzzle, isWon, isLost]);

  const handleWordleSubmit = useCallback(async () => {
    if (currentGuess.length !== 5 || isPaused || isWon || isLost || isWordleValidating) return;
    
    const wordToSubmit = currentGuess.toUpperCase();
    setIsWordleValidating(true);
    
    try {
      const valid = await isValidWord(wordToSubmit);
      if (!valid) { 
        setIsWordleValidating(false);
        setWordleShakeTrigger(p => p + 1); 
        return; 
      }
      
      const feedback = getWordFeedback(wordToSubmit, targetWord);
      
      // Update results and guesses together to ensure consistency
      setWordleResults(prev => [...prev, feedback]);
      setGuesses(prev => [...prev, wordToSubmit]);
      
      // Update keyboard states
      setKeyStatus(prev => {
        const next = { ...prev };
        feedback.forEach((s, idx) => {
          const char = wordToSubmit[idx];
          if (s === 'correct' || (s === 'present' && next[char] !== 'correct')) next[char] = s;
          else if (!next[char]) next[char] = s;
        });
        return next;
      });
      
      const newMove: WordleMove = { type: 'wordle-guess', word: wordToSubmit, timestamp: Date.now() };
      setMoveHistory(prev => [...prev, newMove]);
      
      // Check win/loss conditions
      const win = wordToSubmit === targetWord;
      const loss = !win && (guesses.length + 1) >= MAX_WORDLE_GUESSES;
      
      setCurrentGuess('');
      
      if (win || loss) {
        // Only fetch explanation if game actually ends
        const explanation = await fetchWordExplanation(targetWord);
        setIsWordleValidating(false);
        setTimeout(() => handleGameOver(win, [...moveHistory, newMove], explanation), 1000);
      } else {
        setIsWordleValidating(false);
      }
    } catch (err) {
      console.error("Wordle submit error:", err);
      setIsWordleValidating(false);
    }
  }, [currentGuess, targetWord, guesses, moveHistory, isPaused, isWon, isLost, isWordleValidating, handleGameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') {
        if (selectedHistoryItem) { setSelectedHistoryItem(null); return; }
        if (isPaused) { setIsPaused(false); return; }
        if (isWon || isLost) { setView(`${activeGameType}-menu` as View); return; }
        if (view === 'hub') return;
        if (view.includes('-game')) setView(`${activeGameType}-menu` as View);
        else if (view === 'settings' || view === 'history') setView(activeGameType ? `${activeGameType}-menu` as View : 'hub');
        else if (view.includes('-menu')) setView('hub');
      }
      if (isPaused || isWon || isLost || isWordleValidating) return;
      
      if (view === 'sudoku-game') {
        if (e.key >= '1' && e.key <= '9') handleSudokuInput(parseInt(e.key));
        if (e.key === 'Backspace' || e.key === 'Delete') handleSudokuErase();
        if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.shiftKey ? redoSudoku() : undoSudoku(); }
      } else if (view === 'wordle-game') {
        if (/^[a-zA-Z]$/.test(e.key) && currentGuess.length < 5) setCurrentGuess(p => p + e.key.toUpperCase());
        if (e.key === 'Backspace') setCurrentGuess(p => p.slice(0, -1));
        if (e.key === 'Enter') handleWordleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, isPaused, isWon, isLost, isWordleValidating, currentGuess, handleSudokuInput, handleSudokuErase, handleWordleSubmit, undoSudoku, redoSudoku, selectedHistoryItem, activeGameType]);

  // Timer Effect
  useEffect(() => {
    let interval: number | undefined;
    if (view.includes('-game') && !isWon && !isLost && !isPaused) {
      interval = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [view, isWon, isLost, isPaused]);

  const autoSave = useCallback(() => {
    if (!view.includes('-game') || isWon || isLost || !activeGameType || !difficulty || !startTime) return;
    const now = Date.now();
    if (now - lastAutoSave.current < 2000) return;
    lastAutoSave.current = now;
    
    const gameId = `${activeGameType}-${difficulty}-${startTime}`;
    const game: InProgressGame = { 
      id: gameId, 
      gameType: activeGameType, 
      difficulty: difficulty, 
      startTime: startTime, 
      puzzle: activeGameType === 'sudoku' ? initialPuzzle! : (activeGameType === 'wordle' ? targetWord : (activeGameType === 'colordle' ? targetColor : targetCountry)), 
      solution: activeGameType === 'sudoku' ? solution! : (activeGameType === 'wordle' ? targetWord : (activeGameType === 'colordle' ? targetColor : targetCountry)), 
      boardState: activeGameType === 'sudoku' ? boardState! : (activeGameType === 'wordle' ? guesses : (activeGameType === 'colordle' ? colordleGuesses : geodleGuesses)), 
      elapsedTime, 
      moves: moveHistory 
    };

    try {
      const existing: InProgressGame[] = JSON.parse(localStorage.getItem(`zen_${activeGameType}_progress`) || '[]');
      localStorage.setItem(`zen_${activeGameType}_progress`, JSON.stringify([...existing.filter(e => e.id !== gameId), game]));
    } catch (e) {}
  }, [view, activeGameType, difficulty, startTime, initialPuzzle, targetWord, targetColor, targetCountry, solution, boardState, guesses, colordleGuesses, geodleGuesses, elapsedTime, moveHistory, isWon, isLost]);

  useEffect(() => { autoSave(); }, [boardState, guesses, colordleGuesses, geodleGuesses, autoSave]);

  const resetGameState = (targetView: View) => {
    setIsWon(false); setIsLost(false); setIsPaused(false); setElapsedTime(0); setStartTime(Date.now());
    setMoveHistory([]); setView(targetView); setSelectedCell(null); setHighlightedValue(null);
    setCurrentGuess(''); setKeyStatus({}); setWordleResults([]); setGuesses([]);
    setUndoStack([]); setRedoStack([]); setGeodleGuesses([]); setGeodleHint(null); 
    setColordleGuesses([]); setColordleHint(null); setWordExplanation(''); setIsWordleValidating(false);
  };

  const startSudoku = (l: Difficulty) => { 
    const { puzzle, solution } = generateSudoku(l); 
    setDifficulty(l); 
    setActiveGameType('sudoku'); 
    setInitialPuzzle(puzzle); 
    setSolution(solution); 
    setBoardState(puzzle.map(r => r.map(v => ({ value: v, readonly: v !== 0 })))); 
    resetGameState('sudoku-game'); 
  };

  const startWordle = (l: Difficulty) => { 
    setDifficulty(l); 
    setActiveGameType('wordle'); 
    setTargetWord(generateWordleWord(l)); 
    resetGameState('wordle-game'); 
  };

  const startColordle = (l: Difficulty) => { 
    const c = getRandomNicheColor(l); 
    setDifficulty(l); 
    setActiveGameType('colordle'); 
    setTargetColor(c.hex); 
    setTargetColorName(c.name); 
    resetGameState('colordle-game'); 
  };

  const startGeodle = (l: Difficulty) => {
    const c = getRandomCountry(l); 
    setDifficulty(l); 
    setActiveGameType('geodle'); 
    setTargetCountry(c); 
    resetGameState('geodle-game');
  };

  const resumeGame = (g: InProgressGame) => {
    resetGameState(`${g.gameType}-game` as View);
    setActiveGameType(g.gameType); setDifficulty(g.difficulty); setStartTime(g.startTime); setElapsedTime(g.elapsedTime); setMoveHistory(g.moves);
    if (g.gameType === 'sudoku') { 
      setInitialPuzzle(g.puzzle as Grid); 
      setSolution(g.solution as Grid); 
      setBoardState(g.boardState as BoardState); 
    }
    else if (g.gameType === 'wordle') { 
      setTargetWord(g.puzzle as string); 
      const gs = g.boardState as string[]; 
      setGuesses(gs); 
      const res = gs.map(w => getWordFeedback(w, g.puzzle as string)); 
      setWordleResults(res);
      const restoredKeys: Record<string, WordleStatus> = {}; 
      res.forEach((feedback, fIdx) => { 
        const word = gs[fIdx]; 
        feedback.forEach((s, idx) => { 
          const char = word[idx]; 
          if (s === 'correct' || (s === 'present' && restoredKeys[char] !== 'correct')) restoredKeys[char] = s; 
          else if (!restoredKeys[char]) restoredKeys[char] = s; 
        }); 
      }); 
      setKeyStatus(restoredKeys);
    }
    else if (g.gameType === 'colordle') { setTargetColor(g.puzzle as string); setColordleGuesses(g.boardState as ColordleMove[]); }
    else if (g.gameType === 'geodle') { setTargetCountry(g.puzzle as string); setGeodleGuesses(g.boardState as GeodleMove[]); }
    setView(`${g.gameType}-game` as View); setSelectedHistoryItem(null);
  };

  return (
    <div className="app-container relative bg-zinc-100 overflow-hidden font-sans">
      {/* Background Hub View */}
      <div className="absolute inset-0 z-0 bg-white flex flex-col items-center justify-center p-8 transition-opacity" style={{ opacity: view === 'hub' ? 1 : 0.4 }}>
        <h1 className="text-[min(15vw,100px)] font-black tracking-tighter text-black leading-none mb-12 animate-fade-in">ZEN</h1>
        <div className="w-full max-w-xs space-y-4">
          <button onClick={() => { setActiveGameType('sudoku'); setView('sudoku-menu'); }} className="w-full py-6 bg-black text-white rounded-[2.5rem] font-black uppercase tracking-widest text-[13px] shadow-xl active:scale-95 transition-all">SUDOKU</button>
          <button onClick={() => { setActiveGameType('wordle'); setView('wordle-menu'); }} className="w-full py-6 bg-white text-black rounded-[2.5rem] font-black uppercase tracking-widest text-[13px] border-2 border-black active:scale-95 transition-all">WORDLE</button>
          <button onClick={() => { setActiveGameType('colordle'); setView('colordle-menu'); }} className="w-full py-6 bg-black text-white rounded-[2.5rem] font-black uppercase tracking-widest text-[13px] shadow-xl active:scale-95 transition-all">COLORDLE</button>
          <button onClick={() => { setActiveGameType('geodle'); setView('geodle-menu'); }} className="w-full py-6 bg-white text-black rounded-[2.5rem] font-black uppercase tracking-widest text-[13px] border-2 border-black active:scale-95 transition-all">GEODLE</button>
        </div>
        <div className="mt-12 flex gap-8">
          <button onClick={() => { setActiveGameType(null); setView('history'); }} className="flex flex-col items-center gap-2 group"><div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center border border-zinc-200 group-active:scale-90 transition-transform"><ClockIcon /></div><span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">History</span></button>
          <button onClick={() => { setActiveGameType(null); setView('settings'); }} className="flex flex-col items-center gap-2 group"><div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center border border-zinc-200 group-active:scale-90 transition-transform"><SparkleIcon className="w-5 h-5" /></div><span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Settings</span></button>
        </div>
      </div>

      {/* Primary View Layer */}
      {view !== 'hub' && (
        <div className="absolute inset-0 bg-white shadow-[0_-20px_60px_rgba(0,0,0,0.15)] rounded-t-[3.5rem] border-t border-zinc-200 z-50 overflow-y-auto no-scrollbar animate-fade-in">
          {view.includes('-menu') && (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
              <h2 className="text-7xl font-black tracking-tighter mb-4 uppercase text-black">{activeGameType}</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-12">Select Prowess</p>
              <DifficultySelector onSelectDifficulty={activeGameType === 'sudoku' ? startSudoku : activeGameType === 'wordle' ? startWordle : activeGameType === 'colordle' ? startColordle : startGeodle} />
              <div className="mt-12 w-full max-w-xs space-y-4">
                <div className="flex gap-4">
                  <button onClick={() => setView('history')} className="flex-1 py-4 bg-zinc-100 rounded-3xl text-[10px] font-black uppercase tracking-widest active:bg-zinc-200 transition-colors">History</button>
                  <button onClick={() => setView('settings')} className="flex-1 py-4 bg-zinc-100 rounded-3xl text-[10px] font-black uppercase tracking-widest active:bg-zinc-200 transition-colors">Settings</button>
                </div>
                <button onClick={() => setView('hub')} className="w-full py-5 bg-black text-white rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Hub Home</button>
              </div>
            </div>
          )}

          {view === 'history' && <HistoryScreen category={activeGameType || 'sudoku'} setCategory={setActiveGameType as any} onBack={() => setView(activeGameType ? `${activeGameType}-menu` : 'hub')} onOpenStats={setSelectedHistoryItem} />}
          {view === 'settings' && <SettingsScreen context={activeGameType || 'global'} settings={settings} onSettingsChange={s => { const n = { ...settings, ...s }; setSettings(n); localStorage.setItem('zen_settings', JSON.stringify(n)); }} onBack={() => setView(activeGameType ? `${activeGameType}-menu` : 'hub')} />}

          {view.includes('-game') && (
            <div className="h-full flex flex-col">
              <header className="px-8 py-8 mt-4 flex items-center justify-between flex-shrink-0 z-[70]">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-black tracking-[0.4em] text-zinc-400">{difficulty} • {activeGameType}</span>
                  <div className="flex items-center space-x-1 text-black mt-1">
                    <ClockIcon />
                    <span className="text-2xl tabular-nums font-black tracking-tighter">{formatTime(elapsedTime)}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setIsPaused(p => !p)} className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 active:bg-zinc-200 transition-all">{isPaused ? <ClockIcon /> : <PauseIcon />}</button>
                  <button onClick={() => setView(`${activeGameType}-menu` as View)} className="px-5 py-3 bg-zinc-50 rounded-2xl border border-zinc-100 text-[10px] font-black uppercase tracking-widest active:bg-zinc-200">Exit</button>
                </div>
              </header>

              <main className="flex-grow flex flex-col items-center justify-center px-4 relative overflow-visible pb-44">
                {view === 'sudoku-game' && boardState && (
                  <div className="flex flex-col items-center gap-10 w-full animate-fade-in">
                    <Board boardState={boardState} selectedCell={selectedCell} onCellSelect={(r, c) => { setSelectedCell({row: r, col: c}); setHighlightedValue(boardState[r][c].value); }} highlightedValue={highlightedValue} />
                    <div className="flex gap-8">
                       <button onClick={resetSudoku} className="flex flex-col items-center gap-2 group"><div className="w-14 h-14 bg-zinc-100 rounded-[1.8rem] border border-zinc-200 flex items-center justify-center shadow-sm active:scale-90 transition-transform"><ResetIcon className="w-5 h-5 text-zinc-900" /></div><span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Reset</span></button>
                       <button onClick={undoSudoku} disabled={undoStack.length === 0} className={`flex flex-col items-center gap-2 group transition-opacity ${undoStack.length === 0 ? 'opacity-30' : 'opacity-100'}`}><div className="w-14 h-14 bg-zinc-100 rounded-[1.8rem] border border-zinc-200 flex items-center justify-center shadow-sm active:scale-90 transition-transform"><UndoIcon className="w-5 h-5 text-zinc-900" /></div><span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Undo</span></button>
                       <button onClick={redoSudoku} disabled={redoStack.length === 0} className={`flex flex-col items-center gap-2 group transition-opacity ${redoStack.length === 0 ? 'opacity-30' : 'opacity-100'}`}><div className="w-14 h-14 bg-zinc-100 rounded-[1.8rem] border border-zinc-200 flex items-center justify-center shadow-sm active:scale-90 transition-transform"><RedoIcon className="w-5 h-5 text-zinc-900" /></div><span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Redo</span></button>
                    </div>
                  </div>
                )}
                {view === 'wordle-game' && <div key={wordleShakeTrigger} className={wordleShakeTrigger > 0 ? 'animate-shake' : ''}><WordleBoard guesses={guesses} results={wordleResults} currentGuess={currentGuess} wordLength={5} maxGuesses={MAX_WORDLE_GUESSES} /></div>}
                {view === 'colordle-game' && <div className="w-full flex flex-col items-center gap-10 pt-4"><div className="w-56 h-56 rounded-[4rem] bg-zinc-100 flex items-center justify-center text-4xl font-black text-zinc-300 border-[12px] border-zinc-50 shadow-inner">?</div><ColordleBoard guesses={colordleGuesses} /></div>}
                {view === 'geodle-game' && <div className="w-full flex flex-col items-center gap-10 pt-4"><div className="w-56 h-56 rounded-[4rem] bg-zinc-100 flex items-center justify-center text-4xl font-black text-zinc-300 border-[12px] border-zinc-50 shadow-inner"><svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg></div><GeodleBoard guesses={geodleGuesses} /></div>}
              </main>

              {/* Input Layers */}
              {view === 'sudoku-game' && <footer className="fixed bottom-0 left-0 right-0 px-8 pb-10 bg-white/95 backdrop-blur-xl border-t border-zinc-100 pt-6 z-[60]"><StaticNumberPad onNumberSelect={handleSudokuInput} onErase={handleSudokuErase} show={!!selectedCell} /></footer>}
              {view === 'wordle-game' && <div className="fixed bottom-0 left-0 right-0 z-[65] bg-white/95 backdrop-blur-xl p-4 border-t border-zinc-100"><WordleKeyboard onKey={k => { if (currentGuess.length < 5) setCurrentGuess(p => p + k); }} onDelete={() => setCurrentGuess(p => p.slice(0, -1))} onEnter={handleWordleSubmit} keyStatus={keyStatus} validating={isWordleValidating} /></div>}
              {view === 'colordle-game' && <div className="fixed bottom-0 left-0 right-0 z-[65]"><ColordleInput onGuess={async n => { const r = await getSemanticCloseness(n, targetColorName); if (!r.isValid) return; const move: ColordleMove = { type: 'color-guess', guessName: n, guessHex: r.hex, percentage: r.percentage, timestamp: Date.now() }; setColordleGuesses(p => [...p, move]); setMoveHistory(p => [...p, move]); if (r.percentage >= 99.5) handleGameOver(true, [...moveHistory, move]); }} onGetHint={async () => { const h = await getColorHint(targetColorName); setColordleHint(h); }} isLoading={false} isHintLoading={false} currentHint={colordleHint} /></div>}
              {view === 'geodle-game' && <div className="fixed bottom-0 left-0 right-0 z-[65]"><GeodleInput onGuess={async n => { setIsGeoLoading(true); const r = await validateAndGetLocation(n, targetCountry); setIsGeoLoading(false); if (!r.isValid) return; const move: GeodleMove = { type: 'geo-guess', guessName: r.canonicalName, distance: r.distance, direction: r.direction, percentage: r.percentage, timestamp: Date.now(), lat: r.lat, lng: r.lng }; setGeodleGuesses(p => [...p, move]); setMoveHistory(p => [...p, move]); if (r.percentage >= 99.5) handleGameOver(true, [...moveHistory, move]); }} onGetHint={async () => { setIsGeoHintLoading(true); const h = await getGeoHint(targetCountry); setIsGeoHintLoading(false); setGeodleHint(h); }} isLoading={isGeoLoading} isHintLoading={isGeoHintLoading} currentHint={geodleHint} /></div>}

              {/* Game Over Overlays */}
              {(isWon || isLost) && (
                <div className="fixed inset-0 z-[100] bg-white/98 backdrop-blur-3xl flex items-center justify-center p-8 animate-pop-in">
                  <div className="text-center w-full max-sm:px-4 max-w-sm flex flex-col items-center">
                    <h2 className={`text-7xl font-black mb-6 tracking-tighter uppercase ${isWon ? 'text-black' : 'text-zinc-300'}`}>{isWon ? 'SOLVED' : 'FAILED'}</h2>
                    <div className="w-full bg-zinc-50 rounded-[3.5rem] p-10 border border-zinc-100 mb-10 shadow-sm">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Target Entity</p>
                      <p className="text-3xl font-black text-zinc-900 uppercase tracking-[0.2em]">{activeGameType === 'sudoku' ? 'COMPLETED' : (activeGameType === 'wordle' ? targetWord : (activeGameType === 'colordle' ? targetColorName : targetCountry))}</p>
                      
                      {activeGameType === 'wordle' && wordExplanation && (
                        <div className="mt-4 px-4 py-3 bg-white/50 rounded-2xl border border-zinc-100 animate-fade-in text-left">
                           <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Definition</p>
                           <p className="text-[13px] font-medium text-zinc-700 leading-tight">{wordExplanation}</p>
                        </div>
                      )}

                      <div className="mt-8 pt-8 border-t border-zinc-200 grid grid-cols-2">
                        <div><p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Elapsed</p><p className="text-2xl font-black tabular-nums">{formatTime(elapsedTime)}</p></div>
                        <div><p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Status</p><p className={`text-2xl font-black ${isWon ? 'text-emerald-500' : 'text-red-500'}`}>{isWon ? 'WIN' : 'LOSS'}</p></div>
                      </div>
                    </div>
                    <button onClick={() => setView(`${activeGameType}-menu` as View)} className="w-full bg-black text-white py-7 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Back to Menu</button>
                  </div>
                </div>
              )}

              {/* Pause Overlay */}
              {isPaused && (
                <div className="fixed inset-0 z-[90] bg-white/95 backdrop-blur-3xl flex items-center justify-center p-12">
                  <div className="text-center w-full max-w-sm animate-pop-in">
                    <h2 className="text-7xl font-black mb-12 tracking-tighter text-black uppercase">Paused</h2>
                    <button onClick={() => setIsPaused(false)} className="w-full bg-black text-white py-7 rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Resume</button>
                    <button onClick={() => setView(`${activeGameType}-menu` as View)} className="mt-10 text-zinc-400 font-black uppercase tracking-widest text-[11px] hover:text-black">Abort Mission</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Statistics Modal (via History) */}
          {selectedHistoryItem && <StatisticsModal game={selectedHistoryItem} onClose={() => setSelectedHistoryItem(null)} onBringToGame={() => { if (!('endTime' in selectedHistoryItem)) resumeGame(selectedHistoryItem as InProgressGame); else setSelectedHistoryItem(null); }} />}
        </div>
      )}
    </div>
  );
};

export default App;

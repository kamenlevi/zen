
import React from 'react';
import { GameType } from '../types';

interface CompletionMenuProps {
    gameType: GameType;
    isWon: boolean;
    elapsedTime: number;
    onExit: () => void;
    onRestart: () => void;
}

const CompletionMenu: React.FC<CompletionMenuProps> = ({
    gameType,
    isWon,
    elapsedTime,
    onExit,
    onRestart,
}) => {
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="absolute inset-0 z-[99] flex flex-col items-center justify-center bg-white/95 backdrop-blur-xl animate-fade-in p-6">
            <div className="text-center mb-8">
                <h2 className="text-5xl font-black tracking-tighter text-black mb-2">
                    {isWon ? 'YOU WON!' : 'GAME OVER'}
                </h2>
                <p className="text-sm uppercase font-bold tracking-widest text-zinc-500">
                    {gameType} - {isWon ? 'Completed' : 'Lost'} in {formatTime(elapsedTime)}
                </p>
            </div>

            <div className="w-full max-w-xs flex flex-col gap-4">
                <button
                    onClick={onRestart}
                    className="w-full py-5 bg-black text-white rounded-full font-black tracking-[0.3em] uppercase text-[11px] shadow-xl active:scale-95"
                >
                    PLAY AGAIN
                </button>
                <button
                    onClick={onExit}
                    className="w-full py-5 bg-zinc-100 text-zinc-800 rounded-full font-black tracking-[0.3em] uppercase text-[11px] shadow-sm active:scale-95"
                >
                    EXIT TO MENU
                </button>
            </div>
        </div>
    );
};

export default CompletionMenu;

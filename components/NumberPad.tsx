
import React from 'react';
// Fix: BackspaceIcon is used instead of non-existent EraseIcon from icons.tsx
import { BackspaceIcon } from './icons.tsx';

interface NumberPadProps {
  isOpen: boolean;
  onNumberSelect: (num: number) => void;
  onErase: () => void;
  onClose: () => void;
}

const NumberPad: React.FC<NumberPadProps> = ({ isOpen, onNumberSelect, onErase, onClose }) => {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-40 z-20 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Keypad Container */}
      <div
        className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xs px-2 pb-4 z-30 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Number Input"
      >
        {/* Keypad */}
        <div
          className="bg-gray-200/95 backdrop-blur-sm rounded-xl shadow-lg p-2"
          onClick={e => e.stopPropagation()} 
        >
          <div className="grid grid-cols-3 gap-1.5">
            {numbers.map((num) => (
              <button
                key={num}
                onClick={() => onNumberSelect(num)}
                className="h-14 flex items-center justify-center text-3xl text-black bg-white rounded-lg shadow active:bg-gray-200 transition-colors duration-150"
              >
                {num}
              </button>
            ))}
            <button
              onClick={onErase}
              className="h-14 col-span-3 flex items-center justify-center gap-2 text-xl text-black bg-white rounded-lg shadow active:bg-gray-200 transition-colors duration-150"
            >
              {/* Fix: Using BackspaceIcon which is exported from icons.tsx */}
              <BackspaceIcon />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NumberPad;

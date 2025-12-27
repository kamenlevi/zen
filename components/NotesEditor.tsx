
import React, { useState, useEffect, useRef } from 'react';

interface NotesEditorProps {
  currentNotes: string;
  onSave: (notes: string) => void;
  onClose: () => void;
}

const NotesEditor: React.FC<NotesEditorProps> = ({ currentNotes, onSave, onClose }) => {
  const [notes, setNotes] = useState(currentNotes);
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Internal ref

  useEffect(() => {
    // Automatically focus the textarea when the component mounts
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []); // Run once on mount

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleSave = () => {
    onSave(notes);
    onClose();
  };

  return (
    <div className="absolute inset-0 glass flex items-center justify-center z-[120] p-4 sm:p-8" onClick={onClose}>
      <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto no-scrollbar p-8 sm:p-12 animate-pop-in flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="mb-8 flex justify-between items-center">
          <h2 className="text-3xl font-black uppercase tracking-tighter text-black">Notes</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <textarea
          ref={textareaRef} // Use internal ref
          autoFocus // Re-add autoFocus
          className="flex-grow w-full h-40 bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-black resize-none"
          placeholder="Write your notes here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        ></textarea>

        <div className="mt-8 flex gap-4">
          <button onClick={handleSave} className="flex-1 bg-black text-white py-5 rounded-full font-black uppercase text-[11px] tracking-[0.3em] shadow-xl active:scale-95 transition-all">
            Save Notes
          </button>
          <button onClick={onClose} className="flex-1 bg-zinc-100 text-zinc-800 py-5 rounded-full font-black uppercase text-[11px] tracking-[0.3em] shadow-sm active:scale-95 transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}); // Corrected: Added closing parenthesis and semicolon

export default NotesEditor;

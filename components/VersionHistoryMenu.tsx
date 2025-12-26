
import React from 'react';
import { VERSION_HISTORY } from '../constants';

interface VersionHistoryMenuProps {
  onClose: () => void;
}

const VersionHistoryMenu: React.FC<VersionHistoryMenuProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 glass flex items-center justify-center z-[110] p-4 sm:p-8" onClick={onClose}>
      <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar p-8 sm:p-12 animate-pop-in" onClick={e => e.stopPropagation()}>
        <header className="mb-8 flex justify-between items-center">
          <h2 className="text-3xl font-black uppercase tracking-tighter text-black">Version History</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <div className="flex flex-col gap-8">
          {VERSION_HISTORY.map((v, index) => (
            <div key={index} className="bg-zinc-50 p-6 rounded-[2rem] border border-zinc-100 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xl font-black text-black">v{v.version}</p>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{v.date}</p>
              </div>
              <ul className="list-disc pl-5 space-y-1">
                {v.changes.map((change, i) => (
                  <li key={i} className="text-sm text-zinc-700 leading-tight">{change}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <button onClick={onClose} className="w-full bg-black text-white py-6 rounded-full font-black uppercase text-[11px] tracking-[0.3em] shadow-xl active:scale-95 transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VersionHistoryMenu;

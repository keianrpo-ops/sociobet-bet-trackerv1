import React, { useEffect } from 'react';
import { X, MessageCircle, Bell } from 'lucide-react';

interface ToastProps {
  message: string;
  sender: string;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, sender, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto close after 5s
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 p-4 max-w-sm w-full flex gap-3 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full w-10 h-10 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-800 dark:text-white flex justify-between items-center">
                Nuevo Mensaje
                <span className="text-[10px] text-slate-400 font-normal">Ahora</span>
            </h4>
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5">{sender}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 truncate mt-1">{message}</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 self-start">
            <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
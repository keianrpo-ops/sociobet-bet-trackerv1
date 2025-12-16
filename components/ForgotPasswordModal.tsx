import React, { useState } from 'react';
import { Partner } from '../types';
import { X, Key, ShieldAlert, CheckCircle, Lock } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  partners: Partner[];
  onResetPassword: (partnerId: string, newPassword: string) => Promise<void>;
}

// ESTE ES TU CÓDIGO DE RESPALDO. 
// Guárdalo en un lugar seguro. Si olvidas tu clave, usas esto.
const MASTER_RECOVERY_KEY = "SOCIOBET_2025"; 

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose, partners, onResetPassword }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [targetPartner, setTargetPartner] = useState<Partner | null>(null);

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      
      // 1. Buscar Usuario
      const partner = partners.find(p => p.username === username || p.email === username);
      
      if (!partner) {
          setError('No encontramos un usuario con ese nombre o correo.');
          return;
      }

      // 2. Verificar Código Maestro
      if (recoveryKey !== MASTER_RECOVERY_KEY) {
          setError('Código de Recuperación inválido. Contacta al soporte técnico.');
          return;
      }

      setTargetPartner(partner);
      setStep(2);
  };

  const handleReset = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!targetPartner) return;
      
      if (newPassword.length < 4) {
          setError('La contraseña debe tener al menos 4 caracteres.');
          return;
      }

      setIsLoading(true);
      await onResetPassword(targetPartner.partnerId, newPassword);
      setIsLoading(false);
      onClose();
      alert('¡Contraseña restablecida! Ahora puedes iniciar sesión.');
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
        
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
             <ShieldAlert className="w-5 h-5 text-amber-500" /> Recuperar Acceso
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
            {step === 1 ? (
                <form onSubmit={handleVerify} className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                        Ingresa tu usuario y el <strong>Código Maestro de Recuperación</strong> proporcionado por el desarrollador para verificar tu identidad.
                    </p>
                    
                    {error && (
                        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300 text-xs rounded-lg font-bold flex items-center gap-2">
                            <X className="w-4 h-4" /> {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Usuario o Email</label>
                        <input 
                            type="text"
                            required
                            className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ej: admin"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Código Maestro</label>
                        <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="password"
                                required
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                placeholder="••••••••"
                                value={recoveryKey}
                                onChange={e => setRecoveryKey(e.target.value)}
                            />
                        </div>
                    </div>

                    <button className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold shadow-lg transition-transform active:scale-95">
                        Verificar Credenciales
                    </button>
                </form>
            ) : (
                <form onSubmit={handleReset} className="space-y-4 animate-in slide-in-from-right-10 duration-300">
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                        <div>
                            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Identidad Verificada</p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-500">Usuario: {targetPartner?.name}</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nueva Contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                required
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ingresa nueva clave"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Escríbela con cuidado.</p>
                    </div>

                    <button disabled={isLoading} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2">
                        {isLoading ? 'Guardando...' : 'Restablecer Contraseña'}
                    </button>
                </form>
            )}
        </div>
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { Partner, BetStatus, Bet } from '../types';
import { calculateExpectedReturn, formatCurrency } from '../utils/calculations';
import { X, Save, Edit, DollarSign, Wand2, AlertTriangle } from 'lucide-react';

interface AddBetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (betData: any) => void;
  partners: Partner[];
  currentUserRole: 'ADMIN' | 'PARTNER';
  initialData?: Bet | null; // For Edit Mode
}

export const AddBetModal: React.FC<AddBetModalProps> = ({ isOpen, onClose, onSave, partners, currentUserRole, initialData }) => {
  const [formData, setFormData] = useState({
    partnerId: partners[0]?.partnerId || '',
    date: new Date().toISOString().split('T')[0],
    sport: 'Fútbol',
    homeTeam: '',
    awayTeam: '',
    marketDescription: '',
    oddsDecimal: 1.50,
    stakeCOP: 10000,
    status: 'PENDING' as BetStatus,
    notes: '',
    // Campos extra para edición
    cashoutReturnCOP: 0
  });

  const [potentialReturn, setPotentialReturn] = useState(0);

  // Cargar datos si es edición
  useEffect(() => {
    if (initialData) {
        setFormData({
            partnerId: initialData.partnerId,
            date: initialData.date,
            sport: initialData.sport,
            homeTeam: initialData.homeTeam,
            awayTeam: initialData.awayTeam,
            marketDescription: initialData.marketDescription,
            oddsDecimal: initialData.oddsDecimal,
            stakeCOP: initialData.stakeCOP,
            status: initialData.status,
            notes: initialData.notes || '',
            cashoutReturnCOP: initialData.cashoutReturnCOP || 0
        });
    } else {
        // Reset
        setFormData({
            partnerId: partners[0]?.partnerId || '',
            date: new Date().toISOString().split('T')[0],
            sport: 'Fútbol',
            homeTeam: '',
            awayTeam: '',
            marketDescription: '',
            oddsDecimal: 1.50,
            stakeCOP: 10000,
            status: 'PENDING',
            notes: '',
            cashoutReturnCOP: 0
        });
    }
  }, [initialData, isOpen, partners]);

  useEffect(() => {
    setPotentialReturn(calculateExpectedReturn(formData.stakeCOP, formData.oddsDecimal));
  }, [formData.stakeCOP, formData.oddsDecimal]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const isEditMode = !!initialData;
  const selectedPartner = partners.find(p => p.partnerId === formData.partnerId);
  const contractMissing = selectedPartner && !selectedPartner.contractAccepted;

  // Generar sugerencias de mercado
  const marketSuggestions = [
      { label: `Gana ${formData.homeTeam || 'Local'}`, value: `Gana ${formData.homeTeam || 'Local'}` },
      { label: 'Empate', value: 'Empate' },
      { label: `Gana ${formData.awayTeam || 'Visitante'}`, value: `Gana ${formData.awayTeam || 'Visitante'}` },
      { label: 'Ambos Marcan', value: 'Ambos Equipos Marcan' },
      { label: '+2.5 Goles', value: 'Más de 2.5 Goles' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
             {isEditMode ? <Edit className="w-5 h-5 text-blue-500" /> : null}
             {isEditMode ? 'Editar Apuesta' : 'Nueva Apuesta'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {contractMissing && (
             <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-lg border border-rose-200 dark:border-rose-800 flex items-start gap-3 animate-pulse">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5" />
                <div>
                   <h4 className="font-bold text-rose-700 dark:text-rose-300 text-sm">Contrato no firmado</h4>
                   <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">El socio seleccionado <strong>{selectedPartner?.name}</strong> aún no ha aceptado el contrato de inversión. No es posible registrar apuestas para este perfil hasta que se regularice su situación.</p>
                </div>
             </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Socio</label>
              <select 
                value={formData.partnerId}
                onChange={e => setFormData({...formData, partnerId: e.target.value})}
                disabled={currentUserRole === 'PARTNER'}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              >
                {partners.map(p => (
                  <option key={p.partnerId} value={p.partnerId}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fecha</label>
              <input 
                type="date"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Equipo Local</label>
              <input 
                type="text"
                required
                value={formData.homeTeam}
                onChange={e => setFormData({...formData, homeTeam: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Equipo Visitante</label>
              <input 
                type="text"
                required
                value={formData.awayTeam}
                onChange={e => setFormData({...formData, awayTeam: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mercado / Descripción</label>
             <input 
                type="text"
                placeholder="Ej: Más de 2.5 Goles, Empate, Ganador..."
                required
                value={formData.marketDescription}
                onChange={e => setFormData({...formData, marketDescription: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-white mb-2"
              />
              {/* Quick Select Chips */}
              <div className="flex flex-wrap gap-2">
                 {marketSuggestions.map((suggestion, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({...formData, marketDescription: suggestion.value})}
                        className="text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-300 transition-colors border border-slate-200 dark:border-slate-600"
                    >
                        {suggestion.label}
                    </button>
                 ))}
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
             <div>
               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Cuota (Decimal)</label>
               <input 
                  type="number"
                  step="0.01"
                  min="1.01"
                  required
                  value={formData.oddsDecimal}
                  onChange={e => setFormData({...formData, oddsDecimal: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-center bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                />
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Stake (COP)</label>
               <input 
                  type="number"
                  step="1000"
                  min="1000"
                  required
                  value={formData.stakeCOP}
                  onChange={e => setFormData({...formData, stakeCOP: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-center bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                />
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Retorno Potencial</label>
               <div className="w-full px-3 py-2 bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-lg font-mono text-center font-bold">
                 {formatCurrency(potentialReturn)}
               </div>
             </div>
          </div>
          
          {/* Opciones Avanzadas en Edición */}
          {isEditMode && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-800">
                  <h4 className="font-bold text-amber-800 dark:text-amber-200 mb-2 text-sm">Resolución de Apuesta</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Estado</label>
                          <select 
                            value={formData.status}
                            onChange={e => setFormData({...formData, status: e.target.value as BetStatus})}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-medium"
                          >
                              <option value="PENDING">PENDIENTE (En juego)</option>
                              <option value="WON">GANADA</option>
                              <option value="LOST">PERDIDA</option>
                              <option value="CASHED_OUT">CASH OUT (Retiro Anticipado)</option>
                              <option value="VOID">ANULADA</option>
                          </select>
                      </div>
                      
                      {/* Mostrar Input condicional para CashOut */}
                      {formData.status === 'CASHED_OUT' && (
                          <div className="animate-in fade-in slide-in-from-left-2">
                             <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                                <DollarSign className="w-3 h-3" /> Valor Recuperado (Cash Out)
                             </label>
                             <input 
                                type="number"
                                required
                                value={formData.cashoutReturnCOP}
                                onChange={e => setFormData({...formData, cashoutReturnCOP: parseFloat(e.target.value)})}
                                className="w-full px-3 py-2 border border-blue-300 dark:border-blue-700 rounded-lg font-mono text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold"
                                placeholder="0"
                             />
                             <p className="text-[10px] text-slate-500 mt-1">
                                Ingresa el monto total devuelto por la casa de apuestas.
                             </p>
                          </div>
                      )}

                       {/* Mostrar Input condicional para WON si se quisiera override (opcional, pero limpio) */}
                       {formData.status === 'WON' && (
                           <div className="flex items-center text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded border border-emerald-100 dark:border-emerald-800">
                               <span>La ganancia se calculará automáticamente: <b>Stake x Cuota</b>.</span>
                           </div>
                       )}
                  </div>
              </div>
          )}

          <div className="flex justify-end pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg mr-2"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={!!contractMissing}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center shadow-md shadow-blue-200 dark:shadow-none font-bold"
            >
              <Save className="w-4 h-4 mr-2" />
              {isEditMode ? 'Guardar Cambios' : 'Registrar Apuesta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
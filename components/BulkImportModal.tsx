import React, { useState } from 'react';
import { Partner, BetStatus } from '../types';
import { calculateBetOutcome } from '../utils/calculations';
import { X, CheckCircle, Clipboard, AlertCircle } from 'lucide-react';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (betsData: any[]) => void;
  partners: Partner[];
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, onImport, partners }) => {
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');

  if (!isOpen) return null;

  const parseCurrency = (val: string) => {
      if (!val) return 0;
      // Remove $ and non-numeric chars, keep digits. 
      // Note: In some locales ',' is decimal, in others '.', but typically in this raw text 50,000 is 50000.
      const clean = val.replace(/[^\d]/g, ''); 
      return parseFloat(clean) || 0;
  };

  const parseDateSpanish = (dateStr: string) => {
      try {
          const months: {[key: string]: string} = {
              'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04', 'may': '05', 'jun': '06',
              'jul': '07', 'ago': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12'
          };
          // Expected format: "14 de dic de 2025 • 03:28:53 p. m."
          const parts = dateStr.toLowerCase().split(' ');
          
          if (parts.length < 5) return new Date().toISOString().split('T')[0];

          const day = parts[0].padStart(2, '0');
          // parts[2] should be month short name
          const monthKey = parts[2].substring(0, 3);
          const month = months[monthKey] || '01';
          // parts[4] should be year
          const year = parts[4].replace(/[^\d]/g, ''); 
          
          if (!year || !month || !day) return new Date().toISOString().split('T')[0];

          return `${year}-${month}-${day}`;
      } catch (e) {
          return new Date().toISOString().split('T')[0];
      }
  };

  const mapStatus = (text: string): BetStatus | null => {
      const lower = text.toLowerCase();
      if (lower.includes('ganada')) return 'WON';
      if (lower.includes('perdida')) return 'LOST';
      if (lower.includes('cobro') || lower.includes('cash')) return 'CASHED_OUT';
      if (lower.includes('anulada') || lower.includes('void')) return 'VOID';
      return null;
  };

  const handleProcess = () => {
      try {
          if (!selectedPartnerId) throw new Error("Por favor selecciona a qué socio pertenecen estas apuestas.");
          const rawText = inputText.trim();
          if (!rawText) throw new Error("No hay texto para procesar.");

          // Split by lines and clean
          const allLines = rawText.replace(/\r\n/g, '\n').split('\n').map(l => l.trim()).filter(l => l !== '');
          
          const newBets: any[] = [];
          
          let currentBet: any = null;

          // Helper to save the bet being built
          const pushCurrentBet = () => {
              if (currentBet && currentBet.stakeCOP > 0) {
                  // Defaults
                  if (!currentBet.marketDescription) currentBet.marketDescription = 'Apuesta General';
                  if (!currentBet.homeTeam) {
                      currentBet.homeTeam = 'Evento';
                      currentBet.awayTeam = 'Desconocido';
                  }

                  // Financial Logic
                  if (currentBet.status === 'WON') {
                      // If we found a specific Payout value, use it, otherwise calc
                      currentBet.finalReturnCOP = currentBet.payout > 0 ? currentBet.payout : (currentBet.stakeCOP * currentBet.oddsDecimal);
                  } else if (currentBet.status === 'CASHED_OUT') {
                      currentBet.finalReturnCOP = currentBet.payout;
                      currentBet.cashoutReturnCOP = currentBet.payout;
                  } else if (currentBet.status === 'LOST') {
                      currentBet.finalReturnCOP = 0;
                  } else {
                      currentBet.finalReturnCOP = 0;
                  }

                  const partner = partners.find(p => p.partnerId === selectedPartnerId);
                  const outcome = calculateBetOutcome(currentBet, partner?.partnerProfitPct || 50);
                  Object.assign(currentBet, outcome);

                  newBets.push(currentBet);
              }
              currentBet = null;
          };

          // --- LINE BY LINE PARSING ---
          for (let i = 0; i < allLines.length; i++) {
              const line = allLines[i];
              
              // 1. Detect Header: "Sencilla", "Doble", etc. or "ID del cupón" if header missed
              // Sometimes "Sencilla" is followed by "@" on next line
              const isHeader = line === 'Sencilla' || line === 'Doble' || line === 'Triple' || line === 'Combinada' || line === 'En vivo';
              
              if (isHeader) {
                  pushCurrentBet(); // Close previous if exists
                  currentBet = {
                      partnerId: selectedPartnerId,
                      sport: 'Fútbol',
                      oddsDecimal: 1.0,
                      stakeCOP: 0,
                      payout: 0,
                      status: 'PENDING',
                      marketDescription: '',
                      notes: '',
                      date: new Date().toISOString().split('T')[0]
                  };
                  continue; 
              }

              if (!currentBet) continue; // Wait until we find a header

              // 2. Extract Data

              // Odds: often "@" on one line, value on next. Or "@ 1.50"
              if (line === '@') {
                  const nextLine = allLines[i+1];
                  if (nextLine && /^\d+(\.\d+)?$/.test(nextLine)) {
                      currentBet.oddsDecimal = parseFloat(nextLine);
                      i++; // Skip next line since we consumed it
                  }
              } else if (line.startsWith('@ ')) {
                  const val = parseFloat(line.replace('@', ''));
                  if (!isNaN(val)) currentBet.oddsDecimal = val;
              }

              // Status (Ganadas, Perdida...)
              const statusFound = mapStatus(line);
              if (statusFound) currentBet.status = statusFound;

              // Date (look for pattern "14 de dic de 2025")
              if (line.includes(' de ') && /\d{4}/.test(line)) {
                  currentBet.date = parseDateSpanish(line);
              }

              // ID
              if (line.includes('ID del cupón:')) {
                  const id = line.split(':')[1]?.trim();
                  currentBet.notes = `ID: ${id}`;
                  currentBet.betId = `B-${id}`;
              }

              // Stake (Apuesta:) -> Value usually on next line
              if (line.includes('Apuesta:')) {
                  // Check if value is on same line?
                  let valStr = line.replace('Apuesta:', '').trim();
                  if (!valStr && allLines[i+1]) {
                      valStr = allLines[i+1];
                      i++; // Skip
                  }
                  currentBet.stakeCOP = parseCurrency(valStr);
              }

              // Payout (Pago:) -> Value usually on next line
              if (line.includes('Pago:')) {
                   let valStr = line.replace('Pago:', '').trim();
                   if (!valStr && allLines[i+1]) {
                       valStr = allLines[i+1];
                       i++; // Skip
                   }
                   currentBet.payout = parseCurrency(valStr);
              }

              // Teams (look for " - " or " v ")
              // Avoid lines that are Date or ID
              if (line.includes(' - ') && !line.includes(' de ') && !line.includes('ID')) {
                  const [home, away] = line.split(' - ');
                  currentBet.homeTeam = home.trim();
                  currentBet.awayTeam = away ? away.trim() : '';
              }

              // Market Description
              // Heuristic: Line that is NOT date, NOT status, NOT money, NOT ID, NOT Header, NOT Teams
              if (
                  !line.includes(' de ') &&
                  !mapStatus(line) &&
                  !line.includes('$') &&
                  !line.includes('Apuesta:') &&
                  !line.includes('Pago:') &&
                  !line.includes('ID del cupón') &&
                  line !== '@' &&
                  !/^\d+(\.\d+)?$/.test(line) &&
                  !line.includes(' - ')
              ) {
                  // If we don't have a market yet, take this line
                  if (!currentBet.marketDescription) {
                      currentBet.marketDescription = line;
                  }
              }
          }

          pushCurrentBet(); // Push the last one

          if (newBets.length > 0) {
              onImport(newBets);
              setInputText('');
              setError(null);
              onClose();
          } else {
              throw new Error("No se detectaron apuestas. Asegúrate de copiar desde 'Sencilla' hacia abajo.");
          }

      } catch (err: any) {
          setError(err.message);
      }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-4xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Clipboard className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Pegar Historial (BetPlay/Rush)
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div>
                    <p className="font-bold mb-1">Modo Texto Plano (Detectar Bloques)</p>
                    <p>Pega todo el texto tal cual lo copiaste de la página. El sistema buscará patrones como:</p>
                    <ul className="list-disc pl-4 mt-1 space-y-1 text-xs opacity-80">
                        <li>"Sencilla" / "Combinada"</li>
                        <li>"Apuesta:" (y el valor en la siguiente línea)</li>
                        <li>"Pago:" (y el valor en la siguiente línea)</li>
                        <li>Estado (Ganadas, Perdida, Cobro...)</li>
                    </ul>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Asignar a Socio:</label>
                <select 
                    className="w-full md:w-1/2 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                >
                    <option value="">-- Seleccionar Socio --</option>
                    {partners.filter(p => p.partnerId !== 'P001').map(p => (
                        <option key={p.partnerId} value={p.partnerId}>{p.name}</option>
                    ))}
                </select>
            </div>

            <div className="relative flex-1 min-h-[300px]">
                <textarea 
                    className="w-full h-full p-4 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-white leading-relaxed resize-none"
                    placeholder="Pega aquí el listado..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                ></textarea>
            </div>

            {error && (
                <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300 p-3 rounded-lg text-sm flex items-center gap-2 animate-pulse">
                    <AlertCircle className="w-4 h-4" /> {error}
                </div>
            )}

            <div className="flex justify-end pt-2 gap-3 border-t border-slate-100 dark:border-slate-700 mt-4">
                <button 
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleProcess}
                  disabled={!inputText || !selectedPartnerId}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 shadow-md font-medium"
                >
                  <CheckCircle className="w-4 h-4" /> Procesar Historial
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
import React, { useMemo, useState } from 'react';
import { Bet, BetStatus, Fund, Withdrawal, Partner } from '../types';
import { formatCurrency, generateLedger } from '../utils/calculations';
import { Search, ChevronLeft, ChevronRight, AlertCircle, ArrowDownCircle, ArrowUpCircle, Target, Wallet, CheckCircle, XCircle, Ban, DollarSign, Filter, Calendar, Edit2, Save, X } from 'lucide-react';

interface BetTableProps {
  bets: Bet[];
  partners: Partner[]; // Recibir socios reales
  onUpdateStatus: (betId: string, newStatus: BetStatus, cashoutValue?: number) => void;
  onEditBet?: (betId: string) => void;
  isAdmin: boolean;
  selectedPartnerId?: string | 'ALL';
  funds?: Fund[];
  withdrawals?: Withdrawal[];
}

const ITEMS_PER_PAGE = 15;

export const BetTable: React.FC<BetTableProps> = ({ 
    bets, 
    partners, // Props
    onUpdateStatus, 
    onEditBet,
    isAdmin, 
    selectedPartnerId = 'ALL',
    funds = [],
    withdrawals = [] 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtros Locales
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | BetStatus>('ALL');
  const [localPartnerFilter, setLocalPartnerFilter] = useState<string>('ALL');

  // Estado para Modal de Cashout
  const [cashoutModal, setCashoutModal] = useState<{ id: string, amount: string } | null>(null);

  // Generar Ledger unificado USANDO SOCIOS REALES
  const ledger = useMemo(() => 
    generateLedger(bets, funds, withdrawals, selectedPartnerId, partners),
  [bets, funds, withdrawals, selectedPartnerId, partners]);

  // Lógica de Filtrado Avanzado
  const filteredLedger = useMemo(() => {
    return ledger.filter(item => {
        // 1. Buscador Texto
        const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              item.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              item.partnerName.toLowerCase().includes(searchTerm.toLowerCase());
        
        // 2. Filtro Fecha
        let matchesDate = true;
        if (dateFrom) matchesDate = matchesDate && item.date >= dateFrom;
        if (dateTo) matchesDate = matchesDate && item.date <= dateTo;

        // 3. Filtro Estado
        let matchesStatus = true;
        if (filterStatus !== 'ALL') {
             matchesStatus = item.status === filterStatus;
        }

        // 4. Filtro Socio (Local en tabla global)
        let matchesPartner = true;
        if (selectedPartnerId === 'ALL' && localPartnerFilter !== 'ALL') {
             // Buscar el nombre del socio seleccionado en el filtro local
             const pName = partners.find(p => p.partnerId === localPartnerFilter)?.name;
             if (pName) matchesPartner = item.partnerName === pName;
        }

        return matchesSearch && matchesDate && matchesStatus && matchesPartner;
    });
  }, [ledger, searchTerm, dateFrom, dateTo, filterStatus, localPartnerFilter, selectedPartnerId, partners]);

  // Paginación
  const totalPages = Math.ceil(filteredLedger.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredLedger.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const currentBalance = ledger.length > 0 ? ledger[0].runningBalance : 0;

  // Manejadores de Acción
  // CORRECCIÓN CRÍTICA: Recibir el betId directo, sin hacer split de strings
  const handleAction = (realBetId: string, action: BetStatus) => {
      
      if (!realBetId) {
          console.error("ID de apuesta no válido");
          alert("Error: ID de apuesta no identificado. Intenta recargar la página.");
          return;
      }

      if (action === 'CASHED_OUT') {
          // Abrir Modal de Cashout
          setCashoutModal({ id: realBetId, amount: '' });
      } else {
          const msg = action === 'PENDING' 
            ? "¿Revertir apuesta a estado PENDIENTE?" 
            : `¿Confirmar cambio de estado a ${action === 'WON' ? 'GANADA' : action === 'LOST' ? 'PERDIDA' : action}?`;
            
          if(confirm(msg)) {
              onUpdateStatus(realBetId, action);
          }
      }
  };

  const submitCashout = (e: React.FormEvent) => {
      e.preventDefault();
      if (cashoutModal && cashoutModal.amount) {
          onUpdateStatus(cashoutModal.id, 'CASHED_OUT', parseFloat(cashoutModal.amount));
          setCashoutModal(null);
      }
  };

  const handleEditClick = (realBetId: string) => {
      if (onEditBet && realBetId) onEditBet(realBetId);
  }

  // Helper para Badge de Estado
  const getStatusBadge = (status: string, category: string) => {
      if (category === 'DEPOSIT') return <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">EXITOSO</span>;
      if (category === 'WITHDRAWAL') return <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-1 rounded dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">PAGADO</span>;
      
      switch (status) {
          case 'WON': return <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">GANADA</span>;
          case 'LOST': return <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-1 rounded dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">PERDIDA</span>;
          case 'PENDING': return <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">PENDIENTE</span>;
          case 'VOID': return <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">ANULADA</span>;
          case 'CASHED_OUT': return <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">CASH OUT</span>;
          default: return <span className="text-[10px] text-slate-400">-</span>;
      }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors duration-300 relative">
      
      {/* Header & Controls */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                {selectedPartnerId === 'ALL' ? 'Historial Global' : 'Historial Financiero'}
            </h3>
            {selectedPartnerId !== 'ALL' && (
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-1.5 rounded-full">
                    <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">Saldo:</span>
                    <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(currentBalance)}</span>
                </div>
            )}
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 shadow-sm">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input 
                    type="date" 
                    className="text-xs bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-200"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                />
                <span className="text-slate-400">-</span>
                <input 
                    type="date" 
                    className="text-xs bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-200"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                />
            </div>
            {selectedPartnerId === 'ALL' && (
                <div className="relative">
                    <select
                        className="appearance-none pl-8 pr-8 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-slate-700 dark:text-slate-200"
                        value={localPartnerFilter}
                        onChange={(e) => setLocalPartnerFilter(e.target.value)}
                    >
                        <option value="ALL">Todos los Socios</option>
                        {partners.filter(p => p.partnerId !== 'P001').map(p => (
                            <option key={p.partnerId} value={p.partnerId}>{p.name}</option>
                        ))}
                    </select>
                    <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                </div>
            )}
            <select
                className="pl-3 pr-8 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-slate-700 dark:text-slate-200"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
            >
                <option value="ALL">Todos los Estados</option>
                <option value="PENDING">Pendientes</option>
                <option value="WON">Ganadas</option>
                <option value="LOST">Perdidas</option>
                <option value="CASHED_OUT">Cash Out</option>
            </select>
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                    type="text" 
                    placeholder="Buscar equipo, mercado..." 
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-slate-800 dark:text-white placeholder-slate-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700 uppercase text-xs tracking-wider">
            <tr>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4">Socio</th>
              <th className="px-6 py-4">Descripción / Detalle</th>
              <th className="px-6 py-4 text-center">Estado</th>
              <th className="px-6 py-4 text-right text-rose-600 dark:text-rose-400">Salidas</th>
              <th className="px-6 py-4 text-right text-emerald-600 dark:text-emerald-400">Entradas</th>
              <th className="px-6 py-4 text-right">Saldo</th>
              {isAdmin && <th className="px-6 py-4 text-center bg-slate-100/50 dark:bg-slate-800/50">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {paginatedItems.map((item, idx) => (
              <tr key={`${item.id}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-xs">{item.date}</td>
                <td className="px-6 py-4">
                     {item.partnerName === 'Desconocido' ? (
                         <span className="font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded text-xs whitespace-nowrap border border-amber-200 dark:border-amber-800">
                            Desc.
                         </span>
                     ) : (
                         <span className="font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-600 px-2 py-1 rounded text-xs whitespace-nowrap border border-slate-200 dark:border-slate-500">
                            {item.partnerName}
                         </span>
                     )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                     {item.category === 'DEPOSIT' && <ArrowDownCircle className="w-4 h-4 text-emerald-500 shrink-0"/>}
                     {item.category === 'WITHDRAWAL' && <ArrowUpCircle className="w-4 h-4 text-rose-500 shrink-0"/>}
                     {item.category === 'BET_STAKE' && <Target className="w-4 h-4 text-slate-400 shrink-0"/>}
                     <div className="min-w-[180px]">
                        <div className="font-bold text-slate-800 dark:text-white text-xs sm:text-sm">{item.description}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{item.details}</div>
                     </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                    {getStatusBadge(item.status, item.category)}
                </td>
                <td className="px-6 py-4 text-right font-medium text-rose-600 dark:text-rose-400 whitespace-nowrap">
                   {item.type === 'DEBIT' ? formatCurrency(Math.abs(item.amount)) : '-'}
                </td>
                <td className="px-6 py-4 text-right font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                   {item.type === 'CREDIT' ? formatCurrency(item.amount) : '-'}
                </td>
                <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-white whitespace-nowrap">
                    {formatCurrency(item.runningBalance)}
                </td>
                {isAdmin && (
                    <td className="px-6 py-4 text-center bg-slate-50/30 dark:bg-slate-800/30">
                        {item.category === 'BET_STAKE' ? (
                            <div className="flex justify-center gap-1">
                                <button 
                                    onClick={() => handleEditClick(item.originalBetId)}
                                    className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md transition-colors border border-blue-200 shadow-sm"
                                    title="Editar Apuesta"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                
                                <div className="w-px h-4 bg-slate-300 mx-1 self-center" />

                                <button 
                                    onClick={() => handleAction(item.originalBetId, 'WON')}
                                    className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-md transition-colors border border-emerald-200 shadow-sm"
                                    title="Ganada"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleAction(item.originalBetId, 'LOST')}
                                    className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-md transition-colors border border-rose-200 shadow-sm"
                                    title="Perdida"
                                >
                                    <XCircle className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleAction(item.originalBetId, 'CASHED_OUT')}
                                    className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors border border-blue-200 shadow-sm"
                                    title="Cash Out (Retiro Anticipado)"
                                >
                                    <DollarSign className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleAction(item.originalBetId, 'VOID')}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition-colors border border-slate-200 shadow-sm"
                                    title="Anular"
                                >
                                    <Ban className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <span className="text-xs text-slate-300 block w-20 mx-auto opacity-20">-</span>
                        )}
                    </td>
                )}
              </tr>
            ))}
             {paginatedItems.length === 0 && (
              <tr><td colSpan={isAdmin ? 8 : 7} className="px-6 py-16 text-center text-slate-400">No se encontraron movimientos.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800">
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Página {currentPage} de {totalPages || 1}
        </span>
        <div className="flex gap-2">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 shadow-sm">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 shadow-sm">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CASHOUT MODAL */}
      {cashoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-700">
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-blue-600" /> Confirmar Cash Out
                      </h3>
                      <button onClick={() => setCashoutModal(null)} className="text-slate-400 hover:text-slate-600">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  <form onSubmit={submitCashout} className="p-6 space-y-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-200 mb-4">
                          Ingresa el valor total que la casa de apuestas te devolvió al cerrar la apuesta anticipadamente.
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Valor Recuperado (COP)</label>
                          <input 
                              type="number"
                              required
                              autoFocus
                              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-lg font-bold bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-center focus:ring-2 focus:ring-blue-500 outline-none"
                              placeholder="0"
                              value={cashoutModal.amount}
                              onChange={e => setCashoutModal({...cashoutModal, amount: e.target.value})}
                          />
                      </div>
                      <div className="flex gap-2 pt-2">
                          <button type="button" onClick={() => setCashoutModal(null)} className="flex-1 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-medium">Cancelar</button>
                          <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md">Confirmar</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

    </div>
  );
};
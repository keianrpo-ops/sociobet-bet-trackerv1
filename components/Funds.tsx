import React, { useState, useMemo, useRef } from 'react';
import { Partner, Fund, Withdrawal } from '../types';
import { formatCurrency } from '../utils/calculations';
import { ArrowDownLeft, ArrowUpRight, Plus, CheckCircle, XCircle, Filter, Calendar, Search, Banknote, AlertCircle, Edit2, X, Save, Image as ImageIcon, ExternalLink, Trash2 } from 'lucide-react';

interface FundsProps {
  partners: Partner[];
  isAdmin: boolean;
  funds: Fund[]; 
  withdrawals: Withdrawal[]; 
  onUpdateWithdrawal: (updatedWithdrawal: Withdrawal) => void;
  onUpdateFund: (updatedFund: Fund) => void;
  onDeleteFund: (fundId: string) => void; 
  onAddFund: (newFund: Fund) => void; // New prop for adding funds to main state
}

export const Funds: React.FC<FundsProps> = ({ partners, isAdmin, funds, withdrawals, onUpdateWithdrawal, onUpdateFund, onDeleteFund, onAddFund }) => {
  const [activeTab, setActiveTab] = useState<'DEPOSITS' | 'WITHDRAWALS'>('DEPOSITS');
  
  // --- Estados de Filtros ---
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // --- Estado de Edición ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<'FUND' | 'WITHDRAWAL' | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);

  // Combine props data directly. Removed localFunds state to fix persistence issue.
  const allFunds = useMemo(() => [...funds], [funds]);
  const allWithdrawals = useMemo(() => [...withdrawals], [withdrawals]);

  // --- Lógica de Filtrado ---
  const filterData = (items: any[]) => {
      return items.filter(item => {
          // 1. Filtro Texto (Descripción, Método, Socio)
          const searchLower = searchTerm.toLowerCase();
          const partnerName = partners.find(p => p.partnerId === item.partnerId)?.name.toLowerCase() || '';
          const desc = (item.description || '').toLowerCase();
          const matchesSearch = desc.includes(searchLower) || partnerName.includes(searchLower);

          // 2. Filtro Fecha
          let matchesDate = true;
          if (dateFrom) matchesDate = matchesDate && item.date >= dateFrom;
          if (dateTo) matchesDate = matchesDate && item.date <= dateTo;

          // 3. Filtro Socio
          let matchesPartner = true;
          if (selectedPartnerId !== 'ALL') {
              matchesPartner = item.partnerId === selectedPartnerId;
          }

          return matchesSearch && matchesDate && matchesPartner;
      });
  };

  const filteredFunds = useMemo(() => 
      filterData(allFunds).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), 
  [allFunds, searchTerm, dateFrom, dateTo, selectedPartnerId]);

  const filteredWithdrawals = useMemo(() => 
      filterData(allWithdrawals).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), 
  [allWithdrawals, searchTerm, dateFrom, dateTo, selectedPartnerId]);


  // --- Formulario Nuevo Depósito (Rápido) ---
  const [newDeposit, setNewDeposit] = useState({ partnerId: '', amount: 0, desc: '' });

  const handleDeposit = (e: React.FormEvent) => {
      e.preventDefault();
      const newFund: Fund = {
          fundId: `F-NEW-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          scope: 'PARTNER',
          partnerId: newDeposit.partnerId,
          amountCOP: Number(newDeposit.amount),
          method: 'Manual',
          description: newDeposit.desc
      };
      
      // Call parent handler to save state in App.tsx and LocalStorage
      onAddFund(newFund);
      setNewDeposit({ partnerId: '', amount: 0, desc: '' });
  };

  // --- Manejo de Edición ---
  const openEditModal = (item: any, type: 'FUND' | 'WITHDRAWAL') => {
      setEditingType(type);
      setEditFormData({ ...item }); // Clone to avoid direct mutation
      setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingType === 'WITHDRAWAL') {
          onUpdateWithdrawal(editFormData);
      } else {
          onUpdateFund(editFormData);
      }
      setIsEditModalOpen(false);
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          // Simulate upload by converting to DataURL (Not recommended for huge production usage in Sheets but ok for demo)
          const reader = new FileReader();
          reader.onloadend = () => {
              setEditFormData({ ...editFormData, receiptUrl: reader.result as string });
          };
          reader.readAsDataURL(file);
      }
  };

  const handleDelete = (fundId: string) => {
      if(confirm('¿Eliminar este registro de fondos permanentemente?')) {
          onDeleteFund(fundId);
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* 1. Barra de Herramientas (Filtros Globales) */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between">
         <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
             
             {/* Filtro Fechas */}
             <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 shadow-sm">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input 
                    type="date" 
                    className="text-sm bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-200 p-0"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                />
                <span className="text-slate-400">-</span>
                <input 
                    type="date" 
                    className="text-sm bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-200 p-0"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                />
            </div>

            {/* Filtro Socio */}
            {isAdmin && (
                <div className="relative">
                    <select
                        className="appearance-none pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-slate-700 dark:text-slate-200 min-w-[180px]"
                        value={selectedPartnerId}
                        onChange={(e) => setSelectedPartnerId(e.target.value)}
                    >
                        <option value="ALL">Todos los Socios</option>
                        {partners.filter(p => p.partnerId !== 'P001').map(p => (
                            <option key={p.partnerId} value={p.partnerId}>{p.name}</option>
                        ))}
                    </select>
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
            )}

            {/* Buscador */}
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                    type="text" 
                    placeholder="Buscar descripción, socio..." 
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-slate-800 dark:text-white placeholder-slate-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
         </div>
      </div>

      {/* 2. KPIs Reactivos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-emerald-600 dark:bg-emerald-700 text-white p-6 rounded-xl shadow-lg relative overflow-hidden transition-all duration-300">
            <div className="relative z-10">
                <p className="text-emerald-100 text-sm font-medium mb-1 flex items-center gap-2">
                    Ingresos Filtrados <Filter className="w-3 h-3 opacity-50"/>
                </p>
                <h3 className="text-3xl font-bold">{formatCurrency(filteredFunds.reduce((a,b) => a + b.amountCOP, 0))}</h3>
                <p className="text-xs text-emerald-200 mt-2 opacity-80">{filteredFunds.length} transacciones encontradas</p>
            </div>
            <ArrowDownLeft className="absolute right-4 bottom-4 w-16 h-16 text-emerald-500 opacity-50" />
         </div>
         <div className="bg-rose-600 dark:bg-rose-700 text-white p-6 rounded-xl shadow-lg relative overflow-hidden transition-all duration-300">
            <div className="relative z-10">
                <p className="text-rose-100 text-sm font-medium mb-1 flex items-center gap-2">
                    Pagos Filtrados (Paid) <Filter className="w-3 h-3 opacity-50"/>
                </p>
                <h3 className="text-3xl font-bold">{formatCurrency(filteredWithdrawals.filter(w=>w.status === 'PAID').reduce((a,b) => a + b.amountCOP, 0))}</h3>
                <p className="text-xs text-rose-200 mt-2 opacity-80">{filteredWithdrawals.filter(w=>w.status === 'PAID').length} pagos realizados</p>
            </div>
            <ArrowUpRight className="absolute right-4 bottom-4 w-16 h-16 text-rose-500 opacity-50" />
         </div>
          <div className="bg-amber-500 dark:bg-amber-600 text-white p-6 rounded-xl shadow-lg relative overflow-hidden transition-all duration-300">
            <div className="relative z-10">
                <p className="text-amber-100 text-sm font-medium mb-1">Retiros Pendientes</p>
                <h3 className="text-3xl font-bold">{formatCurrency(allWithdrawals.filter(w=>w.status === 'REQUESTED').reduce((a,b) => a + b.amountCOP, 0))}</h3>
                <p className="text-xs text-amber-100 mt-2 opacity-80">Requieren aprobación</p>
            </div>
            <AlertCircle className="absolute right-4 bottom-4 w-16 h-16 text-amber-400 opacity-50" />
         </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700">
          <button 
            onClick={() => setActiveTab('DEPOSITS')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'DEPOSITS' ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
              <ArrowDownLeft className="w-4 h-4" /> Historial de Depósitos
          </button>
          <button 
            onClick={() => setActiveTab('WITHDRAWALS')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'WITHDRAWALS' ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
              <ArrowUpRight className="w-4 h-4" /> Gestión de Retiros
          </button>
      </div>

      {activeTab === 'DEPOSITS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulario Deposito (Solo Admin) */}
            {isAdmin && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-fit">
                    <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <Plus className="w-4 h-4 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full p-0.5" /> Nuevo Ingreso
                    </h4>
                    <form onSubmit={handleDeposit} className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Socio</label>
                            <select 
                                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                                value={newDeposit.partnerId}
                                onChange={e => setNewDeposit({...newDeposit, partnerId: e.target.value})}
                            >
                                <option value="">Seleccionar Socio...</option>
                                {partners.map(p => <option key={p.partnerId} value={p.partnerId}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Monto (COP)</label>
                            <input 
                                type="number" 
                                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="0"
                                required
                                value={newDeposit.amount || ''}
                                onChange={e => setNewDeposit({...newDeposit, amount: parseFloat(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Descripción</label>
                            <input 
                                type="text" 
                                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ej: Aporte capital octubre"
                                value={newDeposit.desc}
                                onChange={e => setNewDeposit({...newDeposit, desc: e.target.value})}
                            />
                        </div>
                        <button className="w-full bg-slate-900 dark:bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-blue-700 shadow-lg transition-all active:scale-95">Registrar Depósito</button>
                    </form>
                </div>
            )}

            {/* Lista Depósitos */}
            <div className={`${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-medium">
                            <tr>
                                <th className="px-6 py-3">Fecha</th>
                                <th className="px-6 py-3">Socio</th>
                                <th className="px-6 py-3">Descripción</th>
                                <th className="px-6 py-3 text-right">Monto</th>
                                {isAdmin && <th className="px-6 py-3 text-center">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredFunds.map(fund => (
                                <tr key={fund.fundId} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                    <td className="px-6 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{fund.date}</td>
                                    <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">
                                        <span className="bg-slate-100 dark:bg-slate-600 px-2 py-1 rounded text-xs border border-slate-200 dark:border-slate-500">
                                            {partners.find(p => p.partnerId === fund.partnerId)?.name || 'General'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{fund.description}</td>
                                    <td className="px-6 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(fund.amountCOP)}</td>
                                    {isAdmin && (
                                        <td className="px-6 py-3 text-center">
                                            <div className="flex justify-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEditModal(fund, 'FUND')} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 rounded transition-colors">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(fund.fundId)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-700 rounded transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {filteredFunds.length === 0 && (
                                <tr><td colSpan={5} className="text-center py-8 text-slate-400">No se encontraron depósitos con estos filtros.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'WITHDRAWALS' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
             <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-medium">
                        <tr>
                            <th className="px-6 py-3">Fecha Solicitud</th>
                            <th className="px-6 py-3">Socio</th>
                            <th className="px-6 py-3 text-right">Monto Solicitado</th>
                            <th className="px-6 py-3 text-center">Estado</th>
                            <th className="px-6 py-3 text-center">Comprobante</th>
                            {isAdmin && <th className="px-6 py-3 text-center bg-slate-100/50 dark:bg-slate-800/50">Acciones</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredWithdrawals.map(w => (
                            <tr key={w.withdrawalId} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                <td className="px-6 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{w.date}</td>
                                <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">
                                    <span className="bg-slate-100 dark:bg-slate-600 px-2 py-1 rounded text-xs border border-slate-200 dark:border-slate-500">
                                        {partners.find(p => p.partnerId === w.partnerId)?.name}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-right font-bold text-slate-800 dark:text-slate-200">{formatCurrency(w.amountCOP)}</td>
                                <td className="px-6 py-3 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                                        w.status === 'PAID' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800' :
                                        w.status === 'REJECTED' ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-800' :
                                        w.status === 'APPROVED' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800' :
                                        'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800 animate-pulse'
                                    }`}>
                                        {w.status === 'PAID' ? 'PAGADO' : w.status === 'APPROVED' ? 'APROBADO' : w.status === 'REQUESTED' ? 'PENDIENTE' : 'RECHAZADO'}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-center">
                                    {w.receiptUrl ? (
                                        <a href={w.receiptUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                                            <ImageIcon className="w-3 h-3" /> Ver
                                        </a>
                                    ) : (
                                        <span className="text-slate-300 text-xs">-</span>
                                    )}
                                </td>
                                {isAdmin && (
                                    <td className="px-6 py-3 text-center bg-slate-50/30 dark:bg-slate-800/30">
                                        <button 
                                            onClick={() => openEditModal(w, 'WITHDRAWAL')}
                                            className="p-1.5 bg-white dark:bg-slate-700 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 dark:border-slate-600 rounded transition-all shadow-sm"
                                            title="Editar / Gestionar Comprobante"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                         {filteredWithdrawals.length === 0 && (
                            <tr><td colSpan={isAdmin ? 6 : 5} className="text-center py-8 text-slate-400">No hay solicitudes de retiro con estos filtros.</td></tr>
                        )}
                    </tbody>
                 </table>
             </div>
          </div>
      )}

      {/* --- MODAL DE EDICIÓN --- */}
      {isEditModalOpen && editFormData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        {editingType === 'FUND' ? 'Editar Depósito' : 'Gestionar Retiro'}
                    </h3>
                    <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto">
                    
                    {/* Campos Comunes */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Fecha</label>
                            <input 
                                type="date"
                                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                value={editFormData.date}
                                onChange={e => setEditFormData({...editFormData, date: e.target.value})}
                            />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Monto (COP)</label>
                            <input 
                                type="number"
                                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold"
                                value={editFormData.amountCOP}
                                onChange={e => setEditFormData({...editFormData, amountCOP: parseFloat(e.target.value)})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Socio</label>
                        <select 
                            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                            value={editFormData.partnerId}
                            onChange={e => setEditFormData({...editFormData, partnerId: e.target.value})}
                        >
                             {partners.map(p => <option key={p.partnerId} value={p.partnerId}>{p.name}</option>)}
                        </select>
                    </div>

                    {/* Campos Específicos DEPÓSITO */}
                    {editingType === 'FUND' && (
                        <div>
                             <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Descripción</label>
                             <input 
                                type="text"
                                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                value={editFormData.description}
                                onChange={e => setEditFormData({...editFormData, description: e.target.value})}
                            />
                        </div>
                    )}

                    {/* Campos Específicos RETIRO */}
                    {editingType === 'WITHDRAWAL' && (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Estado</label>
                                <select 
                                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-medium"
                                    value={editFormData.status}
                                    onChange={e => setEditFormData({...editFormData, status: e.target.value})}
                                >
                                    <option value="REQUESTED">PENDIENTE (Requested)</option>
                                    <option value="APPROVED">APROBADO (Por Pagar)</option>
                                    <option value="PAID">PAGADO (Completado)</option>
                                    <option value="REJECTED">RECHAZADO</option>
                                </select>
                            </div>

                            {/* Sección Comprobante */}
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Comprobante de Pago</label>
                                
                                <div className="space-y-3">
                                    {/* Opción 1: URL */}
                                    <div>
                                        <input 
                                            type="text" 
                                            placeholder="Pegar URL del comprobante..." 
                                            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                            value={editFormData.receiptUrl || ''}
                                            onChange={e => setEditFormData({...editFormData, receiptUrl: e.target.value})}
                                        />
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 uppercase font-bold justify-center">O</div>

                                    {/* Opción 2: Carga Simulada */}
                                    <div className="flex items-center gap-2">
                                        <label className="flex-1 cursor-pointer bg-slate-50 dark:bg-slate-700 border border-dashed border-slate-300 dark:border-slate-500 rounded-lg p-3 flex flex-col items-center justify-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                                            <ImageIcon className="w-5 h-5 text-slate-400" />
                                            <span className="text-xs text-slate-500">Cargar Imagen (Simulado)</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleReceiptUpload} />
                                        </label>
                                    </div>

                                    {editFormData.receiptUrl && (
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100 dark:border-blue-800 flex items-center justify-between">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                                <span className="text-xs text-blue-700 dark:text-blue-300 truncate max-w-[200px]">Comprobante adjunto</span>
                                            </div>
                                            <a href={editFormData.receiptUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:underline">Ver</a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    <div className="flex justify-end pt-4 gap-2">
                        <button 
                            type="button"
                            onClick={() => setIsEditModalOpen(false)}
                            className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none"
                        >
                            <Save className="w-4 h-4" /> Guardar Cambios
                        </button>
                    </div>

                </form>
            </div>
        </div>
      )}

    </div>
  );
};
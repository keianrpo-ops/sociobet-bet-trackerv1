import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, ReferenceLine } from 'recharts';
import { Bet, Partner, Fund, Withdrawal } from '../types';
import { formatCurrency, calculateDashboardStats, generateLedger, generateProfessionalReport } from '../utils/calculations';
import { Wallet, Activity, TrendingUp, Briefcase, Download, Upload, ArrowDownCircle, ArrowUpCircle, Target, Users, Trophy, DollarSign, PiggyBank, Calendar } from 'lucide-react';

interface DashboardProps {
  bets: Bet[];
  partners: Partner[];
  funds: Fund[];
  withdrawals: Withdrawal[];
  selectedPartnerId: string | 'ALL'; 
  isDarkMode: boolean;
  onOpenBulkImport: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
    bets, 
    partners, 
    funds, 
    withdrawals,
    selectedPartnerId, 
    isDarkMode, 
    onOpenBulkImport 
}) => {
  // State for Report Export
  const [reportDateFrom, setReportDateFrom] = useState('');
  const [reportDateTo, setReportDateTo] = useState('');

  const stats = useMemo(() => 
    calculateDashboardStats(bets, partners, selectedPartnerId, funds, withdrawals), 
  [bets, partners, selectedPartnerId, funds, withdrawals]);

  // Chart Data: Cumulative Profit over Time (Net Profit)
  const chartData = useMemo(() => {
    const data: any[] = [];
    let runningBalance = 0;
    
    // Create a chronological list of ALL movements (funds + bets)
    const ledger = generateLedger(bets, funds, withdrawals, selectedPartnerId, partners);
    
    // Reverse ledger (which comes new->old) to old->new for charting
    const chronological = [...ledger].reverse();

    chronological.forEach(item => {
        data.push({
            date: item.date,
            balance: item.runningBalance,
            description: item.description
        });
    });
    
    // Limit points for performance if too many
    return data.length > 50 ? data.filter((_, i) => i % Math.ceil(data.length / 50) === 0) : data;
  }, [bets, funds, withdrawals, selectedPartnerId, partners]);

  // Bar Chart Data: Profit per Partner (Only for Global View)
  const partnersPerformance = useMemo(() => {
     if (selectedPartnerId !== 'ALL') return [];
     
     return partners.filter(p => p.partnerId !== 'P001').map(p => {
         const pStats = calculateDashboardStats(bets, partners, p.partnerId, funds, withdrawals);
         return {
             name: p.name,
             profit: pStats.grossProfit, // Total generated
             commission: pStats.netProfitAdmin, // Admin share
             net: pStats.netProfitPartner // Partner share
         };
     }).sort((a,b) => b.profit - a.profit);
  }, [bets, partners, funds, withdrawals, selectedPartnerId]);

  const handleExport = () => {
     const partnerName = selectedPartnerId === 'ALL' ? 'Global' : partners.find(p => p.partnerId === selectedPartnerId)?.name || 'Socio';
     generateProfessionalReport(
         bets.filter(b => selectedPartnerId === 'ALL' || b.partnerId === selectedPartnerId), 
         partnerName,
         reportDateFrom,
         reportDateTo
     );
  };

  const isGlobal = selectedPartnerId === 'ALL';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* 1. KPIs Principales - ESTILO 3D/PREMIUM */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Card 1: Capital Base */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300 shadow-xl shadow-slate-200/50 dark:shadow-none">
            {/* 3D Bottom Border */}
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-slate-400 to-slate-600"></div>
            
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-slate-100 dark:bg-slate-700 rounded-full opacity-50 blur-2xl group-hover:opacity-100 transition-opacity"></div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl text-white shadow-lg shadow-slate-500/30">
                        <PiggyBank className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600">
                        Depósitos: {formatCurrency(stats.totalDeposited)}
                    </span>
                </div>
                <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Capital Activo</h3>
                <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                    {formatCurrency(stats.totalDeposited - stats.totalWithdrawn)}
                </p>
            </div>
        </div>

        {/* Card 2: Utilidad Generada */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300 shadow-xl shadow-emerald-500/10 dark:shadow-none">
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 dark:bg-emerald-900/30 rounded-full opacity-50 blur-2xl group-hover:opacity-100 transition-opacity"></div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl text-white shadow-lg shadow-emerald-500/30">
                        <Activity className="w-6 h-6" />
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${stats.roi >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                        ROI: {stats.roi.toFixed(2)}%
                    </span>
                </div>
                <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Utilidad Generada</h3>
                <p className={`text-3xl font-black tracking-tight ${stats.grossProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {stats.grossProfit > 0 ? '+' : ''}{formatCurrency(stats.grossProfit)}
                </p>
                <div className="mt-4 w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-1000" style={{width: `${stats.winRate}%`}}></div>
                </div>
                <div className="flex justify-between mt-1 text-[10px] font-bold text-slate-400 uppercase">
                    <span>Win Rate</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{stats.winRate.toFixed(1)}%</span>
                </div>
            </div>
        </div>

        {/* Card 3: Saldo Real */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/50 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300 shadow-2xl shadow-blue-500/20">
             <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
             <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-100 dark:bg-blue-900/40 rounded-full blur-3xl opacity-60"></div>

             <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl text-white shadow-lg shadow-blue-500/30">
                        <Wallet className="w-6 h-6" />
                    </div>
                </div>
                <h3 className="text-blue-500 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">Disponible Real (Bookie)</h3>
                <p className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{formatCurrency(stats.currentBalance)}</p>
                
                <div className="mt-4 flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                     <span className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                        <Target className="w-3 h-3" /> En Juego
                     </span>
                     <span className="text-sm font-black text-slate-700 dark:text-white">{formatCurrency(stats.pendingExposure)}</span>
                </div>
            </div>
        </div>

        {/* Card 4: Comisión Admin */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300 shadow-xl shadow-purple-500/10 dark:shadow-none">
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-400 to-purple-600"></div>
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-50 dark:bg-purple-900/30 rounded-full opacity-50 blur-2xl group-hover:opacity-100 transition-opacity"></div>

             <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl text-white shadow-lg shadow-purple-500/30">
                        <Trophy className="w-6 h-6" />
                    </div>
                    {!isGlobal && (
                        <span className="text-xs font-bold bg-purple-100 text-purple-700 px-3 py-1 rounded-full border border-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-800">
                           {partners.find(p => p.partnerId === selectedPartnerId)?.partnerProfitPct}% Part.
                        </span>
                    )}
                </div>
                <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                    {isGlobal ? 'Comisión Admin Total' : 'Comisión Admin'}
                </h3>
                <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                    {formatCurrency(stats.netProfitAdmin)}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs font-medium">
                     <span className="text-slate-400">Socio Gana</span>
                     <span className="text-purple-600 font-bold">{formatCurrency(stats.netProfitPartner)}</span>
                </div>
            </div>
        </div>

      </div>

      {/* TOOLBAR: EXPORT & FILTERS */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="font-bold uppercase text-xs">Rango del Reporte:</span>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1">
                  <Calendar className="w-3 h-3" />
                  <input 
                    type="date" 
                    className="bg-transparent border-none text-xs focus:ring-0 text-slate-700 dark:text-white p-0 w-24"
                    value={reportDateFrom}
                    onChange={(e) => setReportDateFrom(e.target.value)}
                  />
                  <span>-</span>
                  <input 
                    type="date" 
                    className="bg-transparent border-none text-xs focus:ring-0 text-slate-700 dark:text-white p-0 w-24"
                    value={reportDateTo}
                    onChange={(e) => setReportDateTo(e.target.value)}
                  />
              </div>
          </div>
          
          <div className="flex gap-3">
            <button 
                onClick={onOpenBulkImport}
                className="bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors shadow-lg shadow-slate-300 dark:shadow-none"
            >
                <Upload className="w-3 h-3" /> Carga Masiva
            </button>
            <button 
                onClick={handleExport}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border border-transparent px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5"
            >
                <Download className="w-3 h-3" /> Exportar Reporte Pro
            </button>
          </div>
      </div>

      {/* 2. Gráficos y Desglose */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chart Principal - ESTILO PREMIUM */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700">
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Curva de Rendimiento</h3>
                    <p className="text-xs text-slate-500">Crecimiento del capital en el tiempo</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> En alza
                </div>
             </div>
             
             <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                            {/* Filter for Drop Shadow on Line */}
                            <filter id="shadow" height="200%">
                                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.3"/>
                            </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                        <XAxis 
                            dataKey="date" 
                            tick={{fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b'}} 
                            axisLine={false} 
                            tickLine={false}
                            minTickGap={40}
                            dy={10}
                        />
                        <YAxis 
                            tick={{fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b'}} 
                            axisLine={false} 
                            tickLine={false}
                            tickFormatter={(val) => `$${val/1000}k`}
                            dx={-10}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                borderRadius: '12px', 
                                border: 'none', 
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', 
                                backgroundColor: isDarkMode ? '#1e293b' : 'rgba(255,255,255,0.95)', 
                                color: isDarkMode ? '#fff' : '#000',
                                padding: '12px'
                            }}
                            itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                            formatter={(value: number) => [formatCurrency(value), 'Saldo']}
                            cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="balance" 
                            stroke="#3b82f6" 
                            strokeWidth={4}
                            fillOpacity={1} 
                            fill="url(#colorBalance)" 
                            filter="url(#shadow)"
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Desglose Lateral */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
             <div className="flex items-center gap-2 mb-6">
                 <div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm">
                    <Users className="w-5 h-5 text-blue-500" />
                 </div>
                 <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">Rentabilidad por Socio</h3>
                    <p className="text-[10px] text-slate-500">Desglose de utilidad neta</p>
                 </div>
             </div>
             
             <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                 {(isGlobal ? partnersPerformance : [
                     {
                         name: partners.find(p => p.partnerId === selectedPartnerId)?.name || '',
                         profit: stats.grossProfit,
                         commission: stats.netProfitAdmin,
                         net: stats.netProfitPartner,
                         roi: stats.roi,
                         share: partners.find(p => p.partnerId === selectedPartnerId)?.partnerProfitPct
                     }
                 ]).map((p: any, idx) => (
                     <div key={idx} className="bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 hover:shadow-md transition-shadow">
                         <div className="flex justify-between items-start mb-2">
                             <div className="flex items-center gap-2">
                                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-600 dark:to-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shadow-inner">
                                     {p.name.substring(0,2).toUpperCase()}
                                 </div>
                                 <div>
                                     <h4 className="font-bold text-sm text-slate-800 dark:text-white leading-tight">{p.name}</h4>
                                     <div className="flex gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                                        {!isGlobal && (
                                            <>
                                                <span>ROI: <strong className={p.roi >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{p.roi?.toFixed(1)}%</strong></span>
                                                <span>• {p.share}% Comm.</span>
                                            </>
                                        )}
                                     </div>
                                 </div>
                             </div>
                             {/* Show TOTAL Generated in global view just to be clear */}
                             {!isGlobal && (
                                 <div className="text-right">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold">Total Gen.</span>
                                    <p className={`font-bold text-sm ${p.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                                        {formatCurrency(p.profit)}
                                    </p>
                                 </div>
                             )}
                         </div>

                         {/* 3D Progress Bar Split */}
                         <div className="relative h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2 shadow-inner">
                             <div 
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-sm" 
                                style={{ width: `${p.profit > 0 ? (p.net / p.profit) * 100 : 0}%` }}
                             ></div>
                         </div>
                         
                         <div className="flex justify-between text-xs font-medium">
                             <div className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-800/50">
                                 <span className="text-[9px] uppercase opacity-70">Neto Socio</span>
                                 <div className="font-bold">{formatCurrency(p.net)}</div>
                             </div>
                             <div className="text-right text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-800/50">
                                 <span className="text-[9px] uppercase opacity-70">Admin</span>
                                 <div className="font-bold">{formatCurrency(p.commission)}</div>
                             </div>
                         </div>
                     </div>
                 ))}
                 
                 {isGlobal && partnersPerformance.length === 0 && (
                     <p className="text-center text-xs text-slate-400 py-4">No hay actividad registrada aún.</p>
                 )}
             </div>
          </div>
      </div>
    </div>
  );
};
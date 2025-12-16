import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { BetTable } from './components/BetTable';
import { AddBetModal } from './components/AddBetModal';
import { BulkImportModal } from './components/BulkImportModal';
import { CreatePartnerModal } from './components/CreatePartnerModal'; 
import { PartnerList } from './components/PartnerList'; 
import { ContractModal } from './components/ContractModal'; 
import { Funds } from './components/Funds'; 
import { Messages } from './components/Messages';
import { Toast } from './components/Toast'; 
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { sheetApi } from './services/sheetApi'; 
import { Bet, Partner, BetStatus, Message, Fund, Withdrawal } from './types';
import { calculateBetOutcome, formatCurrency, calculateDashboardStats } from './utils/calculations';
import { LayoutDashboard, List, DollarSign, LogOut, RefreshCw, UserCircle, Menu, X, Moon, Sun, Mail, Users, Key, Loader2, Database, WifiOff, Settings } from 'lucide-react';

// --- Utils: LocalStorage (Cache para velocidad) ---
const loadState = <T,>(key: string, fallback: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (e) {
        return fallback;
    }
};

const saveState = (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value));
};

// --- Components for Layout ---

const SidebarItem = ({ to, icon: Icon, label, onClick }: any) => (
  <NavLink 
    to={to} 
    onClick={onClick}
    className={({ isActive }) => 
      `flex items-center gap-3 px-4 py-3 rounded-lg transition-all mb-1 ${
        isActive 
          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-200/50 font-semibold' 
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
      }`
    }
  >
    <Icon className="w-5 h-5" />
    <span className="">{label}</span>
  </NavLink>
);

const Layout = ({ children, user, onLogout, onSync, isDarkMode, toggleTheme, isSyncing, isDemoMode, onOpenProfile }: any) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={`flex h-screen bg-[#f0f2f5] dark:bg-slate-900 overflow-hidden font-sans transition-colors duration-300`}>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 shadow-xl lg:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 dark:bg-slate-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-slate-300 dark:shadow-none">
            SB
          </div>
          <span className="font-bold text-xl text-slate-800 dark:text-white tracking-tight">SocioBet</span>
          <button className="lg:hidden ml-auto" onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto space-y-1">
          <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 mt-2">Menú Principal</p>
          <SidebarItem to="/" icon={LayoutDashboard} label="Panel Principal" onClick={() => setSidebarOpen(false)} />
          <SidebarItem to="/bets" icon={List} label="Apuestas" onClick={() => setSidebarOpen(false)} />
          <SidebarItem to="/funds" icon={DollarSign} label="Fondos y Retiros" onClick={() => setSidebarOpen(false)} />
          <SidebarItem to="/messages" icon={Mail} label="Mensajes" onClick={() => setSidebarOpen(false)} />
          
          {user.role === 'ADMIN' && (
              <>
                <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 mt-6">Administración</p>
                <SidebarItem to="/partners" icon={Users} label="Gestión de Socios" onClick={() => setSidebarOpen(false)} />
              </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
           <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl mb-3 shadow-sm relative group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors" onClick={onOpenProfile}>
             <div className="bg-slate-100 dark:bg-slate-600 p-1 rounded-full">
                <UserCircle className="w-8 h-8 text-slate-500 dark:text-slate-300" />
             </div>
             <div className="overflow-hidden flex-1">
               <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user.name}</p>
               <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.role === 'ADMIN' ? 'Administrador' : 'Socio'}</p>
             </div>
             <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Settings className="w-4 h-4 text-slate-400" />
             </div>
           </div>
           
           <div className="flex gap-2">
                <button 
                    onClick={onOpenProfile}
                    className="flex-1 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 text-xs font-bold py-2.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
                    title="Configuración de Perfil"
                >
                    <Settings className="w-4 h-4" /> Configurar
                </button>
                <button 
                    onClick={onLogout}
                    className="flex-1 flex items-center justify-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold py-2.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors border border-transparent hover:border-rose-100 dark:hover:border-rose-800"
                    title="Cerrar Sesión"
                >
                    <LogOut className="w-4 h-4" /> Salir
                </button>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <header className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 h-16 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm transition-colors duration-300">
          <button 
            className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-200"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="ml-auto flex items-center gap-4">
             {/* Local Mode Badge */}
             {isDemoMode && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-full">
                    <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Modo Local (Datos en navegador)</span>
                </div>
             )}

             {/* Dark Mode Toggle */}
             <button 
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium text-xs border border-slate-200 dark:border-slate-600"
             >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
                <span className="hidden sm:inline">{isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
             </button>

             <button 
              onClick={onSync}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-bold transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed
                ${isDemoMode 
                    ? 'bg-amber-100 border-amber-200 text-amber-800 dark:bg-amber-900 dark:border-amber-800 dark:text-amber-100 hover:bg-amber-200' 
                    : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600'
                }`}
             >
               <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /> 
               <span className="hidden sm:inline">{isSyncing ? 'Conectando...' : (isDemoMode ? 'Reconectar' : 'Sincronizar')}</span>
             </button>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
           {isSyncing && (
               <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px] z-20 flex items-center justify-center animate-in fade-in">
                   <div className="bg-white dark:bg-slate-800 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 border border-slate-200 dark:border-slate-700">
                       <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                       <div>
                           <h4 className="font-bold text-slate-800 dark:text-white">Conectando con Google Sheets...</h4>
                           <p className="text-xs text-slate-500">Verificando configuración de nube</p>
                       </div>
                   </div>
               </div>
           )}
           <div className="max-w-7xl mx-auto pb-10">
              {children}
           </div>
        </div>
      </main>
    </div>
  );
};

// --- Main App Logic ---

const App: React.FC = () => {
  // Inicializamos vacíos o con caché localStorage
  const [bets, setBets] = useState<Bet[]>(() => loadState('sb_bets', []));
  const [funds, setFunds] = useState<Fund[]>(() => loadState('sb_funds', []));
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(() => loadState('sb_withdrawals', []));
  const [messages, setMessages] = useState<Message[]>(() => loadState('sb_messages', []));
  const [partners, setPartners] = useState<Partner[]>(() => loadState('sb_partners', []));

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState({ name: '', role: 'ADMIN', partnerId: '' });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false); // New State for Safety
  
  // Login Inputs
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [betToEdit, setBetToEdit] = useState<Bet | null>(null);
  
  const [toast, setToast] = useState<{message: string, sender: string} | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<string>('ALL');
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('theme') === 'dark' || 
               (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // --- API SYNC FUNCTION ---
  const performSync = async () => {
      setIsSyncing(true);
      try {
          const data = await sheetApi.syncAll();
          
          if (data === null) {
              // DETECTADO ERROR 503: Faltan credenciales.
              setIsDemoMode(true);
              if (isAuthenticated) {
                 setToast({ message: "Modo Local: Tus datos se guardan en este navegador.", sender: "Sin Conexión a Nube" });
              }
          } else {
              // Éxito: Tenemos datos de la nube, actualizamos local
              setPartners(data.partners);
              setBets(data.bets);
              setFunds(data.funds);
              setWithdrawals(data.withdrawals);
              setMessages(data.messages);

              // Actualizar Caché Local
              saveState('sb_partners', data.partners);
              saveState('sb_bets', data.bets);
              saveState('sb_funds', data.funds);
              saveState('sb_withdrawals', data.withdrawals);
              saveState('sb_messages', data.messages);
              
              setIsDemoMode(false);
          }

      } catch (error) {
          console.error("Error crítico de sincronización:", error);
          setToast({ message: "Error de red. Usando datos locales.", sender: "Sistema" });
          setIsDemoMode(true);
      } finally {
          setIsSyncing(false);
      }
  };

  // Sync inicial al montar
  useEffect(() => {
      performSync();
  }, []);
  
  // Guardar en localStorage cada vez que cambia algo (Para modo local robusto)
  useEffect(() => { saveState('sb_partners', partners); }, [partners]);
  useEffect(() => { saveState('sb_bets', bets); }, [bets]);
  useEffect(() => { saveState('sb_funds', funds); }, [funds]);
  useEffect(() => { saveState('sb_withdrawals', withdrawals); }, [withdrawals]);
  useEffect(() => { saveState('sb_messages', messages); }, [messages]);

  useEffect(() => {
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // --- LOGIN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    // Fallback: Si la hoja está vacía (o modo local inicial), permitir entrar como Admin
    if (partners.length === 0 && loginUsername === 'admin' && loginPassword === '123') {
         // Crear el perfil Admin
         const adminProfile: Partner = { 
            partnerId: 'P001', 
            name: 'Admin Usuario', 
            status: 'ACTIVE', 
            partnerProfitPct: 100, 
            username: 'admin', 
            password: '123',
            email: 'admin@sociobet.com',
            joinedDate: new Date().toISOString().split('T')[0],
            contractAccepted: true 
         };
         
         // Actualizar Estado Local
         setPartners([adminProfile]);
         setUser({ name: 'Admin', role: 'ADMIN', partnerId: 'P001' });
         setSelectedPartner('ALL');
         setIsAuthenticated(true);

         // AUTO-INICIALIZAR NUBE (Importante para que la próxima vez cargue del Excel)
         if (!isDemoMode) {
             try {
                await sheetApi.savePartner(adminProfile);
                setToast({ message: "Base de datos inicializada con usuario Admin.", sender: "SocioBet Cloud" });
             } catch(err) {
                console.error("Error autoinicializando admin", err);
             }
         }
         return;
    }

    const matchedPartner = partners.find(p => p.username === loginUsername && p.password === loginPassword);

    if (matchedPartner) {
        if (matchedPartner.partnerId === 'P001' || matchedPartner.username === 'admin') { 
             setUser({ name: matchedPartner.name, role: 'ADMIN', partnerId: matchedPartner.partnerId });
             setSelectedPartner('ALL');
        } else {
             setUser({ name: matchedPartner.name, role: 'PARTNER', partnerId: matchedPartner.partnerId });
             setSelectedPartner(matchedPartner.partnerId);
        }
        setIsAuthenticated(true);
    } else {
        setLoginError('Usuario o contraseña incorrectos');
    }
  };

  // --- CREAR / EDITAR PARTNER ---
  const handleCreatePartner = async (newPartner: Partner) => {
      const exists = partners.find(p => p.partnerId === newPartner.partnerId);
      
      if (exists) {
          setPartners(prev => prev.map(p => p.partnerId === newPartner.partnerId ? newPartner : p));
          await sheetApi.updatePartner(newPartner);
          
          // Si me actualicé a mí mismo, actualizar estado de usuario
          if (user.partnerId === newPartner.partnerId) {
             setUser(prev => ({ ...prev, name: newPartner.name }));
          }
      } else {
          setPartners(prev => [...prev, newPartner]);
          await sheetApi.savePartner(newPartner);
      }
  };

  const handleAcceptContract = async () => {
      if (user.role === 'PARTNER') {
          const updatedPartner = partners.find(p => p.partnerId === user.partnerId);
          if (updatedPartner) {
              const accepted = { 
                  ...updatedPartner, 
                  contractAccepted: true, 
                  contractAcceptedDate: new Date().toISOString().split('T')[0] 
              };
              setPartners(prev => prev.map(p => p.partnerId === user.partnerId ? accepted : p));
              await sheetApi.updatePartner(accepted);
          }
      }
  };

  // --- BETS ---
  const handleSaveBet = async (betData: any) => {
    let newBetObj: Bet | null = null;

    if (betToEdit) {
        const updatedBets = bets.map(b => {
            if (b.betId === betToEdit.betId) {
                const partner = partners.find(p => p.partnerId === betData.partnerId);
                const updatedBase = { ...b, ...betData }; 
                const outcome = calculateBetOutcome(updatedBase, partner?.partnerProfitPct || 50);
                
                const final = { 
                    ...updatedBase, 
                    finalReturnCOP: outcome.finalReturn,
                    profitGrossCOP: outcome.profitGross,
                    profitPartnerCOP: outcome.profitPartner,
                    profitAdminCOP: outcome.profitAdmin
                };
                newBetObj = final;
                return final;
            }
            return b;
        });
        setBets(updatedBets);
        if (newBetObj) await sheetApi.updateBet(newBetObj);
        setBetToEdit(null);
    } else {
        const newBet: Bet = {
          ...betData,
          betId: `B-${Date.now()}`,
          expectedReturnCOP: betData.stakeCOP * betData.oddsDecimal,
          status: 'PENDING'
        };
        setBets([newBet, ...bets]);
        await sheetApi.saveBet(newBet);
    }
    setIsModalOpen(false);
  };

  const handleUpdateBetStatus = async (betId: string, newStatus: BetStatus, cashoutVal?: number) => {
      let targetBet: Bet | undefined;

      const updatedBets = bets.map(bet => {
          if (bet.betId === betId) {
             const updatedBet = { ...bet, status: newStatus, cashoutReturnCOP: cashoutVal };
             const partner = partners.find(p => p.partnerId === bet.partnerId);
             const outcome = calculateBetOutcome(updatedBet, partner?.partnerProfitPct || 50);
             const resolvedBet = { 
                 ...updatedBet, 
                 finalReturnCOP: outcome.finalReturn,
                 profitGrossCOP: outcome.profitGross,
                 profitPartnerCOP: outcome.profitPartner,
                 profitAdminCOP: outcome.profitAdmin
             };
             targetBet = resolvedBet;
             return resolvedBet;
          }
          return bet;
      });
      
      setBets(updatedBets);
      
      if (targetBet) {
          await sheetApi.updateBet(targetBet);
      }
  };

  const handleBulkImport = async (newBetsData: any[]) => {
     const newBets = newBetsData.map((b, i) => ({
        ...b,
        betId: `B-IMP-${Date.now()}-${i}`,
        expectedReturnCOP: b.stakeCOP * b.oddsDecimal
     }));
     
     setBets([...newBets, ...bets]);
     
     for (const b of newBets) {
         await sheetApi.saveBet(b);
     }
  };

  // --- FUNDS ---
  const handleAddFund = async (newFund: Fund) => {
      setFunds(prev => [newFund, ...prev]);
      await sheetApi.saveFund(newFund);
  };

  const handleUpdateWithdrawal = async (updatedWithdrawal: Withdrawal) => {
      setWithdrawals(prev => prev.map(w => w.withdrawalId === updatedWithdrawal.withdrawalId ? updatedWithdrawal : w));
      await sheetApi.updateWithdrawal(updatedWithdrawal);
  };

  const handleUpdateFund = async (updatedFund: Fund) => {
      setFunds(prev => prev.map(f => f.fundId === updatedFund.fundId ? updatedFund : f));
      await sheetApi.updateFund(updatedFund);
  };

  const handleDeleteFund = (fundId: string) => {
      setFunds(funds.filter(f => f.fundId !== fundId));
      // NOTE: Deletion is not fully implemented in Cloud API to avoid data loss, just local for now or soft delete.
  };

  // --- MESSAGES ---
  const handleSendMessage = async (msgData: { partnerId: string, subject: string, body: string }) => {
      const senderName = user.role === 'ADMIN' ? 'Administrador' : user.name;
      const isFromAdmin = user.role === 'ADMIN';

      const newMessage: Message = {
          messageId: `M-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          partnerId: msgData.partnerId,
          senderName: senderName,
          subject: msgData.subject || 'Chat', 
          message: msgData.body,
          status: 'UNREAD', 
          isFromAdmin: isFromAdmin
      };
      setMessages(prev => [...prev, newMessage]); 
      await sheetApi.saveMessage(newMessage);
  };

  const handleMarkRead = async (messageId: string) => {
      const target = messages.find(m => m.messageId === messageId);
      if (target && target.status === 'UNREAD') {
          const updated = { ...target, status: 'READ' as const };
          setMessages(prev => prev.map(m => m.messageId === messageId ? updated : m));
          await sheetApi.updateMessage(updated);
      }
  };

  // --- RENDER ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 dark:border-slate-700">
          <div className="text-center mb-8">
             <div className="w-14 h-14 bg-slate-900 dark:bg-slate-700 rounded-2xl mx-auto flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-lg shadow-slate-300 dark:shadow-none">SB</div>
             <h1 className="text-2xl font-bold text-slate-800 dark:text-white">SocioBet</h1>
             <p className="text-slate-500 dark:text-slate-400">Plataforma de Gestión</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
                <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm text-center border border-rose-100 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-300">
                    {loginError}
                </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Usuario</label>
              <div className="relative">
                 <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                 <input 
                    type="text" 
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Ej: admin"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50 dark:bg-slate-700 dark:text-white" 
                 />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Contraseña</label>
              <div className="relative">
                 <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                 <input 
                    type="password" 
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50 dark:bg-slate-700 dark:text-white" 
                 />
              </div>
            </div>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg transition-all shadow-lg shadow-blue-200 dark:shadow-none transform active:scale-95 mt-2 flex justify-center items-center gap-2">
               {isSyncing ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Iniciar Sesión'}
            </button>
          </form>

          {partners.length === 0 && !isSyncing && (
             <div className="mt-6 text-center bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-800">
                 <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1 flex justify-center items-center gap-1">
                    <Database className="w-3 h-3" /> Base de datos vacía
                 </p>
                 <p className="text-[10px] text-amber-600 dark:text-amber-500 mb-2">
                     Ingresa como <b>admin / 123</b> para inicializar la nube.
                 </p>
             </div>
          )}
        </div>
      </div>
    );
  }

  // --- CONTRACT CHECK ---
  const currentPartner = partners.find(p => p.partnerId === user.partnerId);
  const showContract = user.role === 'PARTNER' && currentPartner && !currentPartner.contractAccepted;

  if (showContract && currentPartner) {
      return (
          <ContractModal 
            partner={currentPartner} 
            onAccept={handleAcceptContract} 
            onLogout={() => { setIsAuthenticated(false); setLoginPassword(''); }} 
          />
      );
  }

  const visibleBets = user.role === 'PARTNER' ? bets.filter(b => b.partnerId === user.partnerId) : bets;
  const visiblePartners = user.role === 'PARTNER' ? partners.filter(p => p.partnerId === user.partnerId) : partners;
  
  return (
    <HashRouter>
      <Layout 
        user={user} 
        onLogout={() => { setIsAuthenticated(false); setLoginPassword(''); }} 
        onSync={performSync}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        isSyncing={isSyncing}
        isDemoMode={isDemoMode}
        onOpenProfile={() => setIsProfileOpen(true)}
      >
        {toast && <Toast message={toast.message} sender={toast.sender} onClose={() => setToast(null)} />}
        
        {isModalOpen && (
            <AddBetModal 
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setBetToEdit(null); }}
                onSave={handleSaveBet}
                partners={visiblePartners}
                currentUserRole={user.role as any}
                initialData={betToEdit}
            />
        )}

        {isBulkImportOpen && (
            <BulkImportModal 
                isOpen={isBulkImportOpen}
                onClose={() => setIsBulkImportOpen(false)}
                onImport={handleBulkImport}
                partners={visiblePartners}
            />
        )}

        {/* MODAL PERFIL - SEGURO */}
        {isProfileOpen && currentPartner && (
            <ProfileSettingsModal 
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                currentUser={currentPartner}
                onUpdateProfile={handleCreatePartner}
            />
        )}

        <Routes>
          <Route path="/" element={
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                   <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Panel Principal</h1>
                   <p className="text-slate-500 dark:text-slate-400">
                       {user.role === 'ADMIN' ? 'Visión general del negocio' : `Hola ${user.name}, este es tu resumen`}
                   </p>
                </div>
                {user.role === 'ADMIN' && (
                    <div className="flex gap-2">
                    <select 
                        className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium shadow-sm"
                        value={selectedPartner}
                        onChange={(e) => setSelectedPartner(e.target.value)}
                    >
                        <option value="ALL">Todos los Socios</option>
                        {partners.filter(p => p.partnerId !== 'P001').map(p => <option key={p.partnerId} value={p.partnerId}>{p.name}</option>)}
                    </select>
                    <button 
                        onClick={() => { setBetToEdit(null); setIsModalOpen(true); }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200/50 dark:shadow-none"
                    >
                        + Nueva Apuesta
                    </button>
                    </div>
                )}
              </div>
              <Dashboard 
                bets={visibleBets} 
                partners={visiblePartners} 
                funds={funds}
                withdrawals={withdrawals}
                selectedPartnerId={user.role === 'PARTNER' ? user.partnerId : selectedPartner} 
                isDarkMode={isDarkMode} 
                onOpenBulkImport={() => setIsBulkImportOpen(true)}
              />
              <div className="mt-8">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 px-1">Actividad Reciente</h2>
                <BetTable 
                  bets={visibleBets.slice(0, 5)} 
                  funds={funds}
                  withdrawals={withdrawals}
                  onUpdateStatus={handleUpdateBetStatus} 
                  onEditBet={(id) => { const b = bets.find(x => x.betId === id); if(b){ setBetToEdit(b); setIsModalOpen(true); }}}
                  isAdmin={user.role === 'ADMIN'} 
                  selectedPartnerId={user.role === 'PARTNER' ? user.partnerId : selectedPartner} 
                />
              </div>
            </div>
          } />
          
          <Route path="/bets" element={
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestión de Apuestas</h1>
                    <p className="text-slate-500 dark:text-slate-400">Historial completo</p>
                  </div>
                  {user.role === 'ADMIN' && (
                      <button 
                        onClick={() => { setBetToEdit(null); setIsModalOpen(true); }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200/50 dark:shadow-none"
                    >
                        + Nueva Apuesta
                    </button>
                  )}
               </div>
               <BetTable 
                  bets={visibleBets} 
                  funds={funds}
                  withdrawals={withdrawals}
                  onUpdateStatus={handleUpdateBetStatus} 
                  onEditBet={(id) => { const b = bets.find(x => x.betId === id); if(b){ setBetToEdit(b); setIsModalOpen(true); }}}
                  isAdmin={user.role === 'ADMIN'} 
                  selectedPartnerId={user.role === 'PARTNER' ? user.partnerId : selectedPartner} 
               />
            </div>
          } />

          <Route path="/funds" element={
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Fondos y Retiros</h1>
                    <p className="text-slate-500 dark:text-slate-400">Control de caja y flujo de efectivo</p>
                </div>
                <Funds 
                    partners={visiblePartners}
                    isAdmin={user.role === 'ADMIN'}
                    funds={user.role === 'PARTNER' ? funds.filter(f => f.partnerId === user.partnerId) : funds}
                    withdrawals={user.role === 'PARTNER' ? withdrawals.filter(w => w.partnerId === user.partnerId) : withdrawals}
                    onUpdateWithdrawal={handleUpdateWithdrawal}
                    onUpdateFund={handleUpdateFund}
                    onDeleteFund={handleDeleteFund}
                    onAddFund={handleAddFund}
                />
            </div>
          } />

          <Route path="/messages" element={
              <div className="space-y-6 h-[calc(100vh-140px)]">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Mensajería</h1>
                    <p className="text-slate-500 dark:text-slate-400">Canal directo de comunicación</p>
                </div>
                <Messages 
                    messages={messages}
                    partners={partners}
                    onSendMessage={handleSendMessage}
                    onMarkRead={handleMarkRead}
                    isAdmin={user.role === 'ADMIN'}
                    currentPartnerId={user.role === 'PARTNER' ? user.partnerId : undefined}
                />
              </div>
          } />

          {user.role === 'ADMIN' && (
              <Route path="/partners" element={
                <PartnerList 
                    partners={partners} 
                    onUpdatePartner={handleCreatePartner}
                />
              } />
          )}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
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
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { sheetApi } from './services/sheetApi'; 
import { Bet, Partner, BetStatus, Message, Fund, Withdrawal } from './types';
import { calculateBetOutcome, formatCurrency, calculateDashboardStats } from './utils/calculations';
import { LayoutDashboard, List, DollarSign, LogOut, RefreshCw, UserCircle, Menu, X, Moon, Sun, Mail, Users, Key, Loader2, Database, WifiOff, Settings, CloudDownload, AlertCircle } from 'lucide-react';

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

// --- SAFE ICON COMPONENT (ESCUDO PROTECTOR) ---
const SafeIcon = ({ icon, className }: { icon: any, className?: string }) => {
    const IconComponent = icon || AlertCircle; 
    return <IconComponent className={className} />;
};

// --- Components for Layout ---

const SidebarItem = ({ to, icon, label, onClick }: any) => {
  return (
    <NavLink 
      to={to} 
      onClick={onClick}
      className={({ isActive }) => 
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all mb-1 ${
          isActive 
            ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-md shadow-orange-200/50 font-semibold' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
        }`
      }
    >
      <SafeIcon icon={icon} className="w-5 h-5" />
      <span className="">{label}</span>
    </NavLink>
  );
};

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
          {/* LOGO AREA */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-orange-200 dark:shadow-none bg-slate-900">
             <img src="/logo.png" alt="Fennix" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.parentElement!.innerText='FX'; e.currentTarget.parentElement!.className='w-10 h-10 bg-slate-900 text-white flex items-center justify-center font-bold rounded-xl'; }} />
          </div>
          <span className="font-bold text-lg text-slate-800 dark:text-white tracking-tight leading-tight">
            FENNIX<br/>
            <span className="text-orange-600 text-sm">EMPORIUM</span>
          </span>
          <button className="lg:hidden ml-auto" onClick={() => setSidebarOpen(false)}>
            <SafeIcon icon={X} className="w-6 h-6 text-slate-500 dark:text-slate-400" />
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
                <SafeIcon icon={UserCircle} className="w-8 h-8 text-slate-500 dark:text-slate-300" />
             </div>
             <div className="overflow-hidden flex-1">
               <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user.name}</p>
               <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.role === 'ADMIN' ? 'Administrador' : 'Socio'}</p>
             </div>
             <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <SafeIcon icon={Settings} className="w-4 h-4 text-slate-400" />
             </div>
           </div>
           
           <div className="flex gap-2">
                <button 
                    onClick={onOpenProfile}
                    className="flex-1 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 text-xs font-bold py-2.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
                    title="Configuración de Perfil"
                >
                    <SafeIcon icon={Settings} className="w-4 h-4" /> Configurar
                </button>
                <button 
                    onClick={onLogout}
                    className="flex-1 flex items-center justify-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold py-2.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors border border-transparent hover:border-rose-100 dark:hover:border-rose-800"
                    title="Cerrar Sesión"
                >
                    <SafeIcon icon={LogOut} className="w-4 h-4" /> Salir
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
            <SafeIcon icon={Menu} className="w-6 h-6" />
          </button>
          
          <div className="ml-auto flex items-center gap-4">
             {/* Local Mode Badge */}
             {isDemoMode && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-full animate-pulse">
                    <SafeIcon icon={WifiOff} className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Modo Local (Sin conexión a Sheets)</span>
                </div>
             )}

             {/* Dark Mode Toggle */}
             <button 
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium text-xs border border-slate-200 dark:border-slate-600"
             >
                {isDarkMode ? <SafeIcon icon={Sun} className="w-4 h-4 text-amber-400" /> : <SafeIcon icon={Moon} className="w-4 h-4 text-slate-500" />}
                <span className="hidden sm:inline">{isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
             </button>

             <button 
              onClick={onSync}
              disabled={isSyncing}
              title="Descargar datos de la nube (Sobrescribe cambios locales no guardados)"
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-bold transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed
                ${isDemoMode 
                    ? 'bg-amber-100 border-amber-200 text-amber-800 dark:bg-amber-900 dark:border-amber-800 dark:text-amber-100 hover:bg-amber-200' 
                    : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600'
                }`}
             >
               <SafeIcon icon={CloudDownload} className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} /> 
               <span className="hidden sm:inline">{isSyncing ? 'Descargando...' : (isDemoMode ? 'Reconectar' : 'Descargar Datos')}</span>
             </button>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
           {isSyncing && (
               <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px] z-20 flex items-center justify-center animate-in fade-in">
                   <div className="bg-white dark:bg-slate-800 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 border border-slate-200 dark:border-slate-700">
                       <SafeIcon icon={Loader2} className="w-6 h-6 animate-spin text-orange-600" />
                       <div>
                           <h4 className="font-bold text-slate-800 dark:text-white">Conectando con Google Sheets...</h4>
                           <p className="text-xs text-slate-500">Descargando últimos datos</p>
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

  // --- SOLUCIÓN TÉCNICA #1: LAZY INITIALIZATION ---
  // Inicializamos el estado leyendo DIRECTAMENTE la sesión. 
  // Esto evita que se borre al recargar antes de ser leída.
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
      const session = loadState<{isAuthenticated: boolean}>('sb_session', { isAuthenticated: false });
      return session?.isAuthenticated || false;
  });
  
  const [user, setUser] = useState(() => {
      const session = loadState<{user: any}>('sb_session', { user: null });
      return session?.user || { name: '', role: 'ADMIN', partnerId: '' };
  });

  const [selectedPartner, setSelectedPartner] = useState<string>(() => {
      const session = loadState<{selectedPartner: string}>('sb_session', { selectedPartner: 'ALL' });
      return session?.selectedPartner || 'ALL';
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false); 
  
  // Login Inputs
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [betToEdit, setBetToEdit] = useState<Bet | null>(null);
  
  const [toast, setToast] = useState<{message: string, sender: string} | null>(null);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('theme') === 'dark' || 
               (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Solo GUARDAMOS sesión, ya no la cargamos con useEffect (se cargó al inicio)
  useEffect(() => {
      if (isAuthenticated) {
          saveState('sb_session', { user, isAuthenticated, selectedPartner });
      } else {
          localStorage.removeItem('sb_session');
      }
  }, [isAuthenticated, user, selectedPartner]);

  // --- API SYNC FUNCTION ---
  const performSync = async () => {
      setIsSyncing(true);
      try {
          const data = await sheetApi.syncAll();
          
          if (data === null) {
              setIsDemoMode(true);
              if (isAuthenticated) {
                 setToast({ message: "⚠️ Sin conexión a Sheets. Usando datos locales.", sender: "Modo Offline" });
              }
          } else {
              setPartners(data.partners);
              setBets(data.bets);
              setFunds(data.funds);
              setWithdrawals(data.withdrawals);
              setMessages(data.messages);

              saveState('sb_partners', data.partners);
              saveState('sb_bets', data.bets);
              saveState('sb_funds', data.funds);
              saveState('sb_withdrawals', data.withdrawals);
              saveState('sb_messages', data.messages);
              
              setIsDemoMode(false);
          }

      } catch (error) {
          console.error("Error crítico de sincronización:", error);
          setToast({ message: "Error de red al conectar con Google.", sender: "Sistema" });
          setIsDemoMode(true);
      } finally {
          setIsSyncing(false);
      }
  };

  useEffect(() => {
      performSync();
  }, []);
  
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

  // --- NOTIFICACIONES AUTOMÁTICAS ---
  const sendSystemNotification = async (partnerId: string, subject: string, text: string) => {
      if (!partnerId || partnerId === 'P001') return;

      const newMessage: Message = {
          messageId: `M-SYS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          date: new Date().toISOString().split('T')[0],
          partnerId: partnerId,
          senderName: 'Fennix System', 
          subject: subject,
          message: text,
          status: 'UNREAD',
          isFromAdmin: true
      };
      
      setMessages(prev => [...prev, newMessage]);
      await sheetApi.saveMessage(newMessage);
  };

  // --- LOGIN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const safeUser = loginUsername.trim().toLowerCase();
    const safePass = loginPassword.trim();

    if (partners.length === 0 && safeUser === 'admin' && safePass === '123') {
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
         
         setPartners([adminProfile]);
         setUser({ name: 'Admin', role: 'ADMIN', partnerId: 'P001' });
         setSelectedPartner('ALL');
         setIsAuthenticated(true);

         if (!isDemoMode) {
             try {
                const res: any = await sheetApi.savePartner(adminProfile);
                if (res?.mode === 'LOCAL_DEMO_SAVED') {
                    setIsDemoMode(true);
                    setToast({ message: "Admin creado SOLO localmente.", sender: "Aviso" });
                }
             } catch(err) {
                console.error("Error autoinicializando admin", err);
             }
         }
         return;
    }

    const matchedPartner = partners.find(p => (p.username || '').toLowerCase() === safeUser && p.password === safePass);

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
        setLoginError('Usuario o contraseña incorrectos.');
    }
  };

  const handleResetPassword = async (partnerId: string, newPassword: string) => {
      const partner = partners.find(p => p.partnerId === partnerId);
      if (partner) {
          const updated = { ...partner, password: newPassword };
          setPartners(prev => prev.map(p => p.partnerId === partnerId ? updated : p));
          await sheetApi.updatePartner(updated);
      }
  };

  const handleCreatePartner = async (newPartner: Partner) => {
      const exists = partners.find(p => p.partnerId === newPartner.partnerId);
      
      if (exists) {
          setPartners(prev => prev.map(p => p.partnerId === newPartner.partnerId ? newPartner : p));
          if (user.partnerId === newPartner.partnerId) {
             setUser(prev => ({ ...prev, name: newPartner.name }));
          }
          sheetApi.updatePartner(newPartner);
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

  const handleSaveBet = async (betData: any) => {
    let newBetObj: Bet | null = null;
    let isNew = false;

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
        
        await sendSystemNotification(
            betData.partnerId,
            "✏️ Apuesta Modificada",
            `El administrador ha realizado una corrección en la apuesta.`
        );

        setBetToEdit(null);
    } else {
        isNew = true;
        const newBet: Bet = {
          ...betData,
          betId: `B-${Date.now()}`,
          expectedReturnCOP: betData.stakeCOP * betData.oddsDecimal,
          status: 'PENDING'
        };
        newBetObj = newBet;
        setBets([newBet, ...bets]);
        await sheetApi.saveBet(newBet);
        
        await sendSystemNotification(
            newBet.partnerId,
            "🎲 Nueva Apuesta Registrada",
            `Evento: ${newBet.homeTeam} vs ${newBet.awayTeam}`
        );
    }
    setIsModalOpen(false);
    if(newBetObj) setToast({ message: isNew ? "Apuesta registrada" : "Apuesta actualizada", sender: "Sistema" });
  };

  const handleUpdateBetStatus = async (betId: string, newStatus: BetStatus, cashoutVal?: number) => {
      // SOLUCIÓN TÉCNICA #2: Validación previa
      const currentBet = bets.find(b => b.betId === betId);
      if (!currentBet) {
          console.error("Bet ID not found:", betId);
          setToast({ message: "Error crítico: ID no encontrado. Recarga la página.", sender: "Sistema" });
          return;
      }

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
          try {
              await sheetApi.updateBet(targetBet);
              if (targetBet.partnerId) {
                  await sendSystemNotification(targetBet.partnerId, "Actualización de Apuesta", `El estado de tu apuesta ha cambiado a ${newStatus}.`);
              }
          } catch (err) {
              console.error("Error updating bet", err);
              setToast({ message: "Error guardando en la nube.", sender: "Sistema" });
          }
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
     setToast({ message: `${newBets.length} apuestas importadas.`, sender: "Importador" });
  };

  const handleAddFund = async (newFund: Fund) => {
      setFunds(prev => [newFund, ...prev]);
      await sheetApi.saveFund(newFund);
      setToast({ message: "Depósito registrado", sender: "Caja" });
  };

  const handleUpdateWithdrawal = async (updatedWithdrawal: Withdrawal) => {
      setWithdrawals(prev => prev.map(w => w.withdrawalId === updatedWithdrawal.withdrawalId ? updatedWithdrawal : w));
      await sheetApi.updateWithdrawal(updatedWithdrawal);
  };

  const handleUpdateFund = async (updatedFund: Fund) => {
      setFunds(prev => prev.map(f => f.fundId === updatedFund.fundId ? updatedFund : f));
      await sheetApi.updateFund(updatedFund);
  };

  const handleDeleteFund = async (fundId: string) => {
      setFunds(prev => prev.filter(f => f.fundId !== fundId));
      await sheetApi.deleteFund(fundId);
      setToast({ message: "Registro eliminado.", sender: "Sistema" });
  };

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
        
        {isForgotOpen && (
            <ForgotPasswordModal 
                isOpen={isForgotOpen} 
                onClose={() => setIsForgotOpen(false)} 
                partners={partners}
                onResetPassword={handleResetPassword}
            />
        )}

        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 dark:border-slate-700">
          <div className="text-center mb-8">
             <div className="w-24 h-24 bg-slate-900 dark:bg-slate-700 rounded-2xl mx-auto flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-lg shadow-orange-200 dark:shadow-none overflow-hidden">
                <img src="/logo.png" alt="Fennix" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.parentElement!.innerText='FX'; }} />
             </div>
             <h1 className="text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">FENNIX EMPORIUM</h1>
             <p className="text-slate-500 dark:text-slate-400 text-sm">Plataforma de Gestión de Apuestas</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
                <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm text-center border border-rose-100 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-300 animate-pulse">
                    {loginError}
                </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Usuario</label>
              <div className="relative">
                 <SafeIcon icon={UserCircle} className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                 <input 
                    type="text" 
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Ej: admin"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-orange-500 outline-none transition-all bg-slate-50 dark:bg-slate-700 dark:text-white" 
                 />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Contraseña</label>
              <div className="relative">
                 <SafeIcon icon={Key} className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                 <input 
                    type="password" 
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-orange-500 outline-none transition-all bg-slate-50 dark:bg-slate-700 dark:text-white" 
                 />
              </div>
              <div className="text-right mt-1">
                  <button 
                    type="button" 
                    onClick={() => setIsForgotOpen(true)}
                    className="text-xs text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 font-medium"
                  >
                      ¿Olvidaste tu contraseña?
                  </button>
              </div>
            </div>
            <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-lg transition-all shadow-lg shadow-orange-200 dark:shadow-none transform active:scale-95 mt-2 flex justify-center items-center gap-2">
               {isSyncing ? <SafeIcon icon={Loader2} className="w-5 h-5 animate-spin"/> : 'Iniciar Sesión'}
            </button>
          </form>

          {partners.length === 0 && !isSyncing && (
             <div className="mt-6 text-center bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-800">
                 <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1 flex justify-center items-center gap-1">
                    <SafeIcon icon={Database} className="w-3 h-3" /> Base de datos vacía
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
                        className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium shadow-sm"
                        value={selectedPartner}
                        onChange={(e) => setSelectedPartner(e.target.value)}
                    >
                        <option value="ALL">Todos los Socios</option>
                        {partners.filter(p => p.partnerId !== 'P001').map(p => <option key={p.partnerId} value={p.partnerId}>{p.name}</option>)}
                    </select>
                    <button 
                        onClick={() => { setBetToEdit(null); setIsModalOpen(true); }}
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200/50 dark:shadow-none"
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
                  partners={visiblePartners}
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
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200/50 dark:shadow-none"
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
                  partners={visiblePartners}
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
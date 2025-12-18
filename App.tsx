import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { LayoutDashboard, List, DollarSign, LogOut, RefreshCw, UserCircle, Menu, X, Moon, Sun, Mail, Users, Key, Loader2, Database, WifiOff, Settings, Clock } from 'lucide-react';

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
const SafeIcon = ({
  icon: Icon,
  className = "",
}: {
  icon: React.ComponentType<any>;
  className?: string;
}) => {
  if (!Icon) return null;
  return <Icon className={className} aria-hidden="true" />;
};

const AvatarCircle = ({
  src,
  alt = "Foto de perfil",
  sizeClass = "h-10 w-10",
}: {
  src?: string | null;
  alt?: string;
  sizeClass?: string;
}) => {
  return (
    <div className={`${sizeClass} rounded-full overflow-hidden bg-gray-100 flex items-center justify-center`}>
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <UserCircle className="h-6 w-6 text-gray-400" />
      )}
    </div>
  );
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

const Layout = ({
  children,
  avatarSrc,
  user,
  onLogout,
  onSync,
  isDarkMode,
  toggleTheme,
  isSyncing,
  isDemoMode,
  onOpenProfile,
  lastUpdate
}: any) => {
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
            <img
              src="/logo.png"
              alt="Fennix"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerText = 'FX';
                e.currentTarget.parentElement!.className =
                  'w-10 h-10 bg-slate-900 text-white flex items-center justify-center font-bold rounded-xl';
              }}
            />
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
          <div
            className="flex items-center gap-3 p-3 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl mb-3 shadow-sm relative group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
            onClick={onOpenProfile}
          >
            {/* ✅ FOTO EN SESIÓN */}
            <AvatarCircle src={avatarSrc} sizeClass="h-10 w-10" alt="Foto de perfil" />
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
            {/* Live Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900/50 rounded-full border border-slate-100 dark:border-slate-700">
              <div className="relative">
                <div className={`w-2.5 h-2.5 rounded-full ${isSyncing ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                {!isSyncing && <div className="absolute top-0 left-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-75"></div>}
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {isSyncing ? 'Guardando...' : 'En Línea'}
              </span>
            </div>

            {/* Last Update Info */}
            {lastUpdate && (
              <div className="hidden md:flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                <Clock className="w-3 h-3" />
                <span>{lastUpdate}</span>
              </div>
            )}

            {/* Local Mode Badge */}
            {isDemoMode && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 rounded-full animate-pulse">
                <SafeIcon icon={WifiOff} className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300">Sin conexión</span>
              </div>
            )}

            {/* Dark Mode Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600"
              title="Cambiar Tema"
            >
              {isDarkMode ? <SafeIcon icon={Sun} className="w-4 h-4 text-amber-400" /> : <SafeIcon icon={Moon} className="w-4 h-4 text-slate-500" />}
            </button>

            <button 
              onClick={() => onSync(false)}
              disabled={isSyncing}
              title="Forzar Actualización"
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors border shadow-sm disabled:opacity-70 disabled:cursor-not-allowed
                ${isDemoMode 
                  ? 'bg-rose-100 border-rose-200 text-rose-800 dark:bg-rose-900 dark:border-rose-800 dark:text-rose-100' 
                  : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600'
                }`}
            >
              <SafeIcon icon={RefreshCw} className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /> 
            </button>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
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
  const [lastUpdate, setLastUpdate] = useState<string>('');
  
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

  // Solo GUARDAMOS sesión
  useEffect(() => {
    if (isAuthenticated) {
      saveState('sb_session', { user, isAuthenticated, selectedPartner });
    } else {
      localStorage.removeItem('sb_session');
    }
  }, [isAuthenticated, user, selectedPartner]);

  // REF para tracking de sincronización en polling (evita stale closures)
  const isSyncingRef = useRef(isSyncing);
  useEffect(() => { isSyncingRef.current = isSyncing; }, [isSyncing]);

  // --- API SYNC FUNCTION (MEJORADA) ---
  const performSync = useCallback(async (silent = false) => {
    // Si ya está sincronizando, no hacer nada
    if (isSyncingRef.current) return;

    if (!silent) setIsSyncing(true);
    isSyncingRef.current = true;

    try {
      const data = await sheetApi.syncAll();
      
      if (data === null) {
        if (!silent) setIsDemoMode(true);
      } else {
        setPartners(prev => {
          if (isAuthenticated && user.partnerId && user.partnerId !== 'P001') {
            const currentUserData = data.partners.find(p => p.partnerId === user.partnerId);
            if (currentUserData && currentUserData.name !== user.name) {
              setUser(u => ({ ...u, name: currentUserData.name }));
            }
          }
          return data.partners;
        });

        setBets(data.bets);
        setFunds(data.funds);
        setWithdrawals(data.withdrawals);
        setMessages(data.messages);

        // Guardar en caché
        saveState('sb_partners', data.partners);
        saveState('sb_bets', data.bets);
        saveState('sb_funds', data.funds);
        saveState('sb_withdrawals', data.withdrawals);
        saveState('sb_messages', data.messages);
        
        setLastUpdate(new Date().toLocaleTimeString());
        setIsDemoMode(false);
      }

    } catch (error) {
      console.error("Error crítico de sincronización:", error);
      if (!silent) {
        setToast({ message: "Error de red al sincronizar.", sender: "Sistema" });
        setIsDemoMode(true);
      }
    } finally {
      setIsSyncing(false);
      isSyncingRef.current = false;
    }
  }, [isAuthenticated, user]);

  // --- AUTO-SYNC POLLING (10 SEGUNDOS) ---
  useEffect(() => {
    if (!isAuthenticated) return;

    // Sincronización inicial al montar
    performSync(false);

    // Polling cada 10 segundos
    const intervalId = setInterval(() => {
      if (!isSyncingRef.current) {
        performSync(true); // Silent sync
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, performSync]); 
  
  // Persistencia de estados
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

  // --- NOTIFICACIONES AUTOMÁTICAS (ROBOT MEJORADO) ---
  const sendSystemNotification = async (partnerId: string, subject: string, text: string) => {
    if (!partnerId) return;

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
    
    try {
      await sheetApi.saveMessage(newMessage);
      setToast({ message: `📩 Notificación enviada a ${partners.find(p=>p.partnerId === partnerId)?.name || 'Socio'}`, sender: "Sistema" });
    } catch (err: any) {
      console.error("Error enviando notificación:", err);
      setToast({ message: `⚠️ Error enviando mensaje a socio: ${err.message || 'Desconocido'}`, sender: "Sistema" });
    }
  };

  // --- LOGIN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const safeUser = loginUsername.trim().toLowerCase();
    const safePass = loginPassword.trim();

    // LÓGICA DE PRIMER INICIO (BOOTSTRAP)
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

      try {
        await sheetApi.savePartner(adminProfile);
        setToast({ message: "✅ Base de datos inicializada con Admin.", sender: "Setup" });
      } catch(err) {
        console.error("Error autoinicializando admin", err);
        setLoginError("Error conectando a BD. Revisa las llaves API.");
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
      await performSync(true);
    }
  };

  const handleCreatePartner = async (newPartner: Partner) => {
    const exists = partners.find(p => p.partnerId === newPartner.partnerId);
    
    if (exists) {
      setPartners(prev => prev.map(p => p.partnerId === newPartner.partnerId ? newPartner : p));
      if (user.partnerId === newPartner.partnerId) {
        setUser(prev => ({ ...prev, name: newPartner.name }));
      }
      await sheetApi.updatePartner(newPartner);
      await performSync(true);
    } else {
      setPartners(prev => [...prev, newPartner]);
      await sheetApi.savePartner(newPartner);
      await performSync(true);
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
        await performSync(true);
      }
    }
  };

  // --- SAVE BET (NEW/EDIT) ---
  const handleSaveBet = async (betData: any) => {
    const oldBets = [...bets];
    
    let newBetObj: Bet | null = null;

    if (betToEdit) {
      const changes: string[] = [];

      if (Number(betToEdit.stakeCOP) !== Number(betData.stakeCOP)) {
        changes.push(`• Inversión: ${formatCurrency(betToEdit.stakeCOP)} ➔ ${formatCurrency(betData.stakeCOP)}`);
      }
      if (Number(betToEdit.oddsDecimal) !== Number(betData.oddsDecimal)) {
        changes.push(`• Cuota: ${betToEdit.oddsDecimal} ➔ ${betData.oddsDecimal}`);
      }
      if (betToEdit.status !== betData.status) {
        changes.push(`• Estado: ${betToEdit.status} ➔ ${betData.status}`);
      }
      if (betToEdit.marketDescription !== betData.marketDescription) {
        changes.push(`• Mercado: ${betToEdit.marketDescription} ➔ ${betData.marketDescription}`);
      }

      const updatedBets = bets.map(b => {
        if (b.betId === betToEdit.betId) {
          const partner = partners.find(p => p.partnerId === betData.partnerId);
          const updatedBase = { ...b, ...betData }; 
          const outcome = calculateBetOutcome(updatedBase, partner?.partnerProfitPct || 50);
          const final = { ...updatedBase, ...outcome };
          newBetObj = final;
          return final;
        }
        return b;
      });

      setBets(updatedBets);
      
      if (newBetObj) {
        try {
          const updateRes = await sheetApi.updateBet(newBetObj);
          if (!updateRes.success) throw new Error("DB Error");

          const partnerStats = calculateDashboardStats(updatedBets, partners, betData.partnerId, funds, withdrawals);
          const newBalance = partnerStats.currentBalance;
          const balanceMsg = `\n\n💰 **Nuevo Saldo Disponible:** ${formatCurrency(newBalance)}`;

          const changeLog = changes.length > 0 ? changes.join('\n') : "• Corrección menor de datos o notas.";
          
          await sendSystemNotification(
            betData.partnerId,
            "📝 Auditoría: Apuesta Modificada",
            `⚠️ **ACTUALIZACIÓN DE MOVIMIENTO**\n--------------------------------\nEl administrador ha realizado ajustes en la operación:\n\n⚽ **Evento:** ${betData.homeTeam} vs ${betData.awayTeam}\n\n📋 **Bitácora de Cambios:**\n${changeLog}${balanceMsg}`
          );

          const p = partners.find(p => p.partnerId === betData.partnerId);
          const partnerNameForToast = p ? p.name : 'Socio';
          setToast({ message: `Notificación de cambios enviada a ${partnerNameForToast}`, sender: "Auditoría" });

        } catch (err: any) {
          setBets(oldBets);
          const errorMessage = err.message || err.details || "Error desconocido";
          setToast({ message: `❌ Error guardando apuesta: ${errorMessage}`, sender: "Base de Datos" });
        }
      }

      setBetToEdit(null);
    } else {
      const newBet: Bet = {
        ...betData,
        betId: `B-${Date.now()}`,
        expectedReturnCOP: Number(betData.stakeCOP) * Number(betData.oddsDecimal),
        status: 'PENDING'
      };
      newBetObj = newBet;
      setBets([newBet, ...bets]);
      
      try {
        await sheetApi.saveBet(newBet);
        
        await sendSystemNotification(
          newBet.partnerId,
          "🎲 Nueva Inversión",
          `🔔 **NUEVA APUESTA REGISTRADA**\n--------------------------------\n⚽ **Evento:** ${newBet.homeTeam} vs ${newBet.awayTeam}\n🎯 **Mercado:** ${newBet.marketDescription}\n\n📥 **Inversión (Stake):** ${formatCurrency(newBet.stakeCOP)}\n📊 **Cuota:** ${newBet.oddsDecimal}\n🏆 **Retorno Potencial:** ${formatCurrency(newBet.expectedReturnCOP)}\n\n*La operación ya se encuentra activa en tu portafolio.*`
        );
        
        const p = partners.find(p => p.partnerId === betData.partnerId);
        const partnerNameForToast = p ? p.name : 'Socio';
        setToast({ message: `Apuesta creada para ${partnerNameForToast}`, sender: "Sistema" });

      } catch (err: any) {
        setBets(oldBets);
        const errorMessage = err.message || err.details || "Error desconocido";
        setToast({ message: `❌ Error creando apuesta: ${errorMessage}`, sender: "Base de Datos" });
      }
    }
    
    performSync(true);
    setIsModalOpen(false);
  };

  // --- UPDATE STATUS (RESULTADOS) ---
  const handleUpdateBetStatus = async (betId: string, newStatus: BetStatus, cashoutVal?: number) => {
    const oldBets = [...bets];
    const currentBet = bets.find(b => b.betId === betId);
    if (!currentBet) return;

    let targetBet: Bet | undefined;

    const updatedBets = bets.map(bet => {
      if (bet.betId === betId) {
        const updatedBet = { ...bet, status: newStatus, cashoutReturnCOP: cashoutVal };
        const partner = partners.find(p => p.partnerId === bet.partnerId);
        const profitShare = partner?.partnerProfitPct || 50;
        const outcome = calculateBetOutcome(updatedBet, profitShare);
        
        const resolvedBet = { 
          ...updatedBet, 
          finalReturnCOP: Number(outcome.finalReturn), 
          profitGrossCOP: Number(outcome.profitGross),
          profitPartnerCOP: Number(outcome.profitPartner),
          profitAdminCOP: Number(outcome.profitAdmin)
        };
        targetBet = resolvedBet;
        return resolvedBet;
      }
      return bet;
    });
    
    setBets(updatedBets);
    
    if (targetBet && targetBet.partnerId) {
      try {
        const res = await sheetApi.updateBet(targetBet);
        if(!res.success) throw new Error("API Failure");
        
        const partner = partners.find(p => p.partnerId === targetBet!.partnerId);
        const sharePct = partner?.partnerProfitPct || 50;

        const partnerStats = calculateDashboardStats(updatedBets, partners, targetBet.partnerId, funds, withdrawals);
        const newBalance = partnerStats.currentBalance;
        const balanceMsg = `\n\n💰 **Nuevo Saldo Disponible:** ${formatCurrency(newBalance)}`;
        
        if (newStatus === 'WON') {
          await sendSystemNotification(
            targetBet.partnerId,
            "✅ ¡Victoria! Apuesta Ganada",
            `🎉 **OPERACIÓN EXITOSA**\n--------------------------------\n⚽ **Evento:** ${targetBet.homeTeam} vs ${targetBet.awayTeam}\n🎯 **Mercado:** ${targetBet.marketDescription}\n\n📥 **Inversión:** ${formatCurrency(targetBet.stakeCOP)}\n📤 **Retorno Total:** ${formatCurrency(targetBet.finalReturnCOP || 0)}\n\n📈 **Ganancia Bruta:** ${formatCurrency(targetBet.profitGrossCOP || 0)}\n🤝 **Tu Utilidad Neta (${sharePct}%):** ${formatCurrency(targetBet.profitPartnerCOP || 0)}${balanceMsg}`
          );
        } else if (newStatus === 'LOST') {
          await sendSystemNotification(
            targetBet.partnerId,
            "❌ Resultado Negativo",
            `📉 **OPERACIÓN CERRADA EN PÉRDIDA**\n--------------------------------\n⚽ **Evento:** ${targetBet.homeTeam} vs ${targetBet.awayTeam}\n\n📥 **Inversión:** ${formatCurrency(targetBet.stakeCOP)}\n📤 **Retorno:** $ 0\n\n*El sistema continuará operando para recuperar el capital según la estrategia de gestión de riesgo.*${balanceMsg}`
          );
        } else if (newStatus === 'CASHED_OUT') {
          const isProfit = (targetBet.profitGrossCOP || 0) > 0;
          await sendSystemNotification(
            targetBet.partnerId,
            "💰 Cash Out Confirmado",
            `🔄 **CIERRE ANTICIPADO (CASH OUT)**\n--------------------------------\nEl sistema ha cerrado la operación manualmente para asegurar ganancias o mitigar riesgos.\n\n⚽ **Evento:** ${targetBet.homeTeam} vs ${targetBet.awayTeam}\n\n📥 **Inversión Inicial:** ${formatCurrency(targetBet.stakeCOP)}\n↪️ **Valor Recuperado:** ${formatCurrency(targetBet.finalReturnCOP || 0)}\n\n📊 **Resultado Operación:** ${isProfit ? '+' : ''}${formatCurrency(targetBet.profitGrossCOP || 0)}${balanceMsg}`
          );
        } else if (newStatus === 'VOID') {
          await sendSystemNotification(
            targetBet.partnerId,
            "⚠️ Apuesta Anulada (Void)",
            `⛔ **OPERACIÓN ANULADA**\n--------------------------------\nLa casa de apuestas ha anulado el evento ${targetBet.homeTeam} vs ${targetBet.awayTeam}.\n\n📥 **Inversión:** ${formatCurrency(targetBet.stakeCOP)}\n🔄 **Reembolso:** ${formatCurrency(targetBet.stakeCOP)}\n\n*El dinero ha regresado íntegramente a tu saldo sin generar ganancias ni pérdidas.*${balanceMsg}`
          );
        }

        performSync(true);

      } catch (err: any) {
        console.error("Error updating bet", err);
        setBets(oldBets);
        const errorMessage = err.message || err.details || "Error desconocido";
        setToast({ message: `❌ Error al actualizar estado: ${errorMessage}`, sender: "Base de Datos" });
      }
    }
  };

  const handleBulkImport = async (newBetsData: any[]) => {
    const newBets = newBetsData.map((b, i) => ({
      ...b,
      betId: `B-IMP-${Date.now()}-${i}`,
      expectedReturnCOP: b.stakeCOP * b.oddsDecimal
    }));
    const oldBets = [...bets];
    setBets([...newBets, ...bets]);
    
    try {
      for (const b of newBets) await sheetApi.saveBet(b);
      
      if (newBets.length > 0) {
        const pid = newBets[0].partnerId;
        await sendSystemNotification(
          pid,
          "📥 Carga Masiva",
          `📁 **IMPORTACIÓN EXITOSA**\n\nSe han cargado **${newBets.length} nuevas operaciones** a tu portafolio mediante proceso masivo.\n\nPuedes ver los detalles de cada una en tu Historial de Apuestas.`
        );
      }
      setToast({ message: `${newBets.length} apuestas importadas.`, sender: "Importador" });
      performSync(true);

    } catch (err: any) {
      setBets(oldBets);
      const errorMessage = err.message || err.details || "Error desconocido";
      setToast({ message: `❌ Error importando apuestas: ${errorMessage}`, sender: "Base de Datos" });
    }
  };

  const handleAddFund = async (newFund: Fund) => {
    const oldFunds = [...funds];
    setFunds(prev => [newFund, ...prev]);
    try {
      await sheetApi.saveFund(newFund);
      await sendSystemNotification(
        newFund.partnerId || '',
        "💵 Depósito Confirmado",
        `🏦 **INGRESO DE CAPITAL**\n--------------------------------\nSe ha registrado un nuevo movimiento de fondos a tu favor.\n\n💰 **Monto:** ${formatCurrency(newFund.amountCOP)}\n📝 **Detalle:** ${newFund.description}\n\n*Este capital ya se encuentra disponible para operar.*`
      );
      setToast({ message: "Depósito registrado y notificado", sender: "Caja" });
      performSync(true);
    } catch (err: any) {
      console.error("Error save fund", err);
      setFunds(oldFunds);
      const errorMessage = err.message || err.details || "Error desconocido";
      setToast({ message: `❌ Error guardando depósito: ${errorMessage}`, sender: "Sistema" });
    }
  };

  const handleUpdateWithdrawal = async (updatedWithdrawal: Withdrawal) => {
    const oldWithdrawals = [...withdrawals];
    setWithdrawals(prev => prev.map(w => w.withdrawalId === updatedWithdrawal.withdrawalId ? updatedWithdrawal : w));
    
    try {
      const response = await sheetApi.updateWithdrawal(updatedWithdrawal);
      if (!response.success) throw new Error("API devolvió error desconocido");
      
      if (['APPROVED', 'PAID', 'REJECTED'].includes(updatedWithdrawal.status)) {
        let statusText = updatedWithdrawal.status === 'PAID' ? '✅ PAGADO' : (updatedWithdrawal.status === 'APPROVED' ? '👍 APROBADO' : '🚫 RECHAZADO');
        await sendSystemNotification(
          updatedWithdrawal.partnerId,
          "🏦 Actualización de Retiro",
          `🔔 **ESTADO DE RETIRO ACTUALIZADO**\n\nTu solicitud por **${formatCurrency(updatedWithdrawal.amountCOP)}** ha cambiado de estado a:\n\n👉 **${statusText}**\n\n${updatedWithdrawal.status === 'PAID' ? 'Por favor verifica tu cuenta bancaria.' : 'Consulta la sección de Fondos para más detalles.'}`
        );
      }
      setToast({ message: "Retiro actualizado correctamente.", sender: "Sistema" });
      performSync(true);

    } catch (err: any) {
      console.error("Failed to update withdrawal in DB", err);
      setWithdrawals(oldWithdrawals);
      const errorMessage = err.message || err.details || "Error desconocido";
      setToast({ message: `❌ ERROR CRÍTICO: No se guardó. ${errorMessage}`, sender: "Error BD" });
    }
  };

  const handleUpdateFund = async (updatedFund: Fund) => {
    const oldFunds = [...funds];
    setFunds(prev => prev.map(f => f.fundId === updatedFund.fundId ? updatedFund : f));
    try {
      const res = await sheetApi.updateFund(updatedFund);
      if(!res.success) throw new Error("API Failure");
      setToast({ message: "Fondo actualizado.", sender: "Sistema" });
      performSync(true);
    } catch(err: any) {
      console.error("Error updating fund", err);
      setFunds(oldFunds);
      const errorMessage = err.message || err.details || "Error desconocido";
      setToast({ message: `❌ Error actualizando fondo: ${errorMessage}`, sender: "Error BD" });
    }
  };

  const handleDeleteFund = async (fundId: string) => {
    const oldFunds = [...funds];
    setFunds(prev => prev.filter(f => f.fundId !== fundId));
    try {
      await sheetApi.deleteFund(fundId);
      setToast({ message: "Registro eliminado.", sender: "Sistema" });
      performSync(true);
    } catch (err: any) {
      setFunds(oldFunds);
      const errorMessage = err.message || err.details || "Error desconocido";
      setToast({ message: `❌ Error eliminando: ${errorMessage}`, sender: "Error BD" });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (user.role !== 'ADMIN') return;

    const oldMessages = [...messages];
    setMessages(prev => prev.filter(m => m.messageId !== messageId));

    try {
      await sheetApi.deleteMessage(messageId);
      setToast({ message: "Mensaje eliminado.", sender: "Sistema" });
      performSync(true);
    } catch (err: any) {
      setMessages(oldMessages);
      const errorMessage = err.message || err.details || "Error desconocido";
      setToast({ message: `❌ Error eliminando mensaje: ${errorMessage}`, sender: "Error BD" });
    }
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
    
    try {
      await sheetApi.saveMessage(newMessage);
    } catch (err: any) {
      setToast({ message: `❌ Error enviando mensaje: ${err.message}`, sender: "Sistema" });
    }
  };

  const handleMarkRead = async (messageId: string) => {
    const target = messages.find(m => m.messageId === messageId);
    if (target && target.status === 'UNREAD') {
      const updated = { ...target, status: 'READ' as const };
      setMessages(prev => prev.map(m => m.messageId === messageId ? updated : m));
      await sheetApi.updateMessage(updated);
      await performSync(true);
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
            <div className="mt-6 text-center bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
              <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1 flex justify-center items-center gap-1">
                <SafeIcon icon={Database} className="w-3 h-3" /> Base de Datos Conectada
              </p>
              <p className="text-[10px] text-blue-600 dark:text-blue-500 mb-2">
                Ingresa como <b>admin / 123</b> para inicializar la nube.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ✅ PERFIL ACTUAL + AVATAR
  const currentPartner = partners.find(p => p.partnerId === user.partnerId);
  const avatarSrc = currentPartner?.profileImage || null;

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
        avatarSrc={avatarSrc}   // ✅ PASADO A LAYOUT
        onLogout={() => { setIsAuthenticated(false); setLoginPassword(''); }} 
        onSync={() => performSync(false)}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        isSyncing={isSyncing}
        isDemoMode={isDemoMode}
        onOpenProfile={() => setIsProfileOpen(true)}
        lastUpdate={lastUpdate}
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
                onDeleteMessage={handleDeleteMessage}
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

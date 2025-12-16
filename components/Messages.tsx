import React, { useState, useEffect, useRef } from 'react';
import { Message, Partner } from '../types';
import { Send, Search, User, Clock, Check, MoreVertical, Phone, Shield } from 'lucide-react';

interface MessagesProps {
  messages: Message[];
  partners: Partner[];
  onSendMessage: (msg: { partnerId: string, subject: string, body: string }) => void;
  onMarkRead: (id: string) => void;
  isAdmin: boolean;
  currentPartnerId?: string; // If logged in as partner
}

// Función auxiliar para renderizar texto con formato básico de negritas
const formatMessageText = (text: string) => {
    // Dividir por líneas para mantener estructura
    return text.split('\n').map((line, i) => {
        // Detectar si la línea es un separador
        if (line.includes('----')) {
            return <hr key={i} className="my-2 border-white/30" />;
        }
        
        // Procesar negritas **texto**
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
            <div key={i} className="min-h-[1.2em]">
                {parts.map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>;
                    }
                    return <span key={j}>{part}</span>;
                })}
            </div>
        );
    });
};

export const Messages: React.FC<MessagesProps> = ({ messages, partners, onSendMessage, onMarkRead, isAdmin, currentPartnerId }) => {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // EFECTO: Si soy socio, autoselecciono mi propio chat y no permito cambiar
  useEffect(() => {
      if (!isAdmin && currentPartnerId) {
          setSelectedPartnerId(currentPartnerId);
      }
  }, [isAdmin, currentPartnerId]);

  // 1. Agrupar mensajes para ADMIN
  // Si es admin, ve la lista completa. Si no, esta lista se ignora visualmente.
  const chats = partners.filter(p => p.partnerId !== 'P001').map(partner => {
      const partnerMsgs = messages.filter(m => m.partnerId === partner.partnerId);
      const sorted = [...partnerMsgs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const lastMsg = sorted[0];
      const unreadCount = partnerMsgs.filter(m => !m.isFromAdmin && m.status === 'UNREAD').length;

      return {
          partner,
          lastMsg,
          unreadCount
      };
  }).filter(chat => 
      chat.partner.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
      const dateA = a.lastMsg ? new Date(a.lastMsg.date).getTime() : 0;
      const dateB = b.lastMsg ? new Date(b.lastMsg.date).getTime() : 0;
      return dateB - dateA;
  });

  // 2. Obtener mensajes del chat activo
  const activeChatId = isAdmin ? selectedPartnerId : currentPartnerId;
  
  const activeMessages = activeChatId 
    ? messages
        .filter(m => m.partnerId === activeChatId)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) 
    : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages, activeChatId]);

  // Marcar leídos
  useEffect(() => {
    if (activeChatId) {
        // Si soy Admin, marco como leído lo que viene del socio (!isFromAdmin)
        // Si soy Socio, marco como leído lo que viene del Admin (isFromAdmin)
        const unreadIds = messages
            .filter(m => m.partnerId === activeChatId && m.status === 'UNREAD' && (isAdmin ? !m.isFromAdmin : m.isFromAdmin))
            .map(m => m.messageId);
        
        unreadIds.forEach(id => onMarkRead(id));
    }
  }, [activeChatId, messages, onMarkRead, isAdmin]);

  const handleSend = (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputText.trim() || !activeChatId) return;

      onSendMessage({
          partnerId: activeChatId,
          subject: 'Chat Message', 
          body: inputText
      });
      setInputText('');
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in duration-500">
      
      {/* SIDEBAR: SOLO VISIBLE PARA ADMIN */}
      {isAdmin && (
          <div className={`${selectedPartnerId ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50`}>
             <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar socio..." 
                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
             </div>

             <div className="flex-1 overflow-y-auto">
                {chats.map(({ partner, lastMsg, unreadCount }) => (
                    <div 
                        key={partner.partnerId}
                        onClick={() => setSelectedPartnerId(partner.partnerId)}
                        className={`p-4 flex gap-3 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-700 
                            ${selectedPartnerId === partner.partnerId ? 'bg-white dark:bg-slate-700 border-l-4 border-l-blue-500 shadow-sm' : 'border-l-4 border-l-transparent'}`}
                    >
                        <div className="relative">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm ${unreadCount > 0 ? 'bg-blue-600' : 'bg-slate-400 dark:bg-slate-600'}`}>
                                {partner.name.substring(0,2).toUpperCase()}
                            </div>
                            {unreadCount > 0 && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-slate-50 dark:border-slate-800">
                                    {unreadCount}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className={`text-sm truncate ${unreadCount > 0 ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-200'}`}>
                                    {partner.name}
                                </span>
                                {lastMsg && <span className="text-[10px] text-slate-400">{lastMsg.date}</span>}
                            </div>
                            <p className={`text-xs truncate ${unreadCount > 0 ? 'text-slate-800 dark:text-slate-300 font-medium' : 'text-slate-500 dark:text-slate-500'}`}>
                                {lastMsg 
                                    ? (lastMsg.isFromAdmin ? `Tú: ${lastMsg.message}` : lastMsg.message) 
                                    : <span className="italic opacity-50">Sin mensajes aún</span>
                                }
                            </p>
                        </div>
                    </div>
                ))}
             </div>
          </div>
      )}

      {/* MAIN CHAT AREA */}
      <div className={`${!selectedPartnerId && isAdmin ? 'hidden lg:flex' : 'flex'} flex-1 flex-col bg-slate-100 dark:bg-slate-900/50`}>
         {activeChatId ? (
             <>
                {/* Header Chat */}
                <div className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 shadow-sm shrink-0">
                    <div className="flex items-center gap-3">
                        {isAdmin && (
                            <button onClick={() => setSelectedPartnerId(null)} className="lg:hidden p-1 -ml-2 text-slate-500">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                        )}
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md ${isAdmin ? 'bg-blue-600' : 'bg-slate-800 dark:bg-slate-700'}`}>
                            {isAdmin 
                                ? chats.find(c => c.partner.partnerId === activeChatId)?.partner.name.substring(0,2).toUpperCase()
                                : <Shield className="w-5 h-5"/>
                            }
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-sm">
                                {isAdmin 
                                    ? chats.find(c => c.partner.partnerId === activeChatId)?.partner.name
                                    : 'Soporte Administrativo'
                                }
                            </h3>
                            <span className="text-xs text-emerald-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> En línea
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2 text-slate-400">
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><Phone className="w-4 h-4" /></button>
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><MoreVertical className="w-4 h-4" /></button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 scroll-smooth">
                    <div className="flex justify-center">
                         <span className="bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wide">
                            Inicio de la conversación
                         </span>
                    </div>

                    {activeMessages.map((msg) => {
                        // Determinar si es "Mío" o "Del Otro"
                        // Si soy Admin: isFromAdmin -> Mío.
                        // Si soy Socio: !isFromAdmin -> Mío (porque yo no soy Admin).
                        const isMe = isAdmin ? msg.isFromAdmin : !msg.isFromAdmin;

                        return (
                            <div key={msg.messageId} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] lg:max-w-[65%] rounded-2xl px-5 py-4 text-sm shadow-md relative group transition-all
                                    ${isMe 
                                        ? 'bg-blue-600 text-white rounded-tr-none' 
                                        : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-600'
                                    }`}>
                                    {/* Renderizado especial con formato (Receipt Style) */}
                                    <div className="leading-relaxed font-sans">
                                        {formatMessageText(msg.message)}
                                    </div>

                                    <div className={`text-[10px] mt-2 flex items-center justify-end gap-1 opacity-70 
                                        ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                                        <span>{msg.date}</span>
                                        {isMe && <Check className="w-3 h-3" />}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shrink-0">
                    <form onSubmit={handleSend} className="flex gap-3 items-center">
                        <input 
                            type="text" 
                            className="flex-1 bg-slate-100 dark:bg-slate-700 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 border rounded-full px-5 py-3 text-sm outline-none transition-all text-slate-800 dark:text-white"
                            placeholder="Escribe un mensaje..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                        />
                        <button 
                            type="submit" 
                            disabled={!inputText.trim()}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-full shadow-lg shadow-blue-200 dark:shadow-none transition-transform active:scale-95"
                        >
                            <Send className="w-5 h-5 ml-0.5" />
                        </button>
                    </form>
                </div>

             </>
         ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 text-center">
                 <div className="w-20 h-20 bg-slate-200 dark:bg-slate-700/50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                     <User className="w-10 h-10 opacity-50" />
                 </div>
                 <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Selecciona un Socio</h2>
                 <p className="max-w-xs text-sm">Elige un socio de la lista izquierda para comenzar el chat.</p>
             </div>
         )}
      </div>

    </div>
  );
};
import React, { useState, useEffect, useRef } from 'react';
import { Message, Partner } from '../types';
import { Send, Search, User, Phone, MoreVertical, Shield, Check, TrendingUp, TrendingDown, AlertCircle, DollarSign, Trash2 } from 'lucide-react';

interface MessagesProps {
  messages: Message[];
  partners: Partner[];
  onSendMessage: (msg: { partnerId: string, subject: string, body: string }) => void;
  onMarkRead: (id: string) => void;
  onDeleteMessage?: (messageId: string) => void; // ✅ NUEVO
  isAdmin: boolean;
  currentPartnerId?: string; // If logged in as partner
}

// Función auxiliar para renderizar texto con formato mejorado
const formatMessageText = (text: string) => {
  return text.split('\n').map((line, i) => {
    if (line.includes('----')) {
      return <hr key={i} className="my-3 border-white/20" />;
    }

    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <div key={i} className="min-h-[1.4em] mb-1">
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-bold tracking-wide">{part.slice(2, -2)}</strong>;
          }
          return <span key={j}>{part}</span>;
        })}
      </div>
    );
  });
};

const parseCOP = (raw: string) => {
  const cleaned = raw.replace(/[^\d]/g, '');
  if (!cleaned) return null;
  const n = parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : null;
};

const extractCOPAfter = (text: string, re: RegExp) => {
  const m = text.match(re);
  if (!m?.[1]) return null;
  return parseCOP(m[1]);
};

// Función para determinar el estilo de la burbuja basado en el contenido
const getMessageStyle = (subject: string, message: string, isMe: boolean, isSystem: boolean) => {
  const content = (subject + '\n' + message).toLowerCase();

  const positiveStyle = {
    container: 'bg-emerald-600 text-white shadow-emerald-200 dark:shadow-none border border-emerald-500',
    icon: <TrendingUp className="w-4 h-4 text-emerald-100" />
  };

  const negativeStyle = {
    container: 'bg-rose-900 text-rose-50 shadow-rose-200 dark:shadow-none border border-rose-800',
    icon: <TrendingDown className="w-4 h-4 text-rose-300" />
  };

  const warningStyle = {
    container: 'bg-amber-600 text-white shadow-amber-200 dark:shadow-none border border-amber-500',
    icon: <AlertCircle className="w-4 h-4 text-amber-100" />
  };

  // ✅ CASH OUT: decidir verde/rojo según resultado real
  const isCashOut = content.includes('cash out') || content.includes('cierre anticipado');
  if (isCashOut) {
    // 1) Si el texto ya trae resultado negativo explícito
    if (
      /resultado\s*operaci[oó]n\s*:\s*-\s*\$?/.test(content) ||
      content.includes('pérdida') ||
      content.includes('perdida') ||
      content.includes('negativo')
    ) {
      return negativeStyle;
    }

    // 2) Intentar comparar inversión vs recuperado (COP)
    const invested = extractCOPAfter(message, /inversi[oó]n(?:\s+inicial)?\s*:\s*\$?\s*([\d\.\,]+)/i);
    const recovered = extractCOPAfter(message, /valor\s+recuperado\s*:\s*\$?\s*([\d\.\,]+)/i);

    if (invested != null && recovered != null) {
      if (recovered < invested) return negativeStyle;
      if (recovered > invested) return positiveStyle;
      return warningStyle; // empate exacto
    }

    // Si no pudimos calcular, lo dejamos neutral (mejor que marcar verde por error)
    return warningStyle;
  }

  // 1. Mensajes Negativos / Alertas (Rojo Opaco / Vino)
  if (
    content.includes('pérdida') ||
    content.includes('perdida') ||
    content.includes('negativo') ||
    content.includes('anulada') ||
    content.includes('rechazado') ||
    /resultado\s*operaci[oó]n\s*:\s*-\s*\$?/.test(content)
  ) {
    return negativeStyle;
  }

  // 2. Retiros (Ámbar/Naranja) - Neutral/Atención
  if (content.includes('retiro') || content.includes('solicitud')) {
    return warningStyle;
  }

  // 3. Mensajes Positivos (Verde)
  if (
    content.includes('victoria') ||
    content.includes('ganada') ||
    content.includes('exitosa') ||
    content.includes('depósito') ||
    content.includes('deposito')
  ) {
    return positiveStyle;
  }

  // 4. Mensajes Estándar (Azul para mí, Blanco/Gris para otro)
  if (isMe) {
    return {
      container: 'bg-blue-600 text-white shadow-blue-200 dark:shadow-none rounded-tr-none',
      icon: null
    };
  } else {
    return {
      container: 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600 rounded-tl-none',
      icon: null
    };
  }
};

export const Messages: React.FC<MessagesProps> = ({
  messages,
  partners,
  onSendMessage,
  onMarkRead,
  onDeleteMessage,
  isAdmin,
  currentPartnerId
}) => {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAdmin && currentPartnerId) {
      setSelectedPartnerId(currentPartnerId);
    }
  }, [isAdmin, currentPartnerId]);

  const chats = partners
    .filter(p => p.partnerId !== 'P001')
    .map(partner => {
      const partnerMsgs = messages.filter(m => m.partnerId === partner.partnerId);
      const sorted = [...partnerMsgs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const lastMsg = sorted[0];
      const unreadCount = partnerMsgs.filter(m => !m.isFromAdmin && m.status === 'UNREAD').length;

      return { partner, lastMsg, unreadCount };
    })
    .filter(chat => chat.partner.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
      const dateA = a.lastMsg ? new Date(a.lastMsg.date).getTime() : 0;
      const dateB = b.lastMsg ? new Date(b.lastMsg.date).getTime() : 0;
      return dateB - dateA;
    });

  const activeChatId = isAdmin ? selectedPartnerId : currentPartnerId;

  const activeMessages = activeChatId
    ? messages
        .filter(m => m.partnerId === activeChatId)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages, activeChatId]);

  useEffect(() => {
    if (activeChatId) {
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

      {isAdmin && (
        <div className={`${selectedPartnerId ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50`}>
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar socio."
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
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm ${unreadCount > 0 ? 'bg-blue-600' : 'bg-slate-400'}`}>
                    {partner.name.charAt(0).toUpperCase()}
                  </div>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                      {unreadCount}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-slate-800 dark:text-white truncate">{partner.name}</p>
                    {lastMsg && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{lastMsg.date}</p>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-300 truncate">
                    {lastMsg ? (lastMsg.isFromAdmin ? 'Tú: ' : '') + (lastMsg.subject || '') : 'Sin mensajes'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 dark:bg-slate-700 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
              {activeChatId ? (partners.find(p => p.partnerId === activeChatId)?.name?.charAt(0).toUpperCase() || 'S') : 'S'}
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-white">
                {activeChatId ? (partners.find(p => p.partnerId === activeChatId)?.name || 'Soporte Administrativo') : 'Soporte Administrativo'}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                En línea
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-500">
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"><Phone className="w-5 h-5" /></button>
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"><MoreVertical className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/40">
          {!activeChatId && isAdmin ? (
            <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
              Selecciona un socio para ver la conversación.
            </div>
          ) : (
            activeMessages.map((msg) => {
              const isMe = isAdmin ? msg.isFromAdmin : !msg.isFromAdmin;
              const isSystem = (msg.senderName || '').toLowerCase().includes('sistema') || (msg.subject || '').toLowerCase().includes('notificación');

              const style = getMessageStyle(msg.subject || '', msg.message || '', isMe, isSystem);

              return (
                <div key={msg.messageId} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`relative max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-sm ${style.container}`}>
                    {/* ✅ Delete button (solo admin) */}
                    {isAdmin && onDeleteMessage && (
                      <button
                        type="button"
                        onClick={() => {
                          const ok = window.confirm('¿Eliminar este mensaje?');
                          if (!ok) return;
                          onDeleteMessage(msg.messageId);
                        }}
                        className="absolute -top-2 -right-2 p-1 rounded-full bg-black/20 hover:bg-black/30 text-white transition"
                        title="Eliminar mensaje"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <div className="flex items-start gap-2">
                      {style.icon && <div className="mt-0.5">{style.icon}</div>}
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-4 mb-2">
                          <p className="text-xs font-bold opacity-90 flex items-center gap-1">
                            {isSystem ? (
                              <>
                                <Shield className="w-3 h-3" />
                                Sistema
                              </>
                            ) : (
                              msg.senderName || (isMe ? 'Yo' : 'Socio')
                            )}
                          </p>
                          <p className="text-[11px] opacity-80">{msg.date}</p>
                        </div>

                        {(msg.subject && msg.subject !== 'Chat Message' && msg.subject !== 'Chat') && (
                          <p className="text-sm font-bold mb-2 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 opacity-90" />
                            {msg.subject}
                          </p>
                        )}

                        <div className="text-sm leading-relaxed">
                          {formatMessageText(msg.message || '')}
                        </div>

                        <div className="mt-2 flex justify-end">
                          {msg.status === 'READ' ? (
                            <span className="text-[11px] opacity-90 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Leído
                            </span>
                          ) : (
                            <span className="text-[11px] opacity-80">No leído</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex gap-2">
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || !activeChatId}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-bold shadow-sm flex items-center gap-2 transition-colors"
            >
              <Send className="w-4 h-4" />
              Enviar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

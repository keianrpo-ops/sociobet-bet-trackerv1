import React, { useState } from 'react';
import { Partner } from '../types';
import { User, Shield, CheckCircle, XCircle, MoreVertical, Edit2, Phone, Mail, Calendar, TrendingUp } from 'lucide-react';
import { CreatePartnerModal } from './CreatePartnerModal';

interface PartnerListProps {
  partners: Partner[];
  onUpdatePartner: (updated: Partner) => void;
}

export const PartnerList: React.FC<PartnerListProps> = ({ partners, onUpdatePartner }) => {
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEdit = (partner: Partner) => {
      setEditingPartner(partner);
      setIsModalOpen(true);
  };

  const handleCreate = () => {
      setEditingPartner(null);
      setIsModalOpen(true);
  };

  const handleSave = (partnerData: Partner) => {
      // Si estamos editando, mantenemos el ID
      if (editingPartner) {
          onUpdatePartner({ ...editingPartner, ...partnerData });
      } else {
          onUpdatePartner(partnerData);
      }
      setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Gestión de Socios</h2>
                <p className="text-slate-500 dark:text-slate-400">Administración de perfiles y contratos</p>
            </div>
            <button 
                onClick={handleCreate}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95 flex items-center gap-2"
            >
                <User className="w-5 h-5" /> Registrar Nuevo
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partners.filter(p => p.partnerId !== 'P001').map(partner => (
                <div 
                    key={partner.partnerId} 
                    className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 relative overflow-hidden group hover:-translate-y-2 transition-all duration-300 shadow-xl shadow-slate-200/50 dark:shadow-none"
                >
                    {/* 3D Bottom Border Gradient */}
                    <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                    
                    {/* Background Decorative Blob */}
                    <div className="absolute -right-12 -top-12 w-40 h-40 bg-slate-50 dark:bg-slate-700/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-2xl duration-500"></div>

                    {/* Header Image Area */}
                    <div className="relative z-10 flex justify-between items-start mb-6">
                         <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-700 p-1 shadow-lg shadow-slate-200 dark:shadow-black/20 group-hover:scale-105 transition-transform duration-300">
                             {partner.profileImage ? (
                                 <img src={partner.profileImage} alt={partner.name} className="w-full h-full object-cover rounded-xl" />
                             ) : (
                                 <div className="w-full h-full bg-slate-100 dark:bg-slate-600 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500">
                                     <User className="w-8 h-8" />
                                 </div>
                             )}
                         </div>
                         <button 
                            onClick={() => handleEdit(partner)}
                            className="p-2 bg-white dark:bg-slate-700 rounded-full shadow-sm border border-slate-100 dark:border-slate-600 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-colors z-20"
                            title="Editar Perfil"
                        >
                             <Edit2 className="w-4 h-4" />
                         </button>
                    </div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-xl text-slate-800 dark:text-white leading-tight">{partner.name}</h3>
                                <p className="text-xs text-slate-400 font-mono mt-1">ID: {partner.partnerId}</p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${partner.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                                {partner.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>

                        <div className="space-y-3 mt-4 text-sm text-slate-600 dark:text-slate-300">
                             {/* Tarjeta de Comisión destacada */}
                             <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800 group-hover:border-blue-200 transition-colors">
                                <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                    <TrendingUp className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <span className="block text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase opacity-70">Tu Comisión (Admin)</span>
                                    <span className="block font-black text-lg text-slate-800 dark:text-white leading-none mt-0.5">{partner.partnerProfitPct}%</span>
                                </div>
                             </div>

                             <div className="space-y-2 pt-2">
                                <div className="flex items-center gap-3 px-1">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Desde: <span className="text-slate-700 dark:text-slate-200 font-medium">{partner.joinedDate}</span></span>
                                </div>
                                {partner.email && (
                                    <div className="flex items-center gap-3 px-1">
                                        <Mail className="w-4 h-4 text-slate-400" />
                                        <span className="text-xs text-slate-700 dark:text-slate-200 truncate max-w-[200px]" title={partner.email}>{partner.email}</span>
                                    </div>
                                )}
                                {partner.phone && (
                                    <div className="flex items-center gap-3 px-1">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                        <span className="text-xs text-slate-700 dark:text-slate-200">{partner.phone}</span>
                                    </div>
                                )}
                             </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                            <div className={`flex items-center justify-center gap-2 text-xs font-bold px-3 py-2 rounded-lg transition-colors ${partner.contractAccepted ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800' : 'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'}`}>
                                {partner.contractAccepted ? <CheckCircle className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                {partner.contractAccepted ? `Contrato Firmado (${partner.contractAcceptedDate || 'N/A'})` : 'Contrato Pendiente'}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            
            {/* Card para añadir nuevo (visible si hay pocos socios o siempre al final) */}
            <button 
                onClick={handleCreate}
                className="min-h-[300px] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-4 text-slate-400 hover:text-blue-600 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
            >
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <User className="w-8 h-8" />
                </div>
                <span className="font-bold text-sm">Registrar Nuevo Socio</span>
            </button>
        </div>

        {/* Modal Reutilizada para Crear/Editar */}
        {isModalOpen && (
            <CreatePartnerModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSave} 
                initialData={editingPartner}
            />
        )}
    </div>
  );
};
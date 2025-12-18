import React, { useEffect, useRef, useState } from 'react';
import { Partner } from '../types';
import { X, Save, Lock, User, Mail, ShieldCheck, AlertCircle, Image as ImageIcon, Trash2 } from 'lucide-react';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Partner;
  // 👇 Permitimos que sea async o sync
  onUpdateProfile: (updatedData: Partner) => Promise<void> | void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'SECURITY'>('GENERAL');

  // Foto
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>((currentUser as any).profileImage ?? null);

  // General State
  const [formData, setFormData] = useState({
    name: currentUser.name,
    email: currentUser.email || '',
    username: currentUser.username || '',
  });

  // Security State
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Re-sincroniza el modal cuando cambia usuario / se abre
  useEffect(() => {
    if (!isOpen) return;
    setActiveTab('GENERAL');
    setFormData({
      name: currentUser.name,
      email: currentUser.email || '',
      username: currentUser.username || '',
    });
    setPasswords({ current: '', new: '', confirm: '' });
    setError('');
    setSuccess('');
    setIsSaving(false);
    setProfileImage((currentUser as any).profileImage ?? null);
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const triggerPickImage = () => fileInputRef.current?.click();

  const handlePickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Validaciones básicas
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen (JPG/PNG/WebP).');
      e.target.value = '';
      return;
    }
    const maxBytes = 2 * 1024 * 1024; // 2MB
    if (file.size > maxBytes) {
      setError('La imagen es muy pesada. Usa una de máximo 2MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result?.toString() || '';
      if (!result.startsWith('data:image/')) {
        setError('No se pudo leer la imagen. Intenta con otra.');
        return;
      }
      setProfileImage(result);
    };
    reader.onerror = () => setError('Error leyendo la imagen. Intenta de nuevo.');
    reader.readAsDataURL(file);

    // Permite volver a elegir el mismo archivo si lo desean
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
  };

  const handleGeneralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      // Armamos payload incluyendo profileImage (aunque Partner no lo tipifique)
      const updated: any = {
        ...currentUser,
        name: formData.name,
        email: formData.email,
        username: formData.username,
        profileImage, // base64 o null
      };

      await Promise.resolve(onUpdateProfile(updated as Partner));

      setSuccess('Perfil actualizado correctamente.');
      // ✅ Esto es lo que te faltaba: cerrar el modal
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: any) {
      setError(err?.message || 'No se pudo actualizar el perfil. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      // 1. Verificar contraseña actual
      if (passwords.current !== currentUser.password) {
        setError('La contraseña actual es incorrecta.');
        return;
      }

      // 2. Validar nueva contraseña
      if (passwords.new.length < 4) {
        setError('La nueva contraseña debe tener al menos 4 caracteres.');
        return;
      }

      if (passwords.new !== passwords.confirm) {
        setError('Las nuevas contraseñas no coinciden.');
        return;
      }

      // 3. Guardar
      await Promise.resolve(
        onUpdateProfile({
          ...currentUser,
          password: passwords.new,
        })
      );

      setSuccess('Contraseña actualizada con éxito.');
      setPasswords({ current: '', new: '', confirm: '' });

      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      setError(err?.message || 'No se pudo actualizar la contraseña.');
    } finally {
      setIsSaving(false);
    }
  };

  const initials = (formData.name || 'U')
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" /> Configuración de Cuenta
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-100 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('GENERAL')}
            className={`flex-1 py-3 text-sm font-bold text-center transition-colors ${
              activeTab === 'GENERAL'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-slate-700'
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            Información General
          </button>
          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`flex-1 py-3 text-sm font-bold text-center transition-colors ${
              activeTab === 'SECURITY'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-slate-700'
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            Seguridad y Contraseña
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 rounded-lg text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> {success}
            </div>
          )}

          {activeTab === 'GENERAL' ? (
            <form onSubmit={handleGeneralSubmit} className="space-y-4">
              {/* FOTO */}
              <div className="flex items-center gap-4 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40">
                <div className="w-16 h-16 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 flex items-center justify-center">
                  {profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profileImage} alt="Foto de perfil" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-700 dark:text-slate-200 font-bold">{initials}</span>
                  )}
                </div>

                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Foto de perfil</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={triggerPickImage}
                      className="px-3 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white text-sm font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-600"
                    >
                      <ImageIcon className="w-4 h-4" /> Subir foto
                    </button>

                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={!profileImage}
                      className="px-3 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white text-sm font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" /> Quitar
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Recomendado: JPG/PNG, máximo 2MB.</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePickImage}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Nombre Mostrado
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Usuario (Login)
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-300 text-sm cursor-not-allowed"
                  value={formData.username}
                  disabled
                  title="El nombre de usuario no se puede cambiar por seguridad"
                />
                <p className="text-[10px] text-slate-400 mt-1">El nombre de usuario es inmutable.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <button
                disabled={isSaving}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg font-bold shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSecuritySubmit} className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 mb-4">
                Para cambiar tu contraseña, primero debes confirmar que eres tú ingresando tu clave actual.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder="••••••"
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 my-4 pt-4">
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving || !passwords.current || !passwords.new}
                className="w-full py-2 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" /> {isSaving ? 'Actualizando...' : 'Actualizar Contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

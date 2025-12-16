import React, { useState } from 'react';
import { Shield, FileText, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { Partner } from '../types';

interface ContractModalProps {
  partner: Partner;
  onAccept: () => void;
  onLogout: () => void;
}

export const ContractModal: React.FC<ContractModalProps> = ({ partner, onAccept, onLogout }) => {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [checked, setChecked] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const bottom = e.currentTarget.scrollHeight - e.currentTarget.scrollTop === e.currentTarget.clientHeight;
    if (bottom || e.currentTarget.scrollTop > 200) { 
        setHasScrolled(true); 
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
       <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700">
          
          {/* Header Legal */}
          <div className="bg-slate-50 dark:bg-slate-900 p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-lg text-white">
                    <FileText className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Contrato de Inversión</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Términos y Condiciones de Uso - SocioBet v2.1</p>
                </div>
             </div>
             <div className="text-right hidden sm:block">
                 <p className="text-xs font-bold text-slate-400 uppercase">Referencia</p>
                 <p className="text-sm font-mono text-slate-600 dark:text-slate-300">REF-{partner.partnerId}-{new Date().getFullYear()}</p>
             </div>
          </div>

          {/* Cuerpo del Contrato */}
          <div 
            className="flex-1 overflow-y-auto p-8 space-y-6 text-justify text-sm leading-relaxed text-slate-600 dark:text-slate-300 font-serif bg-white dark:bg-slate-800"
            onScroll={handleScroll}
          >
              <div className="mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                  <p className="font-bold text-lg text-slate-800 dark:text-white mb-2">Acuerdo de Participación Conjunta</p>
                  <p>
                      Celebrado entre <strong>SocioBet Administración</strong> (en adelante "El Gestor") y <strong>{partner.name}</strong> (en adelante "El Socio"), 
                      identificado en el sistema con ID {partner.partnerId}.
                  </p>
              </div>

              <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-wider border-l-4 border-blue-500 pl-3">1. Objeto del Contrato</h3>
                  <p>El Socio entrega capital al Gestor para ser utilizado exclusivamente en operaciones de apuestas deportivas de alto valor (arbitraje, value betting). El Gestor se compromete a administrar dicho capital con diligencia profesional.</p>

                  <h3 className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-wider border-l-4 border-blue-500 pl-3">2. Distribución de Utilidades</h3>
                  <p>
                      Las ganancias netas generadas (Gross Profit) se distribuirán de la siguiente manera:
                      <br/>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                          <li><strong>{partner.partnerProfitPct}%</strong> para El Socio.</li>
                          <li><strong>{100 - partner.partnerProfitPct}%</strong> para El Gestor en concepto de comisión por administración y riesgo operativo.</li>
                      </ul>
                  </p>

                  <h3 className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-wider border-l-4 border-rose-500 pl-3">3. Blindaje de Capital y Política de Retiros</h3>
                  <p className="bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg border border-rose-100 dark:border-rose-800 text-rose-800 dark:text-rose-200">
                      <AlertTriangle className="w-4 h-4 inline mr-2 mb-0.5" />
                      <strong>CLÁUSULA RESTRICTIVA DE LIQUIDEZ:</strong>
                  </p>
                  <ul className="list-decimal pl-5 space-y-3">
                      <li>
                          <strong>Intangibilidad del Capital Inicial:</strong> Queda terminantemente prohibido realizar retiros parciales o totales que afecten el monto del Capital Inicial depositado. Los retiros están limitados <strong>exclusivamente a las Utilidades Netas</strong> generadas.
                      </li>
                      <li>
                          <strong>Condición de Desbloqueo de Capital:</strong> El Capital Inicial de Inversión permanecerá bloqueado en la operación y solo podrá ser retirado por El Socio una vez que las <strong>Utilidades Acumuladas superen el 100%</strong> del valor de dicho Capital Inicial (es decir, una vez duplicada la inversión mediante rendimientos).
                      </li>
                      <li>
                          <strong>Recuperación de Pérdidas (Drawdown):</strong> En caso de que el fondo presente pérdidas, el 100% de los beneficios futuros se destinarán automáticamente a reconstruir el Capital Inicial hasta su nivel original antes de realizar cualquier distribución de ganancias.
                      </li>
                      <li>
                          Los retiros de utilidades disponibles deben solicitarse con 48 horas de antelación a través de la plataforma.
                      </li>
                  </ul>

                  <h3 className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-wider border-l-4 border-blue-500 pl-3">4. Riesgos</h3>
                  <p>El Socio declara entender que las inversiones deportivas conllevan riesgo. Aunque el Gestor utiliza estrategias matemáticas para minimizarlo, no se garantiza retorno fijo. El capital está en riesgo.</p>

                  <h3 className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-wider border-l-4 border-blue-500 pl-3">5. Transparencia</h3>
                  <p>El Gestor proveerá acceso 24/7 a este Dashboard para que El Socio audite cada movimiento, apuesta y resultado en tiempo real.</p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-center font-bold text-slate-400 text-xs uppercase mb-8">Firma Digital</p>
                  <div className="flex justify-between px-10">
                      <div className="text-center">
                          <div className="font-script text-2xl text-blue-600 mb-2">SocioBet Admin</div>
                          <div className="border-t border-slate-300 w-32 mx-auto"></div>
                          <p className="text-xs text-slate-400 mt-1">El Gestor</p>
                      </div>
                      <div className="text-center">
                          <div className="font-script text-2xl text-slate-600 dark:text-slate-300 mb-2 italic">{partner.name}</div>
                          <div className="border-t border-slate-300 w-32 mx-auto"></div>
                          <p className="text-xs text-slate-400 mt-1">El Socio</p>
                      </div>
                  </div>
              </div>
          </div>

          {/* Footer Acciones */}
          <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 shadow transition-all checked:border-blue-600 checked:bg-blue-600 hover:shadow-md"
                        checked={checked}
                        onChange={e => setChecked(e.target.checked)}
                      />
                      <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <CheckCircle className="w-3.5 h-3.5" />
                      </span>
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-400 select-none group-hover:text-slate-800 dark:group-hover:text-slate-200">
                      Acepto la cláusula de restricción de retiro de capital y demás términos.
                  </span>
              </label>

              <div className="flex gap-3 w-full sm:w-auto">
                  <button 
                    onClick={onLogout}
                    className="flex-1 sm:flex-none px-4 py-2.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white font-medium text-sm transition-colors"
                  >
                      Rechazar y Salir
                  </button>
                  <button 
                    onClick={onAccept}
                    disabled={!checked}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                      <Shield className="w-4 h-4" /> Firmar Contrato
                  </button>
              </div>
          </div>
       </div>
    </div>
  );
};
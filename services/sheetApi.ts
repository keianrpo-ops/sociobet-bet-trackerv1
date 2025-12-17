import { Partner, Bet, Fund, Withdrawal, Message } from '../types';
import { supabase } from '../lib/supabase';

// --- SUPABASE API SERVICE ---

// Helper: Limpia la apuesta de campos calculados que NO existen en la base de datos
const cleanBetForDB = (b: Bet) => {
    return {
        betId: b.betId,
        partnerId: b.partnerId,
        date: b.date,
        sport: b.sport || 'General',
        homeTeam: b.homeTeam,
        awayTeam: b.awayTeam,
        marketDescription: b.marketDescription,
        oddsDecimal: Number(b.oddsDecimal), // Asegurar número
        stakeCOP: Number(b.stakeCOP),       // Asegurar número
        status: b.status,
        cashoutReturnCOP: Number(b.cashoutReturnCOP || 0),
        notes: b.notes || ''
        // EXCLUIMOS: expectedReturnCOP, finalReturnCOP, profitGrossCOP, etc.
        // Supabase rebotará la actualización si enviamos columnas que no existen.
    };
};

export const sheetApi = {
    // 1. SYNC: Load everything
    async syncAll() {
        try {
            // Intentamos leer con mayúsculas (Estándar Code.gs)
            const [partners, bets, funds, withdrawals, messages] = await Promise.all([
                supabase.from('Partners').select('*'),
                supabase.from('Bets').select('*'),
                supabase.from('Funds').select('*'),
                supabase.from('Withdrawals').select('*'),
                supabase.from('Messages').select('*')
            ]);

            // Verificación de errores de tabla no encontrada
            if (partners.error) console.error("Error Partners:", partners.error.message);
            
            // Si fallan las mayúsculas, Supabase a veces requiere minúsculas (fallback implícito en lógica de usuario)
            // Pero aquí asumimos que la estructura sigue el patrón del Apps Script.

            if (partners.error || bets.error) {
                // Si falla la lectura, devolvemos null para activar modo demo/error
                return null;
            }

            return { 
                partners: partners.data as Partner[], 
                bets: bets.data as Bet[], 
                funds: funds.data as Fund[], 
                withdrawals: withdrawals.data as Withdrawal[], 
                messages: messages.data as Message[] 
            };
        } catch (error) {
            console.error("Critical Sync Error:", error);
            return null;
        }
    },

    // 2. CREATE (INSERT)
    async savePartner(p: Partner) { 
        const { error } = await supabase.from('Partners').insert(p);
        if (error) throw error;
        return { success: true };
    },
    async saveBet(b: Bet) { 
        const dbBet = cleanBetForDB(b);
        const { error } = await supabase.from('Bets').insert(dbBet);
        if (error) throw error;
        return { success: true };
    },
    async saveFund(f: Fund) { 
        const { error } = await supabase.from('Funds').insert(f);
        if (error) throw error;
        return { success: true };
    },
    async saveWithdrawal(w: Withdrawal) { 
        const { error } = await supabase.from('Withdrawals').insert(w);
        if (error) throw error;
        return { success: true };
    },
    async saveMessage(m: Message) { 
        const { error } = await supabase.from('Messages').insert(m);
        if (error) throw error;
        return { success: true };
    },

    // 3. UPDATE CON LIMPIEZA DE DATOS
    async updateBet(b: Bet) { 
        const dbBet = cleanBetForDB(b);
        const { error, count } = await supabase.from('Bets').update(dbBet).eq('betId', dbBet.betId).select('betId', { count: 'exact' });
        
        if (error) {
            console.error("Supabase Update Error (Bets):", error);
            throw error;
        }
        if (count === 0) throw new Error(`Apuesta no encontrada en BD: ${dbBet.betId}`);
        return { success: true };
    },
    async updateFund(f: Fund) { 
        const { error, count } = await supabase.from('Funds').update(f).eq('fundId', f.fundId).select('fundId', { count: 'exact' });
        if (error) throw error;
        return { success: true };
    },
    async updateWithdrawal(w: Withdrawal) { 
        const { error, count } = await supabase.from('Withdrawals').update(w).eq('withdrawalId', w.withdrawalId).select('withdrawalId', { count: 'exact' });
        if (error) throw error;
        if (count === 0) throw new Error(`Retiro no encontrado: ${w.withdrawalId}`);
        return { success: true };
    },
    async updatePartner(p: Partner) { 
        const { error } = await supabase.from('Partners').update(p).eq('partnerId', p.partnerId);
        if (error) throw error;
        return { success: true };
    },
    async updateMessage(m: Message) { 
        const { error } = await supabase.from('Messages').update(m).eq('messageId', m.messageId);
        if (error) throw error;
        return { success: true };
    },

    // 4. DELETE
    async deleteFund(fundId: string) { 
        const { error } = await supabase.from('Funds').delete().eq('fundId', fundId);
        if (error) throw error;
        return { success: true };
    }
};
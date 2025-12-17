import { Partner, Bet, Fund, Withdrawal, Message } from '../types';
import { supabase } from '../lib/supabase';

// --- SUPABASE API SERVICE ---

export const sheetApi = {
    // 1. SYNC: Load everything
    async syncAll() {
        try {
            const [partners, bets, funds, withdrawals, messages] = await Promise.all([
                supabase.from('Partners').select('*'),
                supabase.from('Bets').select('*'),
                supabase.from('Funds').select('*'),
                supabase.from('Withdrawals').select('*'),
                supabase.from('Messages').select('*')
            ]);

            if (partners.error || bets.error) {
                console.error("Supabase Error (Sync):", partners.error || bets.error);
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
        const { error } = await supabase.from('Bets').insert(b);
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

    // 3. UPDATE CON VERIFICACIÓN
    async updateBet(b: Bet) { 
        const { error, count } = await supabase.from('Bets').update(b).eq('betId', b.betId).select('betId', { count: 'exact' });
        if (error) throw error;
        if (count === 0) throw new Error(`No se encontró la apuesta ID: ${b.betId}`);
        return { success: true };
    },
    async updateFund(f: Fund) { 
        const { error, count } = await supabase.from('Funds').update(f).eq('fundId', f.fundId).select('fundId', { count: 'exact' });
        if (error) throw error;
        if (count === 0) throw new Error(`No se encontró el fondo ID: ${f.fundId}`);
        return { success: true };
    },
    async updateWithdrawal(w: Withdrawal) { 
        // Eliminamos campos UI que no existan en BD si es necesario, pero asumimos coincidencia
        const { error, count } = await supabase.from('Withdrawals').update(w).eq('withdrawalId', w.withdrawalId).select('withdrawalId', { count: 'exact' });
        
        if (error) {
            console.error("Supabase Update Error:", error);
            throw error;
        }
        if (count === 0) {
            console.warn("Update success but 0 rows affected. ID might be wrong:", w.withdrawalId);
            throw new Error(`Registro no encontrado en BD (ID: ${w.withdrawalId})`);
        }
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
import { Partner, Bet, Fund, Withdrawal, Message } from '../types';
import { supabase } from '../lib/supabase';

// --- SUPABASE API SERVICE ---

// NOTA: Usamos nombres de tablas en minúscula ('partners', 'bets'...) 
// porque Postgres/Supabase es sensible a mayúsculas si no se usan comillas,
// y por defecto las crea en minúscula.

export const sheetApi = {
    // 1. SYNC: Load everything
    async syncAll() {
        try {
            const [partners, bets, funds, withdrawals, messages] = await Promise.all([
                supabase.from('partners').select('*'),
                supabase.from('bets').select('*'),
                supabase.from('funds').select('*'),
                supabase.from('withdrawals').select('*'),
                supabase.from('messages').select('*')
            ]);

            // Check for specific table errors
            if (partners.error) console.error("Error syncing partners:", partners.error);
            if (bets.error) console.error("Error syncing bets:", bets.error);

            if (partners.error || bets.error) {
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
        const { error } = await supabase.from('partners').insert(p);
        if (error) throw error;
        return { success: true };
    },
    async saveBet(b: Bet) { 
        const { error } = await supabase.from('bets').insert(b);
        if (error) throw error;
        return { success: true };
    },
    async saveFund(f: Fund) { 
        const { error } = await supabase.from('funds').insert(f);
        if (error) throw error;
        return { success: true };
    },
    async saveWithdrawal(w: Withdrawal) { 
        const { error } = await supabase.from('withdrawals').insert(w);
        if (error) throw error;
        return { success: true };
    },
    async saveMessage(m: Message) { 
        const { error } = await supabase.from('messages').insert(m);
        if (error) throw error;
        return { success: true };
    },

    // 3. UPDATE CON VERIFICACIÓN
    async updateBet(b: Bet) { 
        const { error, count } = await supabase.from('bets').update(b).eq('betId', b.betId).select('betId', { count: 'exact' });
        if (error) throw error;
        if (count === 0) throw new Error(`ID no encontrado: ${b.betId}`);
        return { success: true };
    },
    async updateFund(f: Fund) { 
        const { error, count } = await supabase.from('funds').update(f).eq('fundId', f.fundId).select('fundId', { count: 'exact' });
        if (error) throw error;
        if (count === 0) throw new Error(`ID no encontrado: ${f.fundId}`);
        return { success: true };
    },
    async updateWithdrawal(w: Withdrawal) { 
        const { error, count } = await supabase.from('withdrawals').update(w).eq('withdrawalId', w.withdrawalId).select('withdrawalId', { count: 'exact' });
        if (error) throw error;
        if (count === 0) throw new Error(`ID no encontrado: ${w.withdrawalId}`);
        return { success: true };
    },
    async updatePartner(p: Partner) { 
        const { error } = await supabase.from('partners').update(p).eq('partnerId', p.partnerId);
        if (error) throw error;
        return { success: true };
    },
    async updateMessage(m: Message) { 
        const { error } = await supabase.from('messages').update(m).eq('messageId', m.messageId);
        if (error) throw error;
        return { success: true };
    },

    // 4. DELETE
    async deleteFund(fundId: string) { 
        const { error } = await supabase.from('funds').delete().eq('fundId', fundId);
        if (error) throw error;
        return { success: true };
    }
};
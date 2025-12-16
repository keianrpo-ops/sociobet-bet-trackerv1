import { Partner, Bet, Fund, Withdrawal, Message } from '../types';
import { supabase } from '../lib/supabase';

// --- SUPABASE API SERVICE ---
// Ya no necesitamos sheetMapper porque Supabase devuelve JSON limpio.

export const sheetApi = {
    // 1. SYNC: Load everything
    async syncAll() {
        try {
            // Ejecutamos todas las peticiones en paralelo a Supabase
            const [partners, bets, funds, withdrawals, messages] = await Promise.all([
                supabase.from('Partners').select('*'),
                supabase.from('Bets').select('*'),
                supabase.from('Funds').select('*'),
                supabase.from('Withdrawals').select('*'),
                supabase.from('Messages').select('*')
            ]);

            // Si hay error en la conexión o configuración
            if (partners.error || bets.error) {
                console.error("Supabase Error:", partners.error || bets.error);
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

    // 3. UPDATE
    async updateBet(b: Bet) { 
        const { error } = await supabase.from('Bets').update(b).eq('betId', b.betId);
        if (error) throw error;
        return { success: true };
    },
    async updateFund(f: Fund) { 
        const { error } = await supabase.from('Funds').update(f).eq('fundId', f.fundId);
        if (error) throw error;
        return { success: true };
    },
    async updateWithdrawal(w: Withdrawal) { 
        const { error } = await supabase.from('Withdrawals').update(w).eq('withdrawalId', w.withdrawalId);
        if (error) throw error;
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
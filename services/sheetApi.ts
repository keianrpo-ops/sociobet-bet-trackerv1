import { Partner, Bet, Fund, Withdrawal, Message } from '../types';
import { supabase } from '../lib/supabase';

// --- SUPABASE API SERVICE ---

// 1. CLEANERS (Limpiadores de Datos)
// Eliminan campos calculados o UI-only antes de enviar a Supabase para evitar errores.

const cleanBetForDB = (b: Bet) => ({
    betId: b.betId,
    partnerId: b.partnerId,
    date: b.date,
    sport: b.sport || 'General',
    homeTeam: b.homeTeam,
    awayTeam: b.awayTeam,
    marketDescription: b.marketDescription,
    oddsDecimal: Number(b.oddsDecimal),
    stakeCOP: Number(b.stakeCOP),
    status: b.status,
    cashoutReturnCOP: Number(b.cashoutReturnCOP || 0),
    notes: b.notes || ''
});

const cleanFundForDB = (f: Fund) => ({
    fundId: f.fundId,
    date: f.date,
    scope: f.scope,
    partnerId: f.partnerId,
    amountCOP: Number(f.amountCOP),
    method: f.method || 'Manual',
    description: f.description || ''
});

const cleanWithdrawalForDB = (w: Withdrawal) => ({
    withdrawalId: w.withdrawalId,
    date: w.date,
    partnerId: w.partnerId,
    amountCOP: Number(w.amountCOP),
    status: w.status,
    receiptUrl: w.receiptUrl || ''
});

const cleanMessageForDB = (m: Message) => ({
    messageId: m.messageId,
    date: m.date,
    partnerId: m.partnerId,
    senderName: m.senderName || 'System', // Asegurar que no vaya null
    subject: m.subject || 'No Subject',
    message: m.message,
    status: m.status,
    isFromAdmin: !!m.isFromAdmin // Forzar booleano
});

export const sheetApi = {
    // 1. SYNC: Load everything
    async syncAll() {
        try {
            // Intentamos leer todas las tablas
            const [partners, bets, funds, withdrawals, messages] = await Promise.all([
                supabase.from('Partners').select('*'),
                supabase.from('Bets').select('*'),
                supabase.from('Funds').select('*'),
                supabase.from('Withdrawals').select('*'),
                supabase.from('Messages').select('*')
            ]);

            // Detección de errores específicos por tabla
            const errors = [];
            if (partners.error) errors.push(`Partners: ${partners.error.message}`);
            if (bets.error) errors.push(`Bets: ${bets.error.message}`);
            if (funds.error) errors.push(`Funds: ${funds.error.message}`);
            if (withdrawals.error) errors.push(`Withdrawals: ${withdrawals.error.message}`);
            if (messages.error) errors.push(`Messages: ${messages.error.message}`);

            if (errors.length > 0) {
                console.error("⚠️ Sync Errors:", errors.join(' | '));
                // Si falla Partners o Bets, es crítico. Si fallan mensajes, podemos tolerarlo pero retornamos array vacío.
                if (partners.error || bets.error) return null;
            }

            return { 
                partners: partners.data as Partner[] || [], 
                bets: bets.data as Bet[] || [], 
                funds: funds.data as Fund[] || [], 
                withdrawals: withdrawals.data as Withdrawal[] || [], 
                messages: messages.data as Message[] || []
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
        const dbFund = cleanFundForDB(f);
        const { error } = await supabase.from('Funds').insert(dbFund);
        if (error) throw error;
        return { success: true };
    },
    async saveWithdrawal(w: Withdrawal) { 
        const dbW = cleanWithdrawalForDB(w);
        const { error } = await supabase.from('Withdrawals').insert(dbW);
        if (error) throw error;
        return { success: true };
    },
    async saveMessage(m: Message) { 
        const dbMsg = cleanMessageForDB(m);
        const { error } = await supabase.from('Messages').insert(dbMsg);
        if (error) throw error;
        return { success: true };
    },

    // 3. UPDATE
    async updateBet(b: Bet) { 
        const dbBet = cleanBetForDB(b);
        const { error, count } = await supabase.from('Bets').update(dbBet).eq('betId', dbBet.betId).select('betId', { count: 'exact' });
        if (error) throw error;
        if (count === 0) throw new Error(`Apuesta no encontrada en BD: ${dbBet.betId}`);
        return { success: true };
    },
    async updateFund(f: Fund) { 
        const dbFund = cleanFundForDB(f);
        const { error, count } = await supabase.from('Funds').update(dbFund).eq('fundId', dbFund.fundId).select('fundId', { count: 'exact' });
        if (error) throw error;
        return { success: true };
    },
    async updateWithdrawal(w: Withdrawal) { 
        const dbW = cleanWithdrawalForDB(w);
        const { error, count } = await supabase.from('Withdrawals').update(dbW).eq('withdrawalId', dbW.withdrawalId).select('withdrawalId', { count: 'exact' });
        if (error) throw error;
        return { success: true };
    },
    async updatePartner(p: Partner) { 
        const { error } = await supabase.from('Partners').update(p).eq('partnerId', p.partnerId);
        if (error) throw error;
        return { success: true };
    },
    async updateMessage(m: Message) { 
        const dbMsg = cleanMessageForDB(m);
        const { error } = await supabase.from('Messages').update(dbMsg).eq('messageId', dbMsg.messageId);
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
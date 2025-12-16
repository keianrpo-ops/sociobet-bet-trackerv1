import { Partner, Bet, Fund, Withdrawal, Message } from '../types';
import { SHEET_COLUMNS, rowToObject, objectToRow } from '../utils/sheetMapper';

const API_URL = '/api/sheets';

// Helper genérico para fetch
async function fetchSheetData<T>(tabName: string, columns: string[]): Promise<T[] | null> {
    try {
        const res = await fetch(`${API_URL}?tab=${tabName}`);
        
        // Si la API dice que faltan credenciales (503), devolvemos null explícito
        if (res.status === 503) return null;
        
        if (!res.ok) throw new Error(`Error fetching ${tabName}`);
        
        const data = await res.json();
        return data as T[];
    } catch (e) {
        console.error(`Failed to load ${tabName}`, e);
        return [];
    }
}

async function createItem(tabName: string, item: any, columns: string[]) {
    const row = objectToRow(item, columns);
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tab: tabName, data: row })
    });
    return res.json();
}

async function updateItem(tabName: string, id: string, item: any, columns: string[]) {
    const row = objectToRow(item, columns);
    const res = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tab: tabName, id, data: row })
    });
    return res.json();
}

async function deleteItem(tabName: string, id: string) {
    const res = await fetch(API_URL, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tab: tabName, id })
    });
    return res.json();
}

// --- PUBLIC METHODS ---

export const sheetApi = {
    // 1. SYNC: Load everything
    async syncAll() {
        // Ejecutamos todas las peticiones en paralelo
        const results = await Promise.all([
            fetchSheetData<Partner>('Partners', SHEET_COLUMNS.PARTNERS),
            fetchSheetData<Bet>('Bets', SHEET_COLUMNS.BETS),
            fetchSheetData<Fund>('Funds', SHEET_COLUMNS.FUNDS),
            fetchSheetData<Withdrawal>('Withdrawals', SHEET_COLUMNS.WITHDRAWALS),
            fetchSheetData<Message>('Messages', SHEET_COLUMNS.MESSAGES),
        ]);

        // Si ALGUNA devolvió null (503), asumimos modo local total
        if (results.some(r => r === null)) {
            return null;
        }

        return { 
            partners: results[0] as Partner[], 
            bets: results[1] as Bet[], 
            funds: results[2] as Fund[], 
            withdrawals: results[3] as Withdrawal[], 
            messages: results[4] as Message[] 
        };
    },

    // 2. CREATE
    async savePartner(p: Partner) { return createItem('Partners', p, SHEET_COLUMNS.PARTNERS); },
    async saveBet(b: Bet) { return createItem('Bets', b, SHEET_COLUMNS.BETS); },
    async saveFund(f: Fund) { return createItem('Funds', f, SHEET_COLUMNS.FUNDS); },
    async saveWithdrawal(w: Withdrawal) { return createItem('Withdrawals', w, SHEET_COLUMNS.WITHDRAWALS); },
    async saveMessage(m: Message) { return createItem('Messages', m, SHEET_COLUMNS.MESSAGES); },

    // 3. UPDATE
    async updateBet(b: Bet) { return updateItem('Bets', b.betId, b, SHEET_COLUMNS.BETS); },
    async updateFund(f: Fund) { return updateItem('Funds', f.fundId, f, SHEET_COLUMNS.FUNDS); },
    async updateWithdrawal(w: Withdrawal) { return updateItem('Withdrawals', w.withdrawalId, w, SHEET_COLUMNS.WITHDRAWALS); },
    async updatePartner(p: Partner) { return updateItem('Partners', p.partnerId, p, SHEET_COLUMNS.PARTNERS); },
    async updateMessage(m: Message) { return updateItem('Messages', m.messageId, m, SHEET_COLUMNS.MESSAGES); },

    // 4. DELETE
    async deleteFund(fundId: string) { return deleteItem('Funds', fundId); }
};
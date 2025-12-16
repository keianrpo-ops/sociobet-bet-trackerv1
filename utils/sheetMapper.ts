import { Partner, Bet, Fund, Withdrawal, Message } from '../types';

// DEFINICIÓN DE COLUMNAS (Debe coincidir EXACTAMENTE con el orden en Google Sheets)
export const SHEET_COLUMNS = {
    PARTNERS: ['partnerId', 'name', 'status', 'partnerProfitPct', 'username', 'password', 'email', 'phone', 'joinedDate', 'profileImage', 'contractAccepted', 'contractAcceptedDate'],
    BETS: ['betId', 'partnerId', 'date', 'sport', 'homeTeam', 'awayTeam', 'marketDescription', 'oddsDecimal', 'stakeCOP', 'status', 'cashoutReturnCOP', 'notes'],
    FUNDS: ['fundId', 'date', 'scope', 'partnerId', 'amountCOP', 'method', 'description'],
    WITHDRAWALS: ['withdrawalId', 'date', 'partnerId', 'amountCOP', 'status', 'receiptUrl'],
    MESSAGES: ['messageId', 'date', 'partnerId', 'senderName', 'subject', 'message', 'status', 'isFromAdmin']
};

// --- HELPER: ROW (Array) -> OBJECT ---
export const rowToObject = <T>(row: any[], columns: string[]): T => {
    const obj: any = {};
    columns.forEach((col, index) => {
        let val = row[index];
        
        // Conversión de Tipos
        if (col.includes('Pct') || col.includes('COP') || col.includes('odds') || col === 'stake') {
            // Eliminar símbolos de moneda si existen y convertir a numero
            if (typeof val === 'string') {
                 val = val.replace(/[$,]/g, '');
            }
            val = Number(val) || 0;
        } else if (col === 'contractAccepted' || col === 'isFromAdmin') {
            val = val === 'TRUE' || val === true || val === 'true';
        }
        
        // Limpiar undefined/null
        obj[col] = val === undefined || val === null ? '' : val;
    });
    return obj as T;
};

// --- HELPER: OBJECT -> ROW (Array) ---
export const objectToRow = (obj: any, columns: string[]): any[] => {
    return columns.map(col => {
        let val = obj[col];
        if (val === undefined || val === null) return '';
        // Convertir booleanos a string para Sheets
        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
        return val;
    });
};
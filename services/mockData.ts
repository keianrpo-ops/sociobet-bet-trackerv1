import { Bet, Partner, Fund, Withdrawal, Message } from '../types';

// DATA INICIAL PARA PRODUCCIÓN
// Mantenemos al ADMIN y un Socio de Ejemplo para poder iniciar sesión.

export const MOCK_PARTNERS: Partner[] = [
  { 
      partnerId: 'P001', 
      name: 'Admin Usuario', 
      status: 'ACTIVE', 
      partnerProfitPct: 100, 
      username: 'admin', 
      password: '123',
      email: 'admin@sociobet.com',
      joinedDate: '2023-01-01',
      contractAccepted: true 
  },
  { 
      partnerId: 'P005', 
      name: 'Gloria Cano', 
      status: 'ACTIVE', 
      partnerProfitPct: 50, 
      username: 'gloria', 
      password: '123',
      email: 'gloria@email.com',
      phone: '+57 300 123 4567',
      joinedDate: new Date().toISOString().split('T')[0],
      contractAccepted: false 
  }
];

// ARRAYS VACÍOS (Listos para recibir data real)
export const MOCK_FUNDS: Fund[] = [];
export const MOCK_WITHDRAWALS: Withdrawal[] = [];
export const MOCK_BETS: Bet[] = [];
export const MOCK_MESSAGES: Message[] = [];
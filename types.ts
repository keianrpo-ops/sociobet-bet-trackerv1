
export type Role = 'ADMIN' | 'PARTNER';
export type BetStatus = 'PENDING' | 'WON' | 'LOST' | 'CASHED_OUT' | 'VOID';
export type MovementType = 'DEPOSIT' | 'BET_PLACED' | 'BET_RESULT' | 'CASHOUT' | 'VOID_REFUND' | 'WITHDRAWAL_REQUEST' | 'WITHDRAWAL_PAID' | 'ADJUSTMENT';

export interface Partner {
  partnerId: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  partnerProfitPct: number;
  notes?: string;
  // Auth & Profile fields
  username?: string;
  password?: string;
  email?: string;
  phone?: string;
  profileImage?: string; // Base64 or URL
  joinedDate: string;
  // Legal
  contractAccepted: boolean;
  contractAcceptedDate?: string;
}

export interface User {
  userId: string;
  emailOrUsername: string;
  role: Role;
  partnerId?: string; // Empty if ADMIN
}

export interface Fund {
  fundId: string;
  date: string;
  scope: 'GENERAL' | 'PARTNER';
  partnerId?: string;
  amountCOP: number;
  method: string;
  description: string;
}

export interface Bet {
  betId: string;
  partnerId: string;
  date: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  marketDescription: string;
  oddsDecimal: number;
  stakeCOP: number;
  expectedReturnCOP: number;
  status: BetStatus;
  cashoutReturnCOP?: number;
  finalReturnCOP?: number;
  profitGrossCOP?: number;
  profitPartnerCOP?: number;
  profitAdminCOP?: number;
  notes?: string;
}

export interface Withdrawal {
  withdrawalId: string;
  date: string;
  partnerId: string;
  amountCOP: number;
  status: 'REQUESTED' | 'APPROVED' | 'PAID' | 'REJECTED';
  receiptUrl?: string; // URL or Base64 of the payment proof image
}

export interface Movement {
  movementId: string;
  date: string;
  partnerId: string;
  type: MovementType;
  amountCOP: number;
  refId?: string;
  description: string;
}

export interface Message {
  messageId: string;
  date: string;
  partnerId: string;
  senderName: string; // Helper for UI
  subject: string;
  message: string;
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
  isFromAdmin: boolean;
}

// Stats for Dashboard
export interface DashboardStats {
  totalDeposited: number;
  totalWithdrawn: number;
  currentBalance: number; // For low capital alert
  totalStaked: number;
  totalReturned: number;
  grossProfit: number;
  netProfitPartner: number;
  netProfitAdmin: number;
  pendingExposure: number;
  winRate: number;
  avgOdds: number;
  roi: number;
  roas: number;
}

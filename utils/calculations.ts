import { Bet, Partner, DashboardStats, Fund, Withdrawal, Movement } from '../types';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const calculateExpectedReturn = (stake: number, odds: number): number => {
  return stake * odds;
};

// Cálculo individual de la apuesta
export const calculateBetOutcome = (
  bet: Bet,
  adminCommissionPct: number // RENAMED for clarity: This is the % the Partner gives to Admin
): { finalReturn: number; profitGross: number; profitPartner: number; profitAdmin: number } => {
  let finalReturn = 0;
  let profitGross = 0;

  switch (bet.status) {
    case 'WON':
      finalReturn = calculateExpectedReturn(bet.stakeCOP, bet.oddsDecimal);
      profitGross = finalReturn - bet.stakeCOP;
      break;
    case 'LOST':
      finalReturn = 0;
      profitGross = -bet.stakeCOP;
      break;
    case 'CASHED_OUT':
      // En Cashout, el finalReturn es EXACTAMENTE lo que paga la casa
      finalReturn = bet.cashoutReturnCOP || 0;
      profitGross = finalReturn - bet.stakeCOP;
      break;
    case 'VOID':
      finalReturn = bet.stakeCOP;
      profitGross = 0;
      break;
    case 'PENDING':
    default:
      return { finalReturn: 0, profitGross: 0, profitPartner: 0, profitAdmin: 0 };
  }

  let profitPartner = 0;
  let profitAdmin = 0;

  // REGLA: El Admin cobra comisión SOLO si hay ganancia bruta positiva.
  if (profitGross > 0) {
    // CORRECCIÓN: adminCommissionPct es lo que el socio LE PAGA al admin (ej: 30%).
    profitAdmin = profitGross * (adminCommissionPct / 100);
    profitPartner = profitGross - profitAdmin;
  } else if (profitGross < 0) {
    // Si pierde, la pérdida es 100% del socio (se resta de su utilidad neta global)
    profitPartner = profitGross; 
    profitAdmin = 0;
  } else {
    // VOID o Empate
    profitPartner = 0;
    profitAdmin = 0;
  }

  return {
    finalReturn,
    profitGross,
    profitPartner,
    profitAdmin,
  };
};

export const calculateDashboardStats = (
  bets: Bet[], 
  partners: Partner[], 
  selectedPartnerId: string,
  funds: Fund[] = [],
  withdrawals: Withdrawal[] = []
): DashboardStats => {
  
  const isGlobal = selectedPartnerId === 'ALL';
  
  // 1. FILTRADO
  const relevantBets = isGlobal ? bets : bets.filter(b => b.partnerId === selectedPartnerId);
  const relevantFunds = isGlobal 
    ? funds 
    : funds.filter(f => f.partnerId === selectedPartnerId || (f.scope === 'GENERAL' && selectedPartnerId === 'ALL'));
  const relevantWithdrawals = isGlobal
    ? withdrawals
    : withdrawals.filter(w => w.partnerId === selectedPartnerId);

  // 2. CAJA INICIAL (DEPOSITOS - RETIROS)
  const totalDeposited = relevantFunds.reduce((sum, f) => sum + f.amountCOP, 0);
  const totalWithdrawn = relevantWithdrawals.filter(w => w.status === 'PAID').reduce((sum, w) => sum + w.amountCOP, 0);
  const baseCapital = totalDeposited - totalWithdrawn;

  // 3. FLUJO DE APUESTAS (CASH FLOW REAL DE LA CASA)
  // Calculamos el saldo tal cual se ve en la casa de apuestas:
  // Saldo = Depósitos - Retiros - Stakes(Total) + Retornos(Total)
  
  let totalStaked = 0; 
  let totalReturnedReal = 0; // Lo que la casa devolvió realmente
  let grossProfitGlobal = 0; // Ganancia bruta total
  let netProfitPartner = 0;
  let netProfitAdmin = 0;
  let pendingExposure = 0;

  relevantBets.forEach(bet => {
      totalStaked += bet.stakeCOP;

      if (bet.status === 'PENDING') {
          pendingExposure += bet.stakeCOP;
          return; 
      }

      // Obtener resultado
      const partner = partners.find(p => p.partnerId === bet.partnerId);
      const commissionPct = partner ? partner.partnerProfitPct : 0; // Default 0 if not found, usually safety check
      const outcome = calculateBetOutcome(bet, commissionPct);

      // Acumuladores de Caja Real (Bookie Balance)
      totalReturnedReal += outcome.finalReturn; // Sumamos todo lo que entra (Stake + Ganancia)
      
      // Acumuladores de Estadística (P&L)
      grossProfitGlobal += outcome.profitGross;
      netProfitPartner += outcome.profitPartner;
      netProfitAdmin += outcome.profitAdmin;
  });

  // CÁLCULO DE SALDO REAL (BOOKIE BALANCE)
  // Capital Base - Lo que aposté + Lo que volvió
  // Ejemplo: Tengo 100. Apuesto 10. (Saldo 90). Gano 15 (Vuelven 15). Saldo = 100 - 10 + 15 = 105.
  const currentBalance = baseCapital - totalStaked + totalReturnedReal;

  const settledBets = relevantBets.filter(b => b.status !== 'PENDING');
  const wonBets = settledBets.filter(b => b.status === 'WON' || (b.status === 'CASHED_OUT' && (b.cashoutReturnCOP || 0) > b.stakeCOP)).length;
  const winRate = settledBets.length > 0 ? (wonBets / settledBets.length) * 100 : 0;
  
  const totalOdds = relevantBets.reduce((sum, b) => sum + b.oddsDecimal, 0);
  const avgOdds = relevantBets.length > 0 ? totalOdds / relevantBets.length : 0;

  // ROI y ROAS basados en retorno real
  const settledStaked = settledBets.reduce((sum, b) => sum + b.stakeCOP, 0);
  const roas = settledStaked > 0 ? (totalReturnedReal / settledStaked) * 100 : 0;
  const roi = settledStaked > 0 ? (grossProfitGlobal / settledStaked) * 100 : 0;

  return {
    totalDeposited,
    totalWithdrawn,
    currentBalance, // Este es el saldo REAL que debe coincidir con BetPlay
    totalStaked,
    totalReturned: totalReturnedReal,
    grossProfit: grossProfitGlobal, // Utilidad Total Generada
    netProfitPartner,
    netProfitAdmin,
    pendingExposure,
    winRate,
    avgOdds,
    roi,
    roas
  };
};

// Generador de Libro Mayor (Ledger) con SALDO ACUMULADO REAL
export const generateLedger = (bets: Bet[], funds: Fund[], withdrawals: Withdrawal[], selectedPartnerId: string, partners: Partner[]) => {
    const isGlobal = selectedPartnerId === 'ALL';
    let rawMovements: any[] = [];

    // Helper para nombre de socio
    const getPartnerName = (pid?: string) => {
        if (!pid) return 'General';
        const p = partners.find(part => part.partnerId === pid);
        return p ? p.name : 'Desconocido';
    };

    // 1. Agregar Fondos
    funds.forEach(f => {
        // Strict filter: If viewing Carlos, ONLY show Carlos funds.
        if (!isGlobal && f.partnerId !== selectedPartnerId) return;
        
        rawMovements.push({
            id: f.fundId, 
            date: f.date,
            description: `Depósito: ${f.description}`,
            partnerName: getPartnerName(f.partnerId),
            amount: f.amountCOP,
            type: 'CREDIT', 
            category: 'DEPOSIT',
            details: f.method,
            status: 'COMPLETED'
        });
    });

    // 2. Agregar Retiros
    withdrawals.forEach(w => {
        if (!isGlobal && w.partnerId !== selectedPartnerId) return;
        if (w.status !== 'PAID') return;
        rawMovements.push({
            id: w.withdrawalId,
            date: w.date,
            description: `Retiro de Utilidades`,
            partnerName: getPartnerName(w.partnerId),
            amount: -w.amountCOP,
            type: 'DEBIT',
            category: 'WITHDRAWAL',
            details: 'Transferencia',
            status: w.status
        });
    });

    // 3. Agregar Apuestas
    bets.forEach(b => {
        if (!isGlobal && b.partnerId !== selectedPartnerId) return;

        const pName = getPartnerName(b.partnerId);

        // A. SALIDA DE DINERO (STAKE)
        rawMovements.push({
            id: `${b.betId}-STAKE`, 
            date: b.date,
            description: `Apuesta: ${b.homeTeam} vs ${b.awayTeam}`,
            partnerName: pName,
            amount: -b.stakeCOP, 
            type: 'DEBIT',
            category: 'BET_STAKE',
            details: `${b.marketDescription} @ ${b.oddsDecimal}`,
            status: b.status,
            originalBetId: b.betId 
        });

        // B. ENTRADA DE DINERO (RETORNO / CASHOUT)
        if (b.status !== 'PENDING') {
            const partner = partners.find(p => p.partnerId === b.partnerId);
            const commissionPct = partner ? partner.partnerProfitPct : 0;
            const outcome = calculateBetOutcome(b, commissionPct);
            
            const cashBack = outcome.finalReturn;

            if (cashBack > 0 || b.status === 'LOST') {
                 rawMovements.push({
                    id: `${b.betId}-RETURN`, 
                    date: b.date, 
                    description: b.status === 'CASHED_OUT' ? 'Cash Out Confirmado' : 'Retorno Apuesta',
                    partnerName: pName,
                    amount: cashBack, 
                    type: 'CREDIT',
                    category: 'BET_RETURN',
                    details: b.status === 'LOST' ? 'Pérdida Total' : (b.status === 'CASHED_OUT' ? 'Cobro Anticipado' : 'Ganancia Neta'),
                    status: b.status,
                    isZeroReturn: cashBack === 0,
                    originalBetId: b.betId
                });
            }
        }
    });

    // 4. ORDENAR CRONOLÓGICAMENTE
    rawMovements.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) return dateA - dateB;
        
        const catOrder = { 'DEPOSIT': 1, 'BET_STAKE': 2, 'BET_RETURN': 3, 'WITHDRAWAL': 4 };
        const catA = catOrder[a.category as keyof typeof catOrder] || 9;
        const catB = catOrder[b.category as keyof typeof catOrder] || 9;
        if (catA !== catB) return catA - catB;

        if (a.originalBetId && b.originalBetId) return a.originalBetId.localeCompare(b.originalBetId);
        return a.id.localeCompare(b.id);
    });

    // 5. Calcular Running Balance
    let currentBalance = 0;
    const movementsWithBalance = rawMovements.map(m => {
        currentBalance += m.amount;
        currentBalance = Math.round(currentBalance * 100) / 100;
        return { ...m, runningBalance: currentBalance };
    });

    return movementsWithBalance.reverse();
};

// Generador de Reporte Profesional CSV
export const generateProfessionalReport = (
    bets: Bet[], 
    partnerName: string, 
    dateFrom: string, 
    dateTo: string
) => {
  // 1. Filter Data by Date Range
  const filteredBets = bets.filter(b => {
      const d = b.date;
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
  });

  // 2. Calculate Executive Summary Stats
  const totalStaked = filteredBets.reduce((sum, b) => sum + b.stakeCOP, 0);
  const settledBets = filteredBets.filter(b => b.status !== 'PENDING');
  let totalProfit = 0;
  let wins = 0;

  settledBets.forEach(b => {
     if (b.status === 'WON' || (b.status === 'CASHED_OUT' && (b.cashoutReturnCOP || 0) > b.stakeCOP)) wins++;
     
     // Profit simple calculation for report
     if (b.status === 'WON') totalProfit += (b.stakeCOP * b.oddsDecimal) - b.stakeCOP;
     else if (b.status === 'LOST') totalProfit -= b.stakeCOP;
     else if (b.status === 'CASHED_OUT') totalProfit += (b.cashoutReturnCOP || 0) - b.stakeCOP;
  });

  const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;
  const winRate = settledBets.length > 0 ? (wins / settledBets.length) * 100 : 0;

  // 3. Construct CSV Content
  const rows = [];
  
  // Header Section
  rows.push(['REPORTE DE RENDIMIENTO - SOCIOBET']);
  rows.push([`Socio:,${partnerName}`]);
  rows.push([`Fecha de Generación:,${new Date().toLocaleDateString()}`]);
  rows.push([`Periodo:,${dateFrom || 'Inicio'} a ${dateTo || 'Actualidad'}`]);
  rows.push([]); // Empty line
  
  // Executive Summary Section
  rows.push(['RESUMEN EJECUTIVO']);
  rows.push(['--------------------------------']);
  rows.push([`Operaciones Totales:,${filteredBets.length}`]);
  rows.push([`Capital Movido (Stake):,${totalStaked}`]);
  rows.push([`Win Rate:,${winRate.toFixed(2)}%`]);
  rows.push([`ROI (Retorno s/Inversión):,${roi.toFixed(2)}%`]);
  rows.push([`Utilidad Neta Generada:,${totalProfit}`]);
  rows.push([]); // Empty line

  // Detail Header
  rows.push(['DETALLE DE OPERACIONES']);
  rows.push(['ID', 'Fecha', 'Evento', 'Mercado', 'Cuota', 'Inversión', 'Estado', 'Retorno', 'Ganancia Neta']);

  // Data Rows
  filteredBets.forEach(b => {
      let ret = 0;
      let profit = 0;
      
      if (b.status === 'WON') {
          ret = b.stakeCOP * b.oddsDecimal;
          profit = ret - b.stakeCOP;
      } else if (b.status === 'LOST') {
          ret = 0;
          profit = -b.stakeCOP;
      } else if (b.status === 'CASHED_OUT') {
          ret = b.cashoutReturnCOP || 0;
          profit = ret - b.stakeCOP;
      } else if (b.status === 'VOID') {
          ret = b.stakeCOP;
      }

      rows.push([
          b.betId,
          b.date,
          `${b.homeTeam} v ${b.awayTeam}`,
          b.marketDescription,
          b.oddsDecimal,
          b.stakeCOP,
          b.status,
          ret,
          profit
      ]);
  });

  // Convert to CSV String
  const csvContent = rows.map(e => e.join(',')).join('\n');
  
  // Download Logic
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Reporte_SocioBet_${partnerName}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
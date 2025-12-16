/**
 * SOCIOBET - BACKEND SCRIPT
 * 
 * Este script configura la estructura de la base de datos en Google Sheets.
 * No maneja la API (eso lo hace Next.js), pero ayuda a preparar el Excel.
 */

const CONFIG = {
  sheets: {
    partners: {
      name: 'Partners',
      headers: ['partnerId', 'name', 'status', 'partnerProfitPct', 'username', 'password', 'email', 'phone', 'joinedDate', 'profileImage', 'contractAccepted', 'contractAcceptedDate']
    },
    bets: {
      name: 'Bets',
      headers: ['betId', 'partnerId', 'date', 'sport', 'homeTeam', 'awayTeam', 'marketDescription', 'oddsDecimal', 'stakeCOP', 'status', 'cashoutReturnCOP', 'notes']
    },
    funds: {
      name: 'Funds',
      headers: ['fundId', 'date', 'scope', 'partnerId', 'amountCOP', 'method', 'description']
    },
    withdrawals: {
      name: 'Withdrawals',
      headers: ['withdrawalId', 'date', 'partnerId', 'amountCOP', 'status', 'receiptUrl']
    },
    messages: {
      name: 'Messages',
      headers: ['messageId', 'date', 'partnerId', 'senderName', 'subject', 'message', 'status', 'isFromAdmin']
    }
  }
};

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('SocioBet Admin')
    .addItem('1. 🏗️ Inicializar Estructura (Hojas y Encabezados)', 'setupSheets')
    .addItem('2. 🎲 Generar Datos de Prueba (Demo)', 'generateMockData')
    .addSeparator()
    .addItem('⚠️ Borrar Todo (Reset de Fábrica)', 'clearAllData')
    .addToUi();
}

/**
 * Crea las pestañas necesarias y pone los encabezados en negrita.
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  Object.keys(CONFIG.sheets).forEach(key => {
    const conf = CONFIG.sheets[key];
    let sheet = ss.getSheetByName(conf.name);
    
    if (!sheet) {
      sheet = ss.insertSheet(conf.name);
    }
    
    // Configurar Encabezados
    const headerRange = sheet.getRange(1, 1, 1, conf.headers.length);
    headerRange.setValues([conf.headers]);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1e293b'); // Color Slate-900 (Dark theme brand)
    headerRange.setFontColor('#ffffff');
    
    // Congelar primera fila
    sheet.setFrozenRows(1);
    
    // Auto-resize inicial
    sheet.autoResizeColumns(1, conf.headers.length);
  });
  
  // Borrar Hoja 1 por defecto si está vacía
  const sheet1 = ss.getSheetByName('Hoja 1');
  if (sheet1 && sheet1.getLastRow() === 0) {
    ss.deleteSheet(sheet1);
  }
  
  SpreadsheetApp.getUi().alert('✅ Estructura creada exitosamente.\nAhora copia el ID de la hoja para tu archivo .env');
}

/**
 * Llena las hojas con datos falsos para probar la app.
 */
function generateMockData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. PARTNERS
  const partnersSheet = ss.getSheetByName(CONFIG.sheets.partners.name);
  if (partnersSheet.getLastRow() <= 1) {
    partnersSheet.appendRow(['P001', 'Admin Usuario', 'ACTIVE', 100, 'admin', '123', 'admin@sociobet.com', '', '2023-01-01', '', 'TRUE', '2023-01-01']);
    partnersSheet.appendRow(['P005', 'Gloria Cano', 'ACTIVE', 50, 'gloria', '123', 'gloria@email.com', '+57 300 123 4567', '2023-11-01', '', 'FALSE', '']);
    partnersSheet.appendRow(['P006', 'Carlos Ruiz', 'ACTIVE', 40, 'carlos', '123', 'carlos@email.com', '+57 310 999 8888', '2023-11-15', '', 'TRUE', '2023-11-20']);
  }

  // 2. FUNDS (Depósitos)
  const fundsSheet = ss.getSheetByName(CONFIG.sheets.funds.name);
  if (fundsSheet.getLastRow() <= 1) {
    fundsSheet.appendRow(['F-101', '2023-11-01', 'PARTNER', 'P005', 2000000, 'Bancolombia', 'Capital Inicial']);
    fundsSheet.appendRow(['F-102', '2023-11-15', 'PARTNER', 'P006', 5000000, 'Nequi', 'Inversión Noviembre']);
  }

  // 3. BETS (Apuestas)
  const betsSheet = ss.getSheetByName(CONFIG.sheets.bets.name);
  if (betsSheet.getLastRow() <= 1) {
    // Apuesta Ganada Gloria
    betsSheet.appendRow(['B-1001', 'P005', '2023-11-02', 'Fútbol', 'Real Madrid', 'Barcelona', 'Gana Real Madrid', 2.10, 100000, 'WON', 0, 'Clásico']);
    // Apuesta Perdida Gloria
    betsSheet.appendRow(['B-1002', 'P005', '2023-11-03', 'Tenis', 'Nadal', 'Federer', 'Gana Federer', 1.85, 50000, 'LOST', 0, '']);
    // Apuesta Pendiente Carlos
    betsSheet.appendRow(['B-1003', 'P006', '2023-12-01', 'NBA', 'Lakers', 'Celtics', 'Más de 220 Puntos', 1.90, 200000, 'PENDING', 0, '']);
    // Apuesta Cashout Carlos
    betsSheet.appendRow(['B-1004', 'P006', '2023-12-02', 'Fútbol', 'Liverpool', 'Arsenal', 'Empate', 3.50, 100000, 'CASHED_OUT', 150000, 'Cierre táctico']);
  }
  
  // 4. MESSAGES
  const msgSheet = ss.getSheetByName(CONFIG.sheets.messages.name);
  if (msgSheet.getLastRow() <= 1) {
      msgSheet.appendRow(['M-1', '2023-11-01', 'P005', 'SocioBet (Sistema)', 'Bienvenido', 'Hola Gloria, bienvenida a la plataforma.', 'READ', 'TRUE']);
  }

  SpreadsheetApp.getUi().alert('🎲 Datos de prueba generados.');
}

function clearAllData() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert('¿Estás seguro?', 'Esto borrará TODOS los datos (excepto encabezados).', ui.ButtonSet.YES_NO);
  
  if (response == ui.Button.YES) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    Object.keys(CONFIG.sheets).forEach(key => {
      const sheetName = CONFIG.sheets[key].name;
      const sheet = ss.getSheetByName(sheetName);
      if (sheet) {
        const lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
        }
      }
    });
    ui.alert('🧹 Base de datos limpiada.');
  }
}
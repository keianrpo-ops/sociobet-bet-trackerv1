import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// --- CONFIG ---
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

const getAuth = () => {
  if (!CLIENT_EMAIL || !PRIVATE_KEY) return null;
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: CLIENT_EMAIL,
      private_key: PRIVATE_KEY,
    },
    scopes: SCOPES,
  });
};

const getSheets = async () => {
  const auth = getAuth();
  if (!auth) return null;
  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client as any });
};

// --- GET: Read Sheet and Return Objects ---
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get('tab');

    // FIX: Graceful degradation. If credentials are missing, return empty array (Demo Mode)
    // instead of crashing. This fixes "Error fetching..." logs on client.
    if (!SPREADSHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
      console.warn(`[API] Missing credentials for ${tab}. Returning empty dataset.`);
      return NextResponse.json([]);
    }

    if (!tab) return NextResponse.json({ error: 'Falta parámetro ?tab=' }, { status: 400 });

    const sheets = await getSheets();
    if (!sheets) return NextResponse.json([]);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tab}!A:Z`, 
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return NextResponse.json([]);

    // Transformar Arrays a Objetos usando la primera fila como cabecera
    const headers = rows[0];
    const data = rows.slice(1).map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
             let val = row[index];
             if (val === 'TRUE') val = true;
             if (val === 'FALSE') val = false;
             obj[header] = val;
        });
        return obj;
    });

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('API GET Error:', error);
    // Return empty array on error to prevent UI crash loops
    return NextResponse.json([]); 
  }
}

// --- POST: Append Row ---
export async function POST(req: NextRequest) {
  try {
    if (!SPREADSHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
        return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
    }
    
    const body = await req.json();
    const { tab, data } = body; 

    if (!tab || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const sheets = await getSheets();
    if (!sheets) return NextResponse.json({ error: 'Auth failed' }, { status: 500 });

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tab}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [data] },
    });

    return NextResponse.json({ success: true, result: response.data });
  } catch (error: any) {
    console.error('API POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- PUT: Update Row by ID ---
export async function PUT(req: NextRequest) {
    try {
        if (!SPREADSHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
            return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
        }

        const body = await req.json();
        const { tab, id, data } = body;

        if (!tab || !id || !Array.isArray(data)) {
            return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
        }

        const sheets = await getSheets();
        if (!sheets) return NextResponse.json({ error: 'Auth failed' }, { status: 500 });

        const colARes = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${tab}!A:A`,
        });

        const rows = colARes.data.values;
        if (!rows) return NextResponse.json({ error: 'Sheet empty' }, { status: 404 });

        const rowIndex = rows.findIndex(row => row[0] == id);
        if (rowIndex === -1) return NextResponse.json({ error: 'ID not found' }, { status: 404 });

        const sheetRowNumber = rowIndex + 1;

        const response = await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${tab}!A${sheetRowNumber}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [data] }
        });

        return NextResponse.json({ success: true, updatedRange: response.data.updatedRange });

    } catch (error: any) {
        console.error('API PUT Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
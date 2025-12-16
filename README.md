# SocioBet Dashboard

A professional sports betting management system built with React, TailwindCSS, and Google Sheets integration.

## Project Structure

This project uses a React Single Page Application (SPA) structure for the UI, designed to be easily compatible with Next.js App Router for deployment.

- **UI**: React 18, TailwindCSS, Lucide Icons, Recharts.
- **Backend**: Google Sheets via Next.js API Routes (Serverless Functions).
- **Database**: Google Sheets (7 Tabs: Partners, Users, Funds, Bets, Withdrawals, Movements, Messages).

## 1. Google Sheets Setup

1. Create a new Google Sheet.
2. Go to **Extensions > Apps Script**.
3. Copy the content of `apps-script/Code.gs` into the script editor.
4. Save and Run the `onOpen` function.
5. Go back to the Sheet, you will see a "SocioBet" menu.
6. Click **SocioBet > Initialize Sheets**.
7. (Optional) Click **SocioBet > Generate Stress Test Data** to populate 1000 bets.
8. **Share** the Sheet with your Google Service Account Email (see below) with "Editor" permissions.
9. Copy the **Spreadsheet ID** from the URL (string between `/d/` and `/edit`).

## 2. Service Account Setup (GCP)

1. Go to Google Cloud Console.
2. Create a project "SocioBet".
3. Enable **Google Sheets API**.
4. Create a **Service Account**.
5. Create a JSON Key for that account and download it.
6. Note the `client_email` from the JSON.

## 3. Local Development

1. Install dependencies:
   ```bash
   npm install react react-dom react-router-dom lucide-react recharts googleapis next
   npm install -D tailwindcss postcss autoprefixer typescript @types/react @types/node
   ```
2. Start the dev server (Vite or Next.js):
   ```bash
   npm run dev
   ```
   *Note: The provided code is a React SPA preview. To enable the real Google Sheets connection, you must deploy the `app/api/sheets/route.ts` file in a Next.js environment.*

## 4. Deployment to Vercel (Next.js)

1. Move the `app` folder to the root of your Next.js project.
2. Configure `.env.local` in Vercel:
   ```env
   GOOGLE_SHEET_ID=your_sheet_id_here
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email@...
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
   ```
3. Deploy.

## 5. Security Notes

- This project uses `HashRouter` for the preview. For Vercel, switch to standard Next.js routing.
- The `mockData.ts` file is used when the API is not reachable.
- Ensure `GOOGLE_PRIVATE_KEY` is handled correctly in Vercel (handle newlines `\n`).


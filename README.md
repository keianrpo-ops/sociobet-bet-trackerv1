# SocioBet Dashboard

A professional sports betting management system built with React, TailwindCSS, and Supabase.

## Project Structure

- **UI**: React 18, TailwindCSS, Lucide Icons, Recharts.
- **Database**: Supabase (PostgreSQL).

## 1. Setup Supabase

1. Create a project at [Supabase.com](https://supabase.com).
2. Go to **SQL Editor** and run the query provided in the documentation to create tables.
3. Go to **Project Settings > API**.
4. Copy `Project URL` and `anon public key`.

## 2. Environment Variables

Create a `.env.local` file in your project root (or set in Vercel):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```

## 4. Deployment to Vercel

1. Push to GitHub.
2. Import project in Vercel.
3. Add the Environment Variables from Supabase.
4. Deploy.

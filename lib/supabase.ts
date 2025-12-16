import { createClient } from '@supabase/supabase-js';

// Usamos NEXT_PUBLIC_ para que estén disponibles en el navegador
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);
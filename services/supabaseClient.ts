
import { createClient } from '@supabase/supabase-js';

// Intentar obtener variables de entorno con fallbacks seguros
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

if (! (import.meta as any).env?.VITE_SUPABASE_URL) {
  console.warn("Saitama Streak: VITE_SUPABASE_URL no definida. La app mostrará UI pero no persistirá datos.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

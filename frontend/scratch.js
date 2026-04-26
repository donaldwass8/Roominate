import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('reservations').select('*').eq('user_id', 'mock-user-001').order('created_at', { ascending: false }).limit(5);
  console.log(error || data);
}
run();

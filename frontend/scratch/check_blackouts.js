import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkBlackoutsTable() {
  const { data, error } = await supabase
    .from('room_blackouts')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('room_blackouts table does not exist or error:', error.message);
    return;
  }
  
  console.log('room_blackouts table exists! Columns:', Object.keys(data[0] || {}));
}

checkBlackoutsTable();

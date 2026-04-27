import { supabase } from './frontend/src/supabaseClient.js';

async function test() {
  const { data, error } = await supabase.from('backups').select('*');
  console.log("Data:", data, "Error:", error);
}

test();

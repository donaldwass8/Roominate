import { supabase } from './src/supabaseClient.js';

async function findRooms() {
  const { data, error } = await supabase.from('rooms_with_building').select('id, name');
  console.log(data);
}
findRooms();

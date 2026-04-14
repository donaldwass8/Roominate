import { supabase } from '../supabaseClient';

export const getBuildings = async () => {
  if (!supabase) return [];
  const { data, error } = await supabase.from('buildings').select('*').order('name');
  if (error) {
    console.error('Error fetching buildings:', error);
    return [];
  }
  return data || [];
};

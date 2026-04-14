import { supabase } from '../supabaseClient';

export const getRooms = async (filters = {}) => {
  if (!supabase) return [];
  
  // Use the view provided by user
  let query = supabase.from('rooms_with_building').select('*');

  if (filters.buildingId && filters.buildingId !== 'all') {
    query = query.eq('building_id', filters.buildingId);
  }
  if (filters.capacity) {
    query = query.gte('capacity', filters.capacity);
  }
  if (filters.amenities && filters.amenities.length > 0) {
    query = query.contains('amenities', filters.amenities);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching rooms (view: rooms_with_building):', error);
    return [];
  }

  // Ensure fields match what the component needs
  return (data || []).filter(r => r.is_active !== false).map(room => ({
    ...room,
    available: true,
    next_available_time: 'Now'
  }));
};

export const getRoomById = async (id) => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('rooms_with_building')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) {
    console.error('Error fetching room by id:', error);
    return null;
  }
  
  return data;
};

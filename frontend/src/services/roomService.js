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

export const checkIsFavorite = async (userId, roomId) => {
  if (!supabase) return false;
  const { data, error } = await supabase
    .from('user_favorites')
    .select('user_id')
    .eq('user_id', userId)
    .eq('room_id', roomId)
    .maybeSingle();

  if (error) {
    console.error('Error checking favorite:', error);
    return false;
  }
  
  return !!data;
};

export const addFavorite = async (userId, roomId) => {
  if (!supabase) return { success: false, error: 'No supabase client' };

  // Remove any existing favorite first (one favorite per user)
  await supabase.from('user_favorites').delete().eq('user_id', userId);

  const { error } = await supabase
    .from('user_favorites')
    .insert([{ user_id: userId, room_id: roomId }]);

  if (error) {
    console.error('Error adding favorite:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
};

export const removeFavorite = async (userId, roomId) => {
  if (!supabase) return { success: false, error: 'No supabase client' };
  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('room_id', roomId);

  if (error) {
    console.error('Error removing favorite:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
};

export const getFavorites = async (userId) => {
  if (!supabase) return [];

  // Step 1: get favorited room IDs
  const { data: favData, error: favError } = await supabase
    .from('user_favorites')
    .select('room_id')
    .eq('user_id', userId);

  if (favError || !favData || favData.length === 0) {
    if (favError) console.error('Error fetching favorite IDs:', favError);
    return [];
  }

  const roomIds = favData.map(f => f.room_id);

  // Step 2: fetch the full room details from the view
  const { data: roomData, error: roomError } = await supabase
    .from('rooms_with_building')
    .select('*')
    .in('id', roomIds);

  if (roomError) {
    console.error('Error fetching favorite rooms:', roomError);
    return [];
  }

  return roomData || [];
};

import { supabase } from '../supabaseClient';

export const disableRoom = async (roomId, date) => {
  if (!supabase) return { success: false, error: 'Database not connected' };

  const [year, month, day] = date.split('-').map(Number);
  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day, 23, 59, 59, 999);

  // Check if there's already a maintenance record for this day
  const { data: existing } = await supabase
    .from('reservations')
    .select('id')
    .eq('room_id', roomId)
    .eq('status', 'confirmed')
    .eq('purpose', 'MAINTENANCE')
    .gte('start_time', start.toISOString())
    .lte('end_time', end.toISOString());

  if (existing && existing.length > 0) {
    return { success: false, error: 'Room is already disabled for this day' };
  }

  const { data, error } = await supabase
    .from('reservations')
    .insert([
      {
        room_id: roomId,
        user_id: '00000000-0000-0000-0000-000000000000', // System user
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: 'confirmed',
        purpose: 'MAINTENANCE',
        organizer_name: 'Admin'
      }
    ]);

  if (error) {
    console.error('Error disabling room:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

export const enableRoom = async (blackoutId) => {
  if (!supabase) return { success: false, error: 'Database not connected' };

  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', blackoutId)
    .eq('status', 'confirmed')
    .eq('purpose', 'MAINTENANCE');

  if (error) {
    console.error('Error enabling room:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

export const getRoomBlackouts = async (roomId) => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('room_id', roomId)
    .eq('status', 'confirmed')
    .eq('purpose', 'MAINTENANCE')
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching blackouts:', error);
    return [];
  }

  return data;
};

export const getAllBlackouts = async () => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('reservations')
    .select('*, study_rooms(name)')
    .eq('status', 'confirmed')
    .eq('purpose', 'MAINTENANCE')
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching all blackouts:', error);
    return [];
  }

  return data;
};

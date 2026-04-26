import { supabase } from '../supabaseClient';

export const getReservations = async (userId, statusFilter = null) => {
  if (!supabase) return [];
  
  // The room table is called study_rooms
  let query = supabase
    .from('reservations')
    .select(`
      id, room_id, start_time, end_time, status, user_id, room_code,
      study_rooms (
        name,
        capacity,
        buildings (
          name
        )
      )
    `)
    .eq('user_id', userId)
    .order('start_time', { ascending: false });

  if (statusFilter === 'upcoming') {
    const now = new Date().toISOString();
    query = query.gte('start_time', now).neq('status', 'cancelled');
  } else if (statusFilter === 'past') {
    const now = new Date().toISOString();
    query = query.lt('start_time', now).neq('status', 'cancelled');
  } else if (statusFilter === 'cancelled') {
    query = query.eq('status', 'cancelled');
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching reservations:', error);
    return [];
  }

  return (data || []).map(res => ({
    id: res.id,
    room_id: res.room_id,
    raw_start_time: res.start_time,
    raw_end_time: res.end_time,
    start_time: res.start_time ? new Date(res.start_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Unknown',
    end_time: res.end_time ? new Date(res.end_time).toLocaleString([], { timeStyle: 'short' }) : 'Unknown',
    status: res.status || 'confirmed',
    room_name: res.study_rooms?.name || 'Unknown Room',
    capacity: res.study_rooms?.capacity,
    building_name: res.study_rooms?.buildings?.name || 'Unknown Building',
    room_code: res.room_code || String(res.id).substring(0, 8)
  }));
};

export const createReservation = async (userId, roomId, startTime, endTime, purpose = null, organizerName = null) => {
  if (!supabase) return { success: false, error: 'Database API not connected yet.' };
  
  const startIso = new Date(startTime).toISOString();
  const endIso = new Date(endTime).toISOString();

  // Check for conflicts: existing reservation for the same room that overlaps.
  // Overlap logic: existing start < new end AND existing end > new start.
  const { data: conflicts, error: conflictError } = await supabase
    .from('reservations')
    .select('id')
    .eq('room_id', roomId)
    .neq('status', 'cancelled')
    .lt('start_time', endIso)
    .gt('end_time', startIso);

  if (conflictError) {
    console.error('Error checking conflicts:', conflictError);
    return { success: false, error: 'Failed to verify room availability.' };
  }

  if (conflicts && conflicts.length > 0) {
    return { success: false, error: 'This room is already booked for the selected time window. Please choose another time.' };
  }

  const { data, error } = await supabase
    .from('reservations')
    .insert([
      { 
        user_id: userId, 
        room_id: roomId, 
        start_time: startIso, 
        end_time: endIso,
        status: 'confirmed',
        purpose: purpose,
        organizer_name: organizerName
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating reservation:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true, reservation: data };
};

export const cancelReservation = async (reservationId) => {
  if (!supabase) return { success: false, error: 'Database API not connected yet.' };
  
  const { error } = await supabase
    .from('reservations')
    .update({ status: 'cancelled' })
    .eq('id', reservationId);

  if (error) {
    console.error('Error cancelling reservation:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true };
};

export const getReservationsForRoom = async (roomId, monthStartDate, monthEndDate) => {
  if (!supabase) return [];
  
  let query = supabase
    .from('reservations')
    .select('*')
    .eq('room_id', roomId)
    .neq('status', 'cancelled');
    
  if (monthStartDate) {
    query = query.gte('start_time', monthStartDate.toISOString());
  }
  if (monthEndDate) {
    query = query.lte('start_time', monthEndDate.toISOString());
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching room reservations:', error);
    return [];
  }
  
  return data || [];
};

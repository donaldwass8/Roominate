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
    query = query.gte('start_time', now).neq('status', 'cancelled').or('purpose.neq.MAINTENANCE,purpose.is.null');
  } else if (statusFilter === 'past') {
    const now = new Date().toISOString();
    query = query.lt('start_time', now).neq('status', 'cancelled').or('purpose.neq.MAINTENANCE,purpose.is.null');
  } else if (statusFilter === 'cancelled') {
    query = query.eq('status', 'cancelled');
  } else {
    // Default to excluding maintenance from general lists
    query = query.or('purpose.neq.MAINTENANCE,purpose.is.null');
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

export const createReservation = async (userId, roomId, startTime, endTime, purpose = null, organizerName = null, isAdmin = false) => {
  if (!supabase) return { success: false, error: 'Database API not connected yet.' };
  
  const startIso = new Date(startTime).toISOString();
  const endIso = new Date(endTime).toISOString();

  // --- Booking Limits (Non-Admins only) ---
  if (!isAdmin) {
    // 1. Max Duration: 4 Hours
    const durationMs = new Date(endTime) - new Date(startTime);
    const maxDurationMs = 4 * 60 * 60 * 1000;
    if (durationMs > maxDurationMs) {
      return { success: false, error: 'Booking duration cannot exceed 4 hours.' };
    }

    // 2. Fetch user's existing non-cancelled bookings
    const { data: userBookings, error: userError } = await supabase
      .from('reservations')
      .select('start_time, end_time, status')
      .eq('user_id', userId)
      .neq('status', 'cancelled');

    if (userError) {
      console.error('Error checking user limits:', userError);
    } else if (userBookings) {
      const now = new Date();
      const bookingStart = new Date(startTime);
      
      // Check Daily Limit (2 per day)
      const startOfDay = new Date(bookingStart);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(bookingStart);
      endOfDay.setHours(23, 59, 59, 999);

      const bookingsToday = userBookings.filter(b => {
        const bStart = new Date(b.start_time);
        return bStart >= startOfDay && bStart <= endOfDay;
      });

      if (bookingsToday.length >= 2) {
        return { success: false, error: 'Daily booking limit reached (max 2 per day).' };
      }

      // Check Upcoming Limit (5 total)
      const upcomingBookings = userBookings.filter(b => new Date(b.start_time) > now);
      if (upcomingBookings.length >= 5) {
        return { success: false, error: 'Total upcoming booking limit reached (max 5).' };
      }
    }
  }
  // --- End Booking Limits ---

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

export const getAllReservations = async () => {
  if (!supabase) return [];
  
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      id, room_id, start_time, end_time, status, user_id, room_code,
      study_rooms (
        name,
        capacity,
        amenities,
        buildings (
          name
        )
      )
    `)
    .neq('status', 'cancelled')
    .or('purpose.neq.MAINTENANCE,purpose.is.null')
    .order('start_time', { ascending: false });

  if (error) {
    console.error('Error fetching all reservations:', error);
    return [];
  }

  return (data || []).map(res => ({
    id: res.id,
    room_id: res.room_id,
    start_time: res.start_time,
    end_time: res.end_time,
    status: res.status,
    room_name: res.study_rooms?.name || 'Unknown Room',
    capacity: res.study_rooms?.capacity || 0,
    amenities: res.study_rooms?.amenities || [],
    building_name: res.study_rooms?.buildings?.name || 'Unknown Building',
    user_id: res.user_id
  }));
};

export const getUserBookingStats = async (userId) => {
  if (!supabase) return { dailyCount: 0, upcomingCount: 0 };

  const now = new Date();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('reservations')
    .select('start_time')
    .eq('user_id', userId)
    .neq('status', 'cancelled');

  if (error) {
    console.error('Error fetching user stats:', error);
    return { dailyCount: 0, upcomingCount: 0 };
  }

  const dailyCount = data.filter(r => {
    const d = new Date(r.start_time);
    return d >= startOfDay && d <= endOfDay;
  }).length;

  const upcomingCount = data.filter(r => new Date(r.start_time) > now).length;

  return { dailyCount, upcomingCount };
};

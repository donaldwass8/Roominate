import { supabase } from '../supabaseClient';

export const getUserStats = async (userId) => {
  const defaultStats = { active_bookings: 0, hours_this_month: 0, favourite_room: '-', total_bookings: 0 };
  if (!supabase) return defaultStats;

  try {
    const { data: allRes, error } = await supabase
      .from('reservations')
      .select('start_time, end_time, status, study_rooms(name)')
      .eq('user_id', userId);
      
    if (error || !allRes) return defaultStats;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let active = 0;
    let hours = 0;
    let roomCounts = {};
    let total = allRes.length;

    allRes.forEach(res => {
      const start = new Date(res.start_time);
      const end = new Date(res.end_time);

      if (res.status !== 'cancelled' && start >= now) {
        active++;
      }
      
      if (start.getMonth() === currentMonth && start.getFullYear() === currentYear && res.status !== 'cancelled') {
        const diffMs = end - start;
        hours += (diffMs / (1000 * 60 * 60));
      }

      const roomName = res.study_rooms?.name;
      if (roomName) {
        roomCounts[roomName] = (roomCounts[roomName] || 0) + 1;
      }
    });

    let favRoom = '-';
    let max = 0;
    for (const [r, count] of Object.entries(roomCounts)) {
      if (count > max) {
        max = count;
        favRoom = r;
      }
    }

    return {
      active_bookings: active,
      hours_this_month: Math.round(hours) || 0,
      favourite_room: favRoom,
      total_bookings: total,
    };
  } catch (err) {
    console.error("Error generating user stats:", err);
    return defaultStats;
  }
};

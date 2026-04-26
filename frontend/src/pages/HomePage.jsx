import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import StatCard from '../components/StatCard';
import ReservationCard, { ReservationSkeleton } from '../components/ReservationCard';
import QuickBookPanel from '../components/QuickBookPanel';
import BookingModal from '../components/BookingModal';
import { getUserStats } from '../services/userService';
import { getReservations } from '../services/reservationService';
import { getRooms, getFavorites } from '../services/roomService';
import { getBuildings } from '../services/buildingService';

const HomePage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [quickRooms, setQuickRooms] = useState([]);
  const [favoriteRoomId, setFavoriteRoomId] = useState(null);
  const [selectedRoomToBook, setSelectedRoomToBook] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [_stats, _reservations, _buildings, _rooms, _favorites] = await Promise.all([
        getUserStats('a0000000-0000-0000-0000-000000000001'),
        getReservations('a0000000-0000-0000-0000-000000000001', 'upcoming'),
        getBuildings(),
        getRooms({ capacity: 2 }),
        getFavorites('a0000000-0000-0000-0000-000000000001')
      ]);
      setStats({
        ..._stats,
        favourite_room: _favorites.length > 0 ? _favorites[0].name : (_stats.favourite_room || '-')
      });
      setFavoriteRoomId(_favorites.length > 0 ? _favorites[0].id : null);
      setUpcoming(_reservations.slice(0, 3));
      setQuickRooms(_rooms);
    } catch (error) {
      console.error("Failed to load home page data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBookingConfirmed = () => {
    loadData();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Howdy, John</h1>
          <p className="text-gray-500 mt-1">
            {loading ? 'Checking your reservations...' : `You have ${upcoming.length} upcoming reservation${upcoming.length !== 1 ? 's' : ''} this week.`}
          </p>
        </div>
        <Link
          to="/search"
          className="bg-primary-orange hover:bg-[#A84A0E] text-white px-5 py-2.5 rounded-lg font-bold shadow-sm hover:shadow transition-all self-start sm:self-auto"
        >
          ⚡ Book a Room
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Bookings" value={stats?.active_bookings} loading={loading} />
        <StatCard label="Hours this Month" value={stats?.hours_this_month} loading={loading} />
        {favoriteRoomId ? (
          <Link to={`/rooms/${favoriteRoomId}`} className="block hover:scale-[1.02] transition-transform">
            <StatCard label="Favourite Room" value={stats?.favourite_room} loading={loading} />
          </Link>
        ) : (
          <StatCard label="Favourite Room" value={stats?.favourite_room} loading={loading} />
        )}
        <StatCard label="Total Bookings" value={stats?.total_bookings} loading={loading} />
      </div>

      {/* Main content columns */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Upcoming */}
        <div className="lg:w-3/5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Upcoming Reservations</h2>
            <Link to="/reservations" className="text-sm font-semibold text-primary-orange hover:underline flex items-center">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {loading ? (
              <>
                <ReservationSkeleton />
                <ReservationSkeleton />
              </>
            ) : upcoming.length === 0 ? (
              <div className="bg-white border text-center border-gray-100 rounded-xl p-8 flex flex-col items-center justify-center text-gray-500 shadow-sm">
                <div className="w-16 h-16 bg-gray-50 text-3xl flex items-center justify-center rounded-full mb-3 shadow-inner">
                  📅
                </div>
                <p className="font-medium text-gray-700">No upcoming reservations</p>
                <p className="text-sm mt-1 mb-4">You have no upcoming bookings right now.</p>
                <Link to="/search" className="text-primary-orange font-bold text-sm hover:underline">Find a room</Link>
              </div>
            ) : (
              upcoming.map((res) => (
                <ReservationCard key={res.id} reservation={res} onCancel={loadData} />
              ))
            )}
          </div>
        </div>

        {/* Right: Quick Book */}
        <div className="lg:w-2/5">
          <QuickBookPanel
            rooms={quickRooms}
            loading={loading}
            onBookNow={(room) => setSelectedRoomToBook(room)}
          />
        </div>
      </div>

      {/* Booking Modal */}
      {selectedRoomToBook && (
        <BookingModal
          room={selectedRoomToBook}
          onClose={() => setSelectedRoomToBook(null)}
          onConfirm={handleBookingConfirmed}
        />
      )}
    </div>
  );
};

export default HomePage;

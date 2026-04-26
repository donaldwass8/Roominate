import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReservationCard, { ReservationSkeleton } from '../components/ReservationCard';
import { getReservations } from '../services/reservationService';

const ReservationsPage = () => {
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming');

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const allRes = await getReservations('mock-user-001', null);
      setReservations(allRes);
    } catch (error) {
      console.error("Error fetching reservations", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const nowTime = new Date();

  const upcoming = reservations.filter(r => r.status !== 'cancelled' && (!r.raw_end_time || new Date(r.raw_end_time) >= nowTime));
  const past = reservations.filter(r => r.status !== 'cancelled' && r.raw_end_time && new Date(r.raw_end_time) < nowTime);
  const cancelled = reservations.filter(r => r.status === 'cancelled');

  const getActiveList = () => {
    switch (activeTab) {
      case 'upcoming': return upcoming;
      case 'past': return past;
      case 'cancelled': return cancelled;
      default: return upcoming;
    }
  };

  const activeList = getActiveList();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Reservations</h1>
          <p className="text-gray-500 mt-1">Manage your study room bookings</p>
        </div>
        <Link 
          to="/search" 
          className="bg-primary-orange hover:bg-[#A84A0E] text-white px-5 py-2.5 rounded-lg font-bold shadow-sm hover:shadow transition-all"
        >
          ⚡ Book a Room
        </Link>
      </div>

      <div className="flex border-b border-gray-200">
        {[
          { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
          { id: 'past', label: 'Past', count: past.length },
          { id: 'cancelled', label: 'Cancelled', count: cancelled.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-semibold text-sm relative transition-colors ${activeTab === tab.id ? 'text-primary-orange' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label} <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-orange-100 text-primary-orange' : 'bg-gray-100 text-gray-500'}`}>{tab.count}</span>
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-orange scale-x-100 animate-in fade-in zoom-in-90 duration-200" />
            )}
          </button>
        ))}
      </div>

      <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {loading ? (
          <>
            <ReservationSkeleton />
            <ReservationSkeleton />
            <ReservationSkeleton />
          </>
        ) : activeList.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-12 flex flex-col items-center justify-center text-gray-500 shadow-sm mt-6">
            <div className="w-16 h-16 bg-gray-50 text-3xl flex items-center justify-center rounded-full mb-4 shadow-inner">
               {activeTab === 'upcoming' ? '📅' : activeTab === 'past' ? '🕰️' : '🚫'}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No {activeTab} reservations</h3>
            <p className="text-sm max-w-sm text-center">You don't have any {activeTab} room bookings to show here.</p>
            {activeTab === 'upcoming' && (
              <Link to="/search" className="mt-4 text-primary-orange font-bold text-sm hover:underline">Browse available rooms</Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {activeList.map(res => (
              <ReservationCard key={res.id} reservation={res} onCancel={fetchReservations} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReservationsPage;

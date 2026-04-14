import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { cancelReservation } from '../services/reservationService';

const ReservationCard = ({ reservation, onCancel }) => {
  const isConfirmed = reservation.status === 'confirmed';
  const isCancelled = reservation.status === 'cancelled';

  const handleCancelClick = () => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <span className="font-semibold text-gray-800">Are you sure you want to cancel?</span>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const result = await cancelReservation(reservation.id);
              if (result.success) {
                toast.success('Reservation cancelled');
                if (onCancel) onCancel();
              } else {
                toast.error('Failed to cancel: ' + (result.error || 'Unknown error'));
              }
            }}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
          >
            Confirm
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-200 text-gray-800 rounded text-sm hover:bg-gray-300 transition"
          >
            Undo
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  return (
    <div className="flex flex-col sm:flex-row bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200 mb-4 group relative">
      <div className="w-full sm:w-24 h-24 sm:h-auto bg-primary-orange/10 flex items-center justify-center shrink-0 border-r border-gray-50">
        <div className="w-12 h-12 bg-primary-orange/20 rounded-lg flex items-center justify-center font-bold text-primary-orange text-xl shadow-inner">
          {reservation.room_name?.substring(0, 2).toUpperCase()}
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900">{reservation.room_name}</h3>
            {isConfirmed && <span className="px-2 py-0.5 rounded-full border border-green-500 text-green-700 bg-green-50 text-xs font-medium">Confirmed</span>}
            {isCancelled && <span className="px-2 py-0.5 rounded-full border border-red-500 text-red-700 bg-red-50 text-xs font-medium">Cancelled</span>}
            {!isConfirmed && !isCancelled && reservation.status && (
              <span className="px-2 py-0.5 rounded-full border border-gray-400 text-gray-600 bg-gray-50 text-xs font-medium capitalize">{reservation.status}</span>
            )}
          </div>
          <p className="text-gray-500 text-sm mb-3">{reservation.building_name}</p>
          
          <div className="flex items-center gap-4 text-xs font-medium text-gray-600">
            <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded">
              <Calendar className="w-3.5 h-3.5 text-primary-orange" />
              <span>{reservation.start_time} - {reservation.end_time}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded">
              <Users className="w-3.5 h-3.5 text-primary-orange" />
              <span>Up to {reservation.capacity}</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 font-mono mt-3">ID: {reservation.id || reservation.room_code}</p>
        </div>

        <div className="flex sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <Link
            to={`/rooms/${reservation.room_id}`}
            className="flex-1 sm:flex-none text-center px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            Details
          </Link>
          {!isCancelled && (
            <button
              onClick={handleCancelClick}
              className="flex-1 sm:flex-none px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 hover:border-red-300 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
      
      {/* Accent left border */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-orange opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

export const ReservationSkeleton = () => (
  <div className="flex flex-col sm:flex-row bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4 animate-pulse">
    <div className="w-full sm:w-24 h-24 sm:h-auto bg-gray-100 shrink-0" />
    <div className="p-4 flex-1 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex-1 w-full">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-1/4 mb-4" />
        <div className="flex gap-4">
          <div className="h-6 bg-gray-100 rounded w-24" />
          <div className="h-6 bg-gray-100 rounded w-16" />
        </div>
      </div>
      <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
        <div className="h-9 bg-gray-100 rounded w-full sm:w-20" />
        <div className="h-9 bg-gray-100 rounded w-full sm:w-20" />
      </div>
    </div>
  </div>
);

export default ReservationCard;

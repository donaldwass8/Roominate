import React from 'react';
import { Link } from 'react-router-dom';

const QuickBookPanel = ({ rooms, loading, onBookNow }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full relative">
      {/* Decorative top accent */}
      <div className="h-1.5 w-full bg-gradient-to-r from-primary-orange to-dark-green" />
      
      <div className="p-6 flex-1 flex flex-col">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          Quick Book
          <span className="w-2 h-2 rounded-full bg-primary-orange shadow-[0_0_8px_rgba(199,91,18,0.5)] animate-pulse" />
        </h2>

        <div className="flex-1 flex flex-col gap-3">
          {loading ? (
             <>
               {[1, 2].map(i => (
                 <div key={i} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0 animate-pulse">
                   <div className="space-y-2">
                     <div className="w-24 h-4 bg-gray-200 rounded" />
                     <div className="w-32 h-3 bg-gray-100 rounded" />
                   </div>
                   <div className="w-16 h-6 bg-gray-100 rounded-full" />
                 </div>
               ))}
             </>
          ) : rooms.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                 <span className="text-gray-400 text-xl">⏳</span>
              </div>
              <p className="text-gray-500 font-medium text-sm">No rooms available right now.</p>
            </div>
          ) : (
            rooms.slice(0, 2).map((room, idx) => (
              <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0 group">
                <div>
                  <div className="flex items-center gap-2">
                     <h4 className="font-bold text-gray-900">{room.name}</h4>
                     <span className={`w-1.5 h-1.5 rounded-full ${room.available !== false ? 'bg-green-500' : 'bg-gray-300'}`} />
                  </div>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    {room.building_short_name || room.building_name} • Cap: {room.capacity}
                  </p>
                </div>
                <button 
                  onClick={() => onBookNow(room)}
                  className="text-primary-orange text-sm font-semibold hover:bg-primary-orange/10 px-3 py-1.5 rounded-md transition-colors"
                >
                  Book Now
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-gray-100">
          <Link
            to="/search"
            className="block w-full py-2.5 text-center border-2 border-primary-orange text-primary-orange rounded-lg font-bold hover:bg-primary-orange hover:text-white transition-colors"
          >
            Browse All Rooms
          </Link>
        </div>
      </div>
    </div>
  );
};

export default QuickBookPanel;

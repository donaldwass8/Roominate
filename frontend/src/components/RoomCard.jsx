import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Tv, Zap, MonitorPlay } from 'lucide-react';

const RoomCard = ({ room, viewMode = 'grid' }) => {
  const isAvailable = room.available !== false; // default true if undefined
  
  const renderAmenities = () => {
    const iconClass = "w-3.5 h-3.5 text-gray-400";
    return (
      <div className="flex gap-2.5 mt-3 mb-4">
        {room.capacity && (
          <div className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded text-xs text-gray-600 font-medium" title="Capacity">
            <Users className={iconClass} /> {room.capacity}
          </div>
        )}
        {room.amenities?.includes('Whiteboard') && <MonitorPlay className={iconClass} title="Whiteboard" />}
        {room.amenities?.includes('Projector') && <Tv className={iconClass} title="Projector" />}
        {room.amenities?.includes('Outlets') && <Zap className={iconClass} title="Outlets" />}
      </div>
    );
  };

  if (viewMode === 'list') {
    return (
      <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-orange opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="w-32 bg-primary-orange/5 flex items-center justify-center shrink-0 border-r border-gray-50">
           <div className="w-12 h-12 bg-primary-orange/20 rounded-lg flex items-center justify-center font-bold text-primary-orange text-xl shadow-inner">
             {room.name?.substring(0, 2).toUpperCase()}
           </div>
        </div>
        <div className="p-4 flex-1 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-gray-900 text-lg">{room.name}</h3>
              <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-300'}`}></span>
            </div>
            <p className="text-sm text-gray-500">{room.building_name} • Floor {room.floor}</p>
            {renderAmenities()}
          </div>
          <div className="flex flex-col items-end gap-3">
             <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded">
               Next: {room.next_available_time || 'Now'}
             </span>
             <Link to={`/rooms/${room.id}`} className="text-primary-orange font-semibold text-sm hover:underline flex items-center gap-1 group-hover:translate-x-1 transition-transform">
               View <span className="text-lg leading-none">&rsaquo;</span>
             </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col relative overflow-hidden group">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-orange opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="p-5 flex-1 relative">
        <div className="absolute right-4 top-4">
          <span className={`w-2.5 h-2.5 block rounded-full ${isAvailable ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-300'}`}></span>
        </div>
        
        <div className="w-14 h-14 bg-primary-orange/10 rounded-xl flex items-center justify-center font-bold text-primary-orange text-2xl shadow-inner mb-4">
          {room.name?.substring(0, 2).toUpperCase()}
        </div>
        
        <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{room.name}</h3>
        <p className="text-sm text-gray-500 font-medium">Floor {room.floor}</p>
        <p className="text-sm text-gray-400 mt-0.5">{room.building_name}</p>
        
        {renderAmenities()}
      </div>
      
      <div className="px-5 py-3.5 bg-gray-50 flex items-center justify-between border-t border-gray-50 group-hover:bg-primary-orange/5 transition-colors">
        <span className="text-xs text-gray-500 font-medium">Next: <span className="text-gray-700">{room.next_available_time || 'Now'}</span></span>
        <Link to={`/rooms/${room.id}`} className="text-primary-orange font-semibold text-sm hover:underline flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
          View <span className="text-lg leading-none pt-0.5">&rsaquo;</span>
        </Link>
      </div>
    </div>
  );
};

export const RoomCardSkeleton = ({ viewMode = 'grid' }) => {
  if (viewMode === 'list') {
    return (
      <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse h-28">
        <div className="w-32 bg-gray-100 flex-shrink-0" />
        <div className="p-4 flex-1 flex justify-between">
          <div>
            <div className="w-32 h-5 bg-gray-200 rounded mb-2" />
            <div className="w-48 h-4 bg-gray-100 rounded mb-3" />
            <div className="w-24 h-4 bg-gray-100 rounded" />
          </div>
          <div className="w-16 h-8 bg-gray-100 rounded self-end" />
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden animate-pulse min-h-[220px]">
      <div className="p-5 flex-1">
        <div className="w-14 h-14 bg-gray-100 rounded-xl mb-4" />
        <div className="w-3/4 h-6 bg-gray-200 rounded mb-2" />
        <div className="w-1/2 h-4 bg-gray-100 rounded mb-1" />
        <div className="w-2/3 h-4 bg-gray-100 rounded mt-3" />
      </div>
      <div className="h-12 bg-gray-50 border-t border-gray-100" />
    </div>
  );
};

export default RoomCard;

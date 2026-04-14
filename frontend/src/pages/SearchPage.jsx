import React, { useState, useEffect } from 'react';
import { LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { getRooms } from '../services/roomService';
import { getBuildings } from '../services/buildingService';
import RoomCard, { RoomCardSkeleton } from '../components/RoomCard';
import FilterPanel from '../components/FilterPanel';

const SearchPage = () => {
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState(new URLSearchParams(window.location.search).get('q') || '');
  const [selectedBuilding, setSelectedBuilding] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const fetchBuildings = async () => {
    const data = await getBuildings();
    setBuildings(data);
  };

  const fetchRooms = async () => {
    setLoading(true);
    try {
       const data = await getRooms({
         buildingId: selectedBuilding !== 'all' ? selectedBuilding : null,
         ...filters
       });
       setRooms(data);
    } catch (error) {
       console.error("Error fetching rooms", error);
    } finally {
       setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [selectedBuilding, filters]);

  // Local filtering based on text search
  const displayedRooms = rooms.filter(room => {
    const q = searchQuery.toLowerCase();
    return room.name?.toLowerCase().includes(q) || room.building_name?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Study Room Search</h1>
        <p className="text-gray-500 mt-1">
          {loading ? 'Searching...' : `${displayedRooms.length} room${displayedRooms.length !== 1 ? 's' : ''} available across campus`}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center p-2 sm:p-3 gap-3 relative z-20">
        <input 
          type="text" 
          placeholder="Filter by name..." 
          className="w-full sm:w-1/3 bg-gray-50 border border-gray-200 rounded-lg h-10 px-4 text-sm focus:ring-2 focus:ring-primary-orange focus:border-primary-orange outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        <select 
          className="w-full sm:w-1/4 bg-gray-50 border border-gray-200 rounded-lg h-10 px-3 text-sm focus:ring-2 focus:ring-primary-orange outline-none"
          value={selectedBuilding}
          onChange={(e) => setSelectedBuilding(e.target.value)}
        >
          <option value="all">All Buildings</option>
          {buildings.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 h-10 rounded-lg font-medium text-sm transition-colors ${showFilters ? 'bg-primary-orange text-white' : 'bg-orange-50 text-primary-orange hover:bg-orange-100'}`}
        >
          <SlidersHorizontal className="w-4 h-4" /> Filters {Object.keys(filters).length > 0 && `(${Object.keys(filters).length})`}
        </button>

        <div className="hidden sm:flex items-center ml-auto bg-gray-50 border border-gray-200 rounded-lg p-1">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary-orange' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-orange' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showFilters && (
        <FilterPanel 
          onFilterChange={(f) => { setFilters(f); setShowFilters(false); }}
          onClearFilters={() => { setFilters({}); setShowFilters(false); }}
        />
      )}

      {loading ? (
        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
           {[...Array(6)].map((_, i) => <RoomCardSkeleton key={i} viewMode={viewMode} />)}
        </div>
      ) : displayedRooms.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center mt-6">
          <div className="w-24 h-24 mb-6">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path opacity="0.4" d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="#C75B12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 8L10 12M10 12V12.01M10 12H10.01" stroke="#C75B12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No rooms found</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-6">We couldn't find any rooms matching your current filters. Try adjusting your search criteria.</p>
          <button 
            onClick={() => { setFilters({}); setSearchQuery(''); setSelectedBuilding('all'); }} 
            className="px-6 py-2 bg-orange-50 text-primary-orange hover:bg-orange-100 rounded-lg font-bold transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {displayedRooms.map(room => (
            <RoomCard key={room.id} room={room} viewMode={viewMode} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPage;

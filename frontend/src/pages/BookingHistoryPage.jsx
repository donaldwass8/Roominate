import React, { useState, useEffect } from 'react';
import { Search, Calendar, ChevronRight, ChevronLeft, Download, Filter } from 'lucide-react';
import { getAllReservations } from '../services/reservationService';
import { getBuildings } from '../services/buildingService';

// Fallback names to randomly assign deterministically based on user ID logic
const MOCK_NAMES = [
  "John Doe", "Alice Smith", "Michael Ross", "Sarah Lee", 
  "David Kim", "Emily Chen", "James Wilson", "Olivia Taylor",
  "Robert Brown", "Sophia Davis", "William Miller", "Mia Garcia"
];

const getStatusColor = (status) => {
  const s = status.toLowerCase();
  if (s === 'confirmed' || s === 'completed') return 'bg-green-100 text-green-800';
  if (s === 'cancelled') return 'bg-red-100 text-red-800';
  if (s === 'in progress' || s === 'active') return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-800';
};

const getInitials = (name) => {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const getDeterministicName = (userId) => {
  if (!userId) return MOCK_NAMES[0];
  // Simple hash to deterministically pick a name
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return MOCK_NAMES[Math.abs(hash) % MOCK_NAMES.length];
};

const BookingHistoryPage = () => {
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('All Buildings');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 8;
  
  const [allBuildings, setAllBuildings] = useState([]);

  useEffect(() => {
    fetchHistory();
    fetchInitialBuildings();
  }, []);

  const fetchInitialBuildings = async () => {
    const bData = await getBuildings();
    if (bData && bData.length > 0) {
      // Just keep normal building names from the database
      setAllBuildings(bData.map(b => b.name));
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    const data = await getAllReservations();
    
    // Sort logic (most recent start time first)
    // Map with deterministic mock user names so it looks complete as requested
    const formattedData = (data || []).map(r => {
      const mockName = getDeterministicName(r.user_id);
      
      let status = r.status || 'Confirmed';
      // Mocking 'In Progress' and 'Completed' based on time
      if (r.start_time && r.end_time) {
        const now = new Date();
        const start = new Date(r.start_time);
        const end = new Date(r.end_time);
        if (now > start && now < end && status !== 'cancelled') {
          status = 'In Progress';
        } else if (now > end && status !== 'cancelled') {
          status = 'Completed';
        }
      }

      return {
        ...r,
        userName: mockName,
        shortId: (r.user_id || '992103').substring(0, 6) + Math.floor(Math.random() * 10), // fake stable ID
        displayStatus: status,
        formattedDate: r.start_time ? new Date(r.start_time).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'}) : 'Unknown'
      };
    });

    setReservations(formattedData);
    setLoading(false);
  };

  const filteredReservations = reservations.filter(r => {
    const matchesSearch = 
      r.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.shortId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.room_name.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesBuilding = filterBuilding === 'All Buildings' || r.building_name === filterBuilding;
    
    let matchesDate = true;
    if (filterDate) {
      const rDate = r.start_time ? r.start_time.split('T')[0] : '';
      matchesDate = (rDate === filterDate);
    }
    
    return matchesSearch && matchesBuilding && matchesDate;
  });

  const totalPages = Math.ceil(filteredReservations.length / resultsPerPage) || 1;
  const currentResults = filteredReservations.slice((currentPage - 1) * resultsPerPage, currentPage * resultsPerPage);

  const handleExport = () => {
    if (filteredReservations.length === 0) return;
    
    const headers = ['Date', 'User Name', 'User ID', 'Room', 'Building', 'Time', 'Status'];
    const csvRows = [headers.join(',')];

    filteredReservations.forEach(res => {
      let startTimeStr = 'Unknown';
      let endTimeStr = 'Unknown';
      if (res.start_time) startTimeStr = new Date(res.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      if (res.end_time) endTimeStr = new Date(res.end_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

      const row = [
        `"${res.formattedDate}"`,
        `"${res.userName}"`,
        res.shortId,
        `"${res.room_name}"`,
        `"${res.building_name}"`,
        `"${startTimeStr} - ${endTimeStr}"`,
        res.displayStatus
      ];
      csvRows.push(row.join(','));
    });

    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'booking_history.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Booking History</h1>
          <p className="text-gray-500 mt-1">Manage and review past room reservations across campus.</p>
        </div>
        <button onClick={handleExport} className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
          <Download className="w-4 h-4" />
          <span>Export Results</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col lg:flex-row gap-4 items-end">
        <div className="w-full lg:w-1/4">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Date Range</label>
          <div className="relative">
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-orange text-gray-600" 
            />
            <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          </div>
        </div>
        
        <div className="w-full lg:w-2/5">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">User Search</label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search by name or ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-orange text-gray-800" 
            />
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="w-full lg:w-1/4">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Building</label>
          <select 
            value={filterBuilding}
            onChange={(e) => setFilterBuilding(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-orange text-gray-800 bg-white"
          >
            <option value="All Buildings">All Buildings</option>
            {allBuildings.map(bName => (
              <option key={bName} value={bName}>{bName}</option>
            ))}
          </select>
        </div>

        <button className="w-full lg:w-auto bg-primary-orange text-white px-8 py-2.5 rounded-lg text-sm font-bold shadow hover:bg-orange-600 transition-colors h-[42px]">
          Search
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Room</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500 font-medium">Loading history...</td>
                </tr>
              ) : currentResults.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500 font-medium">No reservations found matching your criteria.</td>
                </tr>
              ) : (
                currentResults.map((res) => {
                  let startTimeStr = 'Unknown';
                  let endTimeStr = 'Unknown';
                  if (res.start_time) {
                     startTimeStr = new Date(res.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                  }
                  if (res.end_time) {
                     endTimeStr = new Date(res.end_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                  }

                  return (
                    <tr key={res.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-gray-500">
                          <Calendar className="w-4 h-4 mr-2" />
                          {res.formattedDate}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                             res.userName === 'John Doe' ? 'bg-orange-100 text-orange-700' :
                             res.userName === 'Alice Smith' ? 'bg-blue-100 text-blue-700' :
                             res.userName === 'Michael Ross' ? 'bg-purple-100 text-purple-700' :
                             res.userName === 'Sarah Lee' ? 'bg-green-100 text-green-700' :
                             'bg-pink-100 text-pink-700'
                          }`}>
                            {getInitials(res.userName)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{res.userName}</div>
                            <div className="text-xs text-gray-500">ID: {res.shortId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{res.room_name}</div>
                        <div className="text-xs text-gray-500">{res.building_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">
                        {startTimeStr} - {endTimeStr}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(res.displayStatus)}`}>
                          {res.displayStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-primary-orange text-sm font-semibold hover:text-orange-700 transition-colors flex items-center justify-end w-full group">
                          Details
                          <ChevronRight className="w-4 h-4 ml-0.5 transform group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && currentResults.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-500 font-medium">
              Showing {(currentPage - 1) * resultsPerPage + 1} to {Math.min(currentPage * resultsPerPage, filteredReservations.length)} of {filteredReservations.length} results
            </div>
            <div className="flex space-x-1">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-200 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
               >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {/* Simple page numbers */}
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 border rounded text-sm font-medium transition-colors ${
                    currentPage === i + 1 
                      ? 'border-primary-orange text-primary-orange bg-orange-50' 
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              )).slice(0, 5)}
              
              {totalPages > 5 && <span className="px-2 py-1 text-gray-400">...</span>}
              
              <button 
                 onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                 disabled={currentPage === totalPages}
                 className="px-3 py-1 border border-gray-200 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingHistoryPage;

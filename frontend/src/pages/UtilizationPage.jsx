import React, { useState, useEffect, useRef } from 'react';
import { Clock, Building, Calendar, Download, FileText, Lightbulb, MoreHorizontal, Sparkles, Loader2, Play, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getAllReservations } from '../services/reservationService';
import { getRooms } from '../services/roomService';
import { disableRoom, enableRoom, getAllBlackouts } from '../services/maintenanceService';
import { Plus, Trash2, Wrench, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#14b8a6'];

const UtilizationPage = () => {
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState({
    totalHours: 0,
    mostUsedRoom: 'N/A',
    mostUsedRoomRate: 0,
    peakTime: 'N/A',
    totalBookings: 0,
  });
  const [buildingData, setBuildingData] = useState([]);
  const [usageTypeData, setUsageTypeData] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [blackouts, setBlackouts] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [disableDate, setDisableDate] = useState(new Date().toISOString().split('T')[0]);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // AI Assistant State
  const [aiQuery, setAiQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);

  const handleAiSubmit = (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setIsAiLoading(true);
    setAiResponse(null);

    // Hardcoded mock data for immediate UI results
    setTimeout(() => {
      setIsAiLoading(false);

      const query = aiQuery.toLowerCase();
      let mockResults = [];

      if (query.includes('hackathon') || query.includes('large') || query.includes('50')) {
        mockResults = [
          { room: "ECSW 2.323", building: "Engineering West", capacity: 60, reason: "Matches your large capacity needs. Features modular furniture for collaborative hacking." },
          { room: "SCI 1.210", building: "Science Building", capacity: 80, reason: "Large lecture-style hall with power outlets at every seat." }
        ];
      } else if (query.includes('quiet') || query.includes('study') || query.includes('small')) {
        mockResults = [
          { room: "LIB 4.400", building: "McDermott Library", capacity: 8, reason: "A quiet, glass-enclosed room perfect for focused group study." },
          { room: "JSOM 11.202", building: "Jindal School", capacity: 6, reason: "Quiet executive-style meeting room with high-speed Wi-Fi." }
        ];
      } else {
        mockResults = [
          { room: "SU 2.502", building: "Student Union", capacity: 25, reason: "Central location with built-in projector and presentation tools." },
          { room: "AH2 1.104", building: "Arts & Humanities", capacity: 15, reason: "Modern creative space with writable glass walls." }
        ];
      }

      setAiResponse({ recommendations: mockResults });
    }, 1500);
  };

  const dashboardRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await getAllReservations();

      if (data && data.length > 0) {
        setReservations(data);
        calculateStats(data);
        generateChartData(data);
      }
      setLoading(false);
    };

    fetchData();
    fetchRoomsAndBlackouts();
  }, []);

  const fetchRoomsAndBlackouts = async () => {
    const [rData, bData] = await Promise.all([
      getRooms(),
      getAllBlackouts()
    ]);
    setRooms(rData);
    setBlackouts(bData);
  };

  const handleDisableRoom = async (e) => {
    e.preventDefault();
    if (!selectedRoomId || !disableDate) {
      toast.error('Please select both a room and a date');
      return;
    }

    setIsActionLoading(true);
    const result = await disableRoom(selectedRoomId, disableDate);
    setIsActionLoading(false);

    if (result.success) {
      toast.success('Room disabled successfully for the selected date');
      fetchRoomsAndBlackouts();
    } else {
      toast.error(result.error || 'Failed to disable room');
    }
  };

  const handleEnableRoom = async (blackoutId) => {
    setIsActionLoading(true);
    const result = await enableRoom(blackoutId);
    setIsActionLoading(false);

    if (result.success) {
      toast.success('Room re-enabled successfully');
      fetchRoomsAndBlackouts();
    } else {
      toast.error(result.error || 'Failed to re-enable room');
    }
  };

  const calculateStats = (data) => {
    let totalMs = 0;
    const roomCounts = {};
    const hourCounts = {};

    data.forEach(res => {
      const start = new Date(res.start_time);
      const end = new Date(res.end_time);

      // Calculate Hours
      if (!isNaN(start) && !isNaN(end)) {
        totalMs += (end - start);
      }

      // Count Most Used Room
      const rName = res.room_name;
      roomCounts[rName] = (roomCounts[rName] || 0) + 1;

      // Peak Time (Hour block)
      if (!isNaN(start)) {
        const hour = start.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    const totalHours = Math.round(totalMs / (1000 * 60 * 60));

    // Calculate most used room
    let mostUsedRoom = 'N/A';
    let maxRoomCount = 0;
    for (const [room, count] of Object.entries(roomCounts)) {
      if (count > maxRoomCount) {
        maxRoomCount = count;
        mostUsedRoom = room;
      }
    }
    const mostUsedRoomRate = Math.round((maxRoomCount / data.length) * 100) || 0;

    // Calculate peak time
    let peakHour = 0;
    let maxHourCount = 0;
    for (const [hourStr, count] of Object.entries(hourCounts)) {
      if (count > maxHourCount) {
        maxHourCount = count;
        peakHour = parseInt(hourStr, 10);
      }
    }

    const peakAmPm = peakHour >= 12 ? 'PM' : 'AM';
    const displayHour = peakHour % 12 === 0 ? 12 : peakHour % 12;
    const peakTimeStr = `${displayHour}:00 ${peakAmPm}`;

    setStats({
      totalHours,
      mostUsedRoom,
      mostUsedRoomRate,
      peakTime: peakTimeStr,
      totalBookings: data.length
    });
  };

  const generateChartData = (data) => {
    // 1. Building Data
    const bCounts = {};
    data.forEach(res => {
      const bName = res.building_name || 'Other';
      bCounts[bName] = (bCounts[bName] || 0) + 1;
    });

    const bData = Object.entries(bCounts).map(([name, bookings]) => ({
      name,
      bookings
    }));
    setBuildingData(bData);

    // 2. Usage Type Data (Proxy via Capacity)
    let studyGroups = 0;   // capacity <= 6
    let clubMeetings = 0;  // capacity > 6 && capacity <= 20
    let lectures = 0;      // capacity > 20
    let events = 0;        // amenities contains 'projector' or 'stage'

    data.forEach(res => {
      const cap = res.capacity;
      const am = res.amenities || [];

      if (am.includes('Stage') || am.includes('Event Space')) {
        events++;
      } else if (cap > 20) {
        lectures++;
      } else if (cap > 6) {
        clubMeetings++;
      } else {
        studyGroups++;
      }
    });

    const uData = [
      { name: 'Study Groups', value: studyGroups },
      { name: 'Lectures', value: lectures },
      { name: 'Club Meetings', value: clubMeetings },
      { name: 'Events/Other', value: events }
    ].filter(item => item.value > 0);

    setUsageTypeData(uData);
  };

  const exportCSV = () => {
    if (reservations.length === 0) return;

    const headers = ['Reservation ID', 'Room Name', 'Building Name', 'User ID', 'Start Time', 'End Time', 'Status'];
    const csvRows = [headers.join(',')];

    reservations.forEach(res => {
      const row = [
        res.id,
        `"${res.room_name}"`,
        `"${res.building_name}"`,
        res.user_id,
        res.start_time,
        res.end_time,
        res.status
      ];
      csvRows.push(row.join(','));
    });

    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'utilization_data.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const exportPDF = async () => {
    if (!dashboardRef.current) return;

    try {
      const canvas = await html2canvas(dashboardRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('utilization_dashboard.pdf');
    } catch (err) {
      console.error("Failed to export PDF", err);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><p className="text-gray-500 font-medium">Loading Utilization Data...</p></div>;
  }

  return (
    <div className="space-y-6" ref={dashboardRef}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Utilization Dashboard</h1>
          <p className="text-gray-500 mt-1">Analyze room usage, booking trends, and campus efficiency.</p>
        </div>
        <div className="flex space-x-3" data-html2canvas-ignore="true">
          <button
            onClick={exportPDF}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4" />
            <span>PDF</span>
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-orange rounded-md text-sm font-medium text-white hover:bg-orange-600 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 relative">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Hours Booked</p>
              <h2 className="text-3xl font-bold text-gray-900 mt-2">{stats.totalHours} hrs</h2>
            </div>
            <div className="w-8 h-8 rounded-md bg-orange-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 relative">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Most Used Room</p>
              <h2 className="text-3xl font-bold text-gray-900 mt-2 truncate w-full" title={stats.mostUsedRoom}>{stats.mostUsedRoom}</h2>
            </div>
            <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
              <Building className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-500">
            {stats.mostUsedRoom !== 'N/A' && <span>{stats.mostUsedRoomRate}% of all bookings</span>}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 relative">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Peak Booking Time</p>
              <h2 className="text-3xl font-bold text-gray-900 mt-2">{stats.peakTime}</h2>
            </div>
            <div className="w-8 h-8 rounded-md bg-purple-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 relative">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Bookings</p>
              <h2 className="text-3xl font-bold text-gray-900 mt-2">{stats.totalBookings}</h2>
            </div>
            <div className="w-8 h-8 rounded-md bg-green-50 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-gray-900">Bookings per Building</h3>
          </div>
          <div className="h-72 w-full">
            {buildingData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buildingData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <RechartsTooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  <Bar dataKey="bookings" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40}>
                    {buildingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex justify-center items-center text-gray-400">No building data available</div>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-gray-900">Room Usage Types Proxy</h3>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          <div className="h-64 w-full flex justify-center items-center">
            {usageTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={usageTypeData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {usageTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex justify-center items-center text-gray-400">No usage data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Room Management Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Wrench className="w-5 h-5 text-gray-600" />
            <h3 className="font-bold text-gray-900">Room Availability Management</h3>
          </div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Tool</span>
        </div>
        
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Disable Room Form */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700">Disable Room for Maintenance</h4>
            <form onSubmit={handleDisableRoom} className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Select Room</label>
                <select 
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange outline-none"
                >
                  <option value="">-- Select a room --</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>{room.name} ({room.building_name})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Select Date</label>
                <input 
                  type="date"
                  value={disableDate}
                  onChange={(e) => setDisableDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isActionLoading || !selectedRoomId}
                className="w-full flex items-center justify-center space-x-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                <span>Disable Room for Day</span>
              </button>
              <p className="text-[10px] text-gray-400 italic">This will block all new reservations for the entire selected day.</p>
            </form>
          </div>

          {/* Active Blackouts List */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700">Currently Disabled Rooms</h4>
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              {blackouts.length > 0 ? (
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100 text-xs font-semibold text-gray-600 uppercase sticky top-0">
                    <tr>
                      <th className="px-4 py-2">Room</th>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {blackouts.map(blackout => (
                      <tr key={blackout.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium">{blackout.study_rooms?.name || 'Unknown'}</td>
                        <td className="px-4 py-3 text-gray-500">{new Date(blackout.start_time).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">
                          <button 
                            onClick={() => handleEnableRoom(blackout.id)}
                            disabled={isActionLoading}
                            className="text-green-600 hover:text-green-700 font-semibold text-xs flex items-center justify-end space-x-1 ml-auto"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Re-enable</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-gray-400 text-sm">
                  No rooms are currently disabled.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant Row */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-xl shadow-sm border border-indigo-100 p-6 relative overflow-hidden transition-all">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="relative z-10 flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Event Allocation Assistant</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Powered by <span className="font-semibold text-indigo-700">Gemini</span>. Describe your event, and AI will analyze current campus utilization to find the perfect room without disrupting study patterns.
            </p>
          </div>

          <div className="w-full lg:w-2/3 flex flex-col justify-center">
            <form onSubmit={handleAiSubmit} className="relative">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="e.g. We need a room for a 50-person hackathon this Friday..."
                className="w-full pl-4 pr-12 py-3.5 bg-white border border-indigo-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
              />
              <button
                type="submit"
                disabled={isAiLoading || !aiQuery.trim()}
                className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 ml-0.5" fill="currentColor" />}
              </button>
            </form>

            <div className={`mt-4 space-y-3 transition-all duration-500 ease-in-out ${aiResponse ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0 overflow-hidden'}`}>
              <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider flex items-center">
                <Sparkles className="w-3 h-3 mr-1" /> Gemini Recommendations
              </h4>
              <div className="grid sm:grid-cols-2 gap-3">
                {aiResponse?.recommendations.map((rec, idx) => (
                  <div key={idx} className="bg-white/80 backdrop-blur border border-indigo-100 p-3 rounded-lg shadow-sm hover:shadow transition-shadow">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-gray-900">{rec.room}</span>
                      <span className="text-xs font-medium px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full">Cap: {rec.capacity}</span>
                    </div>
                    <div className="text-xs font-semibold text-gray-500 mb-2">{rec.building}</div>
                    <p className="text-xs text-gray-700 leading-tight">{rec.reason}</p>
                    <button className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center group">
                      Book this room <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Insight Banner */}
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-start space-x-3">
        <div className="bg-orange-100 p-2 rounded-full mt-0.5">
          <Lightbulb className="w-4 h-4 text-orange-600" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Optimization Insight</h4>
          <p className="text-sm text-gray-700 mt-1">
            Based on current dynamic data, keep an eye on <strong className="font-semibold text-black">{stats.mostUsedRoom}</strong> which accounts for roughly {stats.mostUsedRoomRate}% of bookings. Ensure nearby auxiliary rooms are available during {stats.peakTime} to distribute load.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UtilizationPage;

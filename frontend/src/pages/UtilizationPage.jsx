import React, { useState, useEffect, useRef } from 'react';
import { ArrowUpRight, Clock, Building, Calendar, Download, FileText, Lightbulb, MoreHorizontal } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getAllReservations } from '../services/reservationService';

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
  }, []);

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
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                  <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: '1px solid #e5e7eb'}} />
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
                  <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px'}}/>
                </PieChart>
              </ResponsiveContainer>
             ) : (
                <div className="w-full h-full flex justify-center items-center text-gray-400">No usage data available</div>
             )}
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

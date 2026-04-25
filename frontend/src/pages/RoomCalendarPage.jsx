import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRoomById } from '../services/roomService';
import { getReservationsForRoom } from '../services/reservationService';

const getOrdinalSuffix = (i) => {
  if (!i) return '';
  const j = i % 10, k = i % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
};

// Helper to format time "12:30pm"
const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase().replace(' ', '');
};

const RoomCalendarPage = () => {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);

  const [currentDate, setCurrentDate] = useState(new Date()); // Current month shown
  const [selectedDate, setSelectedDate] = useState(new Date()); // The clicked day

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const roomData = await getRoomById(id);
      setRoom(roomData);

      if (roomData) {
        // Fetch reservations for the whole current month
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

        const resData = await getReservationsForRoom(id, startOfMonth, endOfMonth);
        setReservations(resData);
      }
      setLoading(false);
    };
    fetchData();
  }, [id, currentDate]);

  if (loading && !room) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-orange"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="p-8 text-center text-gray-500 min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Room not found</h2>
        <Link to="/" className="text-primary-orange hover:underline">Return to home</Link>
      </div>
    );
  }

  // Parse amenities
  let parsedAmenities = [];
  if (Array.isArray(room.amenities)) {
    parsedAmenities = room.amenities;
  } else if (typeof room.amenities === 'string') {
    let cleanStr = room.amenities;
    if (cleanStr.startsWith('{') && cleanStr.endsWith('}')) {
      cleanStr = cleanStr.slice(1, -1);
    }
    parsedAmenities = cleanStr.split(',').map(a => a.replace(/["']/g, '').trim()).filter(a => a !== '');
  }

  const roomType = room.room_type || 'Lecture Hall';

  // Calendar Logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Calculate day cells
  const days = [];
  // Empty slots for days before the 1st
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // Find bookings for a specific day
  const getBookingsForDay = (day) => {
    if (!day) return [];
    return reservations.filter(res => {
      const resDate = new Date(res.start_time);
      return resDate.getDate() === day &&
        resDate.getMonth() === month &&
        resDate.getFullYear() === year;
    });
  };

  const getDayColorClass = (day) => {
    if (!day) return '';
    const dayBookings = getBookingsForDay(day);
    const dateToCheck = new Date(year, month, day);
    const now = new Date();
    const isToday =
      dateToCheck.getDate() === now.getDate() &&
      dateToCheck.getMonth() === now.getMonth() &&
      dateToCheck.getFullYear() === now.getFullYear();
    const isPast = dateToCheck < new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const bookableEnd = new Date(dateToCheck);
    bookableEnd.setHours(23, 30, 0, 0);

    let bookableStart = new Date(dateToCheck);
    bookableStart.setHours(7, 0, 0, 0);

    if (isToday && now > bookableStart) {
      const next = new Date(now);
      const minutes = next.getMinutes();
      if (minutes > 0 && minutes <= 30) {
        next.setMinutes(30, 0, 0);
      } else if (minutes > 30) {
        next.setHours(next.getHours() + 1, 0, 0, 0);
      } else {
        next.setSeconds(0, 0);
      }
      bookableStart = next;
    } else if (isPast) {
      bookableStart.setHours(7, 0, 0, 0);
    }

    let totalAvailableMinutes = (bookableEnd - bookableStart) / (1000 * 60);
    if (totalAvailableMinutes < 0) totalAvailableMinutes = 0;

    let totalBookedMinutes = 0;
    dayBookings.forEach(res => {
      const resStart = new Date(res.start_time);
      const resEnd = new Date(res.end_time);

      const overlapStart = new Date(Math.max(bookableStart, resStart));
      const overlapEnd = new Date(Math.min(bookableEnd, resEnd));

      const overlapMinutes = (overlapEnd - overlapStart) / (1000 * 60);
      if (overlapMinutes > 0) {
        totalBookedMinutes += overlapMinutes;
      }
    });

    if (totalAvailableMinutes === 0 || (totalAvailableMinutes > 0 && totalBookedMinutes >= totalAvailableMinutes)) {
      return 'bg-[#EF5350] text-black border-b-4 border-[#D32F2F]'; // Red
    }

    if (dayBookings.length > 0) {
      return 'bg-[#FFD54F] text-black border-b-4 border-[#FBC02D]'; // Yellow
    }

    return 'bg-[#4CAF50] text-black border-b-4 border-[#388E3C]'; // Green
  };

  const selectedDayBookings = getBookingsForDay(selectedDate.getDate());

  return (
    <div className="max-w-[1400px] mx-auto p-4 lg:p-6 min-h-[85vh]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">

        {/* LEFT SIDEBAR: Room Info */}
        <div className="lg:col-span-3 flex flex-col h-full min-h-[500px]">
          <div className="bg-[#EFEFEF] rounded-2xl p-6 border border-gray-300 shadow-sm flex flex-col h-full">
            <h1 className="text-3xl font-normal text-gray-900 mb-6">{room.name}</h1>
            <p className="text-gray-800 mb-6 font-medium text-[15px]">{roomType}</p>

            <div className="mb-6">
              <p className="text-gray-800 text-[15px]">Capacity: ~{room.capacity || 0} Occupants</p>
            </div>

            <div className="mb-auto">
              <h3 className="text-gray-800 text-[15px] mb-1">Amenities:</h3>
              <ul className="flex flex-col gap-0.5 text-gray-500 text-[12px] pl-2">
                {parsedAmenities.length > 0 ? (
                  parsedAmenities.map((amenity, index) => (
                    <li key={index} className="flex items-center gap-1.5 capitalize">
                      <div className="w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                      {amenity.replace(/[-_]/g, ' ')}
                    </li>
                  ))
                ) : (
                  <li>No amenities listed</li>
                )}
              </ul>
            </div>

            {/* Legend Key */}
            <div className="mt-8 pt-4 border-t-0">
              <h3 className="text-gray-800 text-[14px] mb-2 font-medium">Key:</h3>
              <div className="flex flex-col gap-1.5 text-[13px] text-gray-800 font-medium">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#4CAF50] border border-[#388E3C]" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#FFD54F] border border-[#FBC02D]" />
                  <span>Partially Available</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#EF5350] border border-[#D32F2F]" />
                  <span>Not Available</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER: Calendar */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="bg-[#EFEFEF] rounded-2xl border border-gray-300 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="bg-[#6B6B6B] text-black p-3 flex justify-between items-center px-6">
              <button
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                className="text-black hover:text-white font-bold text-xl px-2 transition-colors"
              >&lsaquo;</button>
              <h2 className="text-[22px] font-bold tracking-wide">{monthNames[month]}</h2>
              <button
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                className="text-black hover:text-white font-bold text-xl px-2 transition-colors"
              >&rsaquo;</button>
            </div>

            <div className="bg-[#8A8A8A] text-black text-xs sm:text-[13px] font-bold py-1.5">
              <div className="grid grid-cols-7 text-center">
                {weekDays.map(day => (
                  <div key={day} className="truncate px-1">{day}</div>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="grid grid-cols-7 gap-3 sm:gap-4 lg:gap-5">
                {days.map((day, idx) => (
                  <div key={idx} className="aspect-[4/3] relative">
                    {day && (
                      <button
                        onClick={() => setSelectedDate(new Date(year, month, day))}
                        className={`w-full h-full rounded-xl flex items-center justify-center font-normal text-base sm:text-lg transition-transform hover:scale-105 shadow-sm 
                        ${getDayColorClass(day)} 
                        ${selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year ? 'ring-4 ring-blue-400 ring-offset-2 ring-offset-[#EFEFEF]' : ''}`}
                      >
                        {day}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Search By */}
          <div className="mt-8">
            <h3 className="text-[22px] font-normal text-gray-800 mb-3">Search By:</h3>
            <div className="flex flex-wrap gap-4">
              <select className="border border-gray-400 bg-white rounded-full px-5 py-1 text-gray-700 text-sm outline-none hover:bg-gray-50 appearance-none pr-10 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M7%2010l5%205%205-5z%22%20fill%3D%22%23999%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_8px_center]">
                <option>Week</option>
              </select>
              <select className="border border-gray-400 bg-white rounded-full px-5 py-1 text-gray-700 text-sm outline-none hover:bg-gray-50 appearance-none pr-10 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M7%2010l5%205%205-5z%22%20fill%3D%22%23999%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_8px_center]" defaultValue="Month">
                <option>Month</option>
              </select>
              <select className="border border-gray-400 bg-white rounded-full px-5 py-1 text-gray-700 text-sm outline-none hover:bg-gray-50 appearance-none pr-10 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M7%2010l5%205%205-5z%22%20fill%3D%22%23999%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_8px_center]">
                <option>Semester</option>
              </select>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: Selected Day Details */}
        <div className="lg:col-span-3 flex flex-col pt-0 lg:pt-16">
          <div className="bg-[#EFEFEF] rounded-2xl p-6 border border-gray-300 shadow-sm flex flex-col min-h-[250px]">
            <h2 className="text-[20px] font-normal text-gray-900 mb-2">Selected Day:</h2>
            <ul className="list-disc pl-6 text-gray-800 text-[15px] font-normal mb-8">
              <li>{monthNames[selectedDate.getMonth()]} {selectedDate.getDate()}{getOrdinalSuffix(selectedDate.getDate())}</li>
            </ul>

            <h2 className="text-[18px] font-normal text-gray-900 mb-3">Bookings For This Day:</h2>
            <ul className="list-disc pl-6 text-gray-800 text-[14px] font-normal flex-1">
              {selectedDayBookings.length > 0 ? (
                selectedDayBookings.map((res, index) => (
                  <li key={index} className="mb-3">
                    {formatTime(res.start_time)}-{formatTime(res.end_time)}
                    <ul className="list-[circle] pl-6 text-gray-600 mt-0.5">
                      <li>Booked</li>
                    </ul>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 list-none -ml-6">No bookings for this day.</li>
              )}
            </ul>

            <div className="mt-8 flex justify-end">
              <button className="bg-[#D97706] hover:bg-amber-600 text-black font-medium py-2 px-4 rounded-xl shadow-sm transition-transform hover:-translate-y-0.5 border border-[#c66412] text-sm">
                Reserve This Room
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RoomCalendarPage;

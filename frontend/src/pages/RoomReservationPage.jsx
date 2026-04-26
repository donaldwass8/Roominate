import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getRoomById, getRooms, checkIsFavorite, addFavorite, removeFavorite } from '../services/roomService';
import { getReservationsForRoom, createReservation } from '../services/reservationService';
import { Heart } from 'lucide-react';

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

const generateTimeOptions = () => {
  const options = [];
  for (let i = 7; i <= 23; i++) {
    ['00', '30'].forEach(min => {
      const hour24 = i.toString().padStart(2, '0');
      const value = `${hour24}:${min}`;
      const period = i >= 12 ? 'PM' : 'AM';
      const hour12 = i % 12 || 12;
      const label = `${hour12}:${min} ${period}`;
      options.push({ value, label });
    });
  }
  return options;
};

const RoomReservationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [similarRooms, setSimilarRooms] = useState([]);

  // Form State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [purpose, setPurpose] = useState('Study Session');
  const [organizer, setOrganizer] = useState('');

  // Recurrence State
  const [recurrenceType, setRecurrenceType] = useState('none');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [customDates, setCustomDates] = useState([]);

  const [loadingBooking, setLoadingBooking] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const roomData = await getRoomById(id);
        if (!roomData) {
          toast.error("Room not found");
          navigate('/search');
          return;
        }
        setRoom(roomData);

        // Fetch all upcoming reservations for overlap checking
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const resData = await getReservationsForRoom(id, today, null);
        setReservations(resData);

        // Fetch similar rooms
        if (roomData.building_id) {
          const sRooms = await getRooms({ buildingId: roomData.building_id });
          setSimilarRooms(sRooms.filter(r => r.id !== parseInt(id)).slice(0, 3));
        }

      } catch (error) {
        console.error("Failed to load room data", error);
        toast.error("Failed to load room details");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // Check favorite status separately so it doesn't re-run on month change
    checkIsFavorite('a0000000-0000-0000-0000-000000000001', id).then(setIsFavorite);
  }, [id, navigate, selectedDate.getMonth(), selectedDate.getFullYear()]);

  if (loading || !room) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-orange"></div>
      </div>
    );
  }

  // Calculate Intended Dates
  const getIntendedDates = () => {
    let dates = [];
    if (recurrenceType === 'none') {
      dates = [selectedDate];
    } else if (recurrenceType === 'custom') {
      dates = customDates.length > 0 ? [...customDates] : [selectedDate];
      dates.sort((a, b) => a - b);
    } else if (recurrenceType === 'daily' || recurrenceType === 'weekly') {
      dates.push(selectedDate);
      if (recurrenceEndDate) {
        const end = new Date(recurrenceEndDate);
        end.setHours(23, 59, 59);
        let curr = new Date(selectedDate);
        const step = recurrenceType === 'daily' ? 1 : 7;
        let limit = 50; // Prevent infinite loops
        while (limit > 0) {
          curr = new Date(curr);
          curr.setDate(curr.getDate() + step);
          if (curr > end) break;
          dates.push(curr);
          limit--;
        }
      }
    }
    return dates;
  };

  const intendedDates = getIntendedDates();

  // Check Availability
  let validDatesToBook = [];
  let unavailableDates = [];
  let statusMessage = "Room(s) available for selected time(s)";

  if (intendedDates.length === 0) {
    statusMessage = "Please select at least one date.";
  } else {
    let hasTimeError = false;
    for (const date of intendedDates) {
      const dateStr = date.toISOString().split('T')[0];
      const startDateTime = new Date(`${dateStr}T${startTime}:00`);
      const endDateTime = new Date(`${dateStr}T${endTime}:00`);

      if (startDateTime < new Date()) {
        unavailableDates.push(dateStr);
        continue;
      }
      if (startDateTime >= endDateTime) {
        hasTimeError = true;
        statusMessage = "End time must be after start time.";
        break;
      }

      let conflict = false;
      for (const res of reservations) {
        const resStart = new Date(res.start_time);
        const resEnd = new Date(res.end_time);
        if (startDateTime < resEnd && endDateTime > resStart) {
          conflict = true;
          break;
        }
      }

      if (conflict) {
        unavailableDates.push(dateStr);
      } else {
        validDatesToBook.push(dateStr);
      }
    }
    
    if (hasTimeError) {
      validDatesToBook = [];
      unavailableDates = intendedDates.map(d => d.toISOString().split('T')[0]);
    }
  }

  const isPartiallyAvailable = validDatesToBook.length > 0 && unavailableDates.length > 0;
  const isFullyAvailable = validDatesToBook.length > 0 && unavailableDates.length === 0;
  const isFullyUnavailable = validDatesToBook.length === 0;

  if (intendedDates.length > 0 && !isFullyAvailable && statusMessage !== "End time must be after start time.") {
    if (isFullyUnavailable) {
      statusMessage = intendedDates.length === 1 
        ? `Room is not available on ${unavailableDates[0]}.` 
        : `Room is not available on any selected dates.`;
    } else if (isPartiallyAvailable) {
      statusMessage = `Room is not available on ${unavailableDates.length} of ${intendedDates.length} selected dates. Available dates can still be booked.`;
    }
  }

  const availabilityStatus = { 
    isAvailable: isFullyAvailable || isPartiallyAvailable, 
    isPartiallyAvailable,
    validDatesToBook,
    message: statusMessage 
  };

  // Find existing reservations for intended dates
  const existingReservationsForDates = reservations.filter(res => {
    const resStart = new Date(res.start_time);
    return intendedDates.some(d => {
      return resStart.getFullYear() === d.getFullYear() && 
             resStart.getMonth() === d.getMonth() && 
             resStart.getDate() === d.getDate();
    });
  }).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  // Generate Mini Calendar Days
  const year = calendarViewDate.getFullYear();
  const month = calendarViewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  // Parse amenities to handle both array and string formats from DB
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

  const timeOptions = generateTimeOptions();
  const roomType = room.room_type || 'Lecture Hall';

  const handleBook = async () => {
    if (!availabilityStatus.isAvailable) {
      toast.error(availabilityStatus.message);
      return;
    }
    if (!organizer.trim()) {
      toast.error("Please enter an Organizer Name");
      return;
    }

    setLoadingBooking(true);
    const userId = 'a0000000-0000-0000-0000-000000000001';

    let allSuccess = true;
    for (const dateStr of availabilityStatus.validDatesToBook) {
      const startDateTime = new Date(`${dateStr}T${startTime}:00`);
      const endDateTime = new Date(`${dateStr}T${endTime}:00`);

      const result = await createReservation(userId, room.id, startDateTime, endDateTime, purpose, organizer);
      if (!result.success) {
        allSuccess = false;
        toast.error(`Failed to book for ${dateStr}: ${result.error}`);
      }
    }

    setLoadingBooking(false);

    if (allSuccess) {
      toast.success(availabilityStatus.validDatesToBook.length > 1 ? `Successfully booked ${availabilityStatus.validDatesToBook.length} reservations!` : "Room booked successfully!");
      if (availabilityStatus.isPartiallyAvailable) {
         toast("Note: Unavailable dates were automatically skipped.", { icon: '⚠️' });
      }
      navigate('/reservations');
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const resData = await getReservationsForRoom(id, today, null);
      setReservations(resData);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 lg:p-6 min-h-[85vh]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">

        {/* LEFT COLUMN: Room Summary */}
        <div className="flex flex-col gap-4 lg:col-span-3 h-full">
          <h2 className="text-[26px] font-bold text-center mb-0">Room Summary</h2>
          <div className="bg-[#F5F5F5] rounded-2xl p-6 border border-gray-300 shadow-sm flex flex-col h-full min-h-[500px]">
            <h1 className="text-3xl font-normal text-gray-900 mb-2">{room.name}</h1>
            <p className="text-gray-800 mb-6 font-medium text-[15px]">{roomType}</p>

            <div className="mb-6">
              <p className="text-gray-800 text-[15px]">Capacity: ~{room.capacity || 0} Occupants</p>
            </div>

            <div className="mb-auto">
              <h3 className="text-gray-800 text-[15px] mb-1">Amenities:</h3>
              <ul className="flex flex-col gap-0.5 text-gray-500 text-[12px] pl-4 list-disc">
                {parsedAmenities.length > 0 ? (
                  parsedAmenities.map((amenity, index) => (
                    <li key={index} className="capitalize">
                      {amenity.replace(/[-_]/g, ' ')}
                    </li>
                  ))
                ) : (
                  <li className="list-none -ml-4">No amenities listed</li>
                )}
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-300 text-right">
              <Link to={`/rooms/${id}`} className="text-[#E67E22] hover:underline text-sm font-medium">
                View Room Details &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Reservation Details */}
        <div className="flex flex-col gap-4 lg:col-span-6 h-full">
          <h2 className="text-[26px] font-bold text-center mb-0">Reservation Details</h2>
          <div className="bg-white rounded-2xl p-6 lg:p-8 border border-gray-300 shadow-sm flex flex-col h-full">

            {/* Date & Time Section */}
            <h3 className="text-2xl font-normal text-black mb-4">Date & Time</h3>
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              {/* Left side settings */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="border border-gray-400 rounded-xl p-3 bg-white min-h-[80px]">
                  <p className="text-sm text-gray-800 font-medium mb-1">Date(s) Selected:</p>
                  <ul className="list-disc pl-5 text-sm text-gray-800 max-h-24 overflow-y-auto">
                    {intendedDates.length === 0 ? (
                      <li className="text-gray-500 italic list-none -ml-5">No dates selected</li>
                    ) : intendedDates.length <= 3 ? (
                      intendedDates.map((d, i) => (
                        <li key={i}>{monthNames[d.getMonth()]} {d.getDate()}, {d.getFullYear()}</li>
                      ))
                    ) : (
                      <>
                        <li>{monthNames[intendedDates[0].getMonth()]} {intendedDates[0].getDate()}, {intendedDates[0].getFullYear()}</li>
                        <li className="list-none text-gray-500 my-0.5 -ml-1">...</li>
                        <li>{monthNames[intendedDates[intendedDates.length - 1].getMonth()]} {intendedDates[intendedDates.length - 1].getDate()}, {intendedDates[intendedDates.length - 1].getFullYear()}</li>
                        <li className="text-gray-500 list-none -ml-5 mt-1 text-xs italic">({intendedDates.length} total dates)</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <select
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full border border-gray-400 rounded-full px-4 py-1.5 text-sm outline-none appearance-none bg-white text-gray-700"
                    >
                      {timeOptions.map(t => <option key={`s-${t.value}`} value={t.value}>{t.label}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                  <div className="flex-1 relative">
                    <select
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full border border-gray-400 rounded-full px-4 py-1.5 text-sm outline-none appearance-none bg-white text-gray-700"
                    >
                      {timeOptions.map(t => <option key={`e-${t.value}`} value={t.value}>{t.label}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <select
                      value={recurrenceType}
                      onChange={(e) => {
                        setRecurrenceType(e.target.value);
                        if (e.target.value === 'custom' && customDates.length === 0) {
                          setCustomDates([selectedDate]);
                        }
                      }}
                      className="w-full border border-gray-400 rounded-full px-4 py-1.5 text-sm bg-[#F5F5F5] text-gray-700 outline-none appearance-none font-medium"
                    >
                      <option value="none">Does not repeat</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="custom">Custom Dates</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                  {(recurrenceType === 'daily' || recurrenceType === 'weekly') && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-600 font-medium">Until:</span>
                      <input
                        type="date"
                        min={selectedDate.toISOString().split('T')[0]}
                        value={recurrenceEndDate}
                        onChange={(e) => setRecurrenceEndDate(e.target.value)}
                        className="flex-1 border border-gray-400 rounded-full px-3 py-1.5 text-sm outline-none bg-white focus:ring-1 focus:ring-[#E67E22]"
                      />
                    </div>
                  )}
                  {recurrenceType === 'custom' && (
                    <div className="mt-1 text-xs text-[#c66412] font-semibold flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path></svg>
                      Click dates on the calendar to select multiple.
                    </div>
                  )}
                </div>
              </div>

              {/* Right side calendar grid */}
              <div className="flex-1 bg-[#F5F5F5] rounded-xl p-4 border border-gray-300">
                <div className="flex justify-between items-center mb-2 px-1">
                  <button onClick={() => { const d = new Date(calendarViewDate); d.setMonth(d.getMonth() - 1); setCalendarViewDate(d); }} className="text-gray-500 hover:text-black">&lsaquo;</button>
                  <span className="text-sm font-semibold">{monthNames[calendarViewDate.getMonth()]} {year}</span>
                  <button onClick={() => { const d = new Date(calendarViewDate); d.setMonth(d.getMonth() + 1); setCalendarViewDate(d); }} className="text-gray-500 hover:text-black">&rsaquo;</button>
                </div>
                <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center">
                  {weekDays.map((d, i) => <div key={`wd-${i}`} className="text-xs font-medium text-gray-600 mb-1">{d}</div>)}
                  {days.map((day, idx) => {
                    if (!day) return <div key={`empty-${idx}`}></div>;

                    const dayDate = new Date(year, month, day);
                    const isPast = dayDate < new Date(new Date().setHours(0, 0, 0, 0));
                    let isSelected = false;
                    if (recurrenceType === 'custom') {
                      isSelected = customDates.some(d => d.getDate() === day && d.getMonth() === month && d.getFullYear() === year);
                    } else if (recurrenceType === 'daily' || recurrenceType === 'weekly') {
                      isSelected = intendedDates.some(d => d.getDate() === day && d.getMonth() === month && d.getFullYear() === year);
                    } else {
                      isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
                    }

                    return (
                      <button
                        key={`day-${idx}`}
                        disabled={isPast && recurrenceType !== 'custom'}
                        onClick={() => {
                          const newDate = new Date(year, month, day);
                          if (recurrenceType === 'custom') {
                            if (newDate < new Date(new Date().setHours(0, 0, 0, 0))) return; // block past
                            const exists = customDates.find(d => d.getDate() === day && d.getMonth() === month && d.getFullYear() === year);
                            if (exists) {
                              setCustomDates(customDates.filter(d => d !== exists));
                            } else {
                              setCustomDates([...customDates, newDate]);
                            }
                          } else {
                            setSelectedDate(newDate);
                            setRecurrenceEndDate('');
                          }
                        }}
                        className={`w-7 h-7 mx-auto rounded-full text-[11px] flex items-center justify-center font-medium transition-colors
                          ${isSelected ? 'bg-[#5EEB7A] text-black shadow-sm' :
                            isPast ? 'bg-[#D4D4D4] text-gray-500 cursor-not-allowed opacity-60' :
                              'bg-[#8A8A8A] text-white hover:bg-gray-600'}`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Booking Purpose Section */}
            <h3 className="text-2xl font-normal text-black mb-4">Booking Purpose</h3>
            <div className="flex flex-wrap gap-3 mb-8">
              {['Study Session', 'Student Org.', 'Workshop', 'Tutoring'].map(p => (
                <button
                  key={p}
                  onClick={() => setPurpose(p)}
                  className={`border rounded-full px-5 py-1.5 text-sm transition-colors 
                    ${purpose === p ? 'bg-transparent text-gray-800 border-gray-800 ring-1 ring-gray-800' : 'bg-transparent border-gray-400 text-gray-600 hover:bg-gray-50'}`}
                >
                  {p}
                </button>
              ))}
              <div className="relative">
                <select
                  value={['Study Session', 'Student Org.', 'Workshop', 'Tutoring'].includes(purpose) ? 'Other' : purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className={`border rounded-full px-5 py-1.5 text-sm appearance-none outline-none pr-8 transition-colors
                    ${!['Study Session', 'Student Org.', 'Workshop', 'Tutoring'].includes(purpose) && purpose !== 'Other' ? 'bg-transparent text-gray-800 border-gray-800 ring-1 ring-gray-800' : 'bg-transparent border-gray-400 text-gray-600 hover:bg-gray-50'}`}
                >
                  <option value="Other" disabled hidden>Other</option>
                  <option value="Interview">Interview</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Event">Event</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            {/* Organization/Host Section */}
            <h3 className="text-2xl font-normal text-black mb-4">Organization/Host</h3>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Organizer Name"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                className="w-full border border-gray-300 bg-[#F5F5F5] rounded-full px-5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>

            <div className="mb-auto">
              <p className="text-xs font-bold text-black mb-1">Booking Limits Indicator:</p>
              <ul className="list-disc pl-5 text-xs text-gray-800">
                <li>Daily Bookings: 1/2</li>
                <li>Weekly bookings: 1/5</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex justify-center md:justify-end gap-4 mt-8">
              <button
                disabled={loadingBooking || !availabilityStatus.isAvailable}
                onClick={handleBook}
                className="bg-[#E67E22] hover:bg-[#d67118] disabled:opacity-50 disabled:cursor-not-allowed text-black font-medium py-2 px-6 rounded-xl shadow-sm transition-colors text-sm border border-[#c66412]"
              >
                {loadingBooking ? 'Booking...' : 'Reserve This Room'}
              </button>
              <button
                onClick={() => navigate(-1)}
                className="bg-[#E0E0E0] hover:bg-gray-300 text-black font-medium py-2 px-8 rounded-xl shadow-sm transition-colors text-sm border border-gray-300"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Status & Extras */}
        <div className="flex flex-col gap-4 lg:col-span-3 h-full">
          <div className="h-[34px] hidden lg:block"></div> {/* Spacer to align with headers */}

          {/* Availability Status */}
          <div className={`${availabilityStatus.isPartiallyAvailable ? 'bg-[#FDE047] border-[#EAB308]' : availabilityStatus.isAvailable ? 'bg-[#5EEB7A] border-[#4cae4c]' : 'bg-[#EF5350] border-[#D32F2F]'} rounded-xl p-4 border shadow-sm transition-colors`}>
            <h3 className="font-bold text-black text-[15px] mb-1">
              {availabilityStatus.isPartiallyAvailable ? 'Partially Available' : 'Availability Status'}
            </h3>
            <p className="text-black text-[13px]">{availabilityStatus.message}</p>
          </div>

          {/* Existing Reservations */}
          <div className={`${existingReservationsForDates.length > 0 ? 'bg-[#FFF8E1] border-[#FFE082]' : 'bg-[#F5F5F5] border-gray-300'} rounded-xl p-4 border shadow-sm`}>
            <h3 className="font-bold text-black text-[15px] mb-2">Existing Reservations:</h3>
            {existingReservationsForDates.length > 0 ? (
              <ul className="list-disc pl-5 text-[13px] text-gray-800 space-y-1 max-h-32 overflow-y-auto">
                {existingReservationsForDates.map(r => {
                  const sTime = new Date(r.start_time).toLocaleTimeString([], {timeStyle: 'short'});
                  const eTime = new Date(r.end_time).toLocaleTimeString([], {timeStyle: 'short'});
                  const rDate = new Date(r.start_time).toLocaleDateString([], {month: 'short', day: 'numeric'});
                  return (
                    <li key={r.id}>
                      <span className="font-semibold">{rDate}:</span> {sTime} - {eTime}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-[13px] text-gray-500 italic">No existing reservations for the selected date(s).</p>
            )}
          </div>

          {/* Similar Rooms */}
          <div className="bg-[#F5F5F5] rounded-xl p-4 border border-gray-300 shadow-sm">
            <h3 className="font-bold text-black text-[15px] mb-2">Similar Rooms:</h3>
            <ul className="list-disc pl-5 text-[13px] text-gray-800 space-y-1">
              {similarRooms.length > 0 ? (
                similarRooms.map(r => (
                  <li key={r.id}>
                    {r.name} <span className="text-gray-500">({r.capacity > 0 ? 'Available' : 'Not available'})</span>
                  </li>
                ))
              ) : (
                <li className="list-none -ml-5 text-gray-500">No similar rooms found</li>
              )}
            </ul>
          </div>

          {/* Notification Preferences */}
          <div className="bg-[#F5F5F5] rounded-xl p-4 border border-gray-300 shadow-sm">
            <h3 className="font-bold text-black text-[15px] mb-2">Notification Preferences:</h3>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[13px] text-gray-800 cursor-pointer">
                <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-400" defaultChecked />
                Email confirmation
              </label>
              <label className="flex items-center gap-2 text-[13px] text-gray-800 cursor-pointer">
                <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-400" defaultChecked />
                Text reminders
              </label>
            </div>
          </div>

          {/* UTD Policy Reminder */}
          <div className="bg-[#F5F5F5] rounded-xl p-4 border border-gray-300 shadow-sm">
            <h3 className="font-bold text-black text-[15px] mb-2">UTD Policy Reminder:</h3>
            <ul className="list-disc pl-5 text-[12px] text-gray-800 space-y-1">
              <li>Repeated no-shows may restrict access</li>
              <li>Improper use of room may restrict access</li>
            </ul>
          </div>

          {/* Set as Favorite */}
          <div className="mt-2 flex justify-center lg:justify-start">
            <button
              className={`${isFavorite ? 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200' : 'bg-[#5EEB7A] hover:bg-[#4cae4c] border-[#4cae4c]/30 text-black'} font-medium py-2 px-6 rounded-xl shadow-sm transition-colors text-sm border flex items-center gap-2`}
              disabled={favoriteLoading}
              onClick={async () => {
                setFavoriteLoading(true);
                if (isFavorite) {
                  const result = await removeFavorite('a0000000-0000-0000-0000-000000000001', id);
                  if (result.success) { setIsFavorite(false); toast.success('Removed from favorites'); }
                  else toast.error('Failed to remove favorite');
                } else {
                  const result = await addFavorite('a0000000-0000-0000-0000-000000000001', id);
                  if (result.success) { setIsFavorite(true); toast.success('Added to favorites! ❤️'); }
                  else toast.error('Failed to add favorite');
                }
                setFavoriteLoading(false);
              }}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 stroke-red-500' : ''}`} />
              {isFavorite ? 'Remove Favorite' : 'Set as Favorite'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RoomReservationPage;

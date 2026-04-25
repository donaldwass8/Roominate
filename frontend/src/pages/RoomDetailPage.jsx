import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRoomById, getRooms } from '../services/roomService';
import { getReservationsForRoom } from '../services/reservationService';
import { CheckCircle2 } from 'lucide-react';

const roomTypeDescriptions = {
  'Lecture Hall': 'Large lecture classroom designed for presentations and large group instructions. Ideal for review sessions, guest lectures, and organization meetings.',
  'Classroom': 'Standard classroom setting suitable for interactive learning and medium-sized group sessions.',
  'Student Lounge': 'Comfortable, open space designed for students to relax, socialize, and engage in informal group work.',
  'Laboratory': 'Specialized laboratory space equipped for practical experiments and technical instruction.',
  'Meeting Room': 'Formal space designed for group discussions, professional meetings, and collaborative planning sessions.',
  'Study Room': 'Quiet, focused environment intended for individual study or small group collaboration.'
};

const getOrdinalSuffix = (i) => {
  if (!i) return '';
  const j = i % 10, k = i % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
};

const RoomDetailPage = () => {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarRooms, setSimilarRooms] = useState([]);
  const [todayStatus, setTodayStatus] = useState('Available Today');
  const [statusColor, setStatusColor] = useState('bg-[#61B865] border-[#4CAF50]/20');

  useEffect(() => {
    const fetchRoom = async () => {
      setLoading(true);
      const data = await getRoomById(id);
      setRoom(data);
      if (data && data.building_id) {
        const allRooms = await getRooms({ buildingId: data.building_id });
        const filtered = allRooms.filter(r => r.id !== id).slice(0, 2);
        setSimilarRooms(filtered);
      }

      try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        const resData = await getReservationsForRoom(id, startOfDay, endOfDay);

        let bookableStart = new Date();
        bookableStart.setHours(7, 0, 0, 0);

        const bookableEnd = new Date();
        bookableEnd.setHours(23, 30, 0, 0);

        if (now > bookableStart) {
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
        }

        let totalAvailableMinutes = (bookableEnd - bookableStart) / (1000 * 60);
        if (totalAvailableMinutes < 0) totalAvailableMinutes = 0;

        let totalBookedMinutes = 0;
        resData.forEach(res => {
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
          setTodayStatus('Not Available Today');
          setStatusColor('bg-[#EF5350] border-[#D32F2F]/20');
        } else if (resData.length > 0) {
          setTodayStatus('Partially Available Today');
          setStatusColor('bg-[#FFD54F] border-[#FBC02D]/20');
        } else {
          setTodayStatus('Available Today');
          setStatusColor('bg-[#61B865] border-[#4CAF50]/20');
        }
      } catch (err) {
        console.error("Failed to fetch reservations for today", err);
      }

      setLoading(false);
    };
    fetchRoom();
  }, [id]);

  if (loading) {
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

  // Parse usage notes if it's a string with line breaks or commas
  let parsedNotes = [];
  if (Array.isArray(room.usage_notes)) {
    parsedNotes = room.usage_notes;
  } else if (typeof room.usage_notes === 'string') {
    parsedNotes = room.usage_notes.split('\n').filter(n => n.trim() !== '');
  }

  if (parsedNotes.length === 0) {
    // Fallback notes just to match the wireframe if DB is empty
    parsedNotes = [
      "Priority booking for academic classes",
      "Food allowed",
      "Not suitable for small group sessions"
    ];
  }

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

  const roomType = room.room_type || 'Lecture Hall';
  const typeDescription = roomTypeDescriptions[roomType] || 'Standard campus room.';

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Left Column */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-black">{room.name}</h1>
            <div className={`${statusColor} text-black px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm border`}>
              {todayStatus}
            </div>
          </div>

          <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-gray-100 aspect-[16/10] relative">
            {/* Using a solid placeholder image of a lecture hall similar to the wireframe */}
            <img
              src={room.image_url || "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1200&q=80"}
              alt={room.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="mt-2">
            <h2 className="text-[22px] font-bold text-black mb-4">Recommended Similar Rooms:</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {similarRooms.map(simRoom => (
                <div key={simRoom.id} className="border border-gray-300 rounded-2xl p-4 flex flex-col justify-between bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <h3 className="font-bold text-gray-900 text-[17px] mb-1">{simRoom.name}</h3>
                    <p className="text-[13px] text-gray-500">{simRoom.floor}{getOrdinalSuffix(simRoom.floor)} Floor</p>
                    <p className="text-[13px] text-gray-400 leading-tight">{simRoom.building_name}</p>
                  </div>
                  <div className="mt-5 self-end">
                    <Link to={`/rooms/${simRoom.id}`} className="bg-[#61B865] hover:bg-[#4cae4c] text-black px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 border border-[#4cae4c]/30">
                      View Room &rarr;
                    </Link>
                  </div>
                </div>
              ))}
              {similarRooms.length === 0 && (
                <div className="col-span-2 p-6 border border-gray-200 rounded-2xl text-center text-gray-500 bg-gray-50">
                  No similar rooms found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4">
          <div className="border border-gray-300 rounded-2xl p-6 lg:p-8 bg-white shadow-sm flex-1">

            {/* Room Type */}
            <div className="mb-7">
              <h2 className="text-[22px] font-bold text-black mb-1.5">{roomType}:</h2>
              <p className="text-gray-500 leading-relaxed text-[15px]">
                {typeDescription}
              </p>
            </div>

            {/* Capacity */}
            <div className="mb-7">
              <h2 className="text-[22px] font-bold text-black mb-1.5">Capacity:</h2>
              <p className="text-gray-500 text-[15px]">{room.capacity || 0} occupants</p>
            </div>

            {/* Location */}
            <div className="mb-7">
              <h2 className="text-[22px] font-bold text-black mb-1.5">Location:</h2>
              <p className="text-gray-500 text-[15px]">
                {room.building_name}, {room.floor}{getOrdinalSuffix(room.floor)} Floor.
              </p>
            </div>

            {/* Amenities */}
            <div className="mb-7">
              <h2 className="text-[22px] font-bold text-black mb-1.5">Amenities:</h2>
              <ul className="flex flex-col gap-2 mt-2">
                {parsedAmenities.length > 0 ? (
                  parsedAmenities.map((amenity, index) => (
                    <li key={index} className="flex items-center gap-2 text-gray-600 text-[15px] capitalize">
                      <CheckCircle2 className="w-5 h-5 text-[#61B865] shrink-0" />
                      {amenity.replace(/[-_]/g, ' ')}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500 text-[15px]">No amenities listed</li>
                )}
              </ul>
            </div>

            {/* Usage Notes */}
            <div>
              <h2 className="text-[22px] font-bold text-black mb-1.5">Usage Notes:</h2>
              <ul className="list-disc pl-5 text-gray-500 text-[15px] space-y-1">
                {parsedNotes.map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-end mt-4">
            <Link to={`/rooms/${id}/calendar`} className="bg-[#61B865] hover:bg-[#4cae4c] text-black font-medium py-2.5 px-5 rounded-lg shadow-sm transition-colors text-sm sm:text-base border border-[#4cae4c]/30">
              View Calendar
            </Link>
            <button className="bg-[#61B865] hover:bg-[#4cae4c] text-black font-medium py-2.5 px-5 rounded-lg shadow-sm transition-colors text-sm sm:text-base border border-[#4cae4c]/30">
              View Accessibility Info
            </button>
            <button className="bg-[#E67E22] hover:bg-[#d67118] text-black font-medium py-2.5 px-6 rounded-lg shadow-sm transition-colors text-sm sm:text-base border border-[#d67118]/30">
              Reserve This Room
            </button>
            <button className="bg-[#61B865] hover:bg-[#4cae4c] text-black font-medium py-2.5 px-5 rounded-lg shadow-sm transition-colors text-sm sm:text-base border border-[#4cae4c]/30">
              Add to Favorites
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RoomDetailPage;

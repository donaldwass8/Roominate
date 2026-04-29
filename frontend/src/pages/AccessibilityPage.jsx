import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRoomById } from '../services/roomService';
import { X } from 'lucide-react';

const getOrdinalSuffix = (i) => {
  if (!i) return '';
  const j = i % 10, k = i % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
};

const AccessibilityPage = () => {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoom = async () => {
      setLoading(true);
      try {
        const data = await getRoomById(id);
        setRoom(data);
      } catch (err) {
        console.error("Failed to fetch room", err);
      } finally {
        setLoading(false);
      }
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

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-black mb-4">Accessibility Information</h1>
      
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column (Cards) */}
        <div className="flex flex-col gap-5 w-full lg:w-[320px] shrink-0">
          {/* Room Card */}
          <div className="border border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm">
            <h2 className="text-lg font-bold text-center py-2 border-b border-gray-200">Room</h2>
            <div className="bg-[#f0f0f0] p-5 pb-8 min-h-[160px] flex flex-col justify-center">
              <h3 className="text-2xl font-medium text-gray-800 mb-1">{room.name}</h3>
              <p className="text-gray-600 mb-5 text-[15px]">{room.room_type || 'Lecture Hall'}</p>
              <p className="text-gray-600 text-[15px] leading-snug">
                {room.building_name}<br/>
                {room.floor}{getOrdinalSuffix(room.floor)} Floor
              </p>
            </div>
            <div className="p-3 border-t border-gray-200 bg-white">
              <Link to={`/rooms/${id}`} className="text-[#F58220] text-[15px] font-medium hover:underline flex items-center gap-1">
                View Room Details &rarr;
              </Link>
            </div>
          </div>
          
          {/* Need Help Card */}
          <div className="border border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm mt-1">
            <h2 className="text-lg font-bold text-center py-2 border-b border-gray-200">Need Help?</h2>
            <div className="p-5">
              <p className="text-[15px] font-medium text-gray-700 mb-2">Contact</p>
              <div className="border border-gray-300 rounded-xl p-4 bg-[#f0f0f0]">
                <p className="text-gray-800 font-medium mb-4 text-[15px]">AccessAbility Resource Center (ARC)</p>
                <p className="text-[15px] text-gray-700 mb-4">
                  Email:<br/>
                  <a href="mailto:accessability@utdallas.edu" className="italic hover:underline">accessability@utdallas.edu</a>
                </p>
                <p className="text-[15px] text-gray-700">
                  Phone:<br/>
                  <span className="italic">972-883-2098</span>
                </p>
              </div>
            </div>
            <div className="p-3 border-t border-gray-200 bg-white">
              <a href="#" className="text-[#F58220] text-[15px] font-medium hover:underline flex items-center gap-1">
                AccessAbility Resource Center (ARC) &rarr;
              </a>
            </div>
          </div>
        </div>

        {/* Right Column (Info) */}
        <div className="flex-1 border border-gray-300 rounded-xl bg-white shadow-sm flex flex-col w-full">
          <div className="p-6 lg:p-8 flex-1">
            <h2 className="text-[22px] font-bold text-black mb-6">Accessibility Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1.3fr_1fr] gap-6 lg:gap-10">
              {/* Features Column */}
              <div>
                <h3 className="font-bold text-[15px] text-black mb-2">Accessibility Features</h3>
                <div className="flex items-center gap-4 text-xs text-gray-600 mb-6 font-medium">
                  <span>Legend:</span>
                  <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#10B981]"></div> Available</span>
                  <span className="flex items-center gap-1.5"><X className="w-3.5 h-3.5 text-red-500" strokeWidth={4} /> Unavailable</span>
                </div>
                <ul className="space-y-4 text-[15px] text-gray-700 font-medium">
                  <li className="flex items-center gap-3"><X className="w-5 h-5 text-red-500 shrink-0" strokeWidth={4} /> Step-free access</li>
                  <li className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-[#10B981] mx-0.5 shrink-0"></div> Accessible entrance</li>
                  <li className="flex items-center gap-3"><X className="w-5 h-5 text-red-500 shrink-0" strokeWidth={4} /> Elevator access</li>
                  <li className="flex items-center gap-3"><X className="w-5 h-5 text-red-500 shrink-0" strokeWidth={4} /> Automatic door</li>
                  <li className="flex items-center gap-3"><X className="w-5 h-5 text-red-500 shrink-0" strokeWidth={4} /> Flexible seating</li>
                  <li className="flex items-center gap-3"><X className="w-5 h-5 text-red-500 shrink-0" strokeWidth={4} /> Movable furniture</li>
                  <li className="flex items-center gap-3"><X className="w-5 h-5 text-red-500 shrink-0" strokeWidth={4} /> Interior clearance</li>
                </ul>
              </div>

              {/* Temporary Issues Column */}
              <div>
                <h3 className="font-bold text-[15px] text-black mb-2">Temporary Accessibility Issues</h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600 mb-6 font-medium">
                  <span>Legend:</span>
                  <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-gray-300"></div> No issue</span>
                  <span className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#F58220"><polygon points="2,2 22,2 12,22" /></svg> 
                    Temporarily Experiencing Issue
                  </span>
                </div>
                <ul className="space-y-4 text-[15px] text-gray-600 font-medium">
                  <li className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-gray-300 mx-0.5 shrink-0"></div> Step-free access blocked/unavailable</li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#F58220"><polygon points="2,2 22,2 12,22" /></svg>
                    </div>
                    Accessible entrance blocked/unavailable
                  </li>
                  <li className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-gray-300 mx-0.5 shrink-0"></div> Elevator broken/unavailable</li>
                  <li className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-gray-300 mx-0.5 shrink-0"></div> Automatic door broken/unavailable</li>
                </ul>
              </div>

              {/* Comments Column */}
              <div className="flex flex-col">
                <h3 className="font-bold text-[15px] text-black mb-2">Comments/Instructions</h3>
                <div className="bg-[#f0f0f0] border border-gray-300 rounded-xl p-4 text-[15px] text-black flex-1 min-h-[220px]">
                  None
                </div>
                <div className="mt-5">
                  <p className="text-[13px] text-gray-700 mb-2 leading-snug font-medium">Is all information currently accurate and up-to-date?</p>
                  <button className="w-full bg-[#F58220] hover:bg-[#e07519] text-black font-semibold py-2.5 px-4 rounded-lg shadow-sm text-sm transition-colors border border-[#e07519]/30">
                    Submit Information Is Valid
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer Line */}
          <div className="bg-white border-t border-gray-200 p-4 px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between rounded-b-xl gap-3">
            <p className="text-sm font-bold text-black">Last Verified: <span className="font-medium text-black">9:52:07 AM - 3/5/26</span></p>
            <p className="text-[13px] font-medium text-black">
              Is something not right? Submit an <Link to={`/rooms/${id}/accessibility-report`} className="text-[#F58220] hover:underline">Inaccurate Accessibility Information Report &rarr;</Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AccessibilityPage;

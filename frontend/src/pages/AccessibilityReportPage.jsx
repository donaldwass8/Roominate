import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getRoomById } from '../services/roomService';
import toast from 'react-hot-toast';

const getOrdinalSuffix = (i) => {
  if (!i) return '';
  const j = i % 10, k = i % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
};

// Checkbox Component to match the wireframe style
const CustomCheckbox = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-3 cursor-pointer group">
    <div className="relative flex items-center justify-center w-[18px] h-[18px]">
      <input
        type="checkbox"
        className="peer appearance-none w-full h-full border border-gray-300 rounded-[3px] bg-white checked:bg-white checked:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-200 transition-all cursor-pointer"
        checked={checked}
        onChange={onChange}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-checked:opacity-100">
        <div className="w-2.5 h-2.5 rounded-full bg-gray-600"></div>
      </div>
    </div>
    <span className="text-[14px] text-gray-700 font-medium group-hover:text-gray-900 transition-colors">{label}</span>
  </label>
);

const AccessibilityReportPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastVerifiedDate, setLastVerifiedDate] = useState('9:52:07 AM - 3/5/26');

  // Form State
  const [features, setFeatures] = useState({
    stepFree: false,
    accessibleEntrance: true,
    elevator: false,
    automaticDoor: false,
    flexibleSeating: false,
    movableFurniture: false,
    interiorClearance: false,
    other: false,
  });

  const [issues, setIssues] = useState({
    stepFreeBlocked: false,
    accessibleEntranceBlocked: true,
    elevatorBroken: false,
    automaticDoorBroken: false,
    other: false,
  });

  const [instructions, setInstructions] = useState('');
  const [comments, setComments] = useState('');

  useEffect(() => {
    const fetchRoom = async () => {
      setLoading(true);
      try {
        const data = await getRoomById(id);
        setRoom(data);
        if (data && data.accessibility_last_verified) {
          setLastVerifiedDate(data.accessibility_last_verified);
        }
      } catch (err) {
        console.error("Failed to fetch room", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success("Accessibility report submitted successfully.");
    navigate(`/rooms/${id}/accessibility`);
  };

  const handleCancel = () => {
    navigate(`/rooms/${id}/accessibility`);
  };

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
      <h1 className="text-2xl sm:text-3xl font-extrabold text-black mb-4">Inaccurate Accessibility Information Report</h1>
      
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
            <div className="p-3 border-t border-gray-200 bg-white text-left">
              <Link to={`/rooms/${id}`} className="text-[#F58220] text-[15px] font-medium hover:underline flex items-center gap-1">
                View Room Details &rarr;
              </Link>
            </div>
          </div>
          
          {/* Accessibility History Card */}
          <div className="border border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm mt-1">
            <h2 className="text-lg font-bold text-center py-2 border-b border-gray-200">Accessibility History</h2>
            <div className="bg-[#f0f0f0] p-5 flex flex-col min-h-[200px]">
              <div className="mb-6">
                <p className="text-[15px] font-bold text-black mb-0.5">Accessibility Information</p>
                <p className="text-[14px] text-gray-700">None</p>
              </div>
              <div>
                <p className="text-[15px] font-bold text-black mb-0.5">Last Verified Date</p>
                <p className="text-[14px] text-gray-700">{lastVerifiedDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Form) */}
        <div className="flex-1 border border-gray-300 rounded-xl bg-white shadow-sm flex flex-col w-full">
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="p-6 lg:p-8 flex-1">
              <h2 className="text-[22px] font-bold text-black mb-6">Accessibility Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1.3fr_1fr] gap-6 lg:gap-8">
                {/* Features Column */}
                <div>
                  <h3 className="font-bold text-[15px] text-black mb-3">Accessibility Features</h3>
                  <p className="text-[13px] text-gray-600 mb-6">Select all that apply:</p>
                  
                  <div className="flex flex-col gap-4">
                    <CustomCheckbox 
                      label="Step-free access" 
                      checked={features.stepFree} 
                      onChange={(e) => setFeatures({...features, stepFree: e.target.checked})} 
                    />
                    <CustomCheckbox 
                      label="Accessible entrance" 
                      checked={features.accessibleEntrance} 
                      onChange={(e) => setFeatures({...features, accessibleEntrance: e.target.checked})} 
                    />
                    <CustomCheckbox 
                      label="Elevator access" 
                      checked={features.elevator} 
                      onChange={(e) => setFeatures({...features, elevator: e.target.checked})} 
                    />
                    <CustomCheckbox 
                      label="Automatic door" 
                      checked={features.automaticDoor} 
                      onChange={(e) => setFeatures({...features, automaticDoor: e.target.checked})} 
                    />
                    <CustomCheckbox 
                      label="Flexible seating" 
                      checked={features.flexibleSeating} 
                      onChange={(e) => setFeatures({...features, flexibleSeating: e.target.checked})} 
                    />
                    <CustomCheckbox 
                      label="Movable furniture" 
                      checked={features.movableFurniture} 
                      onChange={(e) => setFeatures({...features, movableFurniture: e.target.checked})} 
                    />
                    <CustomCheckbox 
                      label="Interior clearance" 
                      checked={features.interiorClearance} 
                      onChange={(e) => setFeatures({...features, interiorClearance: e.target.checked})} 
                    />
                    <CustomCheckbox 
                      label="Other (specify in comment)" 
                      checked={features.other} 
                      onChange={(e) => setFeatures({...features, other: e.target.checked})} 
                    />
                  </div>
                </div>

                {/* Temporary Issues Column */}
                <div>
                  <h3 className="font-bold text-[15px] text-black mb-3">Temporary Accessibility Issues</h3>
                  <p className="text-[13px] text-gray-600 mb-6">Select all that apply:</p>
                  
                  <div className="flex flex-col gap-4">
                    <CustomCheckbox 
                      label="Step-free access blocked/unavailable" 
                      checked={issues.stepFreeBlocked} 
                      onChange={(e) => setIssues({...issues, stepFreeBlocked: e.target.checked})} 
                    />
                    <CustomCheckbox 
                      label="Accessible entrance blocked/unavailable" 
                      checked={issues.accessibleEntranceBlocked} 
                      onChange={(e) => setIssues({...issues, accessibleEntranceBlocked: e.target.checked})} 
                    />
                    <CustomCheckbox 
                      label="Elevator broken/unavailable" 
                      checked={issues.elevatorBroken} 
                      onChange={(e) => setIssues({...issues, elevatorBroken: e.target.checked})} 
                    />
                    <CustomCheckbox 
                      label="Automatic door broken/unavailable" 
                      checked={issues.automaticDoorBroken} 
                      onChange={(e) => setIssues({...issues, automaticDoorBroken: e.target.checked})} 
                    />
                    <CustomCheckbox 
                      label="Other (specify in comment)" 
                      checked={issues.other} 
                      onChange={(e) => setIssues({...issues, other: e.target.checked})} 
                    />
                  </div>
                </div>

                {/* Comments Column */}
                <div className="flex flex-col gap-5">
                  <div>
                    <h3 className="font-bold text-[15px] text-black mb-2">Comments/Instructions</h3>
                    <div className="bg-[#f0f0f0] border border-gray-300 rounded-xl p-3 text-[14px] text-black min-h-[60px]">
                      None
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-[13px] text-gray-700 mb-1">Type additional instructions below:</label>
                    <textarea 
                      className="w-full bg-[#f0f0f0] border border-gray-300 rounded-xl p-3 text-[14px] text-black min-h-[140px] resize-none focus:outline-none focus:ring-2 focus:ring-[#F58220] transition-shadow placeholder-gray-400"
                      placeholder="Start typing here..."
                      maxLength={500}
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                    ></textarea>
                    <div className="absolute bottom-2 right-3 text-[11px] text-gray-400">
                      {instructions.length}/500
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-[13px] text-gray-700 mb-1">Type additional comments below:</label>
                    <textarea 
                      className="w-full bg-[#f0f0f0] border border-gray-300 rounded-xl p-3 text-[14px] text-black min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-[#F58220] transition-shadow placeholder-gray-400"
                      placeholder="Start typing here..."
                      maxLength={250}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                    ></textarea>
                    <div className="absolute bottom-2 right-3 text-[11px] text-gray-400">
                      {comments.length}/250
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-white border-t border-gray-200 p-4 px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between rounded-b-xl gap-4">
              <p className="text-[14px] font-medium text-gray-800">Date: 1:27:49 PM - 3/6/26</p>
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <button 
                  type="submit"
                  className="bg-[#F58220] hover:bg-[#e07519] text-white font-medium py-2 px-8 rounded-lg shadow-sm text-sm transition-colors border border-[#e07519]/30"
                >
                  Submit
                </button>
                <button 
                  type="button"
                  onClick={handleCancel}
                  className="bg-[#e5e7eb] hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded-lg shadow-sm text-sm transition-colors border border-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default AccessibilityReportPage;

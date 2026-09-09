import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getReservationById } from '../services/reservationService';
import toast from 'react-hot-toast';

// Mock deterministic names for UI consistency
const MOCK_NAMES = [
  "John Doe", "Alice Smith", "Michael Ross", "Sarah Lee", 
  "David Kim", "Emily Chen", "James Wilson", "Olivia Taylor",
  "Robert Brown", "Sophia Davis", "William Miller", "Mia Garcia"
];

const getDeterministicName = (userId) => {
  if (!userId) return MOCK_NAMES[0];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return MOCK_NAMES[Math.abs(hash) % MOCK_NAMES.length];
};

const getOrdinalSuffix = (i) => {
  if (!i) return '';
  const j = i % 10, k = i % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
};

const CardSection = ({ title, value }) => (
  <div className="mb-4 last:mb-0">
    <h3 className="font-bold text-[14px] text-gray-900 mb-0.5">{title}</h3>
    <div className="text-[14px] text-gray-700 leading-snug whitespace-pre-line">{value}</div>
  </div>
);

const Card = ({ title, children, editLink, onPlaceholderClick, className = "", footerContent }) => (
  <div className={`border border-gray-300 rounded-xl bg-white shadow-sm flex flex-col overflow-hidden ${className}`}>
    <h2 className="text-[17px] font-bold text-center py-2.5 border-b border-gray-200 bg-white text-gray-900">{title}</h2>
    <div className="p-4 flex-1 flex flex-col bg-[#f9fafb]">
      {children}
    </div>
    {editLink && !footerContent && (
      <div className="p-2 border-t border-gray-200 bg-white text-right">
        <button onClick={onPlaceholderClick} className="text-[#F58220] text-sm font-medium hover:underline">
          {editLink}
        </button>
      </div>
    )}
    {footerContent && (
      <div className="p-2 border-t border-gray-200 bg-white flex justify-between items-center">
        {footerContent}
        {editLink && (
          <button onClick={onPlaceholderClick} className="text-[#F58220] text-sm font-medium hover:underline">
            {editLink}
          </button>
        )}
      </div>
    )}
  </div>
);

const AdminBookingDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);

  const handlePlaceholderClick = () => {
    toast("This feature is not implemented in this prototype.", { icon: "ℹ️" });
  };

  useEffect(() => {
    const fetchRes = async () => {
      setLoading(true);
      try {
        if (typeof getReservationById === 'function') {
           const data = await getReservationById(id);
           if (data) setReservation(data);
        }
      } catch(e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchRes();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-orange"></div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="p-8 text-center text-gray-500 min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Booking details could not be found.</h2>
        <button onClick={() => navigate('/history')} className="text-primary-orange hover:underline">Return to Booking History</button>
      </div>
    );
  }

  const userName = getDeterministicName(reservation.user_id);
  const dateFormatted = reservation.start_time ? new Date(reservation.start_time).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not provided';
  const timeStartStr = reservation.start_time ? new Date(reservation.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'Not provided';
  const timeEndStr = reservation.end_time ? new Date(reservation.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'Not provided';

  // Prototype Fallbacks for UI completeness
  const mockFloor = 1;
  const mockRoomType = 'Lecture Hall';
  
  let formattedAmenities = 'Not provided';
  if (reservation.amenities && reservation.amenities.length > 0) {
    formattedAmenities = (
      <ul className="list-none space-y-0.5">
        {reservation.amenities.map((am, i) => <li key={i}>{am}</li>)}
      </ul>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto pb-12">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-black">Booking Information</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Column 1 */}
        <div className="flex flex-col gap-6">
          <Card 
            title="Room Details" 
            editLink="Edit"
            onPlaceholderClick={handlePlaceholderClick}
            footerContent={
              <div className="flex flex-col gap-1 text-sm text-[#F58220] font-medium w-full px-1">
                <Link to={`/rooms/${reservation.room_id}`} className="hover:underline text-left">View Room Details &rarr;</Link>
                <Link to={`/rooms/${reservation.room_id}/calendar`} className="hover:underline text-left">View Room Calendar &rarr;</Link>
              </div>
            }
          >
            <CardSection title="Name" value={`${reservation.room_name} ${mockRoomType}`} />
            <div className="text-[14px] text-gray-700 leading-snug mb-4 -mt-3">
              {reservation.building_name || 'Not provided'}<br />
              {mockFloor}{getOrdinalSuffix(mockFloor)} Floor
            </div>
            
            <CardSection title="Capacity" value={reservation.capacity ? `${reservation.capacity} Occupants` : 'Not provided'} />
            <CardSection title="Amenities" value={formattedAmenities} />
            <CardSection title="Usage Notes" value={reservation.usage_notes || 'Not provided'} />
          </Card>

          <Card title="Booked By / For" editLink="Edit" onPlaceholderClick={handlePlaceholderClick}>
            <CardSection title="Booked By" value={userName} />
            <CardSection title="Booked For" value={userName} />
            <CardSection title="Department" value="Computer Science" />
            <CardSection title="On-Behalf Reason" value="Self-booked" />
          </Card>
        </div>

        {/* Column 2 */}
        <div className="flex flex-col gap-6">
          <Card title="Reservation Details" editLink="Edit" onPlaceholderClick={handlePlaceholderClick} className="h-full">
            <CardSection title="Reservation ID" value={reservation.room_code || reservation.id} />
            <CardSection title="Status" value={reservation.status ? reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1) : 'Not provided'} />
            <CardSection title="Date" value={dateFormatted} />
            
            <div className="mb-4">
              <h3 className="font-bold text-[14px] text-gray-900 mb-0.5">Start Time</h3>
              <div className="text-[14px] text-gray-700 leading-snug">{timeStartStr}</div>
              <h3 className="font-bold text-[14px] text-gray-900 mt-2 mb-0.5">End Time</h3>
              <div className="text-[14px] text-gray-700 leading-snug">{timeEndStr}</div>
            </div>

            <CardSection title="Purpose" value={reservation.purpose || 'Not provided'} />
            <CardSection title="Hosting Organization" value={reservation.organizer_name || 'Not provided'} />
            <CardSection title="Recurring" value="No" />
            <CardSection title="Preferred Notification Method" value="Email" />
          </Card>
        </div>

        {/* Column 3 */}
        <div className="flex flex-col gap-6">
          <Card title="Access / Rules" editLink="Edit" onPlaceholderClick={handlePlaceholderClick}>
            <CardSection title="Authorized Only" value="No" />
            <CardSection title="Allowed Departments" value="All" />
            <CardSection title="Allowed Roles" value="All" />
            <CardSection title="Allowed Groups" value="All" />
            <CardSection title="Booking Rules" value="None" />
          </Card>

          <Card title="Pending Overrides">
            <CardSection title="Pending Overrides" value="None" />
            <CardSection title="Pending Override Reason" value="N/A" />
          </Card>

          <Card title="Override Used">
            <CardSection title="Override Used" value="None" />
            <CardSection title="Override Reason" value="N/A" />
          </Card>

          <button 
            onClick={handlePlaceholderClick}
            className="w-full bg-[#F58220] hover:bg-[#e07519] text-white font-bold py-3.5 px-4 rounded-xl shadow-sm text-[15px] transition-colors border border-[#e07519]/30"
          >
            Override Booking Rule
          </button>
        </div>

        {/* Column 4 */}
        <div className="flex flex-col gap-6">
          <Card title="Accessibility / Notes" editLink="Edit" onPlaceholderClick={handlePlaceholderClick}>
            <CardSection title="Accessibility Features" value="None" />
            <CardSection title="Last Verified Date" value="9:52:07 AM - 3/5/26" />
            <CardSection title="Room Instructions/Notes" value="None" />
          </Card>

          <Card 
            title="Audit / Activity" 
            footerContent={
              <div className="w-full text-right px-1">
                 <button onClick={handlePlaceholderClick} className="text-[#F58220] text-sm font-medium hover:underline">View Full Audit Log</button>
              </div>
            }
          >
            <CardSection title="Created By" value={<>{userName}<br/>2:15:43 PM - 3/1/26</>} />
            <CardSection title="Last Updated By" value={<>{userName}<br/>2:15:43 PM - 3/1/26</>} />
            <CardSection title="Action History" value="Last Action: 2:15:43 PM - 3/1/26" />
          </Card>

          <button 
            onClick={() => navigate('/history')}
            className="w-full bg-[#e5e7eb] hover:bg-gray-300 text-gray-800 font-semibold py-3.5 px-4 rounded-xl shadow-sm text-[15px] transition-colors border border-gray-300 mt-auto"
          >
            Return to Booking History
          </button>
        </div>

      </div>
    </div>
  );
};

export default AdminBookingDetailsPage;

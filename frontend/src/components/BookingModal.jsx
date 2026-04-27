import React, { useState } from 'react';
import { X, Calendar as CalIcon, Clock, CheckCircle, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { createReservation } from '../services/reservationService';
import { sendBookingConfirmationSms } from '../services/notificationService';

const BookingModal = ({ room, onClose, onConfirm }) => {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [purpose, setPurpose] = useState('Study Session');
  const [organizer, setOrganizer] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [sendTextReminders, setSendTextReminders] = useState(true);
  const [sendEmailConfirmation, setSendEmailConfirmation] = useState(true);
  const [loading, setLoading] = useState(false);

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

  const getTodayString = () => new Date().toISOString().split('T')[0];

  const handleBook = async () => {
    if (!date) {
      toast.error("Please select a date.");
      return;
    }
    
    // Check if time is in the past
    // Note: ISO 8601 parser natively handles this format properly in modern JS
    const startDateTime = new Date(`${date}T${startTime}:00`);
    if (startDateTime < new Date()) {
      toast.error("Cannot book a time in the past.");
      return;
    }
    
    if (startTime >= endTime) {
      toast.error("End time must be after start time.");
      return;
    }

    setLoading(true);
    // Hardcoded user ID as per instruction
    const result = await createReservation("a0000000-0000-0000-0000-000000000001", room.id, `${date} ${startTime}`, `${date} ${endTime}`, purpose, organizer);
    setLoading(false);
    
    if (result.success) {
      toast.success(
        <div className="flex gap-2 items-center">
          <CheckCircle className="text-green-500 w-5 h-5" />
          <span>Room booked successfully!</span>
        </div>
      );

      // Send SMS confirmation if enabled and phone number was provided
      if (sendTextReminders && phone.trim()) {
        const dateObj = new Date(`${date}T${startTime}:00`);
        const endObj  = new Date(`${date}T${endTime}:00`);
        const dateStr = dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
        const startStr = dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        const endStr   = endObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

        sendBookingConfirmationSms({
          phone: phone.trim(),
          roomName: room.name,
          building: room.building_name,
          date: dateStr,
          startTime: startStr,
          endTime: endStr,
        }).then(smsResult => {
          if (smsResult.success) {
            toast.success('📱 SMS confirmation sent!', { duration: 3000 });
          }
          // Silently ignore SMS failures — booking already succeeded
        });
      }

      if (onConfirm) onConfirm();
      onClose();
    } else {
      toast.error(result.error || "Failed to book room.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900">Book Room</h2>
          <p className="text-sm font-medium text-primary-orange mt-1">
            {room.name} <span className="text-gray-400 font-normal ml-1">• {room.building_name}</span>
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <CalIcon className="w-4 h-4 text-gray-400" /> Date
            </label>
            <input 
              type="date" 
              min={getTodayString()}
              className="w-full h-10 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-primary-orange outline-none transition-shadow text-sm"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-400" /> Start Time
              </label>
              <select 
                className="w-full h-10 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-primary-orange outline-none transition-shadow text-sm bg-white"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              >
                {generateTimeOptions().map(time => <option key={time.value} value={time.value}>{time.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-400" /> End Time
              </label>
              <select 
                className="w-full h-10 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-primary-orange outline-none transition-shadow text-sm bg-white"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              >
                {generateTimeOptions().map(time => <option key={time.value} value={time.value}>{time.label}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                Booking Purpose
              </label>
              <select 
                className="w-full h-10 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-primary-orange outline-none transition-shadow text-sm bg-white"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              >
                <option value="Study Session">Study Session</option>
                <option value="Student Org.">Student Org.</option>
                <option value="Workshop">Workshop</option>
                <option value="Tutoring">Tutoring</option>
                <option value="Interview">Interview</option>
                <option value="Meeting">Meeting</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                Organization/Host
              </label>
              <input 
                type="text" 
                placeholder="Organizer Name"
                className="w-full h-10 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-primary-orange outline-none transition-shadow text-sm"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
              />
            </div>

            <div className="pt-2 border-t border-gray-100">
              <label className="block text-sm font-bold text-gray-800 mb-3">Notification Preferences</label>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-primary-orange focus:ring-primary-orange" 
                      checked={sendEmailConfirmation}
                      onChange={(e) => setSendEmailConfirmation(e.target.checked)}
                    />
                    Email confirmation
                  </label>
                  {sendEmailConfirmation && (
                    <div className="relative animate-in fade-in slide-in-from-top-1 duration-200">
                      <input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-9 px-9 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-primary-orange outline-none transition-shadow text-sm"
                      />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-primary-orange focus:ring-primary-orange" 
                      checked={sendTextReminders}
                      onChange={(e) => setSendTextReminders(e.target.checked)}
                    />
                    Text reminders
                  </label>
                  {sendTextReminders && (
                    <div className="relative animate-in fade-in slide-in-from-top-1 duration-200">
                      <input
                        type="tel"
                        placeholder="+1 555 000 0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-9 px-9 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-primary-orange outline-none transition-shadow text-sm"
                      />
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 pt-2 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
          <button 
            onClick={onClose}
            className="px-5 py-2 font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleBook}
            disabled={loading}
            className="px-6 py-2 bg-primary-orange hover:bg-[#A84A0E] text-white rounded-lg font-medium shadow-sm hover:shadow transition-all disabled:opacity-70 flex items-center gap-2"
          >
            {loading ? <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" /> : null}
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;

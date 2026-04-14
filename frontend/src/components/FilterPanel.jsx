import React, { useState } from 'react';
import { Calendar, Clock, Users, SlidersHorizontal, Check } from 'lucide-react';

const FilterPanel = ({ onFilterChange, onClearFilters }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [capacity, setCapacity] = useState('any');
  const [amenities, setAmenities] = useState([]);

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

  const handleApply = () => {
    onFilterChange({
      date,
      startTime,
      endTime,
      capacity: capacity === 'any' ? null : parseInt(capacity, 10),
      amenities
    });
  };

  const toggleAmenity = (am) => {
    setAmenities(prev =>
      prev.includes(am) ? prev.filter(x => x !== am) : [...prev, am]
    );
  };

  const handleClear = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setStartTime('08:00');
    setEndTime('09:00');
    setCapacity('any');
    setAmenities([]);
    onClearFilters();
  };

  return (
    <div className="bg-white border-t border-gray-100 p-5 shadow-inner mt-2 -mx-4 sm:mx-0 sm:rounded-b-2xl animate-in slide-in-from-top-4 duration-200">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {/* Time & Date */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
            <Calendar className="w-4 h-4 text-primary-orange" /> Date & Time
          </h4>
          <div>
            <input type="date" min={getTodayString()} value={date} onChange={e => setDate(e.target.value)} className="w-full text-sm border-gray-200 rounded-lg h-9 px-3 focus:ring-primary-orange focus:border-primary-orange bg-gray-50" />
          </div>
          <div className="flex gap-2">
            <select value={startTime} onChange={e => setStartTime(e.target.value)} className="w-1/2 text-sm border-gray-200 rounded-lg h-9 px-2 focus:ring-primary-orange bg-gray-50">
              {generateTimeOptions().map(t => <option key={`start-${t.value}`} value={t.value}>{t.label}</option>)}
            </select>
            <span className="self-center text-gray-400">to</span>
            <select value={endTime} onChange={e => setEndTime(e.target.value)} className="w-1/2 text-sm border-gray-200 rounded-lg h-9 px-2 focus:ring-primary-orange bg-gray-50">
               {generateTimeOptions().map(t => <option key={`end-${t.value}`} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        {/* Capacity */}
        <div className="space-y-4">
           <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
             <Users className="w-4 h-4 text-primary-orange" /> Capacity
           </h4>
           <div className="flex flex-wrap gap-2">
             {['any', '2+', '4+', '6+', '8+'].map(cap => (
               <label key={cap} className={`cursor-pointer px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${capacity === (cap === 'any' ? 'any' : cap.replace('+', '')) ? 'bg-primary-orange border-primary-orange text-white shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                 <input type="radio" className="hidden" name="capacity" value={cap === 'any' ? 'any' : cap.replace('+', '')} checked={capacity === (cap === 'any' ? 'any' : cap.replace('+', ''))} onChange={e => setCapacity(e.target.value)} />
                 {cap === 'any' ? 'Any size' : cap}
               </label>
             ))}
           </div>
        </div>

        {/* Amenities */}
        <div className="space-y-4">
           <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
             <SlidersHorizontal className="w-4 h-4 text-primary-orange" /> Amenities
           </h4>
           <div className="grid grid-cols-2 gap-2">
             {['Whiteboard', 'Projector', 'Outlets', 'TV'].map(am => {
               const active = amenities.includes(am);
               return (
                 <label key={am} className={`cursor-pointer flex items-center gap-2 px-3 py-2 rounded-md text-sm border transition-colors ${active ? 'bg-orange-50 border-orange-200 text-orange-900' : 'bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100'}`}>
                   <input type="checkbox" className="hidden" checked={active} onChange={() => toggleAmenity(am)} />
                   <div className={`w-4 h-4 rounded border flex items-center justify-center ${active ? 'bg-primary-orange border-primary-orange' : 'bg-white border-gray-300'}`}>
                     {active && <Check className="w-3 h-3 text-white" />}
                   </div>
                   {am}
                 </label>
               );
             })}
           </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-3 max-w-5xl mx-auto">
         <button onClick={handleClear} className="px-5 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
           Clear Filters
         </button>
         <button onClick={handleApply} className="px-6 py-2 text-sm font-bold text-white bg-dark-green hover:bg-[#0e3324] rounded-lg shadow-sm hover:shadow transition-all">
           Apply Filters
         </button>
      </div>
    </div>
  );
};

export default FilterPanel;

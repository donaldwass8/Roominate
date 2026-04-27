import React, { useState } from 'react';
import { Sparkles, Loader2, Play, ArrowRight } from 'lucide-react';

const AiAssistant = () => {
  const [aiQuery, setAiQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);

  const handleAiSubmit = (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    
    setIsAiLoading(true);
    setAiResponse(null);
    
    // Fake mock delay for UI preview
    setTimeout(() => {
      setIsAiLoading(false);
      setAiResponse({
        recommendations: [
          { room: "ECSW 2.323", building: "Engineering West", capacity: 60, reason: "Matches capacity perfectly. Currently 0% booked this Friday." },
          { room: "LIB 4.400", building: "Library", capacity: 45, reason: "Available after 3 PM. Includes a projector and strong Wi-Fi suitable for a hackathon or large event." }
        ]
      });
    }, 2000);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-xl shadow-sm border border-indigo-100 p-6 relative overflow-hidden transition-all">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      <div className="relative z-10 flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-1/3">
          <div className="flex items-center space-x-2 mb-2">
            <div className="p-1.5 bg-indigo-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Room Booking Assistant</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Powered by <span className="font-semibold text-indigo-700">Gemini</span>. Describe what kind of room you need, and AI will analyze live campus availability to find the perfect fit.
          </p>
        </div>

        <div className="w-full lg:w-2/3 flex flex-col justify-center">
          <form onSubmit={handleAiSubmit} className="relative">
            <input 
              type="text" 
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="e.g. I need a room for 5 people to study quietly tomorrow at 2 PM..." 
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
  );
};

export default AiAssistant;

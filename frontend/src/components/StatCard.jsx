import React from 'react';

const StatCard = ({ label, value, loading }) => {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-start justify-center hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="text-gray-500 text-sm font-medium mb-1 z-10">{label}</div>
      <div className="text-3xl font-bold text-dark-green tracking-tight z-10">
        {loading || value === null ? <span className="text-gray-300">—</span> : value}
      </div>
      <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-primary-orange/5 rounded-full scale-50 group-hover:scale-150 transition-transform duration-500 rounded-tl-3xl z-0" />
    </div>
  );
};

export default StatCard;

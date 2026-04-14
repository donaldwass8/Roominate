import React from 'react';
import { useParams } from 'react-router-dom';

const RoomDetailPage = () => {
  const { id } = useParams();
  return (
    <div className="p-4 bg-white rounded shadow text-center">
      <h1 className="text-2xl font-bold mb-2">Room Details</h1>
      <p className="text-gray-500">Viewing stub for Room ID: {id}</p>
    </div>
  );
};

export default RoomDetailPage;

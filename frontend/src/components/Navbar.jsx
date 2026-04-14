import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, User } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav className="w-full bg-primary-orange h-12 flex items-center px-4 sm:px-6 lg:px-8 shadow-md sticky top-0 z-50">
      {/* Left: Logo & Links */}
      <div className="flex items-center space-x-6 shrink-0">
        <Link to="/" className="text-white font-bold text-lg tracking-wide hover:opacity-90 transition-opacity">
          Roominate
        </Link>
        <div className="hidden md:flex space-x-4">
          <Link to="/" className="text-white/90 text-sm hover:text-white transition-colors">Home</Link>
          <Link to="/reservations" className="text-white/90 text-sm hover:text-white transition-colors">My Bookings</Link>
        </div>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-lg mx-auto px-4 hidden sm:block">
        <form onSubmit={handleSearch} className="relative w-full">
          <input
            type="text"
            className="w-full h-8 pl-10 pr-4 rounded-full text-sm outline-none focus:ring-2 focus:ring-white/50 bg-white/10 text-white placeholder-white/70 transition-all"
            placeholder="Search rooms, buildings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-2 w-4 h-4 text-white/70" />
        </form>
      </div>

      {/* Right: Profile */}
      <div className="flex items-center space-x-4 shrink-0 text-white">
        <button className="hover:bg-white/10 p-1.5 rounded-full transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-400 rounded-full border border-primary-orange"></span>
        </button>
        <div className="flex items-center space-x-2 pl-2 border-l border-white/20">
          <span className="text-sm font-medium hidden sm:block cursor-pointer hover:opacity-80">Admin</span>
          <button className="bg-white/20 p-1 rounded-full hover:bg-white/30 transition-colors">
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

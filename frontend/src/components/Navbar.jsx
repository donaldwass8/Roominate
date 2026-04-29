import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, User, ChevronDown } from 'lucide-react';
import { useRole } from '../context/RoleContext';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { role, setRole } = useRole();
  const { user, signOut } = useAuth();
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

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
          <Link to="/reservations" className="text-white/90 text-sm hover:text-white transition-colors">My Reservations</Link>
          {role === 'admin' && (
            <>
              <Link to="/utilization" className="text-white/90 text-sm hover:text-white transition-colors">Utilization</Link>
              <Link to="/restore" className="text-white/90 text-sm hover:text-white transition-colors">Restore</Link>
            </>
          )}
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
        {user ? (
          <>
            <button className="hover:bg-white/10 p-1.5 rounded-full transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-400 rounded-full border border-primary-orange"></span>
            </button>
            <div className="flex items-center space-x-2 pl-2 border-l border-white/20">
              <div className="relative">
                <button 
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className="hidden sm:flex items-center space-x-1 text-sm font-medium hover:opacity-80 transition-opacity outline-none"
                >
                  <span className="capitalize">{role}</span>
                  <ChevronDown className="w-4 h-4 ml-0.5 opacity-80" />
                </button>
                
                {isRoleDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsRoleDropdownOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-3 w-40 bg-white rounded-lg shadow-xl py-1 z-50 text-gray-800 border border-gray-100">
                      <button
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${role === 'student' ? 'font-semibold bg-gray-50' : 'text-gray-600'}`}
                        onClick={() => {
                          setRole('student');
                          setIsRoleDropdownOpen(false);
                        }}
                      >
                        View as Student
                      </button>
                      <button
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${role === 'admin' ? 'font-semibold bg-gray-50' : 'text-gray-600'}`}
                        onClick={() => {
                          setRole('admin');
                          setIsRoleDropdownOpen(false);
                        }}
                      >
                        View as Admin
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button 
                onClick={async () => {
                  await signOut();
                  navigate('/login');
                }}
                className="bg-white/20 p-1.5 px-3 text-sm font-medium rounded-full hover:bg-white/30 transition-colors flex items-center space-x-1"
                title="Log Out"
              >
                <span>Log out</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center space-x-4 text-sm font-medium">
            <Link to="/login" className="hover:text-white/80 transition-colors">Log in</Link>
            <Link to="/signup" className="bg-white text-primary-orange px-4 py-1.5 rounded-full hover:bg-gray-100 transition-colors shadow-sm">Sign up</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

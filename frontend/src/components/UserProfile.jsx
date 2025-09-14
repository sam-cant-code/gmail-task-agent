import React, { useState, useRef, useEffect } from 'react';
import useAuthStore from '../stores/authStore';

const UserProfile = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-3 bg-gray-700/80 backdrop-blur-md border border-gray-600 rounded-xl px-3 py-2 hover:bg-gray-700 hover:border-gray-500 transition-all duration-200 group shadow-lg"
      >
        <img
          src={user.picture}
          alt={user.name}
          className="w-8 h-8 rounded-lg ring-2 ring-gray-500 group-hover:ring-blue-400 transition-all"
        />
        <div className="hidden md:block text-left">
          <div className="font-medium text-white text-sm">{user.name}</div>
          <div className="text-xs text-gray-400">{user.email}</div>
        </div>
        <svg 
          className={`w-4 h-4 text-gray-400 group-hover:text-white transition-all duration-200 ${showDropdown ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 backdrop-blur-xl border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
          <div className="p-4 bg-gradient-to-br from-blue-600 to-blue-700">
            <div className="flex items-center gap-3">
              <img
                src={user.picture}
                alt={user.name}
                className="w-12 h-12 rounded-lg ring-2 ring-white/30 shadow-lg flex-shrink-0"
              />
              <div className="text-white min-w-0 flex-1">
                <div className="text-sm font-semibold text-white truncate">{user.name}</div>
                <div className="text-xs text-blue-100 truncate">{user.email}</div>
              </div>
            </div>
          </div>
          
          <div className="p-2">
            <button 
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-900/30 hover:text-red-300 rounded-lg transition-colors group text-sm font-medium"
            >
              <div className="w-7 h-7 rounded-lg bg-red-900/30 group-hover:bg-red-800/40 flex items-center justify-center transition-colors flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-red-400 group-hover:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
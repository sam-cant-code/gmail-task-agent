import React from 'react';
import useAuthStore from '../stores/authStore';

const UserProfile = () => {
  // ✅ Correctly select individual state slices to prevent re-render loops
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  if (!user) return null;

  return (
    <div className="flex items-center space-x-4">
      <img
        src={user.picture}
        alt={user.name}
        className="w-10 h-10 rounded-full"
      />
      <div className="text-right">
        <div className="font-semibold text-gray-800">{user.name}</div>
        <div className="text-sm text-gray-500">{user.email}</div>
      </div>
      <button
        onClick={logout}
        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        Logout
      </button>
    </div>
  );
};

export default UserProfile;
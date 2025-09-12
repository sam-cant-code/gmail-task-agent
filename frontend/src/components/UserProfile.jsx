import React from 'react';
import useAuthStore from '../stores/authStore';

const UserProfile = () => {
  // ✅ Correctly select individual state slices to prevent re-render loops
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  if (!user) return null;

  return (
    <div className="user-profile">
      <img src={user.picture} alt={user.name} className="user-avatar" />
      <div className="user-details">
        <span className="user-name">{user.name}</span>
        <span className="user-email">{user.email}</span>
      </div>
      <button onClick={logout} className="logout-btn">
        Logout
      </button>
    </div>
  );
};

export default UserProfile;
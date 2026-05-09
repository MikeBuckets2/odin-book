import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usersApi } from '../api/apiClient';

export default function UserCard({ user: initialUser, onStatusChange }) {
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    setLoading(true);
    try {
      await usersApi.follow(user.id);
      const updated = { ...user, followStatus: 'PENDING' };
      setUser(updated);
      onStatusChange?.(updated);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send follow request.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setLoading(true);
    try {
      await usersApi.unfollow(user.id);
      const updated = { ...user, followStatus: 'NONE' };
      setUser(updated);
      onStatusChange?.(updated);
    } catch {
      alert('Failed to unfollow.');
    } finally {
      setLoading(false);
    }
  };

  const renderFollowBtn = () => {
    if (user.followStatus === 'SELF') return null;

    if (user.followStatus === 'ACCEPTED') {
      return (
        <button className="btn btn-outline sm" onClick={handleUnfollow} disabled={loading}>
          {loading ? '…' : 'Following'}
        </button>
      );
    }
    if (user.followStatus === 'PENDING') {
      return (
        <button className="btn btn-ghost sm" disabled>
          Requested
        </button>
      );
    }
    return (
      <button className="btn btn-primary sm" onClick={handleFollow} disabled={loading}>
        {loading ? '…' : 'Follow'}
      </button>
    );
  };

  return (
    <div className="user-card">
      <Link to={`/profile/${user.id}`} className="user-card-info">
        <img
          src={user.profilePicture || `https://api.dicebear.com/7.x/personas/svg?seed=${user.username}`}
          alt={user.username}
          className="avatar avatar-md"
        />
        <div>
          <p className="user-card-name">{user.username}</p>
          {user.bio && <p className="user-card-bio">{user.bio}</p>}
          <p className="user-card-stats">
            {user._count?.posts ?? 0} posts · {user._count?.followers ?? 0} followers
          </p>
        </div>
      </Link>
      <div className="user-card-action">{renderFollowBtn()}</div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usersApi, postsApi } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';

export default function ProfilePage() {
  const { id } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [followLoading, setFollowLoading] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', bio: '', profilePicture: '' });
  const [editError, setEditError] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  const isOwn = currentUser?.id === id;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await usersApi.getById(id);
        setProfile(res.data.user);
        setEditForm({
          username: res.data.user.username,
          bio: res.data.user.bio || '',
          profilePicture: res.data.user.profilePicture || '',
        });
      } catch {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      await usersApi.follow(id);
      setProfile((p) => ({ ...p, followStatus: 'PENDING' }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send follow request.');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setFollowLoading(true);
    try {
      await usersApi.unfollow(id);
      setProfile((p) => ({
        ...p,
        followStatus: 'NONE',
        _count: { ...p._count, followers: Math.max(0, p._count.followers - 1) },
      }));
    } catch {
      alert('Failed to unfollow.');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setEditError('');
    try {
      const res = await usersApi.update(id, editForm);
      setProfile((p) => ({ ...p, ...res.data.user }));
      updateUser(res.data.user);
      setEditing(false);
    } catch (err) {
      setEditError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to update profile.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePostDeleted = (postId) => {
    setProfile((p) => ({
      ...p,
      posts: p.posts.filter((post) => post.id !== postId),
      _count: { ...p._count, posts: p._count.posts - 1 },
    }));
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Loading profile…</p>
      </div>
    );
  }

  if (error) return <div className="alert alert-error page-container">{error}</div>;
  if (!profile) return null;

  const renderFollowBtn = () => {
    if (isOwn) return null;
    if (profile.followStatus === 'ACCEPTED') {
      return (
        <button className="btn btn-outline" onClick={handleUnfollow} disabled={followLoading}>
          {followLoading ? '…' : 'Following'}
        </button>
      );
    }
    if (profile.followStatus === 'PENDING') {
      return <button className="btn btn-ghost" disabled>Requested</button>;
    }
    return (
      <button className="btn btn-primary" onClick={handleFollow} disabled={followLoading}>
        {followLoading ? '…' : 'Follow'}
      </button>
    );
  };

  return (
    <div className="profile-page">
      <div className="profile-cover" />

      <div className="page-container">
        <div className="profile-header">
          <div className="profile-avatar-wrap">
            <img
              src={profile.profilePicture || `https://api.dicebear.com/7.x/personas/svg?seed=${profile.username}`}
              alt={profile.username}
              className="avatar avatar-xl"
            />
          </div>

          <div className="profile-info">
            <div className="profile-name-row">
              <h1>{profile.username}</h1>
              {isOwn ? (
                <button
                  className="btn btn-outline sm"
                  onClick={() => setEditing((e) => !e)}
                >
                  {editing ? 'Cancel' : 'Edit Profile'}
                </button>
              ) : (
                renderFollowBtn()
              )}
            </div>

            {profile.bio && <p className="profile-bio">{profile.bio}</p>}

            <div className="profile-stats">
              <span><strong>{profile._count.posts}</strong> posts</span>
              <span><strong>{profile._count.followers}</strong> followers</span>
              <span><strong>{profile._count.following}</strong> following</span>
            </div>
          </div>
        </div>

        {editing && (
          <form className="edit-profile-form" onSubmit={handleSaveProfile}>
            <h3>Edit Profile</h3>
            {editError && <div className="alert alert-error">{editError}</div>}

            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                className="input"
                value={editForm.username}
                onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))}
                maxLength={20}
              />
            </div>

            <div className="form-group">
              <label>Bio</label>
              <textarea
                className="input"
                rows={3}
                value={editForm.bio}
                onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                maxLength={200}
                placeholder="Tell people about yourself…"
              />
            </div>

            <div className="form-group">
              <label>Profile Picture URL</label>
              <input
                type="url"
                className="input"
                value={editForm.profilePicture}
                onChange={(e) => setEditForm((f) => ({ ...f, profilePicture: e.target.value }))}
                placeholder="https://example.com/avatar.jpg"
              />
              {editForm.profilePicture && (
                <img src={editForm.profilePicture} alt="Preview" className="avatar avatar-md edit-preview" />
              )}
            </div>

            <button type="submit" className="btn btn-primary" disabled={saveLoading}>
              {saveLoading ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        )}

        <div className="profile-posts">
          <h2>Posts</h2>
          {profile.posts.length === 0 ? (
            <div className="empty-state">
              <p>No posts yet{isOwn ? '. Share something!' : '.'}</p>
            </div>
          ) : (
            <div className="posts-list">
              {profile.posts.map((post) => (
                <PostCard key={post.id} post={post} onDelete={handlePostDeleted} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
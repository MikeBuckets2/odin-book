import { useState, useEffect } from 'react';
import { postsApi, usersApi } from '../api/apiClient';
import PostCard from '../components/PostCard';
import CreatePostForm from '../components/CreatePostForm';
import { useAuth } from '../context/AuthContext';
import { Check, X, Radio } from 'lucide-react';

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requests, setRequests] = useState([]);
  const [respondingTo, setRespondingTo] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [feedRes, reqRes] = await Promise.all([
          postsApi.getFeed(),
          usersApi.getFollowRequests(),
        ]);
        setPosts(feedRes.data.posts);
        setRequests(reqRes.data.requests);
      } catch {
        setError('Failed to load feed.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleFollowResponse = async (followId, action) => {
    setRespondingTo(followId);
    try {
      await usersApi.respondToRequest(followId, action);
      setRequests((prev) => prev.filter((r) => r.id !== followId));
      // Reload feed to include new follower's posts if accepted
      if (action === 'accept') {
        const res = await postsApi.getFeed();
        setPosts(res.data.posts);
      }
    } catch {
      alert('Failed to respond to request.');
    } finally {
      setRespondingTo(null);
    }
  };

  return (
    <div className="page-layout">
      <aside className="sidebar sidebar-left">
        <div className="sidebar-card">
          <h3>Follow Requests</h3>
          {requests.length === 0 ? (
            <p className="empty-state-sm">No pending requests</p>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="follow-request">
                <img
                  src={req.follower.profilePicture || `https://api.dicebear.com/7.x/personas/svg?seed=${req.follower.username}`}
                  alt={req.follower.username}
                  className="avatar avatar-sm"
                />
                <span className="follow-request-name">{req.follower.username}</span>
                <div className="follow-request-btns">
                  <button
                    className="btn btn-primary sm"
                    onClick={() => handleFollowResponse(req.id, 'accept')}
                    disabled={respondingTo === req.id}
                  >
                    <Check size={14} />
                  </button>
                  <button
                    className="btn btn-ghost sm"
                    onClick={() => handleFollowResponse(req.id, 'reject')}
                    disabled={respondingTo === req.id}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      <main className="feed-main">
        <CreatePostForm onPostCreated={handlePostCreated} />

        {loading && (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading feed…</p>
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        {!loading && !error && posts.length === 0 && (
          <div className="empty-feed">
            <div className="empty-icon"><Radio size={40} strokeWidth={1.5} /></div>
            <h3>Your feed is empty</h3>
            <p>Follow some people to see their posts here!</p>
          </div>
        )}

        <div className="posts-list">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onDelete={handlePostDeleted} />
          ))}
        </div>
      </main>

      <aside className="sidebar sidebar-right">
        <div className="sidebar-card">
          <h3>Welcome back</h3>
          <div className="welcome-user">
            <img
              src={user?.profilePicture || `https://api.dicebear.com/7.x/personas/svg?seed=${user?.username}`}
              alt={user?.username}
              className="avatar avatar-md"
            />
            <div>
              <p className="welcome-name">{user?.username}</p>
              {user?.bio && <p className="welcome-bio">{user.bio}</p>}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
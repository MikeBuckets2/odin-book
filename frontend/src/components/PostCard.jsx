import { useState } from 'react';
import { Link } from 'react-router-dom';
import { postsApi } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import CommentSection from './CommentSection';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function PostCard({ post: initialPost, onDelete }) {
  const { user } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);

    const wasLiked = post.likedByMe;
    setPost((p) => ({
      ...p,
      likedByMe: !wasLiked,
      _count: {
        ...p._count,
        likes: wasLiked ? p._count.likes - 1 : p._count.likes + 1,
      },
    }));

    try {
      await postsApi.toggleLike(post.id);
    } catch {
      setPost((p) => ({
        ...p,
        likedByMe: wasLiked,
        _count: {
          ...p._count,
          likes: wasLiked ? p._count.likes + 1 : p._count.likes - 1,
        },
      }));
    } finally {
      setLikeLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    setDeleting(true);
    try {
      await postsApi.delete(post.id);
      onDelete?.(post.id);
    } catch {
      alert('Failed to delete post.');
      setDeleting(false);
    }
  };

  const handleCommentAdded = (newComment) => {
    setPost((p) => ({
      ...p,
      comments: [...p.comments, newComment],
      _count: { ...p._count, comments: p._count.comments + 1 },
    }));
  };

  const handleCommentDeleted = (commentId) => {
    setPost((p) => ({
      ...p,
      comments: p.comments.filter((c) => c.id !== commentId),
      _count: { ...p._count, comments: p._count.comments - 1 },
    }));
  };

  return (
    <article className="post-card">
      <div className="post-header">
        <Link to={`/profile/${post.author.id}`} className="post-author">
          <img
            src={post.author.profilePicture || `https://api.dicebear.com/7.x/personas/svg?seed=${post.author.username}`}
            alt={post.author.username}
            className="avatar avatar-sm"
          />
          <div>
            <span className="post-author-name">{post.author.username}</span>
            <span className="post-time">{timeAgo(post.createdAt)}</span>
          </div>
        </Link>

        {post.author.id === user?.id && (
          <button
            className="btn-icon danger"
            onClick={handleDelete}
            disabled={deleting}
            title="Delete post"
          >
            {deleting ? '...' : <Trash2 size={15} />}
          </button>
        )}
      </div>

      <p className="post-content">{post.content}</p>

      {post.imageUrl && (
        <img src={post.imageUrl} alt="Post media" className="post-image" loading="lazy" />
      )}

      <div className="post-actions">
        <button
          className={`action-btn ${post.likedByMe ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={likeLoading}
        >
          <Heart size={16} fill={post.likedByMe ? 'currentColor' : 'none'} />
          {post._count.likes}
        </button>

        <button
          className="action-btn"
          onClick={() => setShowComments((s) => !s)}
        >
          <MessageCircle size={16} />
          {post._count.comments}
        </button>
      </div>

      {showComments && (
        <CommentSection
          post={post}
          onCommentAdded={handleCommentAdded}
          onCommentDeleted={handleCommentDeleted}
        />
      )}
    </article>
  );
}
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { postsApi } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { X } from 'lucide-react';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function CommentSection({ post, onCommentAdded, onCommentDeleted }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await postsApi.createComment(post.id, { content });
      onCommentAdded(res.data.comment);
      setContent('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await postsApi.deleteComment(post.id, commentId);
      onCommentDeleted(commentId);
    } catch {
      alert('Failed to delete comment.');
    }
  };

  return (
    <div className="comments-section">
      <div className="comments-list">
        {post.comments.length === 0 && (
          <p className="comments-empty">No comments yet. Be the first!</p>
        )}
        {post.comments.map((comment) => (
          <div key={comment.id} className="comment">
            <Link to={`/profile/${comment.author.id}`}>
              <img
                src={comment.author.profilePicture || `https://api.dicebear.com/7.x/personas/svg?seed=${comment.author.username}`}
                alt={comment.author.username}
                className="avatar avatar-xs"
              />
            </Link>
            <div className="comment-body">
              <div className="comment-meta">
                <Link to={`/profile/${comment.author.id}`} className="comment-author">
                  {comment.author.username}
                </Link>
                <span className="comment-time">{timeAgo(comment.createdAt)}</span>
                {(comment.author.id === user?.id || post.author.id === user?.id) && (
                  <button
                    className="btn-icon danger sm"
                    onClick={() => handleDelete(comment.id)}
                    title="Delete comment"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <p className="comment-content">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>

      <form className="comment-form" onSubmit={handleSubmit}>
        <img
          src={user?.profilePicture || `https://api.dicebear.com/7.x/personas/svg?seed=${user?.username}`}
          alt={user?.username}
          className="avatar avatar-xs"
        />
        <input
          type="text"
          className="comment-input"
          placeholder="Write a comment…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={500}
          disabled={submitting}
        />
        <button type="submit" className="btn btn-primary sm" disabled={submitting || !content.trim()}>
          {submitting ? '…' : 'Post'}
        </button>
      </form>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
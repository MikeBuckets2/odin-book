import { useState } from 'react';
import { postsApi } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { ImageIcon } from 'lucide-react';

export default function CreatePostForm({ onPostCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await postsApi.create({
        content,
        imageUrl: imageUrl.trim() || undefined,
      });
      onPostCreated?.(res.data.post);
      setContent('');
      setImageUrl('');
      setShowImageInput(false);
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg
        || err.response?.data?.message
        || 'Failed to create post.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-post-card">
      <div className="create-post-header">
        <img
          src={user?.profilePicture || `https://api.dicebear.com/7.x/personas/svg?seed=${user?.username}`}
          alt={user?.username}
          className="avatar avatar-sm"
        />
        <form className="create-post-form" onSubmit={handleSubmit}>
          <textarea
            className="create-post-input"
            placeholder={`What's on your mind, ${user?.username}?`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={content.length > 80 ? 4 : 2}
            maxLength={1000}
            disabled={submitting}
          />

          {showImageInput && (
            <input
              type="url"
              className="input"
              placeholder="Image URL (optional)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              disabled={submitting}
            />
          )}

          {error && <p className="form-error">{error}</p>}

          <div className="create-post-footer">
            <button
              type="button"
              className="btn btn-ghost sm"
              onClick={() => setShowImageInput((s) => !s)}
            >
              <ImageIcon size={15} />
              {showImageInput ? 'Remove image' : 'Add image URL'}
            </button>
            <div className="char-count">{content.length}/1000</div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !content.trim()}
            >
              {submitting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
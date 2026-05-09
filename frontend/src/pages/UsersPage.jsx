import { useState, useEffect } from 'react';
import { usersApi } from '../api/apiClient';
import UserCard from '../components/UserCard';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await usersApi.getAll();
        setUsers(res.data.users);
      } catch {
        setError('Failed to load users.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleStatusChange = (updated) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  };

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.bio?.toLowerCase().includes(search.toLowerCase())
  );

  const statusOrder = { NONE: 0, REJECTED: 0, PENDING: 1, ACCEPTED: 2 };
  const sorted = [...filtered].sort(
    (a, b) => (statusOrder[a.followStatus] ?? 0) - (statusOrder[b.followStatus] ?? 0)
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>People</h1>
        <p>Discover and connect with others on Orbit</p>
      </div>

      <div className="search-bar">
        <input
          type="search"
          className="input"
          placeholder="Search by username or bio…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading people…</p>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {!loading && sorted.length === 0 && (
        <div className="empty-state">
          <p>No users found{search ? ` for "${search}"` : ''}.</p>
        </div>
      )}

      <div className="users-grid">
        {sorted.map((user) => (
          <UserCard key={user.id} user={user} onStatusChange={handleStatusChange} />
        ))}
      </div>
    </div>
  );
}
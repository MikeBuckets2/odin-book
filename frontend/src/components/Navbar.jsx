import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Globe,
  Rss,
  Users,
  User,
  ChevronDown,
  ChevronUp,
  Menu,
  LogOut,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/feed" className="navbar-logo">
          <Globe size={22} strokeWidth={2} />
          <span>Orbit</span>
        </Link>

        <nav className="navbar-links">
          <NavLink
            to="/feed"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            <Rss size={16} />
            Feed
          </NavLink>
          <NavLink
            to="/users"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            <Users size={16} />
            People
          </NavLink>
          <NavLink
            to={`/profile/${user?.id}`}
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            <User size={16} />
            Profile
          </NavLink>
        </nav>

        <div className="navbar-user">
          <button
            className="avatar-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="User menu"
          >
            <img
              src={
                user?.profilePicture ||
                `https://api.dicebear.com/7.x/personas/svg?seed=${user?.username}`
              }
              alt={user?.username}
              className="avatar avatar-sm"
            />
            <span className="navbar-username">{user?.username}</span>
            {menuOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {menuOpen && (
            <div className="dropdown-menu">
              <Link
                to={`/profile/${user?.id}`}
                className="dropdown-item"
                onClick={() => setMenuOpen(false)}
              >
                <User size={14} />
                My Profile
              </Link>
              <button className="dropdown-item danger" onClick={handleLogout}>
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>

        <button
          className="hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle mobile menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {menuOpen && (
        <nav className="mobile-menu">
          <NavLink to="/feed" onClick={() => setMenuOpen(false)}>
            <Rss size={16} /> Feed
          </NavLink>
          <NavLink to="/users" onClick={() => setMenuOpen(false)}>
            <Users size={16} /> People
          </NavLink>
          <NavLink to={`/profile/${user?.id}`} onClick={() => setMenuOpen(false)}>
            <User size={16} /> Profile
          </NavLink>
          <button className="danger" onClick={handleLogout}>
            <LogOut size={16} /> Sign Out
          </button>
        </nav>
      )}
    </header>
  );
}
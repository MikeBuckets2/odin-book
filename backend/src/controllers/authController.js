const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('../config/passport');
const prisma = require('../config/prismaClient');
const { validationResult } = require('express-validator');

const signToken = (user) =>
  jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const sanitizeUser = (user) => {
  const { password, ...safe } = user;
  return safe;
};

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already in use.' });
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username: username.trim() },
    });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already taken.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        profilePicture: `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(username)}`,
      },
    });

    const token = signToken(user);

    return res.status(201).json({
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Server error during registration.' });
  }
};

const login = (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      return res.status(401).json({ message: info?.message || 'Invalid credentials.' });
    }

    const token = signToken(user);
    return res.json({ token, user: sanitizeUser(user) });
  })(req, res, next);
};

const guestLogin = async (req, res) => {
  try {
    const guestEmail = process.env.GUEST_EMAIL || 'guest@orbit.app';
    const guestPassword = process.env.GUEST_PASSWORD || 'GuestPass123!';

    const guestUser = await prisma.user.findUnique({
      where: { email: guestEmail },
    });

    if (!guestUser) {
      return res.status(404).json({
        message: 'Guest account not found. Please run the database seed first.',
      });
    }

    const isMatch = await bcrypt.compare(guestPassword, guestUser.password);
    if (!isMatch) {
      return res.status(500).json({ message: 'Guest account misconfigured.' });
    }

    const token = signToken(guestUser);
    return res.json({ token, user: sanitizeUser(guestUser) });
  } catch (err) {
    console.error('Guest login error:', err);
    return res.status(500).json({ message: 'Server error during guest login.' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        profilePicture: true,
        isGuest: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: { where: { status: 'ACCEPTED' } },
            following: { where: { status: 'ACCEPTED' } },
          },
        },
      },
    });

    return res.json({ user });
  } catch (err) {
    console.error('GetMe error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { register, login, guestLogin, getMe };
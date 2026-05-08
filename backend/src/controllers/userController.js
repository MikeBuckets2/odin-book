const prisma = require('../config/prismaClient');
const { validationResult } = require('express-validator');

const getFollowStatus = async (currentUserId, targetUserId) => {
  if (currentUserId === targetUserId) return 'SELF';

  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    },
  });

  if (!follow) return 'NONE';
  return follow.status;
};

const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { id: { not: req.user.id } },
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        profilePicture: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: { where: { status: 'ACCEPTED' } },
            following: { where: { status: 'ACCEPTED' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const usersWithStatus = await Promise.all(
      users.map(async (user) => ({
        ...user,
        followStatus: await getFollowStatus(req.user.id, user.id),
      }))
    );

    return res.json({ users: usersWithStatus });
  } catch (err) {
    console.error('GetAllUsers error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
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
        posts: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: { id: true, username: true, profilePicture: true },
            },
            _count: { select: { comments: true, likes: true } },
            likes: { where: { userId: req.user.id }, select: { id: true } },
          },
        },
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found.' });

    const followStatus = await getFollowStatus(req.user.id, id);

    return res.json({ user: { ...user, followStatus } });
  } catch (err) {
    console.error('GetUserById error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;

  if (id !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized to update this profile.' });
  }

  const { bio, profilePicture, username } = req.body;

  try {
    if (username && username !== req.user.username) {
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing) {
        return res.status(400).json({ message: 'Username already taken.' });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(bio !== undefined && { bio }),
        ...(profilePicture !== undefined && { profilePicture }),
        ...(username !== undefined && { username }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        profilePicture: true,
        isGuest: true,
        createdAt: true,
      },
    });

    return res.json({ user: updated });
  } catch (err) {
    console.error('UpdateProfile error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const sendFollowRequest = async (req, res) => {
  const { id: targetId } = req.params;

  if (targetId === req.user.id) {
    return res.status(400).json({ message: "You can't follow yourself." });
  }

  try {
    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) return res.status(404).json({ message: 'User not found.' });

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: req.user.id,
          followingId: targetId,
        },
      },
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        return res.status(400).json({ message: 'Already following this user.' });
      }
      if (existing.status === 'PENDING') {
        return res.status(400).json({ message: 'Follow request already pending.' });
      }
      const updated = await prisma.follow.update({
        where: { id: existing.id },
        data: { status: 'PENDING' },
      });
      return res.status(200).json({ follow: updated });
    }

    const follow = await prisma.follow.create({
      data: {
        followerId: req.user.id,
        followingId: targetId,
        status: 'PENDING',
      },
    });

    return res.status(201).json({ follow });
  } catch (err) {
    console.error('SendFollowRequest error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const unfollow = async (req, res) => {
  const { id: targetId } = req.params;

  try {
    await prisma.follow.deleteMany({
      where: {
        followerId: req.user.id,
        followingId: targetId,
      },
    });

    return res.json({ message: 'Unfollowed successfully.' });
  } catch (err) {
    console.error('Unfollow error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const getFollowRequests = async (req, res) => {
  try {
    const requests = await prisma.follow.findMany({
      where: {
        followingId: req.user.id,
        status: 'PENDING',
      },
      include: {
        follower: {
          select: { id: true, username: true, profilePicture: true, bio: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ requests });
  } catch (err) {
    console.error('GetFollowRequests error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const respondToFollowRequest = async (req, res) => {
  const { followId } = req.params;
  const { action } = req.body; // 'accept' | 'reject'

  if (!['accept', 'reject'].includes(action)) {
    return res.status(400).json({ message: "Action must be 'accept' or 'reject'." });
  }

  try {
    const follow = await prisma.follow.findUnique({ where: { id: followId } });

    if (!follow) return res.status(404).json({ message: 'Follow request not found.' });
    if (follow.followingId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    const updated = await prisma.follow.update({
      where: { id: followId },
      data: { status: action === 'accept' ? 'ACCEPTED' : 'REJECTED' },
    });

    return res.json({ follow: updated });
  } catch (err) {
    console.error('RespondToFollowRequest error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateProfile,
  sendFollowRequest,
  unfollow,
  getFollowRequests,
  respondToFollowRequest,
};
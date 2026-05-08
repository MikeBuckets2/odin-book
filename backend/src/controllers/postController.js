const prisma = require('../config/prismaClient');
const { validationResult } = require('express-validator');

const postInclude = (currentUserId) => ({
  author: {
    select: { id: true, username: true, profilePicture: true },
  },
  comments: {
    orderBy: { createdAt: 'asc' },
    include: {
      author: {
        select: { id: true, username: true, profilePicture: true },
      },
    },
  },
  likes: {
    select: { id: true, userId: true },
  },
  _count: {
    select: { comments: true, likes: true },
  },
});

const formatPost = (post, currentUserId) => ({
  ...post,
  likedByMe: post.likes.some((l) => l.userId === currentUserId),
});

const getFeed = async (req, res) => {
  try {
    const following = await prisma.follow.findMany({
      where: { followerId: req.user.id, status: 'ACCEPTED' },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);

    const posts = await prisma.post.findMany({
      where: {
        authorId: { in: [req.user.id, ...followingIds] },
      },
      orderBy: { createdAt: 'desc' },
      include: postInclude(req.user.id),
    });

    return res.json({ posts: posts.map((p) => formatPost(p, req.user.id)) });
  } catch (err) {
    console.error('GetFeed error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const createPost = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { content, imageUrl } = req.body;

  try {
    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        imageUrl: imageUrl?.trim() || null,
        authorId: req.user.id,
      },
      include: postInclude(req.user.id),
    });

    return res.status(201).json({ post: formatPost(post, req.user.id) });
  } catch (err) {
    console.error('CreatePost error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const getPostById = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: postInclude(req.user.id),
    });

    if (!post) return res.status(404).json({ message: 'Post not found.' });

    return res.json({ post: formatPost(post, req.user.id) });
  } catch (err) {
    console.error('GetPostById error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const deletePost = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await prisma.post.findUnique({ where: { id } });

    if (!post) return res.status(404).json({ message: 'Post not found.' });
    if (post.authorId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this post.' });
    }

    await prisma.post.delete({ where: { id } });

    return res.json({ message: 'Post deleted.' });
  } catch (err) {
    console.error('DeletePost error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const toggleLike = async (req, res) => {
  const { id: postId } = req.params;

  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    const existing = await prisma.like.findUnique({
      where: { postId_userId: { postId, userId: req.user.id } },
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      const count = await prisma.like.count({ where: { postId } });
      return res.json({ liked: false, likeCount: count });
    }

    await prisma.like.create({ data: { postId, userId: req.user.id } });
    const count = await prisma.like.count({ where: { postId } });
    return res.json({ liked: true, likeCount: count });
  } catch (err) {
    console.error('ToggleLike error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getFeed, createPost, getPostById, deletePost, toggleLike };
const prisma = require('../config/prismaClient');
const { validationResult } = require('express-validator');

const createComment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id: postId } = req.params;
  const { content } = req.body;

  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        postId,
        authorId: req.user.id,
      },
      include: {
        author: {
          select: { id: true, username: true, profilePicture: true },
        },
      },
    });

    return res.status(201).json({ comment });
  } catch (err) {
    console.error('CreateComment error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const deleteComment = async (req, res) => {
  const { commentId } = req.params;

  try {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment) return res.status(404).json({ message: 'Comment not found.' });

    const post = await prisma.post.findUnique({ where: { id: comment.postId } });
    const canDelete =
      comment.authorId === req.user.id || post?.authorId === req.user.id;

    if (!canDelete) {
      return res.status(403).json({ message: 'Not authorized to delete this comment.' });
    }

    await prisma.comment.delete({ where: { id: commentId } });

    return res.json({ message: 'Comment deleted.' });
  } catch (err) {
    console.error('DeleteComment error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { createComment, deleteComment };
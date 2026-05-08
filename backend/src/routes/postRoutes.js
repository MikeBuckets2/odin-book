const express = require('express');
const { body } = require('express-validator');
const {
  getFeed,
  createPost,
  getPostById,
  deletePost,
  toggleLike,
} = require('../controllers/postController');
const { createComment, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getFeed);

router.post(
  '/',
  [
    body('content')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Post content must be 1-1000 characters.'),
    body('imageUrl')
      .optional({ checkFalsy: true })
      .isURL()
      .withMessage('Image URL must be a valid URL.'),
  ],
  createPost
);

router.get('/:id', getPostById);

router.delete('/:id', deletePost);

router.post('/:id/like', toggleLike);

router.post(
  '/:id/comments',
  [
    body('content')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Comment must be 1-500 characters.'),
  ],
  createComment
);

router.delete('/:postId/comments/:commentId', deleteComment);

module.exports = router;
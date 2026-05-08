const express = require('express');
const { body } = require('express-validator');
const {
  getAllUsers,
  getUserById,
  updateProfile,
  sendFollowRequest,
  unfollow,
  getFollowRequests,
  respondToFollowRequest,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getAllUsers);

router.get('/follow-requests', getFollowRequests);

router.get('/:id', getUserById);

router.put(
  '/:id',
  [
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Username must be 3-20 characters.')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores.'),
    body('bio')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Bio cannot exceed 200 characters.'),
    body('profilePicture')
      .optional()
      .isURL()
      .withMessage('Profile picture must be a valid URL.'),
  ],
  updateProfile
);

router.post('/:id/follow', sendFollowRequest);

router.delete('/:id/follow', unfollow);

router.patch('/follows/:followId', respondToFollowRequest);

module.exports = router;
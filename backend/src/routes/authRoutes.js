const express = require('express');
const { body } = require('express-validator');
const { register, login, guestLogin, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
  '/register',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Username must be 3-20 characters.')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores.'),
    body('email').isEmail().normalizeEmail().withMessage('Invalid email address.'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters.')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter.')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number.'),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Invalid email address.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  login
);

router.post('/guest', guestLogin);

router.get('/me', protect, getMe);

module.exports = router;
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// @route   POST /api/auth/register (student only — admin cannot register publicly)
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('rollNumber')
      .trim()
      .notEmpty()
      .withMessage('Roll number is required'),
  ],
  authController.register
);

// @route   POST /api/auth/login (both student + admin, role sent in body)
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('role')
      .optional()
      .isIn(['admin', 'student'])
      .withMessage('Invalid role'),
  ],
  authController.login
);

// @route   GET /api/auth/me
router.get('/me', protect, authController.getMe);

// @route   PUT /api/auth/update-profile
router.put('/update-profile', protect, authController.updateProfile);

// @route   PUT /api/auth/change-password
router.put(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
  ],
  authController.changePassword
);

// @route   POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Valid email is required')],
  authController.forgotPassword
);

// @route   POST /api/auth/reset-password
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  authController.resetPassword
);

// TEMPORARY - DELETE AFTER SEEDING
router.post('/seed-admin', async (req, res) => {
  try {
    const { secret } = req.body;
    
    // Security check - only you know this secret
    if (secret !== process.env.SEED_SECRET) {
      return res.status(403).json({ 
        message: 'Forbidden' 
      });
    }

    const existing = await User.findOne({ 
      role: 'admin' 
    });
    
    if (existing) {
      return res.json({ 
        message: 'Admin already exists' 
      });
    }

    const admin = await User.create({
      name: process.env.ADMIN_NAME,
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: 'admin',
      isActive: true
    });

    res.json({ 
      message: 'Admin created!', 
      email: admin.email 
    });

  } catch(err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
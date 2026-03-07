const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator'); // Note: user needs express-validator
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, password, role } = req.body;
      const normalizedEmail = email.toLowerCase().trim();
      let user = await User.findOne({ email: normalizedEmail });

      if (user) {
        return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
      }

      user = new User({
        name,
        email: normalizedEmail,
        password,
        role
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      const payload = {
        user: {
          id: user.id,
          role: user.role
        }
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    try {
      let user = await User.findOne({ email: normalizedEmail }).lean();

      if (!user) {
        console.warn(`[AUTH] Login failed: User not found for email: ${normalizedEmail}`);
        return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        console.warn(`[AUTH] Login failed: Password mismatch for user: ${normalizedEmail}`);
        return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      const payload = {
        user: {
          id: user._id,
          role: user.role
        }
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET /api/auth
// @desc    Get user by token
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/auth/users
// @desc    Get all users (Admin only)
// @access  Private
router.get('/users', auth, async (req, res) => {
    try {
        const requestUser = await User.findById(req.user.id);
        if (!requestUser) {
            return res.status(401).json({ msg: 'User not found' });
        }
        if (requestUser.role !== 'admin') {
            return res.status(401).json({ msg: 'Not authorized as admin' });
        }
        
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/auth/create-user
// @desc    Create a new user (Admin only)
// @access  Private
router.post(
  '/create-user',
  [
    auth,
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if user is admin
      const requestUser = await User.findById(req.user.id);
      if (!requestUser) {
        return res.status(404).json({ msg: 'User not found' });
      }
      if (requestUser.role !== 'admin') {
        return res.status(401).json({ msg: 'Not authorized as admin' });
      }

      const { name, email, password, role } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      let user = await User.findOne({ email: normalizedEmail });

      if (user) {
        return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
      }

      user = new User({
        name,
        email: normalizedEmail,
        password,
        role: role || 'field_work'
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      res.json({ msg: 'User created successfully', user: { id: user.id, name: user.name, email: user.email, role: user.role } });

    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET /api/auth/stats
// @desc    Get system statistics (admins, managers, reporters)
// @access  Private (Admin/Manager only ideally, but keeping simple for now)
router.get('/stats', auth, async (req, res) => {
  try {
      const adminCount = await User.countDocuments({ role: 'admin' });
      const fieldWorkCount = await User.countDocuments({ role: 'field_work' });
      const totalUsers = await User.countDocuments();
      
      res.json({
          admin: adminCount,
          fieldWork: fieldWorkCount,
          total: totalUsers
      });
  } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/auth/users/:id
// @desc    Delete a user
// @access  Private (Admin only)
router.delete('/users/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
             return res.status(404).json({ msg: 'User not found' });
        }
        if (user.role !== 'admin') {
            return res.status(401).json({ msg: 'Not authorized as admin' });
        }
        
        // Prevent deleting yourself
        if (req.params.id === req.user.id) {
             return res.status(400).json({ msg: 'Cannot delete yourself' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: 'User deleted' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
             return res.status(404).json({ msg: 'User not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/auth/users/:id
// @desc    Update a user
// @access  Private (Admin only)
router.put('/users/:id', auth, async (req, res) => {
    try {
        const adminUser = await User.findById(req.user.id);
        if (!adminUser) {
             return res.status(404).json({ msg: 'User not found' });
        }
        if (adminUser.role !== 'admin') {
            return res.status(401).json({ msg: 'Not authorized as admin' });
        }

        const { name, email, role, password } = req.body;
        const normalizedEmail = email ? email.toLowerCase().trim() : undefined;
        const userFields = { name, email: normalizedEmail, role };
        
        // Only hash password if provided/changed
        if (password) {
            if (password.length < 6) {
                 return res.status(400).json({ errors: [{ msg: 'Password must be at least 6 characters' }] });
            }
            const salt = await bcrypt.genSalt(10);
            userFields.password = await bcrypt.hash(password, salt);
        }

        let user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: userFields },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId')  return res.status(404).json({ msg: 'User not found' });
        res.status(500).send('Server Error');
    }
});

module.exports = router;

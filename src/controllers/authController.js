const { Provider } = require('../models/Provider');
const { User } = require('../models/User');
const { generateToken } = require('../services/tokenService');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Build the public user/role payload returned to the client
const buildAuthResponse = (user, provider = null) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: provider && provider.profilePhoto ? provider.profilePhoto : user.avatar,
  provider: provider
    ? {
        id: provider._id,
        status: provider.status,
        profileCompletion: provider.profileCompletion,
        rejectionRemarks: provider.rejectionRemarks
      }
    : null
});

/**
 * @desc    Register a new service provider account
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists. Please login.');
  }

  const userRole = role && ['customer', 'provider'].includes(role) ? role : 'provider';
  const user = await User.create({ name, email, password, role: userRole });

  let provider = null;
  if (userRole === 'provider') {
    // Auto-create the provider profile in "pending" state
    provider = await Provider.create({ user: user._id });
  }

  const token = generateToken(user._id, user.role);
  res.status(201).json({
    success: true,
    message: 'Account created successfully. Please sign in with your credentials.',
    token,
    user: buildAuthResponse(user, provider)
  });
});

/**
 * @desc    Login (providers and admins)
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, 'Invalid email or password.');
  }
  if (!user.isActive) {
    throw new ApiError(403, 'Your account has been deactivated. Contact support.');
  }

  const provider = user.role === 'provider' ? await Provider.findOne({ user: user._id }) : null;
  const token = generateToken(user._id, user.role);

  res.status(200).json({
    success: true,
    message: 'Login successful.',
    token,
    user: buildAuthResponse(user, provider)
  });
});

/**
 * @desc    Get the currently authenticated user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const provider = req.user.role === 'provider' ? await Provider.findOne({ user: req.user._id }) : null;
  res.status(200).json({ success: true, user: buildAuthResponse(req.user, provider) });
});

/**
 * @desc    Update user profile details (name, avatar picture)
 * @route   PUT /api/auth/profile
 * @access  Private (Admin, Customer, Provider)
 */
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, 'User not found');

  const { name } = req.body;
  if (name && name.trim()) {
    user.name = name.trim();
  }

  // Handle uploaded profile picture file
  if (req.file) {
    const avatarUrl = `/uploads/${req.user._id}/${req.file.filename}`;
    user.avatar = avatarUrl;
    if (user.role === 'provider') {
      const provider = await Provider.findOne({ user: user._id });
      if (provider) {
        provider.profilePhoto = avatarUrl;
        await provider.save();
      }
    }
  }

  await user.save();

  const provider = user.role === 'provider' ? await Provider.findOne({ user: user._id }) : null;

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    user: buildAuthResponse(user, provider)
  });
});

module.exports = { register, login, getMe, updateUserProfile, buildAuthResponse };
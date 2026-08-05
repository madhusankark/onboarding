const { Provider, PROVIDER_STATUSES } = require('../models/Provider');
const { User } = require('../models/User');
const Category = require('../models/Category');
const { Document } = require('../models/Document');
const { sendEmail, statusEmailTemplate } = require('../services/emailService');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const serializeProvider = async (provider) => {
  const user = await User.findById(provider.user);
  const docCount = await Document.countDocuments({ user: provider.user });
  return {
    user: user
      ? { id: user._id, name: user.name, email: user.email }
      : { id: provider.user, name: 'Unknown', email: '' },
    id: provider._id,
    phone: provider.phone,
    city: provider.city,
    categories: provider.categories,
    skills: provider.skills,
    experienceYears: provider.experienceYears,
    serviceLocations: provider.serviceLocations,
    profilePhoto: provider.profilePhoto,
    status: provider.status,
    rejectionRemarks: provider.rejectionRemarks,
    submittedAt: provider.submittedAt,
    reviewedAt: provider.reviewedAt,
    profileCompletion: provider.profileCompletion,
    documentCount: docCount,
    createdAt: provider.createdAt
  };
};

/**
 * @desc    List all providers with search, filter & pagination
 * @route   GET /api/admin/providers?search=&status=&category=&page=&limit=
 * @access  Private (admin)
 */
const getProviders = asyncHandler(async (req, res) => {
  const { search = '', status = '', category = '' } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));

  // Build the user filter for name/email search
  const userFilter = search
    ? {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }
    : {};

  // Resolve matching user ids for the provider filter
  const matchedUsers = await User.find(userFilter).select('_id');
  const userIds = matchedUsers.map((u) => u._id);

  const providerFilter = {};
  if (search) providerFilter.user = { $in: userIds };
  if (status && PROVIDER_STATUSES.includes(status)) providerFilter.status = status;
  if (category) providerFilter.categories = category;

  const total = await Provider.countDocuments(providerFilter);
  const providers = await Provider.find(providerFilter)
    .populate('categories')
    .sort({ submittedAt: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const items = await Promise.all(providers.map(serializeProvider));

  res.status(200).json({
    success: true,
    data: items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    filters: {
      search,
      status,
      category,
      statuses: PROVIDER_STATUSES
    }
  });
});

/**
 * @desc    Get single provider with all uploaded documents and profile details
 * @route   GET /api/admin/providers/:id
 * @access  Private (admin)
 */
const getProviderDetail = asyncHandler(async (req, res) => {
  const provider = await Provider.findById(req.params.id).populate('categories');
  if (!provider) throw new ApiError(404, 'Provider not found.');

  const user = await User.findById(provider.user);
  const documents = await Document.find({ user: provider.user }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    provider: {
      user: user ? { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt } : null,
      id: provider._id,
      phone: provider.phone,
      bio: provider.bio,
      address: provider.address,
      city: provider.city,
      categories: provider.categories,
      skills: provider.skills,
      experienceYears: provider.experienceYears,
      experienceSummary: provider.experienceSummary,
      serviceLocations: provider.serviceLocations,
      profilePhoto: provider.profilePhoto,
      status: provider.status,
      rejectionRemarks: provider.rejectionRemarks,
      submittedAt: provider.submittedAt,
      reviewedAt: provider.reviewedAt,
      profileCompletion: provider.profileCompletion,
      createdAt: provider.createdAt
    },
    documents: documents.map((d) => ({
      id: d._id,
      documentType: d.documentType,
      label: d.label,
      url: d.url,
      mimeType: d.mimeType,
      size: d.size,
      status: d.status,
      adminRemark: d.adminRemark,
      createdAt: d.createdAt
    }))
  });
});

/**
 * @desc    Approve or reject a provider application
 * @route   PUT /api/admin/providers/:id/review
 * @access  Private (admin)
 */
const reviewApplication = asyncHandler(async (req, res) => {
  const { status, remarks = '', documentsVerified = true } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    throw new ApiError(400, 'Status must be either "approved" or "rejected".');
  }

  const provider = await Provider.findById(req.params.id).populate('categories');
  if (!provider) throw new ApiError(404, 'Provider not found.');

  if (status === 'rejected' && !remarks.trim()) {
    throw new ApiError(400, 'Rejection remarks are required when rejecting an application.');
  }

  if (status === 'approved') {
    const docs = await Document.find({ user: provider.user });
    const hasGov = docs.some((d) => d.documentType === 'government_id');
    const hasAddress = docs.some((d) => d.documentType === 'address_proof');
    if (!hasGov || !hasAddress) {
      throw new ApiError(400, 'Cannot approve: required documents (Government ID & Address Proof) are missing.');
    }
  }

  provider.status = status;
  provider.rejectionRemarks = status === 'rejected' ? remarks : '';
  provider.reviewedBy = req.user._id;
  provider.reviewedAt = new Date();

  // Optionally mark all documents verified on approval
  if (status === 'approved') {
    await Document.updateMany(
      { user: provider.user },
      { status: 'verified' }
    );
  }

  await provider.save();

  const user = await User.findById(provider.user);
  if (user && user.email) {
    await sendEmail({
      to: user.email,
      subject: status === 'approved' ? 'Application Approved 🎉' : 'Application Rejected',
      html: statusEmailTemplate(user.name, status, remarks)
    });
  }

  res.status(200).json({
    success: true,
    message: `Application ${status}.`,
    provider: { id: provider._id, status: provider.status, rejectionRemarks: provider.rejectionRemarks }
  });
});

/**
 * @desc    Verify or reject an individual document
 * @route   PUT /api/admin/providers/:id/documents/:docId/review
 * @access  Private (admin)
 */
const reviewDocument = asyncHandler(async (req, res) => {
  const { status, remark = '' } = req.body;
  if (!['verified', 'rejected'].includes(status)) {
    throw new ApiError(400, 'Document status must be "verified" or "rejected".');
  }
  if (status === 'rejected' && !remark.trim()) {
    throw new ApiError(400, 'A remark is required when rejecting a document.');
  }

  const doc = await Document.findById(req.params.docId);
  if (!doc) throw new ApiError(404, 'Document not found.');

  doc.status = status;
  doc.adminRemark = remark;
  await doc.save();

  res.status(200).json({ success: true, message: `Document marked as ${status}.` });
});

/**
 * @desc    Remove an uploaded document and send notification to provider portal
 * @route   DELETE /api/admin/providers/:id/documents/:docId
 * @access  Private (admin)
 */
const removeProviderDocument = asyncHandler(async (req, res) => {
  const { id, docId } = req.params;
  const { remark = '' } = req.body || {};

  const provider = await Provider.findById(id);
  if (!provider) throw new ApiError(404, 'Provider not found.');

  const doc = await Document.findById(docId);
  if (!doc) throw new ApiError(404, 'Document not found.');

  const docLabel = doc.label || doc.documentType || 'Uploaded Document';
  const customRemark = remark && remark.trim()
    ? remark.trim()
    : `Admin removed your uploaded document (${docLabel}). Please re-upload a clean, valid copy.`;

  if (!provider.documentNotifications) {
    provider.documentNotifications = [];
  }
  provider.documentNotifications.push({
    documentType: doc.documentType,
    label: docLabel,
    remark: customRemark,
    createdAt: new Date()
  });

  await Document.findByIdAndDelete(docId);
  await provider.save();

  res.status(200).json({
    success: true,
    message: `Document "${docLabel}" removed and notification sent to provider portal.`,
    documentNotifications: provider.documentNotifications
  });
});

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admin/dashboard
 * @access  Private (admin)
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalProviders, pending, approved, rejected, totalDocuments, recent] = await Promise.all([
    Provider.countDocuments(),
    Provider.countDocuments({ status: 'pending' }),
    Provider.countDocuments({ status: 'approved' }),
    Provider.countDocuments({ status: 'rejected' }),
    Document.countDocuments(),
    Provider.find({}).populate('categories').sort({ createdAt: -1 }).limit(8)
  ]);

  const byCategoryRaw = await Provider.aggregate([
    { $match: { categories: { $exists: true, $ne: [] } } },
    { $unwind: '$categories' },
    { $group: { _id: '$categories', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 6 }
  ]);
  const categories = await Category.find({ _id: { $in: byCategoryRaw.map((c) => c._id) } });
  const byCategory = byCategoryRaw.map((c) => {
    const cat = categories.find((k) => String(k._id) === String(c._id));
    return { category: cat ? cat.name : 'Unknown', count: c.count };
  });

  const byStatus = await Provider.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const recentItems = await Promise.all(
    recent.map((p) => serializeProvider(p))
  );

  res.status(200).json({
    success: true,
    stats: {
      totalProviders,
      pending,
      approved,
      rejected,
      approvalRate: totalProviders ? Math.round((approved / totalProviders) * 100) : 0,
      totalDocuments,
      averageCompletion: totalProviders
        ? Math.round((await Provider.aggregate([{ $group: { _id: null, avg: { $avg: '$profileCompletion' } } }]))[0]?.avg || 0)
        : 0
    },
    byStatus,
    byCategory,
    recentProviders: recentItems
  });
});

/**
 * @desc    Manage categories (create)
 * @route   POST /api/admin/categories
 * @access  Private (admin)
 */
const createCategory = asyncHandler(async (req, res) => {
  const { name, icon = '🛠️', description = '' } = req.body;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const existing = await Category.findOne({ slug });
  if (existing) throw new ApiError(409, 'Category already exists.');

  const category = await Category.create({ name, slug, icon, description });
  res.status(201).json({ success: true, category });
});

const Booking = require('../models/Booking');

/**
 * @desc    Manage categories (list)
 * @route   GET /api/admin/categories
 * @access  Private (admin)
 */
const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({}).sort({ order: 1 });
  res.status(200).json({ success: true, categories });
});

/**
 * @desc    Get all customer bookings and work fulfillment status for Admin
 * @route   GET /api/admin/bookings
 * @access  Private (admin)
 */
const getAdminBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({})
    .populate({
      path: 'provider',
      populate: { path: 'user', select: 'name email phone avatar' }
    })
    .populate('customer', 'name email avatar')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, bookings });
});

/**
 * @desc    Admin update work status or re-assign provider
 * @route   PUT /api/admin/bookings/:id
 * @access  Private (admin)
 */
const updateAdminBookingStatus = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found');

  const { status, providerId } = req.body;
  if (status) booking.status = status;
  if (providerId) booking.provider = providerId;

  await booking.save();
  res.status(200).json({ success: true, message: 'Booking updated successfully', booking });
});

module.exports = {
  getProviders,
  getProviderDetail,
  reviewApplication,
  reviewDocument,
  removeProviderDocument,
  getDashboardStats,
  createCategory,
  listCategories,
  getAdminBookings,
  updateAdminBookingStatus
};
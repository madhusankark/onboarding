const { Provider } = require('../models/Provider');
const { Document, DOCUMENT_TYPES } = require('../models/Document');
const Category = require('../models/Category');
const { calculateCompletion, canEditProfile } = require('../services/providerService');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const path = require('path');
const fs = require('fs');

const DOCUMENT_LABELS = {
  profile_photo: 'Profile Photo',
  government_id: 'Government ID',
  address_proof: 'Address Proof',
  certification: 'Certification',
  background_check: 'Background Check',
  other: 'Other'
};

const serializeProvider = async (provider, user) => ({
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar
  },
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
  documentNotifications: provider.documentNotifications || [],
  bookingNotifications: provider.bookingNotifications || [],
  createdAt: provider.createdAt,
  updatedAt: provider.updatedAt
});

/**
 * @desc    Get own onboarding profile + categories + documents
 * @route   GET /api/provider/profile
 * @access  Private (provider)
 */
const getProfile = asyncHandler(async (req, res) => {
  const provider = await Provider.findOne({ user: req.user._id }).populate('categories');
  if (!provider) throw new ApiError(404, 'Provider profile not found.');

  const documents = await Document.find({ user: req.user._id }).sort({ createdAt: -1 });
  const categories = await Category.find({ isActive: true }).sort({ order: 1 });

  res.status(200).json({
    success: true,
    provider: await serializeProvider(provider, req.user),
    documents: documents.map((d) => ({
      id: d._id,
      documentType: d.documentType,
      label: d.label || DOCUMENT_LABELS[d.documentType] || d.documentType,
      url: d.url,
      mimeType: d.mimeType,
      size: d.size,
      status: d.status,
      adminRemark: d.adminRemark,
      createdAt: d.createdAt
    })),
    categories
  });
});

/**
 * @desc    Update profile (allowed only before approval; rejected profiles can
 *          be edited and resubmitted)
 * @route   PUT /api/provider/profile
 * @access  Private (provider)
 */
const updateProfile = asyncHandler(async (req, res) => {
  const provider = await Provider.findOne({ user: req.user._id });
  if (!provider) throw new ApiError(404, 'Provider profile not found.');

  if (!canEditProfile(provider.status)) {
    throw new ApiError(403, 'Your application has been approved. Profile editing is locked.');
  }

  const {
    phone, bio, address, city, categories,
    skills, experienceYears, experienceSummary, serviceLocations
  } = req.body;

  if (phone !== undefined) provider.phone = phone;
  if (bio !== undefined) provider.bio = bio;
  if (address !== undefined) provider.address = address;
  if (city !== undefined) provider.city = city;
  if (categories !== undefined) {
    if (!Array.isArray(categories)) throw new ApiError(400, 'categories must be an array');
    const valid = await Category.find({ _id: { $in: categories }, isActive: true });
    provider.categories = valid.map((c) => c._id);
  }
  if (skills !== undefined) {
    if (!Array.isArray(skills)) throw new ApiError(400, 'skills must be an array of strings');
    provider.skills = skills
      .map((s) => String(s).trim())
      .filter(Boolean)
      .slice(0, 20);
  }
  if (experienceYears !== undefined) provider.experienceYears = Number(experienceYears) || 0;
  if (experienceSummary !== undefined) provider.experienceSummary = experienceSummary;
  if (serviceLocations !== undefined) {
    if (!Array.isArray(serviceLocations)) throw new ApiError(400, 'serviceLocations must be an array');
    provider.serviceLocations = serviceLocations
      .map((s) => String(s).trim())
      .filter(Boolean)
      .slice(0, 30);
  }

  provider.profileCompletion = await calculateCompletion(provider);
  await provider.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    profileCompletion: provider.profileCompletion
  });
});

/**
 * @desc    Submit / resubmit the onboarding application for review
 * @route   POST /api/provider/submit
 * @access  Private (provider)
 */
const submitApplication = asyncHandler(async (req, res) => {
  const provider = await Provider.findOne({ user: req.user._id });
  if (!provider) throw new ApiError(404, 'Provider profile not found.');

  if (canEditProfile(provider.status) === false) {
    throw new ApiError(400, 'Your application is already approved. Nothing to submit.');
  }

  provider.profileCompletion = await calculateCompletion(provider);
  if (provider.profileCompletion < 50) {
    throw new ApiError(400, `Profile is only ${provider.profileCompletion}% complete. Please complete at least 50% before submitting.`);
  }

  const docs = await Document.find({ user: req.user._id });
  const hasGov = docs.some((d) => d.documentType === 'government_id');
  const hasAddress = docs.some((d) => d.documentType === 'address_proof');
  if (!hasGov || !hasAddress) {
    throw new ApiError(400, 'You must upload your Government ID and Address Proof before submitting.');
  }

  provider.status = 'pending';
  provider.rejectionRemarks = '';
  provider.submittedAt = new Date();
  provider.reviewedBy = null;
  provider.reviewedAt = null;
  await provider.save();

  res.status(200).json({
    success: true,
    message: 'Application submitted successfully. It is now pending admin review.',
    provider: { status: provider.status, submittedAt: provider.submittedAt }
  });
});

/**
 * @desc    Upload profile photo & verification documents
 * @route   POST /api/provider/documents
 * @access  Private (provider)
 */
const uploadDocuments = asyncHandler(async (req, res) => {
  const files = req.files || {};
  // Multer returns arrays per field name
  const uploaded = [];
  let newProfilePhoto = null;

  const userIdStr = String(req.user._id || req.user.id);

  if (files.profile_photo && files.profile_photo.length) {
    const f = files.profile_photo[0];
    newProfilePhoto = `/uploads/${userIdStr}/${f.filename}`;
  }

  let saved;
  for (const field of Object.keys(files)) {
    for (const f of files[field]) {
      const doc = await Document.create({
        user: req.user._id,
        documentType: field,
        label: DOCUMENT_LABELS[field] || field,
        filename: f.filename,
        filePath: `${userIdStr}/${f.filename}`,
        url: `/uploads/${userIdStr}/${f.filename}`,
        mimeType: f.mimetype,
        size: f.size
      });
      uploaded.push(doc);
    }
  }


  if (newProfilePhoto) {
    const provider = await Provider.findOne({ user: req.user._id });
    if (provider) {
      provider.profilePhoto = newProfilePhoto;
      provider.profileCompletion = await calculateCompletion(provider);
      await provider.save();
    }
  }

  res.status(201).json({
    success: true,
    message: `${uploaded.length} file(s) uploaded successfully.`,
    uploaded: uploaded.map((d) => ({
      id: d._id,
      documentType: d.documentType,
      label: d.label,
      url: d.url,
      mimeType: d.mimeType,
      size: d.size
    }))
  });
});

/**
 * @desc    Delete an uploaded document (before approval only)
 * @route   DELETE /api/provider/documents/:id
 * @access  Private (provider)
 */
const deleteDocument = asyncHandler(async (req, res) => {
  const provider = await Provider.findOne({ user: req.user._id });
  if (!provider || !canEditProfile(provider.status)) {
    throw new ApiError(403, 'Documents can only be removed while the application is not yet approved.');
  }

  const doc = await Document.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!doc) throw new ApiError(404, 'Document not found.');

  // Remove the file from disk (best effort)
  try {
    fs.unlinkSync(path.join(__dirname, '..', '..', 'uploads', doc.filePath));
  } catch (err) {
    // file may already be gone
  }

  res.status(200).json({ success: true, message: 'Document removed.' });
});

/**
 * @desc    Get application status
 * @route   GET /api/provider/status
 * @access  Private (provider)
 */
const getApplicationStatus = asyncHandler(async (req, res) => {
  const provider = await Provider.findOne({ user: req.user._id });
  if (!provider) throw new ApiError(404, 'Provider profile not found.');

  const docs = await Document.find({ user: req.user._id }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    status: provider.status,
    rejectionRemarks: provider.rejectionRemarks,
    submittedAt: provider.submittedAt,
    reviewedAt: provider.reviewedAt,
    profileCompletion: provider.profileCompletion,
    documentSummary: {
      total: docs.length,
      governmentId: docs.some((d) => d.documentType === 'government_id'),
      addressProof: docs.some((d) => d.documentType === 'address_proof'),
      certification: docs.some((d) => d.documentType === 'certification'),
      backgroundCheck: docs.some((d) => d.documentType === 'background_check')
    }
  });
});

/**
 * @desc    List service categories
 * @route   GET /api/provider/categories
 * @access  Private (provider)
 */
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ order: 1 }).lean();
  res.status(200).json({ success: true, categories });
});

/**
 * @desc    Get approved providers filtered by category or search
 * @route   GET /api/provider/approved
 * @access  Public
 */
const getApprovedProviders = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const filter = { status: 'approved' };

  if (category && category !== 'All Services') {
    const keyword = category.split(/[\s&/]+/)[0];

    const cat = await Category.findOne({
      $or: [
        { slug: category },
        { slug: { $regex: keyword, $options: 'i' } },
        { name: { $regex: keyword, $options: 'i' } }
      ]
    }).lean();

    if (cat) {
      filter.categories = cat._id;
    }
  }

  let providers = await Provider.find(filter)
    .populate('user', 'name email avatar')
    .populate('categories', 'name slug icon')
    .sort({ createdAt: -1 })
    .lean();

  // Fallback to all approved providers if specific filter yielded 0
  if (providers.length === 0) {
    providers = await Provider.find({ status: 'approved' })
      .populate('user', 'name email avatar')
      .populate('categories', 'name slug icon')
      .sort({ createdAt: -1 })
      .lean();
  }

  res.status(200).json({
    success: true,
    count: providers.length,
    providers
  });
});

module.exports = {
  getProfile,
  updateProfile,
  submitApplication,
  uploadDocuments,
  deleteDocument,
  getApplicationStatus,
  getCategories,
  getApprovedProviders
};
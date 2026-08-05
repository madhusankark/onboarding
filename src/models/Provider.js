const mongoose = require('mongoose');

const PROVIDER_STATUSES = ['pending', 'approved', 'rejected', 'in_review'];

const providerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: ''
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      trim: true,
      default: ''
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
      }
    ],
    skills: {
      type: [String],
      default: []
    },
    experienceYears: {
      type: Number,
      min: [0, 'Experience cannot be negative'],
      max: [60, 'Experience cannot exceed 60 years'],
      default: 0
    },
    experienceSummary: {
      type: String,
      trim: true,
      maxlength: [1000, 'Experience summary cannot exceed 1000 characters'],
      default: ''
    },
    serviceLocations: {
      type: [String],
      default: []
    },
    profilePhoto: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: PROVIDER_STATUSES,
      default: 'pending'
    },
    rejectionRemarks: {
      type: String,
      trim: true,
      default: ''
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    submittedAt: {
      type: Date,
      default: null
    },
    profileCompletion: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    documentNotifications: [
      {
        documentType: { type: String, default: '' },
        label: { type: String, default: '' },
        remark: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    bookingNotifications: [
      {
        bookingId: { type: String, default: '' },
        serviceName: { type: String, default: '' },
        category: { type: String, default: '' },
        customerName: { type: String, default: '' },
        customerPhone: { type: String, default: '' },
        location: { type: String, default: '' },
        price: { type: Number, default: 0 },
        date: { type: String, default: '' },
        timeSlot: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = { Provider: mongoose.model('Provider', providerSchema), PROVIDER_STATUSES };
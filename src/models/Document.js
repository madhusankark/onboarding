const mongoose = require('mongoose');

const DOCUMENT_TYPES = [
  'profile_photo',
  'government_id',
  'address_proof',
  'certification',
  'background_check',
  'other'
];

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    documentType: {
      type: String,
      enum: DOCUMENT_TYPES,
      required: [true, 'Document type is required']
    },
    label: {
      type: String,
      trim: true,
      default: ''
    },
    filename: {
      type: String,
      required: true
    },
    // Storage path relative to /uploads, e.g. "documents/abc.jpg"
    filePath: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      default: ''
    },
    size: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['uploaded', 'verified', 'rejected'],
      default: 'uploaded'
    },
    adminRemark: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = { Document: mongoose.model('Document', documentSchema), DOCUMENT_TYPES };
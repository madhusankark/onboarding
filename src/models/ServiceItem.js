const mongoose = require('mongoose');

const serviceItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    originalPrice: {
      type: Number,
      default: 0
    },
    time: {
      type: String,
      default: '1 hr'
    },
    rating: {
      type: String,
      default: '4.85'
    },
    description: {
      type: String,
      default: ''
    },
    img: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

serviceItemSchema.index({ isActive: 1, category: 1 });

module.exports = mongoose.model('ServiceItem', serviceItemSchema);

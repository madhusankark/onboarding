const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    customerName: {
      type: String,
      default: 'Customer'
    },
    customerPhone: {
      type: String,
      default: '+91 98765 43210'
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider'
    },
    serviceName: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    location: {
      type: String,
      default: 'PVR Ripples, Vijayawada'
    },
    date: {
      type: String,
      default: () => new Date().toISOString().split('T')[0]
    },
    timeSlot: {
      type: String,
      default: '10:00 AM - 12:00 PM'
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'],
      default: 'assigned'
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'upi', 'netbanking', 'cod'],
      default: 'cod'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'cash_after_service'],
      default: 'cash_after_service'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    review: {
      type: String,
      default: ''
    },
    ratedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

bookingSchema.index({ customer: 1, status: 1 });
bookingSchema.index({ provider: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);

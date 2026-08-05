const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { Provider } = require('../models/Provider');
const protect = require('../middlewares/authMiddleware');
const Category = require('../models/Category');

// @route   POST /api/bookings
// @desc    Create a new customer service booking & notify nearest provider via WebSockets
// @access  Public / Protected
router.post('/', async (req, res) => {
  try {
    const { serviceName, category, price, location, date, timeSlot, customerName, customerPhone, paymentMethod } = req.body;

    const locString = location || 'Vijayawada';
    const catString = category || 'General Home Service';
    const chosenMethod = paymentMethod || 'cod';
    const paymentStat = chosenMethod === 'cod' ? 'cash_after_service' : 'paid';

    // 1. Find category doc if exists
    const matchedCategoryDoc = await Category.findOne({
      name: { $regex: new RegExp(catString.split(' ')[0], 'i') }
    });

    // 2. Query for nearest approved provider matching category AND location
    let approvedProvider = null;
    if (matchedCategoryDoc) {
      approvedProvider = await Provider.findOne({
        status: 'approved',
        categories: matchedCategoryDoc._id,
        serviceLocations: { $regex: new RegExp(locString, 'i') }
      }).populate('user');
    }

    // 3. Fallback: Find approved provider matching location or category
    if (!approvedProvider && matchedCategoryDoc) {
      approvedProvider = await Provider.findOne({
        status: 'approved',
        categories: matchedCategoryDoc._id
      }).populate('user');
    }

    if (!approvedProvider) {
      approvedProvider = await Provider.findOne({ status: 'approved' }).populate('user');
    }

    // 4. Create Booking
    const booking = await Booking.create({
      customer: req.user?._id || null,
      customerName: customerName || req.user?.name || 'Urban Customer',
      customerPhone: customerPhone || '+91 98765 43210',
      provider: approvedProvider ? approvedProvider._id : null,
      serviceName: serviceName || 'Home Service Package',
      category: catString,
      price: price || 799,
      location: locString,
      date: date || new Date().toISOString().split('T')[0],
      timeSlot: timeSlot || '10:00 AM - 12:00 PM',
      status: approvedProvider ? 'assigned' : 'pending',
      paymentMethod: chosenMethod,
      paymentStatus: paymentStat
    });

    // 5. Notify the provider
    if (approvedProvider) {
      approvedProvider.bookingNotifications.unshift({
        bookingId: booking._id,
        serviceName: booking.serviceName,
        category: booking.category,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        location: booking.location,
        price: booking.price,
        date: booking.date,
        timeSlot: booking.timeSlot,
        createdAt: new Date()
      });
      await approvedProvider.save();
    }

    // ⚡ Emit WebSocket push notification to connected partners
    const io = req.app.get('io');
    if (io) {
      io.emit('new_booking', { booking, providerId: approvedProvider?._id });
    }

    res.status(201).json({
      success: true,
      message: approvedProvider
        ? `Booking assigned & notified to nearest partner: ${approvedProvider.user?.name || 'Partner'}`
        : 'Service booking placed successfully!',
      booking
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/bookings/my-orders
// @desc    Get customer's placed orders history
// @access  Private (Customer)
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Booking.find({
      $or: [
        { customer: req.user._id },
        { customerName: req.user.name }
      ]
    })
      .populate({
        path: 'provider',
        populate: { path: 'user', select: 'name email phone avatar' }
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/bookings/my-leads
// @desc    Get job leads assigned to the logged-in approved provider
// @access  Private (Provider)
router.get('/my-leads', protect, async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.user._id });
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider profile not found.' });
    }

    if (provider.status !== 'approved') {
      return res.json({
        success: true,
        isApproved: false,
        message: 'Your profile is currently under admin verification. Customer job leads will unlock once approved by Admin.',
        leads: []
      });
    }

    const leads = await Booking.find({
      $or: [
        { provider: provider._id },
        { provider: null },
        { status: 'assigned' },
        { status: 'pending' }
      ]
    })
      .populate({ path: 'customer', select: 'name email avatar' })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      isApproved: true,
      leads
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/bookings/:id/status
// @desc    Update lead status (accept, complete, cancel, etc.) & emit WebSockets
// @access  Private (Provider/Admin/Customer)
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const provider = await Provider.findOne({ user: req.user._id });
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking lead not found.' });
    }

    if (provider) {
      booking.provider = provider._id;
    }
    booking.status = status;
    await booking.save();

    // ⚡ Emit WebSocket push notification for status update
    const io = req.app.get('io');
    if (io) {
      io.emit('booking_status_updated', { bookingId: booking._id, status, booking });
    }

    res.json({ success: true, message: `Work status updated to ${status}`, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/bookings/:id/rate
// @desc    Customer submit 1-5 star rating & review for completed service
// @access  Private (Customer)
router.put('/:id/rate', protect, async (req, res) => {
  try {
    const { rating, review } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    booking.rating = Number(rating) || 5;
    booking.review = review || '';
    booking.ratedAt = new Date();
    await booking.save();

    res.json({ success: true, message: 'Thank you for your rating & review!', booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

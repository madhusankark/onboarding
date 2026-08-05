const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { Provider } = require('../models/Provider');
const protect = require('../middlewares/authMiddleware');
const Category = require('../models/Category');

const escapeRegex = (str) => String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @route   POST /api/bookings
// @desc    Create a new customer service booking & notify nearest provider via WebSockets
// @access  Public / Protected
router.post('/', async (req, res) => {
  try {
    const { serviceName, category, price, location, date, timeSlot, customerName, customerPhone, paymentMethod } = req.body;

    const locString = location || 'Vijayawada';
    const catString = category || 'General Home Service';
    const rawMethod = String(paymentMethod || 'cod').toLowerCase();
    const validMethods = ['card', 'upi', 'netbanking', 'cod'];
    const safeMethod = validMethods.includes(rawMethod) ? rawMethod : 'cod';
    const paymentStat = safeMethod === 'cod' ? 'cash_after_service' : 'paid';

    // 1. Find category doc if exists safely
    let matchedCategoryDoc = null;
    if (catString) {
      const keyword = escapeRegex(catString.split(' ')[0]);
      try {
        matchedCategoryDoc = await Category.findOne({
          name: { $regex: new RegExp(keyword, 'i') }
        });
      } catch (e) {
        matchedCategoryDoc = null;
      }
    }

    // 2. Query for nearest approved provider matching category AND location
    let approvedProvider = null;
    if (matchedCategoryDoc) {
      try {
        approvedProvider = await Provider.findOne({
          status: 'approved',
          categories: matchedCategoryDoc._id,
          serviceLocations: { $regex: new RegExp(escapeRegex(locString), 'i') }
        }).populate('user');
      } catch (e) {
        approvedProvider = null;
      }
    }

    // 3. Fallback: Find approved provider matching category or location
    if (!approvedProvider && matchedCategoryDoc) {
      try {
        approvedProvider = await Provider.findOne({
          status: 'approved',
          categories: matchedCategoryDoc._id
        }).populate('user');
      } catch (e) {
        approvedProvider = null;
      }
    }

    if (!approvedProvider) {
      try {
        approvedProvider = await Provider.findOne({ status: 'approved' }).populate('user');
      } catch (e) {
        approvedProvider = null;
      }
    }

    // 4. Create Booking safely with numeric price
    const numPrice = Number(price);
    const safePrice = (!isNaN(numPrice) && numPrice > 0) ? numPrice : 799;

    const booking = await Booking.create({
      customer: req.user?._id || null,
      customerName: customerName || req.user?.name || 'Urban Customer',
      customerPhone: customerPhone || '+91 98765 43210',
      provider: approvedProvider ? approvedProvider._id : null,
      serviceName: serviceName || 'Home Service Package',
      category: catString,
      price: safePrice,
      location: locString,
      date: date || new Date().toISOString().split('T')[0],
      timeSlot: timeSlot || '10:00 AM - 12:00 PM',
      status: approvedProvider ? 'assigned' : 'pending',
      paymentMethod: safeMethod,
      paymentStatus: paymentStat
    });

    // 5. Notify the provider safely
    if (approvedProvider) {
      try {
        if (!Array.isArray(approvedProvider.bookingNotifications)) {
          approvedProvider.bookingNotifications = [];
        }
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
      } catch (e) {
        console.error('Error updating provider notifications:', e.message);
      }
    }

    // ⚡ Emit WebSocket push notification to connected partners
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('new_booking', { booking, providerId: approvedProvider?._id });
      }
    } catch (e) {
      console.error('Error emitting WebSocket event:', e.message);
    }

    res.status(201).json({
      success: true,
      message: approvedProvider
        ? `Booking assigned & notified to nearest partner: ${approvedProvider.user?.name || 'Partner'}`
        : 'Service booking placed successfully!',
      booking
    });
  } catch (err) {
    console.error('Critical Error in POST /api/bookings:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/bookings/my-orders
// @desc    Get customer's placed orders history
// @access  Private (customer)
router.get('/my-orders', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({
      $or: [{ customer: req.user._id }, { customerName: req.user.name }]
    })
      .sort({ createdAt: -1 })
      .populate({
        path: 'provider',
        populate: { path: 'user', select: 'name email avatar' }
      })
      .lean();

    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/bookings/my-leads
// @desc    Get service provider's assigned job leads
// @access  Private (provider)
router.get('/my-leads', protect, async (req, res) => {
  try {
    const providerDoc = await Provider.findOne({ user: req.user._id }).lean();
    if (!providerDoc) {
      return res.status(200).json({ success: true, leads: [] });
    }

    const leads = await Booking.find({ provider: providerDoc._id }).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, count: leads.length, leads });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/bookings/:id/status
// @desc    Update booking work status (assigned -> in_progress -> completed -> cancelled)
// @access  Private (provider/admin)
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.status = status;
    await booking.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('booking_status_updated', { bookingId: booking._id, status: booking.status });
    }

    res.status(200).json({ success: true, message: `Booking status updated to ${status}`, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/bookings/:id/rate
// @desc    Rate and review completed booking
// @access  Private (customer)
router.put('/:id/rate', protect, async (req, res) => {
  try {
    const { rating, review } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.rating = Number(rating);
    booking.review = review || '';
    await booking.save();

    res.status(200).json({ success: true, message: 'Rating & review submitted successfully', booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

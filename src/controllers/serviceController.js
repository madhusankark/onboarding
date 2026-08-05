const ServiceItem = require('../models/ServiceItem');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const DEFAULT_SERVICES = [
  // AC & Appliance Repair
  { name: 'Native Smart Water Purifier', category: 'AC & Appliance Repair', price: 1999, originalPrice: 2299, rating: '4.88', time: '1-2 hrs', img: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4e?auto=format&fit=crop&w=400&q=80', description: 'Native RO Water Purifier — No service needed for 2 years' },
  { name: 'Foam-jet AC service & repair', category: 'AC & Appliance Repair', price: 799, originalPrice: 899, rating: '4.75', time: '1-2 hrs', img: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=400&q=80', description: 'Comprehensive 360° coil cleaning & anti-rust protection' },
  { name: 'Split AC Gas Refill & Leak Fix', category: 'AC & Appliance Repair', price: 1299, originalPrice: 1499, rating: '4.83', time: '2-3 hrs', img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80', description: 'Deep leak check with nitrogen & gas topup' },
  { name: 'Washing Machine Repair', category: 'AC & Appliance Repair', price: 349, originalPrice: 449, rating: '4.78', time: '1-2 hrs', img: 'https://images.unsplash.com/photo-1517685352821-92cf88aee5a5?auto=format&fit=crop&w=400&q=80', description: 'Motor & drum inspection with genuine parts' },

  // Home Cleaning & Pest
  { name: 'Kitchen Chimney Servicing', category: 'Home Cleaning', price: 699, originalPrice: 799, rating: '4.85', time: '2 hrs', img: 'https://images.unsplash.com/photo-1556909211-36987daf7b4d?auto=format&fit=crop&w=400&q=80', description: 'Complete mesh filter degreasing & motor inspection' },
  { name: 'Intense cleaning (2 bathroom)', category: 'Home Cleaning', price: 979, originalPrice: 1058, rating: '4.80', time: '2-3 hrs', img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80', description: 'Hospital-grade sanitization & tile stain removal' },
  { name: 'Deep Cleaning & Sanitization', category: 'Home Cleaning', price: 599, originalPrice: 699, rating: '4.72', time: '2 hrs', img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80', description: 'Complete surface scrubbing & eco-friendly disinfectant spray' },
  { name: 'Move-in / Move-out Cleaning', category: 'Home Cleaning', price: 2499, originalPrice: 2799, rating: '4.69', time: '4-6 hrs', img: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=400&q=80', description: 'Full home deep cleaning for empty apartments & houses' },

  // Beauty & Salon
  { name: "Women's Luxury Salon Package", category: 'Beauty & Salon', price: 1099, originalPrice: 1299, rating: '4.88', time: '120 min', img: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80', description: 'Premium facial, pedicure & hair spa by certified beauticians' },
  { name: 'Salon Luxe Spa & Facial Package', category: 'Beauty & Salon', price: 1299, originalPrice: 1499, rating: '4.91', time: '150 min', img: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=400&q=80', description: 'Fruit glow facial & anti-tan scrub massage with organic hair mask' },
  { name: 'Pedicure & D-Tan Clean-up', category: 'Beauty & Salon', price: 649, originalPrice: 799, rating: '4.88', time: '90 min', img: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=400&q=80', description: 'Single-use sealed hygiene kit with disposables' },

  // Plumbing
  { name: 'Tap repair & leakage fix', category: 'Plumbing', price: 149, originalPrice: 199, rating: '4.77', time: '30 min', img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80', description: 'Instant 44-minute response by background-verified plumbers' },
  { name: 'Bathroom Tile & Fittings Upgrade', category: 'Plumbing', price: 899, originalPrice: 999, rating: '4.84', time: '2 hrs', img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80', description: 'Grout re-sealing & high-shine chrome fitting polish' },

  // Electrical
  { name: 'Smart Television Wall Mounting', category: 'Electrical', price: 349, originalPrice: 449, rating: '4.82', time: '45 min', img: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=400&q=80', description: 'Precision Spirit Level TV Bracket Installation up to 75"' },
  { name: 'Switchboard & Socket Installation', category: 'Electrical', price: 149, originalPrice: 199, rating: '4.76', time: '30 min', img: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80', description: 'Safe fuse check & modular switchboard wiring' }
];

/**
 * @desc    Get all active service items with prices (auto-seeds defaults if empty)
 * @route   GET /api/services
 * @access  Public
 */
const getServices = asyncHandler(async (req, res) => {
  let count = await ServiceItem.countDocuments();
  if (count === 0) {
    await ServiceItem.insertMany(DEFAULT_SERVICES);
  }
  const services = await ServiceItem.find({ isActive: true }).sort({ category: 1, createdAt: -1 });
  res.status(200).json({ success: true, services });
});

/**
 * @desc    Get all service items for Admin (including inactive)
 * @route   GET /api/admin/services
 * @access  Private (Admin)
 */
const getAdminServices = asyncHandler(async (req, res) => {
  let count = await ServiceItem.countDocuments();
  if (count === 0) {
    await ServiceItem.insertMany(DEFAULT_SERVICES);
  }
  const services = await ServiceItem.find({}).sort({ category: 1, createdAt: -1 });
  res.status(200).json({ success: true, services });
});

/**
 * @desc    Create a new service item & price
 * @route   POST /api/admin/services
 * @access  Private (Admin)
 */
const createService = asyncHandler(async (req, res) => {
  const { name, category, price, originalPrice, time, rating, description, img } = req.body;
  if (!name || !category || price === undefined) {
    throw new ApiError(400, 'Name, category, and price are required.');
  }

  const service = await ServiceItem.create({
    name,
    category,
    price: Number(price),
    originalPrice: originalPrice ? Number(originalPrice) : Number(price) + 100,
    time: time || '1 hr',
    rating: rating || '4.85',
    description: description || '',
    img: img || 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=400&q=80',
    isActive: true
  });

  res.status(201).json({ success: true, message: 'Service created successfully', service });
});

/**
 * @desc    Update a service item price or details
 * @route   PUT /api/admin/services/:id
 * @access  Private (Admin)
 */
const updateService = asyncHandler(async (req, res) => {
  const service = await ServiceItem.findById(req.params.id);
  if (!service) throw new ApiError(404, 'Service item not found');

  const fields = ['name', 'category', 'price', 'originalPrice', 'time', 'rating', 'description', 'img', 'isActive'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      if (field === 'price' || field === 'originalPrice') {
        service[field] = Number(req.body[field]);
      } else {
        service[field] = req.body[field];
      }
    }
  });

  await service.save();
  res.status(200).json({ success: true, message: 'Service item updated', service });
});

/**
 * @desc    Delete a service item
 * @route   DELETE /api/admin/services/:id
 * @access  Private (Admin)
 */
const deleteService = asyncHandler(async (req, res) => {
  const service = await ServiceItem.findById(req.params.id);
  if (!service) throw new ApiError(404, 'Service item not found');
  await service.deleteOne();
  res.status(200).json({ success: true, message: 'Service item deleted' });
});

module.exports = {
  getServices,
  getAdminServices,
  createService,
  updateService,
  deleteService
};

const ServiceItem = require('../models/ServiceItem');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

/**
 * @desc    Get all active service items with prices
 * @route   GET /api/services
 * @access  Public
 */
const getServices = asyncHandler(async (req, res) => {
  const services = await ServiceItem.find({ isActive: true }).sort({ category: 1, createdAt: -1 }).lean();
  res.status(200).json({ success: true, services });
});

/**
 * @desc    Get all service items for Admin (including inactive)
 * @route   GET /api/admin/services
 * @access  Private (Admin)
 */
const getAdminServices = asyncHandler(async (req, res) => {
  const services = await ServiceItem.find({}).sort({ category: 1, createdAt: -1 }).lean();
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

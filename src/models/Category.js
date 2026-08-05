const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      maxlength: [60, 'Category name cannot exceed 60 characters']
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true
    },
    icon: {
      type: String,
      default: '🛠️'
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
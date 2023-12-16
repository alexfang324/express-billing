const mongoose = require('mongoose');

const productSchema = mongoose.Schema(
  {
    name: { type: String, unique: true, required: true },
    code: { type: String, unique: true },
    unit_cost: {
      type: Number,
      required: true,
      min: [0, "cost can't be negative"]
    }
  },
  { collection: 'products' }
);

const Product = mongoose.model('Product', productSchema);

module.exports = { Product, productSchema };

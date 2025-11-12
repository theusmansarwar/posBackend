const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema(
  {
    productId: { type: String, unique: true }, // PID-0001, PID-0002 etc.
    productName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, "Quantity cannot be negative"],
    },
    unitPrice: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    salePrice: {
      type: Number,
      required: true,
    },
    supplier: {
      type: String,
      required: true,
    },
    rackNo: {
      type: String,
      required: true,
    },
    purchaseDate: {
      type: String,
      required: true,
    },
    warranty: {
      type: String,
      default: null, // optional
    },
  },
  { timestamps: true }
);

const Stock = mongoose.model("Stock", stockSchema);
module.exports = Stock;

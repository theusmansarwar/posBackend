const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema(
  {
    productId: { type: String, unique: true }, // PID-0001, PID-0002 etc.
    productName: {
      type: String,
      
    },
    quantity: {
      type: Number,
      
      min: [0, "Quantity cannot be negative"],
    },
    unitPrice: {
      type: Number,
      
    },
    totalPrice: {
      type: Number,
      
    },
    salePrice: {
      type: Number,
      
    },
    supplier: {
      type: String,
      
    },
    rackNo: {
      type: String,
      
    },
    purchaseDate: {
      type: String,
      
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

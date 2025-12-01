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
       min: [0, "Price cannot be negative"],
      
    },
    totalPrice: {
      type: Number,
       min: [0, "Price cannot be negative"],
      
    },
    salePrice: {
      type: Number,
       min: [0, "Price cannot be negative"],
      
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

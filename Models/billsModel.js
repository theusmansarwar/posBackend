const mongoose = require("mongoose");

const BillsSchema = new mongoose.Schema(
  {
    billId: {
      type: String,
      required: true,
      unique: true,
    },

    // 🧾 Line items of the bill
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Stock",
          required: true,
        },
        productName: { type: String },
        quantity: { type: Number },
        salePrice: { type: Number }, // per-unit sale price
        total: { type: Number }, // quantity * salePrice
      },
    ],

    // 💰 Pricing Details
    subtotal: { type: Number }, // total before discount/labour
    discountType: {
      type: String,
      enum: ["percent", "amount"],
      default: "amount",
    },
    discountValue: { type: Number, default: 0 }, // % or amount value
    discount: { type: Number, default: 0 }, // actual discount applied
    labourCost: { type: Number, default: 0 },
    totalAmount: { type: Number }, // after discount + labour

    // 💳 Payment Info
    paymentMode: { type: String, enum: ["cash", "card", "credit"] },
    userPaidAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    change: { type: Number, default: 0 },

    // ✅ Status & Staff
    status: { type: Boolean, default: false }, // true = paid
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shift: {
      type: String,
      enum: ["morning", "evening", "night"],
      required: true,
    },
  },
  { timestamps: true }
);

const Bills = mongoose.model("Bills", BillsSchema);
module.exports = Bills;

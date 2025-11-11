const mongoose = require("mongoose");

const BillsSchema = new mongoose.Schema(
  {
    billId: {
      type: String,
      required: true,
      unique: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Stock",
          required: true,
        },
        productName: { type: String, required: true },
        quantity: { type: Number, required: true },
        salePrice: { type: Number, required: true }, // unit sale price
        total: { type: Number, required: true }, // quantity * salePrice
      },
    ],
    discount: { type: Number, default: 0 },
    paymentMode: { type: String, enum: ["cash", "card", "credit"], required: true },
    totalAmount: { type: Number, required: true },
    remainingAmount: { type: Number, default: 0 },
    userPaidAmount: { type: Number, default: 0 },
    status: { type: Boolean, default: false },
     staff: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
            shift: { type: String, enum: ["morning", "evening", "night"], required: true },

  },
  { timestamps: true }
);

const Bills = mongoose.model("Bills", BillsSchema);
module.exports = Bills;

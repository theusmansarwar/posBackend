const mongoose = require("mongoose");

const ExpenceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    amount: { type: Number },
    comment: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
const Expence = mongoose.model("Expence", ExpenceSchema);
module.exports = Expence;

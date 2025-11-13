const mongoose = require("mongoose");

const ExpenceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    amount: { type: Number },
    comment: {
      type: String,
    },
     expenceId:{
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);
const Expence = mongoose.model("Expence", ExpenceSchema);
module.exports = Expence;

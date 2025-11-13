const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    amount: { type: Number },
    comment: {
      type: String,
    },
     ExpenseId:{
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);
const Expense = mongoose.model("Expense", ExpenseSchema);
module.exports = Expense;

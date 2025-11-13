const Expense = require("../Models/ExpenseModel");

// 🧾 Add new expense with auto-generated ExpenseId
const AddExpense = async (req, res) => {
  try {
    const { name, amount, comment } = req.body;

    // ✅ Validation
    const missingFields = [];
    if (!name) missingFields.push({ name: "name", message: "Name is required" });
    if (!amount) missingFields.push({ name: "amount", message: "Amount is required" });

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 400,
        message: "Validation failed",
        missingFields,
      });
    }

    // ✅ Generate new Expense ID (E0001, E0002, ...)
    const lastExpense = await Expense.findOne().sort({ createdAt: -1 });
    let newIdNumber = 1;
    if (lastExpense && lastExpense.ExpenseId) {
      const lastNumber = parseInt(lastExpense.ExpenseId.replace("E", ""));
      newIdNumber = lastNumber + 1;
    }
    const ExpenseId = `E${String(newIdNumber).padStart(4, "0")}`;

    // ✅ Create and Save
    const newExpense = new Expense({
      ExpenseId,
      name,
      amount,
      comment: comment || "",
    });
    await newExpense.save();

    return res.status(201).json({
      status: 201,
      message: "✅ Expense created successfully",
      data: newExpense,
    });
  } catch (error) {
    console.error("❌ Error creating expense:", error);
    return res.status(500).json({
      status: 500,
      message: "Something went wrong while creating expense",
      details: error.message,
    });
  }
};

// 📄 Get all expenses (search by name or ExpenseId)
const getAllExpense = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const keyword = req.query.keyword || "";

    const filter = {
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { ExpenseId: { $regex: keyword, $options: "i" } },
      ],
    };

    const totalExpense = await Expense.countDocuments(filter);
    const expenses = await Expense.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    return res.status(200).json({
      status: 200,
      message: "Expenses fetched successfully",
      totalExpense,
      totalPages: Math.ceil(totalExpense / limit),
      currentPage: page,
      limit,
      data: expenses,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Something went wrong while fetching expenses",
      details: error.message,
    });
  }
};

// ✏️ Update expense
const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, amount, comment } = req.body;

    const missingFields = [];
    if (!name) missingFields.push({ name: "name", message: "Name is required" });
    if (!amount) missingFields.push({ name: "amount", message: "Amount is required" });
    if (!comment) missingFields.push({ name: "comment", message: "Comment is required" });

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 400,
        message: "Validation failed",
        missingFields,
      });
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      id,
      { name, amount, comment },
      { new: true }
    );

    if (!updatedExpense) {
      return res.status(404).json({
        status: 404,
        message: "Expense not found",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Expense updated successfully",
      data: updatedExpense,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Something went wrong while updating expense",
      details: error.message,
    });
  }
};

// 🗑️ Delete multiple expenses
const deleteMultipleExpense = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || ids.length === 0) {
      return res.status(400).json({
        status: 400,
        message: "At least one expense ID is required",
      });
    }

    const result = await Expense.deleteMany({ _id: { $in: ids } });

    return res.status(200).json({
      status: 200,
      message: `${result.deletedCount} expense(s) deleted successfully`,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Something went wrong while deleting expenses",
      details: error.message,
    });
  }
};

module.exports = { AddExpense, getAllExpense, updateExpense, deleteMultipleExpense };

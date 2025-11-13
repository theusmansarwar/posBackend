const Expence = require("../Models/ExpenceModel");

// 🧾 Add new expense with auto-generated expenceId
const AddExpence = async (req, res) => {
  try {
    const { name, amount, comment } = req.body;

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

    // ✅ Generate new expenceId
    const lastExpence = await Expence.findOne().sort({ createdAt: -1 });
    let newIdNumber = 1;

    if (lastExpence && lastExpence.expenceId) {
      const lastNumber = parseInt(lastExpence.expenceId.split("-")[1]);
      newIdNumber = lastNumber + 1;
    }

    const expenceId = `EXP-${newIdNumber.toString().padStart(4, "0")}`;

    // ✅ Create new expense
    const newExpence = new Expence({ expenceId, name, amount, comment:comment || "" });
    await newExpence.save();

    return res.status(201).json({
      status: 201,
      message: "Expense created successfully",
      data: newExpence,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Something went wrong while creating expense",
      details: error.message,
    });
  }
};

// 📄 Get all expenses (search by name or expenceId)
const getAllExpence = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const keyword = req.query.keyword || "";

    const filter = {
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { expenceId: { $regex: keyword, $options: "i" } },
      ],
    };

    const totalExpence = await Expence.countDocuments(filter);
    const expenses = await Expence.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    return res.status(200).json({
      status: 200,
      message: "Expenses fetched successfully",
      totalExpence,
      totalPages: Math.ceil(totalExpence / limit),
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
const updateExpence = async (req, res) => {
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

    const updatedExpence = await Expence.findByIdAndUpdate(
      id,
      { name, amount, comment },
      { new: true }
    );

    if (!updatedExpence) {
      return res.status(404).json({
        status: 404,
        message: "Expense not found",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Expense updated successfully",
      data: updatedExpence,
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
const deleteMultipleExpence = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || ids.length === 0) {
      return res.status(400).json({
        status: 400,
        message: "At least one expense ID is required",
      });
    }

    const result = await Expence.deleteMany({ _id: { $in: ids } });

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

module.exports = { AddExpence, getAllExpence, updateExpence, deleteMultipleExpence };

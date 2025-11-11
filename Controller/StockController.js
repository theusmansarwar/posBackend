const Stock = require("../Models/StockModel");

// ✅ Create Stock
const createStock = async (req, res) => {
  try {
    const {
      productName,
      quantity,
      unitPrice,
      totalPrice,
      salePrice,
      supplier,
      warranty,
    } = req.body;

    // Validation
    const missingFields = [];
    if (!productName) missingFields.push({ name: "productName", message: "Product Name is required" });
    if (!quantity) missingFields.push({ name: "quantity", message: "Quantity is required" });
    if (!unitPrice) missingFields.push({ name: "unitPrice", message: "Unit Price is required" });
    if (!totalPrice) missingFields.push({ name: "totalPrice", message: "Total Price is required" });
    if (!salePrice) missingFields.push({ name: "salePrice", message: "Sale Price is required" });
    if (!supplier) missingFields.push({ name: "supplier", message: "Supplier is required" });
    if (!warranty) missingFields.push({ name: "warranty", message: "Warranty is required" });

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 400,
        message: "Validation failed",
        missingFields,
      });
    }

    // ✅ Auto-generate Product ID (PID-0001, PID-0002, ...)
    const lastStock = await Stock.findOne().sort({ createdAt: -1 });
    let newProductId = "PID-0001";

    if (lastStock && lastStock.productId) {
      const lastNumber = parseInt(lastStock.productId.split("-")[1]);
      const nextNumber = lastNumber + 1;
      newProductId = `PID-${String(nextNumber).padStart(4, "0")}`;
    }

    const stock = new Stock({
      productId: newProductId,
      productName,
      quantity,
      unitPrice,
      totalPrice,
      salePrice,
      supplier,
      warranty,
    });

    await stock.save();

    return res.status(201).json({
      status: 201,
      message: "Stock created successfully",
      data: stock,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Error creating stock",
      error: error.message,
    });
  }
};

// ✅ List Stocks (with search + pagination)
const listStock = async (req, res) => {
  try {
    let { page, limit, keyword } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    const query = keyword
      ? {
          $or: [
            { productName: { $regex: keyword, $options: "i" } },
            { supplier: { $regex: keyword, $options: "i" } },
          ],
        }
      : {};

    const total = await Stock.countDocuments(query);
    const stocks = await Stock.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      status: 200,
      message: "Stock records fetched successfully",
      totalRecords: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      data: stocks,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Error fetching stock records",
      error: error.message,
    });
  }
};

// ✅ Update Stock
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      productName,
      quantity,
      unitPrice,
      totalPrice,
      salePrice,
      supplier,
      warranty,
    } = req.body;

    const missingFields = [];
    if (!productName) missingFields.push({ name: "productName", message: "Product Name is required" });
    if (!quantity) missingFields.push({ name: "quantity", message: "Quantity is required" });
    if (!unitPrice) missingFields.push({ name: "unitPrice", message: "Unit Price is required" });
    if (!totalPrice) missingFields.push({ name: "totalPrice", message: "Total Price is required" });
    if (!salePrice) missingFields.push({ name: "salePrice", message: "Sale Price is required" });
    if (!supplier) missingFields.push({ name: "supplier", message: "Supplier is required" });
    if (!warranty) missingFields.push({ name: "warranty", message: "Warranty is required" });

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 400,
        message: "Validation failed",
        missingFields,
      });
    }

    const updatedStock = await Stock.findByIdAndUpdate(
      id,
      { productName, quantity, unitPrice, totalPrice, salePrice, supplier, warranty },
      { new: true }
    );

    if (!updatedStock) {
      return res.status(404).json({ status: 404, message: "Stock not found" });
    }

    return res.status(200).json({
      status: 200,
      message: "Stock updated successfully",
      data: updatedStock,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Error updating stock",
      error: error.message,
    });
  }
};

// ✅ Delete Single Stock
const deleteStock = async (req, res) => {
  try {
    const { id } = req.params;
    const stock = await Stock.findByIdAndDelete(id);

    if (!stock) {
      return res.status(404).json({
        status: 404,
        message: "Stock not found",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Stock deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Error deleting stock",
      error: error.message,
    });
  }
};

// ✅ Delete Multiple Stocks
const deleteMultipleStocks = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || ids.length === 0) {
      return res.status(400).json({
        status: 400,
        message: "No stock IDs provided",
      });
    }

    const result = await Stock.deleteMany({ _id: { $in: ids } });

    return res.status(200).json({
      status: 200,
      message: `${result.deletedCount} stocks deleted successfully`,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Error deleting stocks",
      error: error.message,
    });
  }
};

module.exports = {
  createStock,
  listStock,
  updateStock,
  deleteStock,
  deleteMultipleStocks,
};

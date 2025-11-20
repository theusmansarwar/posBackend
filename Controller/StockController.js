const Stock = require("../Models/StockModel");
const Bills = require("../Models/billsModel");
const mongoose = require("mongoose");

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
      purchaseDate,
      warranty,
      rackNo,
    } = req.body;

    // ✅ Validation
    const missingFields = [];
    if (!productName) missingFields.push({ name: "productName", message: "Product Name is required" });
    if (!quantity) missingFields.push({ name: "quantity", message: "Quantity is required" });
    if (!unitPrice) missingFields.push({ name: "unitPrice", message: "Unit Price is required" });
    if (!totalPrice) missingFields.push({ name: "totalPrice", message: "Total Price is required" });
    if (!salePrice) missingFields.push({ name: "salePrice", message: "Sale Price is required" });
    // if (!supplier) missingFields.push({ name: "supplier", message: "Supplier is required" });
    if (!purchaseDate) missingFields.push({ name: "purchaseDate", message: "Purchase Date is required" });
    // if (!rackNo) missingFields.push({ name: "rackNo", message: "Rack No is required" });

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 400,
        message: "Validation failed",
        missingFields,
      });
    }

    // ✅ Auto-generate Product ID (P0001, P0002, ...)
    const lastStock = await Stock.findOne().sort({ createdAt: -1 });
    let newProductId = "P0001";

    if (lastStock && lastStock.productId) {
      const lastNumber = parseInt(lastStock.productId.replace("P", ""));
      newProductId = `P${String(lastNumber + 1).padStart(4, "0")}`;
    }

    // ✅ Create new stock record
    const stock = new Stock({
      productId: newProductId,
      productName,
      quantity,
      unitPrice,
      totalPrice,
      salePrice,
      supplier,
      purchaseDate,
      rackNo,
      warranty: warranty || null,
    });

    await stock.save();

    return res.status(201).json({
      status: 201,
      message: "✅ Stock created successfully",
      data: stock,
    });
  } catch (error) {
    console.error("❌ Error creating stock:", error);
    return res.status(500).json({
      status: 500,
      message: "Error creating stock",
      error: error.message,
    });
  }
};


// ✅ Add new stock batch or update prices only
const addnewStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { unitPrice, salePrice, totalPrice, warranty, purchaseDate, quantity } = req.body;

    // ✅ Validation
    const missingFields = [];
    if (!unitPrice) missingFields.push({ name: "unitPrice", message: "Unit Price is required" });
    if (!salePrice) missingFields.push({ name: "salePrice", message: "Sale Price is required" });
    if (!totalPrice) missingFields.push({ name: "totalPrice", message: "Total Price is required" });
    if (!quantity) missingFields.push({ name: "quantity", message: "Quantity is required" });
    if (!purchaseDate) missingFields.push({ name: "purchaseDate", message: "Purchase Date is required" });

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 400,
        message: "Validation failed",
        missingFields,
      });
    }

    // ✅ Fetch existing stock
    const existingStock = await Stock.findById(id);
    if (!existingStock) {
      return res.status(404).json({
        status: 404,
        message: "Stock not found",
      });
    }

    // ✅ Update quantity (add new to old)
    const updatedQuantity = existingStock.quantity + Number(quantity);

    // ✅ Update stock record
    const updatedStock = await Stock.findByIdAndUpdate(
      id,
      {
        unitPrice,
        salePrice,
        totalPrice,
        warranty: warranty || null,
        purchaseDate,
        quantity: updatedQuantity,
      },
      { new: true }
    );

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
            { productId: { $regex: keyword, $options: "i" } },
            { supplier: { $regex: keyword, $options: "i" } },
          ],
        }
      : {};

    const total = await Stock.countDocuments(query);
    const stocks = await Stock.find(query)
      .sort({ createdAt: 1 })
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
const reportStock = async (req, res) => {
  try {
 

    const total = await Stock.countDocuments();
    const stocks = await Stock.find()
      .sort({ createdAt: 1 })

    return res.status(200).json({
      status: 200,
      message: "Stock records fetched successfully",
      totalRecords: total,
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

// ✅ Update Complete Stock Record
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
      rackNo,
      purchaseDate,
    } = req.body;

    const missingFields = [];
    if (!productName) missingFields.push({ name: "productName", message: "Product Name is required" });
    if (!quantity) missingFields.push({ name: "quantity", message: "Quantity is required" });
    if (!unitPrice) missingFields.push({ name: "unitPrice", message: "Unit Price is required" });
    if (!totalPrice) missingFields.push({ name: "totalPrice", message: "Total Price is required" });
    if (!salePrice) missingFields.push({ name: "salePrice", message: "Sale Price is required" });
    if (!supplier) missingFields.push({ name: "supplier", message: "Supplier is required" });
    if (!rackNo) missingFields.push({ name: "rackNo", message: "Rack No is required" });
    if (!purchaseDate) missingFields.push({ name: "purchaseDate", message: "Purchase Date is required" });

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 400,
        message: "Validation failed",
        missingFields,
      });
    }

    const updatedStock = await Stock.findByIdAndUpdate(
      id,
      {
        productName,
        quantity,
        unitPrice,
        totalPrice,
        salePrice,
        supplier,
        warranty: warranty || null,
        rackNo,
        purchaseDate,
      },
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

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
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

const getProductSalesReport = async (req, res) => {
  try {
    const { filter } = req.query;

    // -----------------------------
    //  DATE RANGE. (Start - End)
    // -----------------------------
    const now = new Date();
    let startDate, endDate;

    switch (filter) {
      case "today":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date();
        break;

      case "yesterday":
        startDate = new Date(now.setDate(now.getDate() - 1));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;

      case "thisWeek":
        const weekDay = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - weekDay);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date();
        break;

      case "thisMonth":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date();
        break;

      case "lastMonth":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;

      case "allTime":
      default:
        startDate = new Date(0);
        endDate = new Date();
    }

    // -----------------------------
    //  MAIN AGGREGATION
    // -----------------------------
    const report = await Bills.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      { $unwind: "$items" },

      {
        $lookup: {
          from: "stocks",
          localField: "items.productId",
          foreignField: "_id",
          as: "productData",
          
        },
      },

      { $unwind: "$productData" },

      {
        $group: {
          _id: "$items.productId",
          productId: { $first: "$items.productCode" },
          name: { $first: "$items.productName" },

          totalQuantity: { $sum: "$items.quantity" },

          unitPrice: { $first: "$productData.unitPrice" },
          salePrice: { $first: "$items.salePrice" },

          totalCost: {
            $sum: { $multiply: ["$items.quantity", "$productData.unitPrice"] },
          },
          totalSale: {
            $sum: { $multiply: ["$items.quantity", "$items.salePrice"] },
          },
        },
      },

      {
        $addFields: {
          profit: { $subtract: ["$totalSale", "$totalCost"] },
        },
      },
    ]);

    return res.json({ status: true, filter, report });

  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};



module.exports = {
  createStock,
  addnewStock,
  listStock,
  updateStock,
  deleteStock,
  deleteMultipleStocks,
  reportStock,
  getProductSalesReport
};

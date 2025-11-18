const Bills = require("../Models/billsModel");
const Stock = require("../Models/StockModel");

// 🧾 Create new Bill (Checkout)
const createBill = async (req, res) => {
  try {
    const {
      items,
      subtotal,
      discountType,
      discountValue,
      discount,
      labourCost,
      totalAmount,
      paymentMode,
      userPaidAmount,
      remainingAmount,
      change,
      staff,
      shift,
      customerName,
      customerPhone
    } = req.body;

    // -------------------------
    // VALIDATION
    // -------------------------
  const missingFields = [];

if (!staff) missingFields.push({ name: "staff", message: "Staff ID is required" });
if (!totalAmount) missingFields.push({ name: "totalAmount", message: "Total amount is required" });
if (!customerPhone) missingFields.push({ name: "customerPhone", message: "Customer phone is required" });
if (!customerName) missingFields.push({ name: "customerName", message: "Customer name is required" });
if (!shift) missingFields.push({ name: "shift", message: "Shift is required" });
if (!paymentMode) missingFields.push({ name: "paymentMode", message: "Payment mode is required" });

if (missingFields.length > 0) {
  return res.status(400).json({
    message: "Missing required fields",
    missingFields,
  });
}

    if (!items || !Array.isArray(items) || items.length === 0)
      return res
        .status(400)
        .json({ message: "No items provided in the bill" });

    // -------------------------
    // BILL ID GENERATION (B000001)
    // -------------------------
    const lastBill = await Bills.findOne().sort({ createdAt: -1 });
    let newBillId = "B000001";

    if (lastBill && lastBill.billId) {
      const lastNumber = parseInt(lastBill.billId.replace("B", ""));
      newBillId = `B${String(lastNumber + 1).padStart(6, "0")}`;
    }

    // -------------------------
    // PROCESS ITEMS & DECREASE STOCK
    // -------------------------
    const processedItems = [];

    for (const item of items) {
      const stockItem = await Stock.findById(item.productId);

      if (!stockItem) {
        return res.status(404).json({
          message: `Product not found: ${item.productId}`,
        });
      }

      if (stockItem.quantity < item.quantity) {
        return res.status(400).json({
          message: `Not enough stock for ${stockItem.productName}. Available: ${stockItem.quantity}`,
        });
      }

      // Deduct stock
      stockItem.quantity -= item.quantity;
      await stockItem.save();

      processedItems.push({
        productId: stockItem._id,
        productName: stockItem.productName,
        quantity: item.quantity,
        salePrice: item.salePrice,
        total: item.quantity * item.salePrice,
      });
    }

    // -------------------------
    // CREATE BILL (NO BACKEND CALCULATIONS)
    // -------------------------
    const newBill = new Bills({
      billId: newBillId,
      items: processedItems,
      subtotal,
      discountType,
      discountValue,
      discount,
      labourCost,
      totalAmount,
      paymentMode,
      userPaidAmount,
      remainingAmount,
      change,
      customerName,
      customerPhone,
      status: remainingAmount <= 0,
      staff,
      shift,
      isDeleted: false,
    });

    await newBill.save();
    await newBill.populate("staff", "name email userId -_id");

    return res.status(201).json({
      status: 201,
      message: "Bill created successfully",
      data: newBill,
    });
  } catch (error) {
    console.error("Error creating bill:", error);
    return res.status(500).json({
      status: 500,
      message: "Something went wrong while creating bill",
      error: error.message,
    });
  }
};

const getBillByBillId = async (req, res) => {
  try {
    const { billId } = req.params;

    if (!billId) {
      return res.status(400).json({
        status: 400,
        message: "Bill ID is required",
      });
    }

    // Find bill by billId and populate related fields
    const bill = await Bills.findOne({ billId })
      .populate("items.productId", "productName salePrice") // fetch product info
      .populate("staff", "name email role") // fetch staff info
      .exec();

    if (!bill) {
      return res.status(404).json({
        status: 404,
        message: "Bill not found",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Bill fetched successfully",
      data: bill,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Error fetching bill",
      error: error.message,
    });
  }
};

// 📋 List Bills (with pagination + search)
const listBills = async (req, res) => {
  try {
    let { page, limit, keyword, shift, staff } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    const query = {};

    if (keyword) {
      query.$or = [
        { billId: { $regex: keyword, $options: "i" } },
        { paymentMode: { $regex: keyword, $options: "i" } },
      ];
    }

    if (shift) query.shift = shift;
    if (staff) query.staff = staff;

    const total = await Bills.countDocuments(query);

    const bills = await Bills.find(query)
      .populate("staff", "name email role")
      .populate("items.productId", "productName salePrice quantity")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({
      status: 200,
      message: "Bills fetched successfully",
      totalRecords: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      data: bills,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Error fetching bills",
      error: error.message,
    });
  }
};

// ❌ Delete Bill
const deleteMultiBills = async (req, res) => {
  try {
    const { ids } = req.body;

    // Validate input
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "IDs array is required" });
    }

    // Delete all bills matching those IDs
    const result = await Bills.deleteMany({ _id: { $in: ids } });

    return res.status(200).json({
      status:200,
      message: "Bills deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error deleting bills",
      error: error.message,
    });
  }
};

const updateBill = async (req, res) => {
  try {
    const { billId } = req.params;
    const { items, discountType, discountValue, userPaidAmount, labourCost, paymentMode, shift } = req.body;

    if (!billId) return res.status(400).json({ message: "Bill ID is required" });
    if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ message: "No items provided" });

    // Fetch existing bill
    const existingBill = await Bills.findOne({ billId }).populate("items.productId");
    if (!existingBill) return res.status(404).json({ message: "Bill not found" });

    // Build a map of old items for quick lookup
    const oldItemsMap = {};
    for (const oldItem of existingBill.items) {
      oldItemsMap[oldItem.productId._id] = oldItem.quantity;
    }

    let totalAmount = 0;
    const processedItems = [];

    for (const newItem of items) {
      const stockItem = await Stock.findById(newItem.productId);
      if (!stockItem) return res.status(404).json({ message: `Product not found: ${newItem.productId}` });

      const oldQuantity = oldItemsMap[newItem.productId] || 0;
      const quantityDiff = newItem.quantity - oldQuantity;

      if (quantityDiff > 0 && stockItem.quantity < quantityDiff) {
        return res.status(400).json({ message: `Not enough stock for ${stockItem.productName}. Available: ${stockItem.quantity}` });
      }

      // Update stock
      stockItem.quantity -= quantityDiff; // if diff is negative, it adds back to stock
      await stockItem.save();

      const itemTotal = newItem.quantity * stockItem.salePrice;
      totalAmount += itemTotal;

      processedItems.push({
        productId: stockItem._id,
        productName: stockItem.productName,
        quantity: newItem.quantity,
        salePrice: stockItem.salePrice,
        total: itemTotal,
      });

      // Remove processed old item from map
      delete oldItemsMap[newItem.productId];
    }

    // Return remaining old items (removed items) to stock
    for (const removedProductId in oldItemsMap) {
      const stockItem = await Stock.findById(removedProductId);
      if (stockItem) {
        stockItem.quantity += oldItemsMap[removedProductId];
        await stockItem.save();
      }
    }

    // Calculate discount
    let finalDiscount = 0;
    if (discountType === "percent") finalDiscount = (totalAmount * (discountValue || 0)) / 100;
    else if (discountType === "amount") finalDiscount = discountValue || 0;
    const labour = Number(labourCost) || 0;
    const discountedTotal = totalAmount - finalDiscount + labour;
    const paidAmount = Number(userPaidAmount) || 0;
    const remainingAmount = discountedTotal - paidAmount;
    const isPaid = remainingAmount <= 0;
    existingBill.items = processedItems;
    existingBill.discount = finalDiscount;
    existingBill.totalAmount = discountedTotal;
    existingBill.remainingAmount = remainingAmount;
    existingBill.userPaidAmount = paidAmount;
    existingBill.labourCost = labour;
    existingBill.status = isPaid;
    existingBill.paymentMode = paymentMode || existingBill.paymentMode;
    existingBill.shift = shift || existingBill.shift;
    await existingBill.save();
    await existingBill.populate("staff", "name email");
    await existingBill.populate("items.productId", "productName salePrice");
    return res.status(200).json({
      status: 200,
      message: "✅ Bill updated successfully",
      data: existingBill,
    });
  } catch (error) {
    console.error("❌ Error updating bill:", error);
    return res.status(500).json({ status: 500, message: error.message });
  }
};



const getSalesActivity = async (req, res) => {
  try {
    const sales = await Bills.aggregate([
      { $unwind: "$items" },

      {
        $group: {
          _id: "$items.productId",
          productName: { $first: "$items.productName" },

          // total quantity sold (already adjusted for returns)
          totalSold: { $sum: "$items.quantity" },

          // latest sale date
          lastSoldAt: { $max: "$createdAt" },
        },
      },

      // sort by latest sale
      { $sort: { lastSoldAt: -1 } },
    ]);

    return res.status(200).json({
      status: 200,
      message: "Sales activity fetched successfully",
      data: sales,
    });
  } catch (error) {
    console.error("Sales Activity Error:", error);
    return res.status(500).json({
      status: 500,
      message: "Error fetching sales activity",
      error: error.message,
    });
  }
};


module.exports = {
  createBill,
  listBills,
  deleteMultiBills,
  getBillByBillId,
  updateBill,
  getSalesActivity
};

const Bills = require("../Models/billsModel");
const Stock = require("../Models/StockModel");

// 🧾 Create new Bill (Checkout)
const createBill = async (req, res) => {
  try {
    const {
      items,
      subtotal,
      // discountType,
      // discountValue,
      // discount,
      tunningCost,
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
        productCode: stockItem.productId || "",
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
      // discountType,
      // discountValue,
      // discount,
      tunningCost,
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
const getBillReport = async (req, res) => {
  try {
   

    const total = await Bills.countDocuments();

    const bills = await Bills.find()
      .populate("staff", "name email role")
      .populate("items.productId", "productName salePrice quantity")
      .sort({ createdAt: -1 })
      
    return res.json({
      status: 200,
      message: "Bills fetched successfully",
      totalRecords: total,
      
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
    const { items, staff, shift, paymentMode, customerName, customerPhone, totalAmount,
      //  discountType, discountValue, discount,
       
       tunningCost,labourCost, userPaidAmount, remainingAmount, change } = req.body;

    if (!billId) return res.status(400).json({ message: "Bill ID is required" });
   
    // Fetch existing bill
    const existingBill = await Bills.findOne({ billId });
    if (!existingBill) return res.status(404).json({ message: "Bill not found" });

    // Build a map of old items for stock adjustment
    const oldItemsMap = {};
    for (const oldItem of existingBill.items) {
      oldItemsMap[oldItem.productId] = oldItem.quantity;
    }

    const processedItems = [];

    for (const newItem of items) {
      const stockItem = await Stock.findById(newItem.productId);
      if (!stockItem) return res.status(404).json({ message: `Product not found: ${newItem.productId}` });

      const oldQuantity = oldItemsMap[newItem.productId] || 0;
      const quantityDiff = newItem.quantity - oldQuantity;

      if (quantityDiff > 0 && stockItem.quantity < quantityDiff) {
        return res.status(400).json({ message: `Not enough stock for ${stockItem.productName}. Available: ${stockItem.quantity}` });
      }

      // Adjust stock
      stockItem.quantity -= quantityDiff; // if negative, adds back
      await stockItem.save();

      processedItems.push({
        productId: stockItem._id,
        productName: stockItem.productName,
        productCode: stockItem.productId || "",
        quantity: newItem.quantity,
        salePrice: newItem.salePrice, // take from frontend
        total: newItem.total,         // take from frontend
      });

      // Remove from old items map
      delete oldItemsMap[newItem.productId];
    }

    // Return removed items back to stock
    for (const removedId in oldItemsMap) {
      const stockItem = await Stock.findById(removedId);
      if (stockItem) {
        stockItem.quantity += oldItemsMap[removedId];
        await stockItem.save();
      }
    }

    // Save everything as-is from frontend (no calculation)
    existingBill.items = processedItems;
    existingBill.staff = staff || existingBill.staff;
    existingBill.shift = shift || existingBill.shift;
    existingBill.paymentMode = paymentMode || existingBill.paymentMode;
    existingBill.customerName = customerName || existingBill.customerName;
    existingBill.customerPhone = customerPhone || existingBill.customerPhone;
    existingBill.totalAmount = totalAmount;
    existingBill.discountType = discountType;
    existingBill.discountValue = discountValue;
    existingBill.discount = discount;
    existingBill.labourCost = labourCost || existingBill.labourCost;
    existingBill.tunningCost = tunningCost || existingBill.tunningCost;
    existingBill.userPaidAmount = userPaidAmount;
    existingBill.remainingAmount = remainingAmount;
    existingBill.change = change;
    existingBill.status = remainingAmount <= 0;

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
    let { page, limit, keyword } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    keyword = keyword ? keyword.trim() : "";

    const matchStage = keyword
      ? { "items.productName": { $regex: keyword, $options: "i" } }
      : {};

    const salesAggregation = [
      { $unwind: "$items" },
      { $match: matchStage },

      {
        $group: {
      _id: "$items.productCode",   // <-- return P0001
      productId: { $first: "$items.productId" },   // MongoID
      productCode: { $first: "$items.productCode" },  // P0001
      productName: { $first: "$items.productName" },
      totalSold: { $sum: "$items.quantity" },
      lastSoldAt: { $max: "$createdAt" },
    },
      },

      { $sort: { lastSoldAt: -1 } },

      // pagination
      { $skip: (page - 1) * limit },
      { $limit: limit }
    ];

    const countAggregation = [
      { $unwind: "$items" },
      { $match: matchStage },
      {
        $group: {
          _id: "$items.productId"
        }
      },
      { $count: "totalRecords" }
    ];

    const [sales, totalCountResult] = await Promise.all([
      Bills.aggregate(salesAggregation),
      Bills.aggregate(countAggregation)
    ]);

    const totalRecords = totalCountResult.length > 0 ? totalCountResult[0].totalRecords : 0;

    return res.status(200).json({
      status: 200,
      message: "Sales activity fetched successfully",
      totalRecords,
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
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
const getSales2Activity = async (req, res) => {
  try {
    let { page, limit, keyword } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    keyword = keyword ? keyword.trim() : "";

    const matchStage = keyword
      ? { "items.productName": { $regex: keyword, $options: "i" } }
      : {};

    const salesAggregation = [
      { $unwind: "$items" },
      { $match: matchStage },

      {
        $group: {
          _id: "$items.productCode",              // product code P0001
          productId: { $first: "$items.productId" },
          productCode: { $first: "$items.productCode" },
          productName: { $first: "$items.productName" },

          // ✅ Sold price (from items)
          soldPrice: { $first: "$items.salePrice" },

          // ✅ Customer name
          customerName: { $first: "$customerName" },

          totalSold: { $sum: "$items.quantity" },
          lastSoldAt: { $max: "$createdAt" },
        },
      },

      { $sort: { lastSoldAt: -1 } },

      { $skip: (page - 1) * limit },
      { $limit: limit }
    ];

    const countAggregation = [
      { $unwind: "$items" },
      { $match: matchStage },
      {
        $group: {
          _id: "$items.productId"
        }
      },
      { $count: "totalRecords" }
    ];

    const [sales, totalCountResult] = await Promise.all([
      Bills.aggregate(salesAggregation),
      Bills.aggregate(countAggregation)
    ]);

    const totalRecords =
      totalCountResult.length > 0 ? totalCountResult[0].totalRecords : 0;

    return res.status(200).json({
      status: 200,
      message: "Sales activity fetched successfully",
      totalRecords,
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
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



const getPendingBills = async (req, res) => {
  try {
    const { keyword, page = 1, limit = 10 } = req.query;
    const query = { remainingAmount: { $gt: 0 } };
    if (keyword) {
      query.$or = [
        { billId: { $regex: keyword, $options: "i" } },
        { customerName: { $regex: keyword, $options: "i" } },
        { customerPhone: { $regex: keyword, $options: "i" } },
      ];
    }
    const pageNumber = parseInt(page);
    const pageLimit = parseInt(limit);
    const skip = (pageNumber - 1) * pageLimit;
    const totalRecords = await Bills.countDocuments(query);
    const pendingBills = await Bills.find(query)
      .select(
        "billId customerName customerPhone totalAmount userPaidAmount remainingAmount createdAt"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit);
    return res.status(200).json({
      status: 200,
      message: "Pending bills fetched successfully",
      page: pageNumber,
      limit: pageLimit,
      totalRecords,
      totalPages: Math.ceil(totalRecords / pageLimit),
      data: pendingBills,
    });
  } catch (error) {
    console.error("❌ Error fetching pending bills:", error);
    return res.status(500).json({
      status: 500,
      message: "Error fetching pending bills",
      error: error.message,
    });
  }
};
const deletePendingBills = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        message: "ids array (_id of bills) is required",
      });
    }
    const bills = await Bills.find({ _id: { $in: ids } });
    if (bills.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "No bills found for the given ids",
      });
    }
    let updatedBills = [];
    for (const bill of bills) {
      bill.userPaidAmount = 0;
      bill.remainingAmount = bill.totalAmount;
      bill.status = false; // still unpaid

      await bill.save();
      updatedBills.push(bill);
    }
    return res.status(200).json({
      status: 200,
      message: "Selected pending bills reset successfully",
      modifiedBills: updatedBills.length,
      data: updatedBills,
    });
  } catch (error) {
    console.error("❌ Error resetting pending bills:", error);
    return res.status(500).json({
      status: 500,
      message: "Server error resetting pending bills",
      error: error.message,
    });
  }
};
const updatePendingBill = async (req, res) => {
  try {
    const { billId } = req.params;
    const { payAmount } = req.body; // amount customer is paying now

    if (!billId) {
      return res.status(400).json({ message: "Bill ID is required" });
    }

    if (payAmount === undefined || payAmount < 0) {
      return res.status(400).json({ message: "payAmount is required and must be >= 0" });
    }

    const bill = await Bills.findOne({ billId });
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    // Previous amounts
    const oldPaid = bill.userPaidAmount || 0;
    const oldRemaining = bill.remainingAmount || bill.totalAmount;

    const newPaid = oldPaid + payAmount;
    let newRemaining = bill.totalAmount - newPaid;
    if (newRemaining < 0) newRemaining = 0;
    bill.userPaidAmount = newPaid;
    bill.remainingAmount = newRemaining;
    bill.status = newRemaining === 0;
    bill.paymentHistory = bill.paymentHistory || [];
    bill.paymentHistory.push({
      paidNow: payAmount,
      date: new Date(),
    });
    await bill.save();
    return res.status(200).json({
      status: 200,
      message: "Pending bill updated successfully",
      data: bill,
    });
  } catch (error) {
    console.error("❌ Error updating pending bill:", error);
    return res.status(500).json({
      status: 500,
      message: "Error updating pending bill",
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
  getSalesActivity,
  getBillReport,
  getPendingBills,
  deletePendingBills,
  updatePendingBill,
  getSales2Activity
};
const Bills = require("../Models/billsModel");
const Stock = require("../Models/StockModel");

// 🧾 Create new Bill (Checkout)
const createBill = async (req, res) => {
  try {
    const {
      items,
      discountType,
      discountValue,
      paymentMode,
      change,
      userPaidAmount,
      staff,
      shift,
      labourCost,
    } = req.body;

    // ✅ Validation
    if (!staff) return res.status(400).json({ message: "Staff ID is required" });
    if (!shift) return res.status(400).json({ message: "Shift is required" });
    if (!paymentMode)
      return res.status(400).json({ message: "Payment mode is required" });
    if (!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: "No items provided in the bill" });

    // ✅ Generate Bill ID (BILL-000001, BILL-000002, ...)
    const lastBill = await Bills.findOne().sort({ createdAt: -1 });
     let newBillId = "B000001";
    if (lastBill && lastBill.billId) {
      // Extract number part (remove 'B' prefix)
      const lastNumber = parseInt(lastBill.billId.replace("B", ""));
      newBillId = `B${String(lastNumber + 1).padStart(6, "0")}`;
    }

    // ✅ Process Each Item
    let totalAmount = 0;
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

      const itemTotal = item.quantity * stockItem.salePrice;
      totalAmount += itemTotal;

      // Deduct sold quantity from stock
      stockItem.quantity -= item.quantity;
      await stockItem.save();

      processedItems.push({
        productId: stockItem._id,
        productName: stockItem.productName,
        quantity: item.quantity,
        salePrice: stockItem.salePrice,
        total: itemTotal,
      });
    }

    // ✅ Calculate Discount
    let finalDiscount = 0;
    if (discountType === "percent") {
      finalDiscount = (totalAmount * (discountValue || 0)) / 100;
    } else if (discountType === "amount") {
      finalDiscount = discountValue || 0;
    }

    // ✅ Labour Cost + Total
    const labour = Number(labourCost) || 0;
    const discountedTotal = totalAmount - finalDiscount + labour;

    // ✅ Remaining & Status
    const paidAmount = Number(userPaidAmount) || 0;
    const remainingAmount = discountedTotal - paidAmount;
    const isPaid = remainingAmount <= 0;

    // ✅ Create Bill
    const newBill = new Bills({
      billId: newBillId,
      items: processedItems,
      discount: finalDiscount,
      paymentMode,
      totalAmount: discountedTotal,
      remainingAmount,
      userPaidAmount: paidAmount,
      labourCost: labour,
      status: isPaid,
      staff,
      shift,
    });

    await newBill.save();
    await newBill.populate("staff", "name email userId -_id");
    // ✅ Populate staff details (name, email)
  

    return res.status(201).json({
      status: 201,
      message: "✅ Bill created successfully",
      data: newBill,
    });
  } catch (error) {
    console.error("❌ Error creating bill:", error);
    return res.status(500).json({
      status: 500,
      message: "Something went wrong while creating bill",
      error: error.message,
    });
  }}
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
const deleteBill = async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await Bills.findByIdAndDelete(id);

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    return res.json({ message: "Bill deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting bill", error: error.message });
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


module.exports = {
  createBill,
  listBills,
  deleteBill,
  getBillByBillId,
  updateBill
};

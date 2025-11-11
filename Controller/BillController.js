const Bills = require("../Models/billsModel");
const Stock = require("../Models/StockModel");

// 🧾 Create new Bill (Checkout)
const createBill = async (req, res) => {
  try {
    const { items, discount, paymentMode, userPaidAmount, staff, shift } = req.body;

    // Validation
    if (!staff) return res.status(400).json({ message: "Staff ID is required" });
    if (!shift) return res.status(400).json({ message: "Shift is required" });
    if (!paymentMode) return res.status(400).json({ message: "Payment mode is required" });
    if (!items || items.length === 0)
      return res.status(400).json({ message: "No items provided in the bill" });

    // ✅ Generate unique Bill ID (BILL-0001, BILL-0002, ...)
    const lastBill = await Bills.findOne().sort({ createdAt: -1 });
    let newBillId = "BILL-0001";
    if (lastBill && lastBill.billId) {
      const lastNumber = parseInt(lastBill.billId.split("-")[1]);
      newBillId = `BILL-${String(lastNumber + 1).padStart(4, "0")}`;
    }

    let totalAmount = 0;
    const processedItems = [];

    // ✅ Validate and deduct stock
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

      // Deduct from stock
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

    // ✅ Apply discount and calculate totals
    const discountedTotal = totalAmount - (discount || 0);
    const remainingAmount = discountedTotal - (userPaidAmount || 0);

    // ✅ Create Bill
    const newBill = new Bills({
      billId: newBillId,
      items: processedItems,
      discount,
      paymentMode,
      totalAmount: discountedTotal,
      remainingAmount,
      userPaidAmount,
      status: remainingAmount <= 0, // mark as paid if no remaining balance
      staff,
      shift,
    });

    await newBill.save();

    return res.status(201).json({
      status: 201,
      message: "Bill created successfully",
      data: newBill,
    });
  } catch (error) {
    console.error("❌ Error creating bill:", error);
    return res.status(500).json({
      status: 500,
      message: "Something went wrong while creating bill",
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

module.exports = {
  createBill,
  listBills,
  deleteBill,
};

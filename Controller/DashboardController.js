const mongoose = require("mongoose");
const Bills = require("../Models/billsModel");
const Stock = require("../Models/StockModel");
const Expense = require("../Models/ExpenseModel");
const getDashboardData = async (req, res) => {
  try {
    const now = new Date();

    // Helper date boundaries
    const startOfDay = (d) => new Date(d.setHours(0, 0, 0, 0));
    const endOfDay = (d) => new Date(d.setHours(23, 59, 59, 999));
    const startOfWeek = (d) => {
      const date = new Date(d);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(date.setDate(diff));
    };
    const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
    const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    // =====================
    // 🧾 EXPENSE DATA
    // =====================
    const expenseToday = await Expense.aggregate([
      { $match: { createdAt: { $gte: startOfDay(new Date()), $lte: endOfDay(new Date()) } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const expenseYesterday = await Expense.aggregate([
      { $match: { createdAt: { $gte: startOfDay(yesterday), $lte: endOfDay(yesterday) } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const expenseWeek = await Expense.aggregate([
      { $match: { createdAt: { $gte: startOfWeek(today), $lte: endOfDay(today) } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const expenseMonth = await Expense.aggregate([
      { $match: { createdAt: { $gte: startOfMonth(today), $lte: endOfMonth(today) } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const expenseLastMonth = await Expense.aggregate([
      { $match: { createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // =====================
    // 💰 SALES DATA
    // =====================
    const salesToday = await Bills.aggregate([
      { $match: { createdAt: { $gte: startOfDay(new Date()), $lte: endOfDay(new Date()) } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const salesYesterday = await Bills.aggregate([
      { $match: { createdAt: { $gte: startOfDay(yesterday), $lte: endOfDay(yesterday) } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const salesWeek = await Bills.aggregate([
      { $match: { createdAt: { $gte: startOfWeek(today), $lte: endOfDay(today) } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const salesMonth = await Bills.aggregate([
      { $match: { createdAt: { $gte: startOfMonth(today), $lte: endOfMonth(today) } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const salesLastMonth = await Bills.aggregate([
      { $match: { createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    // =====================
    // 📦 PRODUCT STATS
    // =====================
    const totalProducts = await Stock.countDocuments();

    const soldToday = await Bills.aggregate([
      { $match: { createdAt: { $gte: startOfDay(new Date()), $lte: endOfDay(new Date()) } } },
      { $unwind: "$items" },
      { $group: { _id: null, totalSold: { $sum: "$items.quantity" } } },
    ]);
    const soldYesterday = await Bills.aggregate([
      { $match: { createdAt: { $gte: startOfDay(yesterday), $lte: endOfDay(yesterday) } } },
      { $unwind: "$items" },
      { $group: { _id: null, totalSold: { $sum: "$items.quantity" } } },
    ]);
    const soldWeek = await Bills.aggregate([
      { $match: { createdAt: { $gte: startOfWeek(today), $lte: endOfDay(today) } } },
      { $unwind: "$items" },
      { $group: { _id: null, totalSold: { $sum: "$items.quantity" } } },
    ]);
    const soldMonth = await Bills.aggregate([
      { $match: { createdAt: { $gte: startOfMonth(today), $lte: endOfMonth(today) } } },
      { $unwind: "$items" },
      { $group: { _id: null, totalSold: { $sum: "$items.quantity" } } },
    ]);
    const soldLastMonth = await Bills.aggregate([
      { $match: { createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
      { $unwind: "$items" },
      { $group: { _id: null, totalSold: { $sum: "$items.quantity" } } },
    ]);

    // =====================
    // 🧾 PENDING AMOUNT
    // =====================
    const pendingAmount = await Bills.aggregate([
      { $match: { status: false } }, // unpaid bills
      { $group: { _id: null, totalPending: { $sum: "$remainingAmount" } } },
    ]);

    // =====================
    // ✅ RESPONSE
    // =====================
    res.json({
      expense: {
        today: expenseToday[0]?.total || 0,
        yesterday: expenseYesterday[0]?.total || 0,
        thisWeek: expenseWeek[0]?.total || 0,
        thisMonth: expenseMonth[0]?.total || 0,
        lastMonth: expenseLastMonth[0]?.total || 0,
      },
      sales: {
        today: salesToday[0]?.total || 0,
        yesterday: salesYesterday[0]?.total || 0,
        thisWeek: salesWeek[0]?.total || 0,
        thisMonth: salesMonth[0]?.total || 0,
        lastMonth: salesLastMonth[0]?.total || 0,
      },
      products: {
        totalProducts,
        todaySold: soldToday[0]?.totalSold || 0,
        yesterdaySold: soldYesterday[0]?.totalSold || 0,
        thisWeekSold: soldWeek[0]?.totalSold || 0,
        thisMonthSold: soldMonth[0]?.totalSold || 0,
        lastMonthSold: soldLastMonth[0]?.totalSold || 0,
      },
      pendingAmount: pendingAmount[0]?.totalPending || 0,
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    res.status(500).json({ message: "Server Error", error });
  }
};

module.exports = { getDashboardData };

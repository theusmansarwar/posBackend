const mongoose = require("mongoose");
const Bills = require("../Models/billsModel");
const Stock = require("../Models/StockModel");
const Expense = require("../Models/ExpenseModel");

const getDashboardData = async (req, res) => {
  try {
    const now = new Date();

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

    // =======================
    // 🧾 EXPENSES
    // =======================
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

    // =======================
    // 📦 PRODUCTS DATA
    // =======================
    const totalProducts = await Stock.countDocuments();

    // ✔ Total price of all available stock (quantity × unitPrice)
    const totalProductPrice = await Stock.aggregate([
      {
        $group: {
          _id: null,
          totalPrice: { $sum: { $multiply: ["$quantity", "$unitPrice"] } },
        },
      },
    ]);

    // =======================
    // 🛒 SOLD PRODUCTS (QTY + PRICE)
    // =======================
    const soldPipeline = (start, end) => [
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: null,
          totalQty: { $sum: "$items.quantity" },
          totalPrice: { $sum: { $multiply: ["$items.quantity", "$items.salePrice"] } },
        },
      },
    ];

    // Daily + weekly + monthly
    const [soldToday, soldYesterday, soldWeek, soldMonth, soldLastMonth] =
      await Promise.all([
        Bills.aggregate(soldPipeline(startOfDay(today), endOfDay(today))),
        Bills.aggregate(soldPipeline(startOfDay(yesterday), endOfDay(yesterday))),
        Bills.aggregate(soldPipeline(startOfWeek(today), endOfDay(today))),
        Bills.aggregate(soldPipeline(startOfMonth(today), endOfMonth(today))),
        Bills.aggregate(soldPipeline(lastMonthStart, lastMonthEnd)),
      ]);

    // =======================
    // 🧾 TOTAL SALES (ALL TIME)
    // =======================
    const totalSales = await Bills.aggregate([
      { $unwind: "$items" },
      {
        $group: {
            _id: null,
            totalSaleAmount: { $sum: { $multiply: ["$items.quantity", "$items.salePrice"] }},
            totalQtySold: { $sum: "$items.quantity" }
        }
      }
    ]);

    // =======================
    // 🧾 PENDING AMOUNT
    // =======================
    const pendingAmount = await Bills.aggregate([
      { $match: { status: false } },
      { $group: { _id: null, totalPending: { $sum: "$remainingAmount" } } },
    ]);

    // =======================
    // 🔥 RESPONSE
    // =======================
    res.json({
      expense: {
        today: expenseToday[0]?.total || 0,
        yesterday: expenseYesterday[0]?.total || 0,
        thisWeek: expenseWeek[0]?.total || 0,
        thisMonth: expenseMonth[0]?.total || 0,
        lastMonth: expenseLastMonth[0]?.total || 0,
      },

      products: {
        totalProducts: {
          quantity: totalProducts,
          price: totalProductPrice[0]?.totalPrice || 0,
        },

        today: {
          quantity: soldToday[0]?.totalQty || 0,
          sale: soldToday[0]?.totalPrice || 0,
        },
        yesterday: {
          quantity: soldYesterday[0]?.totalQty || 0,
          sale: soldYesterday[0]?.totalPrice || 0,
        },
        thisWeek: {
          quantity: soldWeek[0]?.totalQty || 0,
          sale: soldWeek[0]?.totalPrice || 0,
        },
        thisMonth: {
          quantity: soldMonth[0]?.totalQty || 0,
          sale: soldMonth[0]?.totalPrice || 0,
        },
        lastMonth: {
          quantity: soldLastMonth[0]?.totalQty || 0,
          sale: soldLastMonth[0]?.totalPrice || 0,
        },

        totalSold: {
          quantity: totalSales[0]?.totalQtySold || 0,
          sale: totalSales[0]?.totalSaleAmount || 0,
        }
      },

      pendingAmount: pendingAmount[0]?.totalPending || 0,
    });

  } catch (error) {
    console.error("Dashboard API Error:", error);
    res.status(500).json({ message: "Server Error", error });
  }
};

module.exports = { getDashboardData };

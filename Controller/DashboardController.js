const Role = require("../Models/RoleModel");
const User = require("../Models/UserModel");
const Stock = require("../Models/StockModel");

const getDashboardData = async (req, res) => {
  try {
    const totalRoles = await Role.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalStock = await Stock.countDocuments();

    return res.status(200).json({
      totalRoles,
      totalUsers,
      totalSuppliers,
      totalProducts,
      totalStock,
      totalAssets,
      totalMaintenance,
      totalDeadProducts,
      totalAssetLocations,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ message: "Error fetching dashboard data", error });
  }
};

module.exports = { getDashboardData };

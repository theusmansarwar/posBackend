const express = require("express");
const { getDashboardData } = require("../Controller/DashboardController");
const router = express.Router();

// ✅ New route for dashboard data
router.get("/dashboard", getDashboardData);

module.exports = router;

const express = require("express");
const router = express.Router();
const { createBill, listBills, deleteMultiBills, getBillByBillId, updateBill, getSalesActivity } = require("../Controller/BillController");

router.post("/create", createBill);
router.get("/list", listBills);
router.get("/salesactivity", getSalesActivity);
router.delete("/deletemany", deleteMultiBills);
router.get("/:billId", getBillByBillId);
router.put("/:billId", updateBill);
module.exports = router;

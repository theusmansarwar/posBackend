const express = require("express");
const router = express.Router();
const { createBill, listBills, deleteBill, getBillByBillId } = require("../Controller/BillController");

router.post("/create", createBill);
router.get("/list", listBills);
router.delete("/:id", deleteBill);
router.get("/:billId", getBillByBillId);
module.exports = router;

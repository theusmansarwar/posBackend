const express = require("express");
const router = express.Router();
const { createBill, listBills, deleteBill, getBillByBillId, updateBill } = require("../Controller/BillController");

router.post("/create", createBill);
router.get("/list", listBills);
router.delete("/:id", deleteBill);
router.get("/:billId", getBillByBillId);

router.put("/:billId", updateBill);
module.exports = router;

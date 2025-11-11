const express = require("express");
const router = express.Router();
const { createBill, listBills, deleteBill } = require("../Controller/BillController");

router.post("/create", createBill);
router.get("/list", listBills);
router.delete("/:id", deleteBill);

module.exports = router;

const express = require("express");
const router = express.Router();

const { 
  createBill, 
  listBills, 
  deleteMultiBills, 
  getBillByBillId, 
  updateBill, 
  getSalesActivity, 
  getBillReport, 
  getPendingBills,       
  updatePendingBill,       
  deletePendingBills
} = require("../Controller/BillController");
router.post("/create", createBill);
router.get("/list", listBills);
router.get("/report", getBillReport);
router.get("/pendingamount", getPendingBills);
router.delete("/pending/deletemany", deletePendingBills);
router.put("/pending/:billId", updatePendingBill);
router.get("/salesactivity", getSalesActivity);
router.delete("/deletemany", deleteMultiBills);
router.get("/:billId", getBillByBillId);
router.put("/:billId", updateBill);

module.exports = router;
